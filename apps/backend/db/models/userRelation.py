from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from db.database import Base

class UserRelation(Base):
    __tablename__ = "user_relations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Celui qui invite
    addressee_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Celui qui reçoit
    status = Column(String, nullable=False, default="pending")  # "pending", "accepted", "declined"
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))

    requester = relationship("User", foreign_keys=[requester_id])
    addressee = relationship("User", foreign_keys=[addressee_id])
