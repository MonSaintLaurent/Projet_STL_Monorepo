from db.database import SessionLocal
from db import models

from defis.data.defis_data import defis_data
from defis.data.projects_data import projects_data
from defis.depollue.data import depollue_maps, pollutants, allowed_objects

from geoalchemy2.shape import from_shape
from shapely.geometry import Point

def init_data():
    session = SessionLocal()

    # --- Défis (insert que si n'existe pas)
    for g in defis_data:
        defi_name = g['route'].split('/')[-1]  # "/defis/depollue" -> "depollue"
        image_filename = f"{defi_name}Image.png"

        existing = session.query(models.Defi).filter_by(id=g["id"]).first()
        if not existing:
            image_path = f"/static/defis/{g['route']}.png" # route = nom du jeu ("depollue")
            session.merge(models.Defi(  # merge = safe si déjà présent
                id=g["id"],
                title=g["title"],
                description=g["description"],
                defi_type=g["defi_type"],
                difficulty=g["difficulty"],
                max_score=g["max_score"],
                image=image_filename,
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
            route=p.get("route", ""),
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

    # --- Fun facts et infos recyclage
    depollue_facts = [
        {"fact_type": "funfact", "text": "Le fleuve Saint-Laurent contient 20% de l'eau douce de surface de la planète !"},
        {"fact_type": "funfact", "text": "Une bouteille en plastique peut mettre jusqu'à 450 ans à se dégrader dans l'eau."},
        {"fact_type": "funfact", "text": "Le Saint-Laurent abrite plus de 80 espèces de poissons dont certaines sont endémiques."},
        {"fact_type": "funfact", "text": "Chaque année, environ 8 millions de tonnes de plastique finissent dans les océans du monde."},
        {"fact_type": "funfact", "text": "Un seul pneu peut contaminer jusqu'à 400 litres d'eau avec ses produits chimiques toxiques."},
        {"fact_type": "funfact", "text": "Le fleuve Saint-Laurent abrite plus de 80 espèces de poissons et 40 espèces de mammifères aquatiques."},
        {"fact_type": "recyclage", "text": "♻️ Les bouteilles en plastique peuvent être recyclées en vêtements polaires ! Une bouteille = environ 25% d'un pull en polaire."},
        {"fact_type": "recyclage", "text": "♻️ Un pneu usagé peut être recyclé en revêtement de terrain de sport, en tapis de sol ou même en carburant alternatif."},
        {"fact_type": "recyclage", "text": "🛢️ Les barils de pétrole vides peuvent être nettoyés et reconditionnés pour un usage industriel, évitant ainsi la pollution."},
    ]

    for fact in depollue_facts:
        session.merge(models.DepollueFact(
            id=fact.get("id"),
            fact_type=fact["fact_type"],
            text=fact["text"]
        ))

    session.commit()
    session.close()

if __name__ == "__main__":
    init_data()
    print("Toutes les données initiales ont été insérées")
