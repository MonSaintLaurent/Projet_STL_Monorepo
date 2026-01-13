from fastapi import APIRouter
from db.database import SessionLocal
from apps.backend.db.models.defis_db import Defi

router = APIRouter(prefix="/games", tags=["games"])

@router.get("/")
def get_games():
    db = SessionLocal()
    games = db.query(Defi).all()
    db.close()
    return {"games": [
        {
            "id": g.id,
            "title": g.title,
            "description": g.description,
            "image": g.image,
            "color": g.color,
            "route": g.route,
            "objective": g.objective,
        } for g in games
    ]}
