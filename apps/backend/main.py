from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="MonSaintLaurent API", version="0.1.0")

# Version 0, pas du tout à jour, à mettre en place

# CORS pour permettre au frontend de communiquer
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "MonSaintLaurent API v0.1"}

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)