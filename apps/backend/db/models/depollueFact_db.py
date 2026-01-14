from sqlalchemy import Column, Integer, String, Text
from db.database import Base


class DepollueFact(Base):
    __tablename__ = "depollue_facts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    fact_type = Column(String(50), nullable=False)  # "funfact" | "recyclage"
    text = Column(Text, nullable=False)