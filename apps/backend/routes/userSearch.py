from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import or_

from db.database import get_db
from db.models.users_db import User
from auth.auth0 import verify_token
from pydantic import BaseModel

router = APIRouter(prefix="/userSearch", tags=["userSearch"])

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    picture: str

class UserSearchResponse(BaseModel):
    users: List[UserOut]

@router.get("/", response_model=UserSearchResponse)
def search_users(query: str = "", token_payload=Depends(verify_token), db: Session = Depends(get_db)):
    print(f"Recherche avec query: '{query}'")
    
    auth0_id = token_payload["sub"]
    current_user = db.query(User).filter(User.auth0_id == auth0_id).first()
    print(f"Utilisateur courant: {current_user.name if current_user else 'None'}")
    
    q = db.query(User)
    if current_user:
        q = q.filter(User.id != current_user.id)
    
    if query:
        q = q.filter(
            or_(
                User.name.ilike(f"%{query}%"),
                User.email.ilike(f"%{query}%")
            )
        )

    users = q.limit(20).all()
    print(f"Utilisateurs trouvés: {len(users)}")
    
    return {"users": users}