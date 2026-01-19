from sqlalchemy import Column, Integer, Float, ForeignKey
from geoalchemy2 import Geometry
from db.database import Base

class FindValuePoint(Base):
    __tablename__ = "findvalue_points_map_1"

    id = Column(Integer, primary_key=True)
    map_id = Column(Integer, ForeignKey("findvalue_maps.id"), nullable=False)
    geom = Column(Geometry("POINT", srid=4326), nullable=False)
    velocity = Column(Float, nullable=False)
