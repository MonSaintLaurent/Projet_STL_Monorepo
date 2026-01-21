from sqlalchemy.orm import Session
from db.models.userRelation import UserRelation
from datetime import datetime, timezone

def send_friend_request(db: Session, from_user_id: int, to_user_id: int):
    existing = db.query(UserRelation).filter(
        UserRelation.requester_id==from_user_id,
        UserRelation.addressee_id==to_user_id
    ).first()

    if existing:
        raise ValueError("Demande déjà envoyée ou relation existante")

    relation = UserRelation(
        requester_id=from_user_id,
        addressee_id=to_user_id,
        status="pending"
    )
    db.add(relation)
    db.commit()
    db.refresh(relation)
    return relation

def respond_friend_request(db: Session, relation_id: int, accept: bool):
    relation = db.query(UserRelation).filter(UserRelation.id==relation_id).first()
    if not relation:
        raise ValueError("Relation introuvable")
    
    relation.status = "accepted" if accept else "declined"
    relation.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(relation)
    return relation

def get_friends(db: Session, user_id: int):
    relations = db.query(UserRelation).filter(
        ((UserRelation.requester_id == user_id) | (UserRelation.addressee_id == user_id)) &
        (UserRelation.status == "accepted")
    ).all()

    friend_ids = []
    for r in relations:
        if r.requester_id == user_id:
            friend_ids.append(r.addressee_id)
        else:
            friend_ids.append(r.requester_id)
    
    return friend_ids

def get_pending_requests(db: Session, user_id: int):
    # Invitations reçues en attente
    return db.query(UserRelation).filter(
        UserRelation.addressee_id == user_id,
        UserRelation.status == "pending"
    ).all()
