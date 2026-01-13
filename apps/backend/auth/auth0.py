#  Ce qui concerne la vérification des tokens
from fastapi import Header, HTTPException
from jose import jwt, jwk
import requests

AUTH0_DOMAIN = "dev-waw2dcy45mcug27p.us.auth0.com"
API_AUDIENCE = "https://api.monstl.local"
ALGORITHMS = ["RS256"]

# Charger les clés une seule fois
jwks = requests.get(f"https://{AUTH0_DOMAIN}/.well-known/jwks.json").json()

def get_public_key(token: str):
    """
    Retourne la clé publique correspondant au token reçu
    """
    unverified_header = jwt.get_unverified_header(token)
    for key in jwks["keys"]:
        if key["kid"] == unverified_header["kid"]:
            return jwk.construct(key)
    raise HTTPException(status_code=401, detail="Public key introuvable")

def verify_token(authorization: str = Header(...)):
    """
    Dépendance FastAPI pour vérifier le token envoyé dans Authorization
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token manquant")
    
    token = authorization.split(" ")[1]

    try:
        payload = jwt.decode(token, get_public_key(token), algorithms=ALGORITHMS, audience=API_AUDIENCE)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.JWTError as e:
        raise HTTPException(status_code=401, detail=f"Token invalide: {str(e)}")

    return payload
