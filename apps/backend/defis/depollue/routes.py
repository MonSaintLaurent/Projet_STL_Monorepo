from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from geoalchemy2.shape import to_shape

from db.database import SessionLocal
from db.models.depollue_db import DepollueMap, DepollueObject

router = APIRouter(prefix="/depollue", tags=["depollue"])

# --- Dépendance pour la session DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------- MAPS
@router.get("/maps")
def get_all_maps(db: Session = Depends(get_db)):
    """Retourne toutes les cartes disponibles"""
    maps = db.query(DepollueMap).all()
    result = []
    for m in maps:
        point = to_shape(m.center)
        result.append({
            "id": m.id,
            "name": m.name,
            "initial_view_state": {
                "longitude": point.x,  # GeoAlchemy Point -> x = lon
                "latitude": point.y,   # y = lat
                "zoom": m.zoom,
                "pitch": 0,
                "bearing": 0,
            },
            "timer": m.timer,
            "nb_pollutants": m.nb_pollutants,
            "nb_allowedObjects": m.nb_allowed_objects,
            "spawn_points": m.spawn_points
        })
    return {"maps": result}


@router.get("/maps/{map_id}")
def get_map(map_id: int, db: Session = Depends(get_db)):
    """Retourne une carte spécifique"""
    m = db.query(DepollueMap).filter(DepollueMap.id == map_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Map not found")

    point = to_shape(m.center)
    return {
        "id": m.id,
        "name": m.name,
        "initial_view_state": {
            "longitude": point.x,
            "latitude": point.y,
            "zoom": m.zoom,
            "pitch": 0,
            "bearing": 0,
        },
        "timer": m.timer,
        "nb_pollutants": m.nb_pollutants,
        "nb_allowedObjects": m.nb_allowed_objects,
        "spawn_points": m.spawn_points
    }


# -------- OBJETS
@router.get("/objects")
def get_objects(db: Session = Depends(get_db)):
    """Retourne les objets du jeu Depollue"""
    objects = db.query(DepollueObject).all()
    pollutants = []
    allowed_objects = []

    for o in objects:
        obj_dict = {
            "id": o.id,
            "emoji": o.emoji,
            "name": o.name,
            "description": o.description,
        }
        if o.object_type == "pollutant":
            pollutants.append(obj_dict)
        else:
            allowed_objects.append(obj_dict)

    return {
        "allowedObjects": allowed_objects,
        "pollutants": pollutants
    }
