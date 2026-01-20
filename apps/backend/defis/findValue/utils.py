from sqlalchemy import text
from geoalchemy2 import WKBElement
from shapely.geometry import shape, mapping
import json
from .cache import findvalue_best_points

def load_best_point(engine, map_id: int):
    """
    Charge le point avec la velocity max pour une map FindValue.
    Remplit le cache findvalue_best_points[map_id].
    """
    table_name = f"findvalue_points_map_{map_id}"

    with engine.connect() as conn:
        result = conn.execute(
            text(f"""
                SELECT id, ST_AsGeoJSON(geom) AS geom, velocity
                FROM {table_name}
                ORDER BY velocity DESC
                LIMIT 1
            """)
        ).mappings().first()

    if result:
        best = {
            "id": result["id"],
            "geom": json.loads(result["geom"]),
            "velocity": result["velocity"]
        }
        findvalue_best_points[map_id] = best
        return best
    return None
