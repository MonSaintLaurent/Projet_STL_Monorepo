from sqlalchemy import Column, Integer, String, Numeric, Text
from sqlalchemy.dialects.postgresql import JSONB
from geoalchemy2 import Geometry
from db.database import Base

class FindValueMap(Base):
    __tablename__ = "findvalue_maps"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    timer = Column(Integer, nullable=False)
    center = Column(Geometry("POINT", srid=4326), nullable=False)
    zoom = Column(Integer, default=10)
    geojson_path = Column(String(255), nullable=True)

    threshold1 = Column(Numeric, nullable=True) # Limites vitesses, affichage carte sur la légende = seuils
    threshold2 = Column(Numeric, nullable=True)
    threshold3 = Column(Numeric, nullable=True)
    tick_alert = Column(Integer, default=10)
    result_phrase = Column(Text, default="Vous êtes à {velocity} m/s de la réponse.")
    home_url = Column(String(255), default="/")
