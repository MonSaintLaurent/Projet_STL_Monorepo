from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from db.database import get_db
from db.models.users_db import User, DefiSession, UserDefiRecord, UserStats
from db.models.defis_db import Defi
from auth.auth0 import verify_token

from pydantic import BaseModel
from typing import Optional, Dict

router = APIRouter(prefix="/defi_sessions", tags=["defi_sessions"])

class FinishDefiRequest(BaseModel):
    defi_id: int
    score: int
    time_spent: int
    completed: bool = True
    metadata: Optional[Dict] = None


# Start, juste vérifier que le défi existe
@router.post("/start/{defi_id}")
def start_defi(defi_id: int, token_payload=Depends(verify_token), db: Session = Depends(get_db)):
    auth0_id = token_payload["sub"]
    # Vérifier ou créer l'utilisateur
    user = db.query(User).filter(User.auth0_id == auth0_id).first()
    if not user:
        user = User(
            auth0_id=auth0_id,
            email=token_payload.get("email"),
            name=token_payload.get("name"),
            picture=token_payload.get("picture"),
            last_login=datetime.now(timezone.utc)
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    defi = db.query(Defi).filter(Defi.id == defi_id).first()
    if not defi:
        raise HTTPException(status_code=404, detail="Défi introuvable")

    return {"message": "Prêt à jouer", "defi_id": defi_id}


# Finish, création et mise à jour de la session à la fin
@router.post("/finish")
def finish_defi(
    request: FinishDefiRequest,
    token_payload=Depends(verify_token),
    db: Session = Depends(get_db)
):
    # Récupération des valeurs du body
    defi_id = request.defi_id
    score = request.score
    time_spent = request.time_spent
    completed = request.completed
    metadata = request.metadata

    auth0_id = token_payload["sub"]
    user = db.query(User).filter(User.auth0_id == auth0_id).first()
    if not user:
        return {"status": "anonymous", "score_saved": False}

    defi = db.query(Defi).filter(Defi.id == defi_id).first()
    if not defi:
        raise HTTPException(status_code=404, detail="Défi introuvable")

    # Création de la session à la fin
    session = DefiSession(
        user_id=user.id,
        defi_id=defi_id,
        score=score,
        time_spent=time_spent,
        completed=completed,
        started_at=datetime.now(timezone.utc),
        completed_at=datetime.now(timezone.utc),
        session_metadata=metadata or {}
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Gestion record
    record = db.query(UserDefiRecord).filter(
        UserDefiRecord.user_id == user.id,
        UserDefiRecord.defi_id == defi_id
    ).first()

    max_score = getattr(defi, "max_score", 1000)
    is_new_record = False

    if not record:
        record = UserDefiRecord(
            user_id=user.id,
            defi_id=defi_id,
            best_score=score,
            best_time_spent=time_spent,
            max_score_at_time=max_score,
            session_id=session.id,
            achieved_at=datetime.now(timezone.utc)
        )
        db.add(record)
        is_new_record = True
    else:
        if score > record.best_score or (score == record.best_score and time_spent < (record.best_time_spent or 99999)):
            record.best_score = score
            record.best_time_spent = time_spent
            record.max_score_at_time = max_score
            record.session_id = session.id
            record.achieved_at = datetime.now(timezone.utc)
            is_new_record = True

    db.commit()

    # Màj des stats
    stats = db.query(UserStats).filter(UserStats.user_id == user.id).first()
    now = datetime.now(timezone.utc)
    if not stats:
        stats = UserStats(
            user_id=user.id,
            total_play_time=time_spent,
            total_sessions=1,
            defis_played=1,
            defis_completed=1 if completed else 0,
            total_score=score,
            max_score_ever=score,
            first_played_at=now,
            last_played_at=now
        )
        db.add(stats)
    else:
        stats.total_play_time += time_spent
        stats.total_sessions += 1

        unique_defis_count = db.query(DefiSession.defi_id).filter(
            DefiSession.user_id == user.id
        ).distinct().count()
        stats.defis_played = unique_defis_count

        if completed:
            previous_completion = db.query(DefiSession).filter(
                DefiSession.user_id == user.id,
                DefiSession.defi_id == defi_id,
                DefiSession.completed == True,
                DefiSession.id != session.id
            ).first()

            if not previous_completion:
                stats.defis_completed += 1

        stats.total_score += score
        if score > stats.max_score_ever:
            stats.max_score_ever = score

        stats.last_played_at = now
        if not stats.first_played_at:
            stats.first_played_at = now

    db.commit()
    db.refresh(stats)

    return {
        "message": "🎉 Nouveau record !" if is_new_record else "Session terminée",
        "session_id": session.id,
        "score": score,
        "time_spent": time_spent,
        "is_new_record": is_new_record,
        "record": {
            "best_score": record.best_score,
            "best_time_spent": record.best_time_spent,
            "max_score_at_time": record.max_score_at_time,
            "session_id": record.session_id,
            "achieved_at": record.achieved_at.isoformat()
        },
        "stats": {
            "total_play_time": stats.total_play_time,
            "total_sessions": stats.total_sessions,
            "defis_played": stats.defis_played,
            "defis_completed": stats.defis_completed,
            "total_score": stats.total_score,
            "max_score_ever": stats.max_score_ever,
            "first_played_at": stats.first_played_at.isoformat() if stats.first_played_at else None,
            "last_played_at": stats.last_played_at.isoformat() if stats.last_played_at else None
        }
    }


# Récupérer records + stats user
@router.get("/user/{auth0_id}")
def get_user_records(auth0_id: str, db: Session = Depends(get_db)):
    # Récupère l'user par son Auth0 ID(str)
    user = db.query(User).filter(User.auth0_id == auth0_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    # Récupère les records et stats via user.id (integer)
    records = db.query(UserDefiRecord).filter(UserDefiRecord.user_id == user.id).all()
    stats = db.query(UserStats).filter(UserStats.user_id == user.id).first()

    return {
        "records": [
            {
                "defi_id": r.defi_id,
                "best_score": r.best_score,
                "best_time_spent": r.best_time_spent,
                "max_score_at_time": r.max_score_at_time,
                "session_id": r.session_id,
                "achieved_at": r.achieved_at.isoformat()
            } for r in records
        ],
        "stats": {
            "total_play_time": stats.total_play_time if stats else 0,
            "total_sessions": stats.total_sessions if stats else 0,
            "defis_played": stats.defis_played if stats else 0,
            "defis_completed": stats.defis_completed if stats else 0,
            "total_score": stats.total_score if stats else 0,
            "max_score_ever": stats.max_score_ever if stats else 0,
            "first_played_at": stats.first_played_at.isoformat() if stats and stats.first_played_at else None,
            "last_played_at": stats.last_played_at.isoformat() if stats and stats.last_played_at else None
        }
    }