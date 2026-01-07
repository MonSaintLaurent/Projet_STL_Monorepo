import os
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from dotenv import load_dotenv
from sqlalchemy import text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

print("En train de lire .env...")
print("DATABASE_URL:", DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("SELECT PostGIS_Full_Version();"))
    print("Version PostGIS :", result.fetchone()[0])
    
try:
    with engine.connect() as conn:
        # Transformer chaîne SQL en objet exécutable
        result = conn.execute(text("SELECT version();"))
        print("Connexion OK. Version PostgreSQL :", result.fetchone()[0])
except OperationalError as e:
    print("Erreur connexion :", e)
