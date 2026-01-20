from fastapi import APIRouter, HTTPException
from sqlalchemy import create_engine, text
from shapely.geometry import shape, mapping
import json
import os
from dotenv import load_dotenv
from .cache import findvalue_best_points
from .utils import load_best_point

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
    

@findvalue_router.post("/map/{map_id}/validate")
def validate_point(map_id: int, player_point: dict):
    """
    player_point = { "longitude": float, "latitude": float, "time_left": int }
    Calcule le score basé sur la distance et le temps restant
    """
    # Récupérer le point max dans le cache (ou charger si absent)
    best = findvalue_best_points.get(map_id) or load_best_point(engine, map_id)
    if not best:
        raise HTTPException(status_code=404, detail="Best point not found")

    # Calculer distance avec PostGIS
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT ST_Distance(
                    ST_GeogFromText(:player_wkt),
                    ST_GeogFromText(:best_wkt)
                ) as distance_m
            """),
            {
                "player_wkt": f"POINT({player_point['longitude']} {player_point['latitude']})",
                "best_wkt": f"POINT({best['geom']['coordinates'][0]} {best['geom']['coordinates'][1]})"
            }
        ).scalar()
    
    distance_m = float(result)

    # Récupérer le timer de la map
    with engine.connect() as conn:
        map_timer = conn.execute(
            text("SELECT timer FROM findvalue_maps WHERE id = :map_id"),
            {"map_id": map_id}
        ).scalar()

    # Calcul du score de distance (0-700 points)
    max_distance = 5000  # 5km
    if distance_m <= 50:
        distance_score = 700
    elif distance_m >= max_distance:
        distance_score = 0
    else:
        distance_score = int(700 * (1 - (distance_m - 50) / (max_distance - 50)))

    # Calcul du bonus temps (0-300 points)
    time_left = player_point.get("time_left", 0)
    time_percent = (time_left / map_timer) * 100 if map_timer > 0 else 0
    
    if time_percent >= 75:
        time_bonus = 300
    elif time_percent >= 50:
        time_bonus = 200
    elif time_percent >= 25:
        time_bonus = 100
    else:
        time_bonus = 50

    # Score final
    final_score = distance_score + time_bonus

    return {
        "won": distance_m <= 50,
        "distance_m": round(distance_m, 2),
        "distance_score": distance_score,
        "time_bonus": time_bonus,
        "final_score": final_score,
        "max_score": 1000,
        "player_point": {"type": "Point", "coordinates": [player_point["longitude"], player_point["latitude"]]},
        "best_point": best["geom"],
        "best_velocity": best["velocity"],
    }


@findvalue_router.get("/map/{map_id}/debug")
def debug_map_stats(map_id: int):
    """Debug: affiche les stats de vitesse pour une map"""
    table_name = f"findvalue_points_map_{map_id}"
    
    with engine.connect() as conn:
        stats = conn.execute(
            text(f"""
                SELECT 
                    MAX(velocity) as max_velocity,
                    MIN(velocity) as min_velocity,
                    AVG(velocity) as avg_velocity,
                    COUNT(*) as total_points,
                    ST_AsGeoJSON((SELECT geom FROM {table_name} ORDER BY velocity DESC LIMIT 1)) as best_point_geom
                FROM {table_name}
            """)
        ).mappings().first()
    
    # Vérifier le cache
    cached = findvalue_best_points.get(map_id)
    
    return {
        "db_stats": {
            "max_velocity": float(stats["max_velocity"]),
            "min_velocity": float(stats["min_velocity"]),
            "avg_velocity": float(stats["avg_velocity"]),
            "total_points": stats["total_points"],
            "best_point": json.loads(stats["best_point_geom"])
        },
        "cached_best": cached
    }