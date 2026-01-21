from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import Optional, List

from db.database import get_db
from db.models.users_db import User
from db.models.defis_db import Defi
from db.models.poules_db import Poule, PouleParticipant, PouleInvitation, PouleScore, PouleBestScore
from auth.auth0 import verify_token

router = APIRouter(prefix="/poules", tags=["poules"])


# ----- MODELS
class CreatePouleRequest(BaseModel):
    name: str
    emoji: Optional[str] = "🏆"
    defi_id: int
    max_participants: int = 8
    rejouable: str = "non"  # "non", "2", "3", "unlimited"
    duration_days: int = 7  # durée en jours
    start_choice: str = "immediat"  # "immediat", "1j", "3j", "1s"
    invited_user_ids: List[int] = []


class InviteToPouleRequest(BaseModel):
    poule_id: int
    user_ids: List[int]


class RespondToInvitationRequest(BaseModel):
    invitation_id: int
    accept: bool


class SubmitPouleScoreRequest(BaseModel):
    poule_id: int
    session_id: int  # ID de la session de défi déjà créée


# ----- ROUTES
@router.post("/create")
def create_poule(
    request: CreatePouleRequest,
    token_payload=Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Créer une nouvelle poule"""
    auth0_id = token_payload["sub"]
    user = db.query(User).filter(User.auth0_id == auth0_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    
    # Vérifier que le défi existe
    defi = db.query(Defi).filter(Defi.id == request.defi_id).first()
    if not defi:
        raise HTTPException(status_code=404, detail="Défi introuvable")
    
    # Créer la poule
    def calculate_start_time(start_choice: str) -> datetime:
        now = datetime.now(timezone.utc)
        if start_choice == "immediat":
            return now
        elif start_choice == "1j":
            return (now + timedelta(days=1)).replace(hour=8, minute=0, second=0, microsecond=0)
        elif start_choice == "3j":
            return (now + timedelta(days=3)).replace(hour=8, minute=0, second=0, microsecond=0)
        elif start_choice == "1s":
            return (now + timedelta(weeks=1)).replace(hour=8, minute=0, second=0, microsecond=0)
        return now

    start_time = calculate_start_time(request.start_choice)
    end_time = start_time + timedelta(days=request.duration_days)

    poule = Poule(
        name=request.name,
        emoji=request.emoji,
        defi_id=request.defi_id,
        creator_id=user.id,
        max_participants=request.max_participants,
        rejouable=request.rejouable,
        start_time=start_time,
        end_time=end_time,
        status="en-cours"
    )
    db.add(poule)
    db.flush()  # Obtenir l'ID sans commit
    
    # Ajouter le créateur comme participant
    participant = PouleParticipant(
        poule_id=poule.id,
        user_id=user.id
    )
    db.add(participant)
    
    # Créer les invitations
    for invited_user_id in request.invited_user_ids:
        invitation = PouleInvitation(
            poule_id=poule.id,
            invitee_id=invited_user_id,
            inviter_id=user.id,
            status="pending"
        )
        db.add(invitation)
    
    db.commit()
    db.refresh(poule)
    
    return {
        "message": "Poule créée avec succès",
        "poule_id": poule.id,
        "name": poule.name,
        "invitations_sent": len(request.invited_user_ids)
    }


@router.get("/my-poules")
def get_my_poules(
    token_payload=Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Récupérer toutes les poules de l'utilisateur (a-venir, en cours et terminées)"""
    auth0_id = token_payload["sub"]
    user = db.query(User).filter(User.auth0_id == auth0_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    
    participants = db.query(PouleParticipant).filter(
        PouleParticipant.user_id == user.id
    ).all()
    
    now = datetime.now(timezone.utc)
    poules_data = []

    def normalize_datetime(dt: Optional[datetime]) -> Optional[datetime]:
        if not dt:
            return None
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)

    def calculate_poule_status(start_time: Optional[datetime], end_time: Optional[datetime]) -> str:
        if not start_time or not end_time:
            return "invalide"
        
        if now < start_time:
            return "a-venir"
        elif start_time <= now <= end_time:
            if end_time - now <= timedelta(hours=24):
                return "fin-proche"
            return "en-cours"
        else:
            return "terminee"

    for participant in participants:
        poule = participant.poule
        start_time = normalize_datetime(poule.start_time)
        end_time = normalize_datetime(poule.end_time)

        # Calcul du statut
        status = calculate_poule_status(start_time, end_time)

        # Calcul du temps restant
        if status == "a-venir" and start_time:
            time_remaining = max(0, int((start_time - now).total_seconds()))
        elif status in ["en-cours", "fin-proche"] and end_time:
            time_remaining = max(0, int((end_time - now).total_seconds()))
        else:
            time_remaining = 0

        # Compter les participants
        participant_count = db.query(PouleParticipant).filter(
            PouleParticipant.poule_id == poule.id
        ).count()

        # Récupérer le meilleur score de l'utilisateur
        best_score = db.query(PouleBestScore).filter(
            PouleBestScore.poule_id == poule.id,
            PouleBestScore.user_id == user.id
        ).first()

        poules_data.append({
            "id": poule.id,
            "name": poule.name,
            "emoji": poule.emoji,
            "defi_id": poule.defi_id,
            "defi_name": poule.defi.title if poule.defi else "Défi inconnu",
            "defi_route": poule.defi.route if poule.defi else None,
            "participants": participant_count,
            "max_participants": poule.max_participants,
            "time_remaining_seconds": time_remaining,
            "status": status,
            "my_position": best_score.rank if best_score else None,
            "my_score": best_score.best_score if best_score else None,
            "rejouable": poule.rejouable,
            "start_time": start_time.isoformat() if start_time else None,
            "end_time": end_time.isoformat() if end_time else None
        })

    # Séparer les poules
    en_cours = [p for p in poules_data if p["status"] in ["a-venir", "en-cours", "fin-proche"]]
    terminees = [p for p in poules_data if p["status"] == "terminee"]

    return {
        "en_cours": en_cours,
        "terminees": terminees
    }



@router.get("/invitations")
def get_my_invitations(
    token_payload=Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Récupérer les invitations en attente de l'utilisateur"""
    auth0_id = token_payload["sub"]
    user = db.query(User).filter(User.auth0_id == auth0_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    
    invitations = db.query(PouleInvitation).filter(
        PouleInvitation.invitee_id == user.id,
        PouleInvitation.status == "pending"
    ).all()
    
    invitations_data = []
    now = datetime.now(timezone.utc)
    
    for invitation in invitations:
        poule = invitation.poule
        
        # Normaliser les timestamps
        if poule.end_time.tzinfo is None:
            poule_end_time = poule.end_time.replace(tzinfo=timezone.utc)
        else:
            poule_end_time = poule.end_time
            
        if poule.start_time.tzinfo is None:
            start_time = poule.start_time.replace(tzinfo=timezone.utc)
        else:
            start_time = poule.start_time
        
        # Vérifier si la poule est encore active
        if poule_end_time < now:
            # La poule est terminée, on ne l'affiche pas
            continue
        
        # Compter les participants
        participant_count = db.query(PouleParticipant).filter(
            PouleParticipant.poule_id == poule.id
        ).count()
        
        # Calculer le temps avant le début (<0 si déjà commencé)
        time_until_start = start_time - now
        
        invitations_data.append({
            "id": invitation.id,
            "poule_id": poule.id,
            "poule_name": poule.name,
            "poule_emoji": poule.emoji,
            "defi_id": poule.defi_id,
            "defi_name": poule.defi.title if poule.defi else "Défi inconnu",
            "inviter_name": invitation.inviter.name,
            "participants": participant_count,
            "max_participants": poule.max_participants,
            "rejouable": poule.rejouable,
            "start_time": poule.start_time.isoformat(),
            "time_until_start_seconds": int(time_until_start.total_seconds()),
            "created_at": invitation.created_at.isoformat()
        })
    
    return {"invitations": invitations_data}


@router.post("/invitations/respond")
def respond_to_invitation(
    request: RespondToInvitationRequest,
    token_payload=Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Accepter ou refuser une invitation"""
    auth0_id = token_payload["sub"]
    user = db.query(User).filter(User.auth0_id == auth0_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    
    invitation = db.query(PouleInvitation).filter(
        PouleInvitation.id == request.invitation_id,
        PouleInvitation.invitee_id == user.id
    ).first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation introuvable")
    
    if invitation.status != "pending":
        raise HTTPException(status_code=400, detail="Invitation déjà traitée")
    
    # Mettre à jour le statut
    invitation.status = "accepted" if request.accept else "refused"
    invitation.responded_at = datetime.now(timezone.utc)
    
    # Si acceptée, ajouter comme participant
    if request.accept:
        # Vérifier qu'il n'est pas déjà participant
        existing = db.query(PouleParticipant).filter(
            PouleParticipant.poule_id == invitation.poule_id,
            PouleParticipant.user_id == user.id
        ).first()
        
        if not existing:
            participant = PouleParticipant(
                poule_id=invitation.poule_id,
                user_id=user.id
            )
            db.add(participant)
    
    db.commit()
    
    return {
        "message": "Invitation acceptée" if request.accept else "Invitation refusée",
        "poule_id": invitation.poule_id
    }


@router.get("/{poule_id}/ranking")
def get_poule_ranking(
    poule_id: int,
    token_payload=Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Récupérer le classement d'une poule"""
    auth0_id = token_payload["sub"]
    user = db.query(User).filter(User.auth0_id == auth0_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    poule = db.query(Poule).filter(Poule.id == poule_id).first()
    if not poule:
        raise HTTPException(status_code=404, detail="Poule introuvable")

    # Vérifier que l'utilisateur est participant
    participant = db.query(PouleParticipant).filter(
        PouleParticipant.poule_id == poule_id,
        PouleParticipant.user_id == user.id
    ).first()

    if not participant:
        raise HTTPException(
            status_code=403,
            detail="Vous n'êtes pas participant de cette poule"
        )

    # Récupérer tous les participants
    participants = db.query(PouleParticipant).filter(
        PouleParticipant.poule_id == poule_id
    ).all()

    # Récupérer les meilleurs scores
    best_scores = db.query(PouleBestScore).filter(
        PouleBestScore.poule_id == poule_id
    ).all()
    best_scores_dict = {score.user_id: score for score in best_scores}

    # Construire le ranking complet
    ranking_data = []
    for participant in participants:
        score = best_scores_dict.get(participant.user_id)
        if score:
            best_score = score.best_score
            best_time = score.best_time_spent
            last_played_at = score.last_played_at.isoformat()
            total_attempts = score.total_attempts
        else:
            best_score = 0
            best_time = 0
            last_played_at = None
            total_attempts = 0

        ranking_data.append({
            "rank": 0, 
            "user_id": participant.user_id,
            "user_name": participant.user.name,
            "user_picture": participant.user.picture,
            "best_score": best_score,
            "best_time_spent": best_time,
            "total_attempts": total_attempts,
            "last_played_at": last_played_at,
            "is_current_user": participant.user_id == user.id
        })

    # Tri : les joueurs ayant joué d'abord, triés par score décroissant et temps croissant
    ranking_data.sort(
        key=lambda x: (x["best_score"] == 0, -x["best_score"], x["best_time_spent"])
    )

    # Recalculer le rang
    for i, r in enumerate(ranking_data, start=1):
        r["rank"] = i

    # Nombre réel de participants
    participants_count = len(participants)

    # Temps restant
    now = datetime.now(timezone.utc)
    poule_end_time = (
        poule.end_time.replace(tzinfo=timezone.utc)
        if poule.end_time.tzinfo is None
        else poule.end_time
    )
    time_remaining = poule_end_time - now

    return {
        "poule": {
            "id": poule.id,
            "name": poule.name,
            "emoji": poule.emoji,
            "defi_id": poule.defi_id,
            "defi_name": poule.defi.title if poule.defi else "Défi inconnu",
            "defi_route": poule.defi.route if poule.defi else None,
            "rejouable": poule.rejouable,
            "participants": participants_count,
            "time_remaining_seconds": max(0, int(time_remaining.total_seconds())),
            "status": poule.status
        },
        "ranking": ranking_data
    }



@router.post("/submit-score")
def submit_poule_score(
    request: SubmitPouleScoreRequest,
    token_payload=Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Soumettre un score pour une poule (après avoir joué au défi)"""
    auth0_id = token_payload["sub"]
    user = db.query(User).filter(User.auth0_id == auth0_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    
    poule = db.query(Poule).filter(Poule.id == request.poule_id).first()
    if not poule:
        raise HTTPException(status_code=404, detail="Poule introuvable")
    
    # Vérifier que l'utilisateur est participant
    participant = db.query(PouleParticipant).filter(
        PouleParticipant.poule_id == request.poule_id,
        PouleParticipant.user_id == user.id
    ).first()
    
    if not participant:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas participant de cette poule")
    
    # Récupérer la session de défi
    from db.models.users_db import DefiSession
    session = db.query(DefiSession).filter(DefiSession.id == request.session_id).first()
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session introuvable")
    
    # Vérifier les limites de rejouabilité
    best_score_record = db.query(PouleBestScore).filter(
        PouleBestScore.poule_id == request.poule_id,
        PouleBestScore.user_id == user.id
    ).first()
    
    if best_score_record:
        if poule.rejouable == "non":
            raise HTTPException(status_code=400, detail="Cette poule n'est pas rejouable")
        elif poule.rejouable not in ["unlimited"]:
            max_attempts = int(poule.rejouable)
            if best_score_record.total_attempts >= max_attempts:
                raise HTTPException(
                    status_code=400,
                    detail=f"Nombre maximum de tentatives atteint ({max_attempts})"
                )
    
    # Calculer le numéro de tentative
    attempt_number = 1
    if best_score_record:
        attempt_number = best_score_record.total_attempts + 1
    
    # Créer le score de poule
    poule_score = PouleScore(
        poule_id=request.poule_id,
        user_id=user.id,
        session_id=request.session_id,
        score=session.score,
        time_spent=session.time_spent,
        attempt_number=attempt_number
    )
    db.add(poule_score)
    
    # Mettre à jour ou créer le meilleur score
    is_new_best = False
    if not best_score_record:
        best_score_record = PouleBestScore(
            poule_id=request.poule_id,
            user_id=user.id,
            best_score=session.score,
            best_time_spent=session.time_spent,
            best_session_id=request.session_id,
            total_attempts=1
        )
        db.add(best_score_record)
        is_new_best = True
    else:
        best_score_record.total_attempts += 1
        best_score_record.last_played_at = datetime.now(timezone.utc)
        
        # Comparer avec le meilleur score
        if (session.score > best_score_record.best_score or 
            (session.score == best_score_record.best_score and 
             session.time_spent < best_score_record.best_time_spent)):
            best_score_record.best_score = session.score
            best_score_record.best_time_spent = session.time_spent
            best_score_record.best_session_id = request.session_id
            is_new_best = True
    
    db.commit()
    
    # Recalculer le rang
    better_scores = db.query(PouleBestScore).filter(
        PouleBestScore.poule_id == request.poule_id,
        (PouleBestScore.best_score > best_score_record.best_score) |
        ((PouleBestScore.best_score == best_score_record.best_score) &
         (PouleBestScore.best_time_spent < best_score_record.best_time_spent))
    ).count()
    
    rank = better_scores + 1
    
    return {
        "message": "🎉 Nouveau record dans la poule !" if is_new_best else "Score enregistré",
        "score": session.score,
        "attempt_number": attempt_number,
        "is_new_best": is_new_best,
        "rank": rank,
        "best_score": best_score_record.best_score
    }


@router.get("/users/search")
def search_users(
    query: str,
    token_payload=Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Rechercher des utilisateurs pour inviter à une poule"""
    if len(query) < 2:
        return {"users": []}
    
    users = db.query(User).filter(
        User.name.ilike(f"%{query}%") | User.email.ilike(f"%{query}%")
    ).limit(20).all()
    
    return {
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "picture": u.picture
            } for u in users
        ]
    }