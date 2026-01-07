from fastapi import APIRouter, HTTPException
from .data import depollue_maps, allowed_objects, pollutants

router = APIRouter(prefix="/depollue", tags=["depollue"])

# -------- MAPS
@router.get("/maps")
def get_all_maps():
    """Retourne toutes les cartes disponibles"""
    return {"maps": list(depollue_maps.values())}

@router.get("/maps/{map_id}")
def get_map(map_id: int):
    """Retourne 1 carte spécifique"""
    if map_id in depollue_maps:
        return depollue_maps[map_id]
    raise HTTPException(status_code=404, detail="Map not found")

# -------- OBJETS

@router.get("/objects")
def get_objects():
    """Retourne les objets du jeu Depollue"""
    return {
        "allowedObjects": list(allowed_objects.values()),
        "pollutants": list(pollutants.values())
    }