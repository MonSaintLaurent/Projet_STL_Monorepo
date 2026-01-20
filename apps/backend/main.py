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