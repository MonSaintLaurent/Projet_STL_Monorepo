from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from db.database import get_db
from auth.auth0 import verify_token
from db.models.users_db import User

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me")
def get_profile(token_payload=Depends(verify_token), db: Session = Depends(get_db)):
    auth0_id = token_payload["sub"]
    user = db.query(User).filter(User.auth0_id == auth0_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    
    stats = user.stats
    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "picture": user.picture,
            "country": user.country,
            "description": user.description
        },
        "stats": {
            "total_score": stats.total_score if stats else 0,
            "total_sessions": stats.total_sessions if stats else 0,
            "defis_played": stats.defis_played if stats else 0,
            "max_score_ever": stats.max_score_ever if stats else 0,
            "total_play_time": stats.total_play_time if stats else 0
        } if stats else None
    }

class UpdateProfileRequest(BaseModel):
    country: Optional[str] = None
    description: Optional[str] = None

@router.put("/me")
def update_profile(
    data: UpdateProfileRequest,
    token_payload=Depends(verify_token),
    db: Session = Depends(get_db)
):
    auth0_id = token_payload["sub"]
    user = db.query(User).filter(User.auth0_id == auth0_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    if data.country is not None:
        user.country = data.country
    if data.description is not None:
        user.description = data.description

    db.commit()
    db.refresh(user)
    return {"message": "Profil mis à jour", "user": {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "picture": user.picture,
        "country": user.country,
        "description": user.description
    }}
