from db.database import SessionLocal
from db import models
from datetime import datetime, timedelta, timezone

from defis.data.defis_data import defis_data
from defis.data.projects_data import projects_data
from defis.depollue.data import depollue_maps, pollutants, allowed_objects

from defis.findValue.data import findvalue_maps

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
            object_type="pollutant",
            image=obj.get("image", ""),
        ))

    for obj in allowed_objects.values():
        session.merge(models.DepollueObject(
            id=obj["id"],
            emoji=obj["emoji"],
            name=obj["name"],
            description=obj["description"],
            object_type="allowed",
            image=obj.get("image", ""),
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

    # --- Maps findValue
    for m in findvalue_maps.values():
        center = Point(
            m["initial_view_state"]["longitude"],
            m["initial_view_state"]["latitude"]
        )

        # merge = safe si déjà présent
        session.merge(models.FindValueMap(
            id=m["id"],
            name=m["name"],
            timer=m["timer"],
            center=from_shape(center, srid=4326),
            zoom=m["initial_view_state"]["zoom"],
            geojson_path=m["geojson_path"],
            threshold1=m.get("threshold1"),
            threshold2=m.get("threshold2"),
            threshold3=m.get("threshold3"),
            tick_alert=m.get("tick_alert", 10),
            result_phrase=m.get("result_phrase", "Vous êtes à {velocity} m/s de la réponse."),
            home_url=m.get("home_url", "/"),
        )
    )

    session.commit()
    init_poules_test_data(session) # Enlever si pas poules test
    session.close()

def init_poules_test_data(session):
    print("Initialisation des poules de test...")
    
    # Vérifier qu'on a au moins des utilisateurs et des défis
    users = session.query(models.User).limit(5).all()
    defis = session.query(models.Defi).limit(2).all()
    
    if len(users) < 2:
        print("Pas assez d'utilisateurs pour créer des poules de test (minimum 2 requis)")
        return
    
    if len(defis) < 1:
        print("Pas de défis disponibles pour créer des poules de test")
        return
    
    now = datetime.now(timezone.utc)
    
    # Vérifier si des poules existent déjà
    existing_poules = session.query(models.Poule).count()
    if existing_poules > 0:
        print(f"{existing_poules} poule(s) déjà existante(s), skip création de test")
        return
    
    # Poule 1: En cours
    try:
        poule1 = models.Poule(
            name="Les Gardiens du Fleuve",
            emoji="🌊",
            defi_id=defis[0].id,
            creator_id=users[0].id,
            max_participants=8,
            rejouable="non",
            start_time=now - timedelta(days=3),
            end_time=now + timedelta(days=4),
            status="en-cours"
        )
        session.add(poule1)
        session.commit()
        session.refresh(poule1)
        
        # Ajouter des participants avec scores
        for i, user in enumerate(users[:min(4, len(users))]):
            participant = models.PouleParticipant(
                poule_id=poule1.id,
                user_id=user.id
            )
            session.add(participant)
            
            best_score = models.PouleBestScore(
                poule_id=poule1.id,
                user_id=user.id,
                best_score=900 - (i * 50),  # 900, 850, 800, 750
                best_time_spent=120 + (i * 30),  # 120s, 150s, 180s, 210s
                total_attempts=1,
                rank=i + 1
            )
            session.add(best_score)
        
        session.commit()
        print(f"Poule de test créée: {poule1.name}")
    
    except Exception as e:
        print(f"Erreur lors de la création de la poule 1: {e}")
        session.rollback()
    
    # Poule 2: Fin proche
    if len(defis) > 1 and len(users) >= 3:
        try:
            poule2 = models.Poule(
                name="Experts du Saint-Laurent",
                emoji="🎯",
                defi_id=defis[1].id if len(defis) > 1 else defis[0].id,
                creator_id=users[1].id,
                max_participants=6,
                rejouable="3",
                start_time=now - timedelta(hours=50),
                end_time=now + timedelta(hours=10),
                status="fin-proche"
            )
            session.add(poule2)
            session.commit()
            session.refresh(poule2)
            
            for i, user in enumerate(users[:min(3, len(users))]):
                participant = models.PouleParticipant(
                    poule_id=poule2.id,
                    user_id=user.id
                )
                session.add(participant)
                
                if i < 2:
                    best_score = models.PouleBestScore(
                        poule_id=poule2.id,
                        user_id=user.id,
                        best_score=800 - (i * 100),
                        best_time_spent=150 + (i * 50),
                        total_attempts=2 if i == 0 else 1,
                        rank=i + 1
                    )
                    session.add(best_score)
            
            session.commit()
            print(f"Poule de test créée: {poule2.name}")
        
        except Exception as e:
            print(f"Erreur lors de la création de la poule 2: {e}")
            session.rollback()
    
    # Poule 3: Invitation en attente
    if len(users) >= 4:
        try:
            poule3 = models.Poule(
                name="Challenge du Week-end",
                emoji="👑",
                defi_id=defis[0].id,
                creator_id=users[2].id,
                max_participants=8,
                rejouable="unlimited",
                start_time=now + timedelta(hours=24),
                end_time=now + timedelta(days=3),
                status="en-cours"
            )
            session.add(poule3)
            session.commit()
            session.refresh(poule3)
            
            participant = models.PouleParticipant(
                poule_id=poule3.id,
                user_id=users[2].id
            )
            session.add(participant)
            
            for user in users[3:min(5, len(users))]:
                invitation = models.PouleInvitation(
                    poule_id=poule3.id,
                    invitee_id=user.id,
                    inviter_id=users[2].id,
                    status="pending"
                )
                session.add(invitation)
            
            session.commit()
            print(f"Poule de test créée: {poule3.name}")
        
        except Exception as e:
            print(f"Erreur lors de la création de la poule 3: {e}")
            session.rollback()
    
    print("Initialisation des poules de test terminée")


if __name__ == "__main__":
    init_data()
    print("Toutes les données initiales ont été insérées")
