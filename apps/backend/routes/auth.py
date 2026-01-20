# Endpoints

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from auth.auth0 import verify_token
from auth.auth0 import get_public_key
from db.database import get_db
from crud.users import get_user_by_auth0_id, create_user
from jose import jwt
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
from db.models.users_db import User

router = APIRouter(prefix="/auth", tags=["auth"])
router = APIRouter(prefix="/users", tags=["users"])

ALGORITHMS = ["RS256"]
API_AUDIENCE = "https://api.monstl.local"

@router.post("/sync_user")
def sync_user(authorization: str = Header(...), db: Session = Depends(get_db)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token manquant")
    
    token = authorization.split(" ")[1]

    try:
        payload = jwt.decode(token, get_public_key(token), algorithms=ALGORITHMS, audience=API_AUDIENCE)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.JWTError as e:
        raise HTTPException(status_code=401, detail=f"Token invalide: {str(e)}")

    # Récupérer les infos depuis les custom claims
    namespace = "https://api.monstl.local"
    email = payload.get(f"{namespace}/email")
    sub = payload.get("sub")
    name = payload.get(f"{namespace}/name")
    picture = payload.get(f"{namespace}/picture")

    # print(f"DEBUG - sub reçu du token: '{sub}'")  # Debug
    # print(f"DEBUG - type de sub: {type(sub)}")     # Debug

    if not email:
        print("Payload reçu:", payload)
        raise HTTPException(status_code=400, detail="Email manquant dans le token Auth0")

    # Vérifier si l'utilisateur existe déjà
    db_user = get_user_by_auth0_id(db, sub)
    
    # print(f"DEBUG - Utilisateur trouvé: {db_user}")  # Debug
    # if db_user:
    #     print(f"DEBUG - ID utilisateur: {db_user.id}, auth0_id: '{db_user.auth0_id}'")  # Debug
    
    if db_user:
        # Mettre à jour la dernière connexion
        db_user.last_login = datetime.now(timezone.utc)
        
        # Optionnel mais à voir plus tard (TODO): mettre à jour le nom et la photo si changés
        if name and db_user.name != name:
            db_user.name = name
        if picture and db_user.picture != picture:
            db_user.picture = picture
            
        db.commit()
        db.refresh(db_user)
        
        return {
            "message": "Utilisateur synchronisé",
            "user_id": db_user.id,
            "is_new": False
        }

    print(f"DEBUG - Création d'un nouvel utilisateur avec auth0_id: '{sub}'")  # DEBUG
    
    # Créer un nouvel utilisateur
    new_user = create_user(db, sub, email, name, picture)
    return {
        "message": "Utilisateur créé",
        "user_id": new_user.id,
        "is_new": True
    }

@router.get("/debug_token")
def debug_token(user=Depends(verify_token)):
    return user


@router.get("/protected")
def protected_route(user=Depends(verify_token)):
    return {"message": "Token valide", "user": user}


