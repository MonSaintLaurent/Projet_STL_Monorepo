from sqlalchemy import Column, Integer, String, TIMESTAMP, func, Text, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, NUMERIC
from sqlalchemy.orm import relationship
from db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    auth0_id = Column(String(255), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=True)
    picture = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    country = Column(String, nullable=True, default="")
    description = Column(String, nullable=True, default="")
    last_login = Column(TIMESTAMP, nullable=True)

    sessions = relationship("DefiSession", back_populates="user")
    records = relationship("UserDefiRecord", back_populates="user")
    stats = relationship("UserStats", back_populates="user", uselist=False)

class DefiSession(Base):
    __tablename__ = "defi_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    defi_id = Column(Integer, ForeignKey("defis.id"), nullable=False, index=True)

    score = Column(Integer, nullable=True)
    time_spent = Column(Integer, nullable=True)
    completed = Column(Boolean, default=False)

    session_metadata = Column(JSONB, nullable=True)
    # ex: {"pollutants_collected": 12, "removed_allowed": 1, "map_id": 1, "multiplier": 1.7}

    started_at = Column(TIMESTAMP, server_default=func.now())
    completed_at = Column(TIMESTAMP, nullable=True)

    # Relations
    user = relationship("User", back_populates="sessions")
    defi = relationship("Defi")


class UserDefiRecord(Base):
    __tablename__ = "user_defi_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    defi_id = Column(Integer, ForeignKey("defis.id"), nullable=False, index=True)

    best_score = Column(Integer, nullable=False)
    max_score_at_time = Column(Integer, nullable=False)
    best_time_spent = Column(Integer, nullable=True)

    session_id = Column(Integer, ForeignKey("defi_sessions.id"), nullable=True)

    achieved_at = Column(TIMESTAMP, nullable=False, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "defi_id", name="uq_user_defi_record"),
    )

    # Relations
    user = relationship("User", back_populates="records")
    defi = relationship("Defi")
    session = relationship("DefiSession")


class UserStats(Base):
    __tablename__ = "user_stats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)

    total_play_time = Column(Integer, default=0)
    defis_played = Column(Integer, default=0)
    defis_completed = Column(Integer, default=0)
    total_sessions = Column(Integer, default=0)

    total_score = Column(Integer, default=0)
    max_score_ever = Column(Integer, default=0)

    first_played_at = Column(TIMESTAMP, nullable=True)
    last_played_at = Column(TIMESTAMP, nullable=True)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relation
    user = relationship("User", back_populates="stats")