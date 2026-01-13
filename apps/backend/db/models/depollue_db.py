from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from geoalchemy2 import Geometry

from db.database import Base


class DepollueMap(Base):
    __tablename__ = "depollue_maps"

    id = Column(Integer, primary_key=True)

    name = Column(String(255), nullable=False)

    # Gameplay
    timer = Column(Integer, nullable=False)
    nb_pollutants = Column(Integer, nullable=False)
    nb_allowed_objects = Column(Integer, nullable=False)

    # Carte
    center = Column(Geometry("POINT", srid=4326), nullable=False)
    zoom = Column(Integer, default=10)
    
    spawn_points = Column(JSONB, nullable=False)


class DepollueObject(Base):
    __tablename__ = "depollue_objects"

    id = Column(String(50), nullable=False, primary_key=True)  # plastic_bottle
    emoji = Column(String(10), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)

    object_type = Column(String(20), nullable=False)  # pollutant | allowed
