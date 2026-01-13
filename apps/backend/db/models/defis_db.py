from sqlalchemy import Column, Integer, String, Text
from db.database import Base

class Defi(Base):
    __tablename__ = "defis"

    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    game_type = Column(Text, nullable=True)
    difficulty = Column(Text, nullable=False)
    max_score = Column(Integer, nullable=False)
    image = Column(String(255), nullable=True)
    color = Column(String(50), nullable=True)
    route = Column(String(255), nullable=True)
    objective = Column(Text, nullable=True)
