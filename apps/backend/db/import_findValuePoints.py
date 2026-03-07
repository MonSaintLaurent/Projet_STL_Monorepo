import json
from pathlib import Path
from sqlalchemy import create_engine, Table, Column, Integer, Float, MetaData, text
from geoalchemy2 import Geometry
from geoalchemy2.shape import from_shape
from shapely.geometry import shape
import os
from dotenv import load_dotenv

load_dotenv()

# Config : PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("Variable DATABASE_URL manquante")

engine = create_engine(DATABASE_URL, echo=False)  # Désactive echo pour aller plus vite

# Définition de la table
metadata = MetaData()
findvalue_points_map_1 = Table(
    "findvalue_points_map_1", metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("map_id", Integer, nullable=False),
    Column("geom", Geometry(geometry_type="POINT", srid=4326), nullable=False),
    Column("velocity", Float, nullable=True),
)

# GeoJSON à importer
geojson_path = Path(__file__).parent.parent.parent / "frontend" / "public" / "data" / "points_v4_allveltime.geojson"

if not geojson_path.exists():
    raise FileNotFoundError(f"Fichier GeoJSON introuvable : {geojson_path}")

with open(geojson_path) as f:
    data = json.load(f)

map_id = 1

# Vérifier si les données existent déjà
with engine.connect() as conn:
    result = conn.execute(
        text("SELECT COUNT(*) FROM findvalue_points_map_1 WHERE map_id = :map_id"),
        {"map_id": map_id}
    ).scalar()
    
    if result > 0:
        print(f"⚠️  La table contient déjà {result} points pour map_id={map_id}")
        response = input("Voulez-vous supprimer les points existants et réimporter ? (y/N): ")
        if response.lower() == 'y':
            conn.execute(
                text("DELETE FROM findvalue_points_map_1 WHERE map_id = :map_id"),
                {"map_id": map_id}
            )
            conn.commit()
            print("✅ Points existants supprimés")
        else:
            print("❌ Import annulé")
            exit(0)

# Import par batch
print(f"Début de l'import de {len(data['features'])} points...")

BATCH_SIZE = 1000
batch = []

with engine.begin() as conn:
    for i, feature in enumerate(data["features"]):
        geom = from_shape(shape(feature["geometry"]), srid=4326)
        velocity = feature["properties"].get("velocity")
        if isinstance(velocity, list):
            velocity = velocity[1]
        
        batch.append({
            "map_id": map_id,
            "geom": geom,
            "velocity": velocity
        })
        
        # Insérer par lots de 1000
        if len(batch) >= BATCH_SIZE:
            conn.execute(findvalue_points_map_1.insert(), batch)
            print(f"{i+1}/{len(data['features'])} points insérés...")
            batch = []
    
    # Insérer le reste
    if batch:
        conn.execute(findvalue_points_map_1.insert(), batch)

print(f"Import terminé : {len(data['features'])} points ajoutés pour map_id={map_id}")