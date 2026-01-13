from db.database import engine, Base
import db.models  # Force l'import de tous les modèles

def init_db():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    init_db()
    print("Toutes les tables ont été créées")
