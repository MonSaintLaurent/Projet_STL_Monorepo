from fastapi import APIRouter
from pathlib import Path

router = APIRouter(prefix="/equipe", tags=["equipe"])

BASE_DIR = Path(__file__).resolve().parents[1]
IMAGES_PATH = BASE_DIR / "data" / "images" / "equipe"

@router.get("/")
def get_team():
    images = []

    for i, file in enumerate(IMAGES_PATH.iterdir()):
        if file.suffix.lower() in [".png", ".jpg", ".jpeg"]:
            images.append({
                "id": i,
                "image": file.name
            })

    return {"members": images}