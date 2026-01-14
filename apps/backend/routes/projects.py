from fastapi import APIRouter
from db.database import SessionLocal
from db.models.projects_db import Project

router = APIRouter(prefix="/projects", tags=["projects"])

@router.get("/")
def get_projects():
    db = SessionLocal()
    projects = db.query(Project).all()
    db.close()
    return {"projects": [
        {
            "id": p.id,
            "name": p.name,
            "location": p.location,
            "description": p.description,
            "image": p.image,
            "route": p.route,
        } for p in projects
    ]}
