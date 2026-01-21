from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from db.database import get_db
from db.models.users_db import User
from db.models.userRelation import UserRelation
from db.userRelations_logic import send_friend_request, respond_friend_request, get_friends, get_pending_requests
from auth.auth0 import verify_token

router = APIRouter(prefix="/userRelation", tags=["userRelation"])

#----- MODELS
class FriendRequest(BaseModel):
    to_user_id: int

class FriendResponse(BaseModel):
    relation_id: int
    accept: bool

class FriendOut(BaseModel):
    id: int
    name: str
    email: str
    picture: str

class FriendsListResponse(BaseModel):
    friends: List[FriendOut]

#----- ROUTES 
@router.post("/request")
def create_friend_request(request: FriendRequest, token_payload=Depends(verify_token), db: Session = Depends(get_db)):
    auth0_id = token_payload["sub"]
    user = db.query(User).filter(User.auth0_id == auth0_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    
    try:
        relation = send_friend_request(db, user.id, request.to_user_id)
        return {"message": "Invitation envoyée", "relation_id": relation.id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/respond")
def respond_to_request(request: FriendResponse, token_payload=Depends(verify_token), db: Session = Depends(get_db)):
    auth0_id = token_payload["sub"]
    user = db.query(User).filter(User.auth0_id == auth0_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    
    relation = db.query(UserRelation).filter(
        UserRelation.id == request.relation_id, 
        UserRelation.addressee_id == user.id
    ).first()
    if not relation:
        raise HTTPException(status_code=404, detail="Relation introuvable")
    
    relation = respond_friend_request(db, request.relation_id, request.accept)
    return {"message": "Invitation acceptée" if request.accept else "Invitation refusée", "relation_id": relation.id}

@router.get("/my-friends", response_model=FriendsListResponse)
def list_friends(token_payload=Depends(verify_token), db: Session = Depends(get_db)):
    auth0_id = token_payload["sub"]
    user = db.query(User).filter(User.auth0_id == auth0_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    
    friend_ids = get_friends(db, user.id)
    friends = db.query(User).filter(User.id.in_(friend_ids)).all()
    
    return {"friends": friends}

@router.get("/pending-requests")
def list_pending_requests(token_payload=Depends(verify_token), db: Session = Depends(get_db)):
    auth0_id = token_payload["sub"]
    user = db.query(User).filter(User.auth0_id == auth0_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    
    requests = get_pending_requests(db, user.id)
    return {
        "pending_requests": [
            {
                "id": r.id, 
                "from_user_id": r.requester_id, 
                "from_user_name": r.requester.name
            } for r in requests
        ]
    }

@router.get("/sent-requests")
def list_sent_requests(token_payload=Depends(verify_token), db: Session = Depends(get_db)):
    """Récupérer les demandes d'amitié envoyées en attente"""
    auth0_id = token_payload["sub"]
    user = db.query(User).filter(User.auth0_id == auth0_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    
    # Invitations envoyées en attente
    sent_requests = db.query(UserRelation).filter(
        UserRelation.requester_id == user.id,
        UserRelation.status == "pending"
    ).all()
    
    return {
        "sent_requests": [
            {
                "id": r.id,
                "to_user_id": r.addressee_id,
                "to_user_name": r.addressee.name
            } for r in sent_requests
        ]
    }

@router.delete("/cancel/{relation_id}")
def cancel_friend_request(relation_id: int, token_payload=Depends(verify_token), db: Session = Depends(get_db)):
    """Annuler une demande d'amitié envoyée"""
    auth0_id = token_payload["sub"]
    user = db.query(User).filter(User.auth0_id == auth0_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    
    # Vérifier que c'est bien une demande envoyée par cet utilisateur
    relation = db.query(UserRelation).filter(
        UserRelation.id == relation_id,
        UserRelation.requester_id == user.id,
        UserRelation.status == "pending"
    ).first()
    
    if not relation:
        raise HTTPException(status_code=404, detail="Demande introuvable ou déjà traitée")
    
    db.delete(relation)
    db.commit()
    
    return {"message": "Demande annulée avec succès"}