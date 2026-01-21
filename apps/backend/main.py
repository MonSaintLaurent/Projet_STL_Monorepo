from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from defis.depollue.routes import router as depollue_router
from routes.auth import router as auth_router
from routes.defis import router as defis_router
from routes.projects import router as projects_router
from defis.findValue.routes import findvalue_router
from routes.defi_sessions import router as defi_sessions_router
from routes.users import router as users_router
from routes import poules
from routes import userRelation
from routes import userSearch

app = FastAPI(title="MonSaintLaurent API", version="0.1.0")

# CORS pour permettre au frontend de communiquer avec le backend
origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # Front, URL autorisées
    allow_credentials=True, # Cookies autorisés
    allow_methods=["*"], # Pour get, POST, ...
    allow_headers=["*"],
)

app.include_router(depollue_router)
app.include_router(auth_router)
app.include_router(defis_router)
app.include_router(projects_router)
app.include_router(findvalue_router)
app.include_router(defi_sessions_router)
app.include_router(users_router)
app.include_router(poules.router)
app.include_router(userRelation.router)
app.include_router(userSearch.router)


@app.get("/")
def read_root():
    return {"message": "MonSaintLaurent API v0.1"}


BASE_DIR = Path(__file__).resolve().parent

# Défis
STATIC_DEFIS = BASE_DIR / "data" / "images" / "defis"
if not STATIC_DEFIS.exists():
    print(f"Dossier défis inexistant : {STATIC_DEFIS}")
else:
    print(f"Dossier défis trouvé : {STATIC_DEFIS}")
app.mount("/static/defis", StaticFiles(directory=str(STATIC_DEFIS)), name="defis")

# Objets Depollue
STATIC_DEPOLLUE = BASE_DIR / "data" / "images" / "depollue"
if not STATIC_DEPOLLUE.exists():
    print(f"Dossier depollue inexistant : {STATIC_DEPOLLUE}")
else:
    print(f"Dossier depollue trouvé : {STATIC_DEPOLLUE}")
app.mount("/static/depollue", StaticFiles(directory=str(STATIC_DEPOLLUE)), name="depollue")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
