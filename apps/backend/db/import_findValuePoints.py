import json
from pathlib import Path

from sqlalchemy import create_engine, Table, Column, Integer, Float, MetaData
from geoalchemy2 import Geometry
from geoalchemy2.shape import from_shape
from shapely.geometry import shape
import os
from dotenv import load_dotenv

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


# Définition de la table
metadata = MetaData()
findvalue_points_map_1 = Table(
    "findvalue_points_map_1", metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("map_id", Integer, nullable=False),
    Column("geom", Geometry(geometry_type="POINT", srid=4326), nullable=False),
    Column("velocity", Float, nullable=True),
)


# GeoJSON à importer, ajuste le chemin vers le GeoJSON
geojson_path = Path(__file__).parent.parent.parent / "frontend" / "public" / "data" / "points_v4_allveltime.geojson"

if not geojson_path.exists():
    raise FileNotFoundError(f"Fichier GeoJSON introuvable : {geojson_path}")

with open(geojson_path) as f:
    data = json.load(f)

map_id = 1  # ID de la carte à associer aux points


# Import des points
with engine.begin() as conn:
    for feature in data["features"]:
        geom = from_shape(shape(feature["geometry"]), srid=4326)  # Convertit en WKBElement compatible PostGIS
        # Vérifie si velocity existe dans properties
        velocity = feature["properties"].get("velocity")
        if isinstance(velocity, list):
            velocity = velocity[1]  # Prendre vitesse au temps 1 et non pas 0 (car nulles)

        conn.execute(
            findvalue_points_map_1.insert().values(
                map_id=map_id,
                geom=geom,
                velocity=velocity
            )
        )

print(f"Import terminé : {len(data['features'])} points ajoutés pour map_id={map_id}")
