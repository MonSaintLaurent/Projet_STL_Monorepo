from fastapi import APIRouter
from db.database import SessionLocal
from db.models.defis_db import Defi

router = APIRouter(prefix="/defis", tags=["defis"])

@router.get("/")
def get_defis():
    db = SessionLocal()
    defis = db.query(Defi).all()
    db.close()
    return {"defis": [
        {
            "id": d.id,
            "title": d.title,
            "description": d.description,
            "image": d.image,
            "color": d.color,
            "route": d.route,
            "objective": d.objective,
        } for d in defis
    ]}
