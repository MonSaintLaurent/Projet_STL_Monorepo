from db.database import SessionLocal
from db import models

from games.data.defis_data import defis_data
from games.data.projects_data import projects_data
from games.depollue.data import depollue_maps, pollutants, allowed_objects

from geoalchemy2.shape import from_shape
from shapely.geometry import Point

def init_data():
    session = SessionLocal()

    # --- Défis (insert que si n'existe pas)
    for g in defis_data:
        existing = session.query(models.Defi).filter_by(id=g["id"]).first()
        if not existing:
            session.merge(models.Defi(  # merge = safe si déjà présent
                id=g["id"],
                title=g["title"],
                description=g["description"],
                game_type=g["game_type"],
                difficulty=g["difficulty"],
                max_score=g["max_score"],
                image=g.get("image", ""),
                color=g.get("color", "blue"),
                route=g.get("route", ""),
                objective=g.get("objective", ""),
            ))

    # --- Projets
    for p in projects_data:
        session.merge(models.Project(
            id=p["id"],
            name=p["name"],
            location=p["location"],
            image=p.get("image", "🗺️"),
        ))

    # --- Objets Depollue
    for obj in pollutants.values():
        session.merge(models.DepollueObject(
            id=obj["id"],
            emoji=obj["emoji"],
            name=obj["name"],
            description=obj["description"],
            object_type="pollutant"
        ))

    for obj in allowed_objects.values():
        session.merge(models.DepollueObject(
            id=obj["id"],
            emoji=obj["emoji"],
            name=obj["name"],
            description=obj["description"],
            object_type="allowed"
        ))

    # --- Maps Depollue
    for m in depollue_maps.values():
        center = Point(
            m["initial_view_state"]["longitude"],
            m["initial_view_state"]["latitude"]
        )

        session.merge(models.DepollueMap(
            id=m["id"],
            name=m["name"],
            timer=m["timer"],
            nb_pollutants=m["nb_pollutants"],
            nb_allowed_objects=m["nb_allowedObjects"],
            center=from_shape(center, srid=4326),
            zoom=m["initial_view_state"]["zoom"],
            spawn_points=m["spawn_points"],
        ))

    session.commit()
    session.close()

if __name__ == "__main__":
    init_data()
    print("Toutes les données initiales ont été insérées")
