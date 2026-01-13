# Sync DB users : créer un user en DB, le retrouver, màj last_login
# Create Read Update Delete

from sqlalchemy.orm import Session
from apps.backend.db.models.users_db import User
from datetime import datetime, timezone

def get_user_by_auth0_id(db: Session, auth0_id: str):
    return db.query(User).filter(User.auth0_id == auth0_id).first()

def create_user(db: Session, auth0_id: str, email: str, name: str = None, picture: str = None):
    user = User(
        auth0_id=auth0_id, 
        email=email, 
        name=name, 
        picture=picture,
        last_login=datetime.now(timezone.utc) # Heure en UTC, TODO changer plus tard l'affichage en heure local user, si on veut afficher l'heure sur les pages
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def update_user_info(db: Session, user: User, name: str = None, picture: str = None):
    """Màj les infos user et last_login"""
    user.last_login = datetime.now(timezone.utc)
    if name:
        user.name = name
    if picture:
        user.picture = picture
    db.commit()
    db.refresh(user)
    return user