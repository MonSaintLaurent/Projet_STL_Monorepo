from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from defis.depollue.routes import router as depollue_router
from routes.auth import router as auth_router
from routes.defis import router as defis_router
from routes.projects import router as projects_router

from defis.findValue.routes import findvalue_router


app = FastAPI(title="MonSaintLaurent API", version="0.1.0")

# CORS pour permettre au frontend de communiquer avec le backend
origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Front, URL autorisées
    allow_credentials=True, # Cookies autorisés
    allow_methods=["*"], # Pour get, POST, ...
    allow_headers=["*"],
)

app.include_router(depollue_router)
app.include_router(auth_router)
app.include_router(defis_router)
app.include_router(projects_router)
app.include_router(findvalue_router)


@app.get("/")
def read_root():
    return {"message": "MonSaintLaurent API v0.1"}


BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "data" / "images" / "defis"

if not STATIC_DIR.exists():
    print(f"Le dossier {STATIC_DIR} n'existe pas")
else:
    print(f"Dossier static trouvé : {STATIC_DIR}")

app.mount("/static/defis", StaticFiles(directory=str(STATIC_DIR)), name="defis")



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)









'''
# Routes pour les data
@app.get("/data/layers")
def get_layers():
    """Retourne les couches de données dispos, à remodifier"""
    return {
        "layers": [
            {"id": 1, "name": "Courant", "type": "velocity"},
            {"id": 2, "name": "Température", "type": "temperature"},
        ]
    }

@app.get("/data/geojson/{project_name}")
def get_geojson(project_name: str):
    """
    Retourne les data GeoJSON pour un projet
    TODO: Récupérer depuis PostgreSQL avec PostGIS, mais pour l'instant retourne juste un exemple
    """
    # TEMPORAIRE: Lit depuis le fichier
    # Plus tard, on fera par ex SELECT * FROM geo_points WHERE project = project_name, ou à voir
    import json
    try:
        with open("../data/points_v4_allveltime.geojson", "r") as f:
            data = json.load(f)
        return data
    except:
        return {"error": "Project not found"}

@app.get("/data/variables")
def get_variables():
    """Retourne les variables disponibles"""
    return {
        "variables": ["velocity", "temperature", "salinity"]
    }

# Routes pour les défis
@app.post("/defi/start")
def start_defi(defi_id: int):
    """Initialise un défi"""
    return {
        "defi_id": defi_id,
        "status": "started",
        "initial_state": {}
    }

@app.post("/defi/result")
def submit_result(defi_id: int, score: int):
    """Donne un résultat de défi"""
    return {
        "defi_id": defi_id,
        "score": score,
        "saved": True
    }


'''