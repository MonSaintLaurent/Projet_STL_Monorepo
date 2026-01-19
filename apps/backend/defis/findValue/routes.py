from fastapi import APIRouter, HTTPException
from sqlalchemy import create_engine, text
import json
import os
from dotenv import load_dotenv

findvalue_router = APIRouter(prefix="/data/findvalue", tags=["findvalue"])

load_dotenv()

# Config : PostgreSQL
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", 5432)

if not all([DB_USER, DB_PASSWORD, DB_NAME]):
    raise RuntimeError("Variables d'environnement DB manquantes")

DATABASE_URL = (
    f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

engine = create_engine(DATABASE_URL, echo=True)


@findvalue_router.get("/map/{map_id}")
def get_findvalue_map(map_id: int):
    """Retourne tous les points d'une carte FindValue depuis PostGIS"""

    # Vérifier que la map existe
    with engine.connect() as conn:
        map_exists = conn.execute(
            text("SELECT id FROM findvalue_maps WHERE id = :map_id"),
            {"map_id": map_id}
        ).fetchone()
    
    if not map_exists:
        raise HTTPException(status_code=404, detail=f"Map {map_id} non trouvée")

    # Construire le nom de table dynamique
    table_name = f"findvalue_points_map_{map_id}"

    # Vérifier que la table existe dans la base
    with engine.connect() as conn:
        table_check = conn.execute(
            text("""
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_name = :table_name
                )
            """),
            {"table_name": table_name}
        ).scalar()

    if not table_check:
        raise HTTPException(status_code=404, detail=f"Table {table_name} non trouvée")

    # Récupérer les points
    try:
        with engine.connect() as conn:
            # Ajouter .mappings() pour récupérer des dicos
            result = conn.execute(
                text(f"""
                    SELECT id, ST_AsGeoJSON(geom) AS geom, velocity
                    FROM {table_name}
                """)
            ).mappings().all()

        features = []
        for row in result:
            features.append({
                "type": "Feature",
                "geometry": json.loads(row["geom"]), 
                "properties": {"id": row["id"], "velocity": row["velocity"]}
            })

        return {"type": "FeatureCollection", "features": features}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur récupération points: {e}")

@findvalue_router.get("/maps")
def get_findvalue_maps():
    """Retourne la liste des cartes FindValue disponibles"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT id, name, timer,
                       ST_X(center::geometry) AS longitude,
                       ST_Y(center::geometry) AS latitude,
                       zoom,
                       geojson_path,
                       threshold1,
                       threshold2,
                       threshold3,
                       tick_alert,
                       result_phrase,
                       home_url
                FROM findvalue_maps
                ORDER BY id
            """)).mappings().all()

        maps = []
        for row in result:
            # Convertir les decimaux en float
            thresholds = [
                float(row["threshold1"]) if row["threshold1"] is not None else 0.5,
                float(row["threshold2"]) if row["threshold2"] is not None else 1.5,
                float(row["threshold3"]) if row["threshold3"] is not None else 2.5,
            ]
            
            maps.append({
                "id": row["id"],
                "name": row["name"],
                "timer": row["timer"],
                "initial_view_state": {
                    "longitude": row["longitude"],
                    "latitude": row["latitude"],
                    "zoom": row["zoom"],
                    "pitch": 0,
                    "bearing": 0
                },
                "geojson_path": row["geojson_path"],
                "thresholds": thresholds,
                "tick_alert": row.get("tick_alert", 10),
                "result_phrase": row.get("result_phrase", "Vous êtes à {velocity} m/s de la réponse."),
                "home_url": row.get("home_url", "/"),
            })
        return maps

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur récupération maps: {e}")