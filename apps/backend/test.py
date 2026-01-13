from dotenv import load_dotenv
import os

load_dotenv()  # charge le .env

print(os.getenv("AUTH0_DOMAIN"))
