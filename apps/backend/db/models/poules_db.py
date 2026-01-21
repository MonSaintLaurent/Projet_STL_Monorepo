from sqlalchemy import Column, Integer, String, TIMESTAMP, func, Text, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from db.database import Base

class Poule(Base):
    """Table principale des poules (compétitions)"""
    __tablename__ = "poules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    emoji = Column(String(50), nullable=True, default="🏆")
    
    # Défi associé
    defi_id = Column(Integer, ForeignKey("defis.id"), nullable=False, index=True)
    
    # Créateur de la poule
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Configuration de la poule
    max_participants = Column(Integer, nullable=False, default=8)
    rejouable = Column(String(50), nullable=False, default="non")  # "non", "2", "3", "unlimited"
    
    # Dates
    start_time = Column(TIMESTAMP, nullable=False)
    end_time = Column(TIMESTAMP, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Statut
    status = Column(String(50), nullable=False, default="en-cours")  # "en-cours", "fin-proche", "terminee"
    
    # Relations
    defi = relationship("Defi")
    creator = relationship("User", foreign_keys=[creator_id])
    participants = relationship("PouleParticipant", back_populates="poule")
    invitations = relationship("PouleInvitation", back_populates="poule")
    scores = relationship("PouleScore", back_populates="poule")


class PouleParticipant(Base):
    """Table des participants à une poule"""
    __tablename__ = "poule_participants"

    id = Column(Integer, primary_key=True, index=True)
    poule_id = Column(Integer, ForeignKey("poules.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Dates
    joined_at = Column(TIMESTAMP, server_default=func.now())
    
    __table_args__ = (
        UniqueConstraint("poule_id", "user_id", name="uq_poule_participant"),
    )
    
    # Relations
    poule = relationship("Poule", back_populates="participants")
    user = relationship("User")


class PouleInvitation(Base):
    """Table des invitations à rejoindre une poule"""
    __tablename__ = "poule_invitations"

    id = Column(Integer, primary_key=True, index=True)
    poule_id = Column(Integer, ForeignKey("poules.id"), nullable=False, index=True)
    
    # Invité
    invitee_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Inviteur (celui qui a créé la poule généralement)
    inviter_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Statut de l'invitation
    status = Column(String(50), nullable=False, default="pending")  # "pending", "accepted", "refused"
    
    # Dates
    created_at = Column(TIMESTAMP, server_default=func.now())
    responded_at = Column(TIMESTAMP, nullable=True)
    
    __table_args__ = (
        UniqueConstraint("poule_id", "invitee_id", name="uq_poule_invitation"),
    )
    
    # Relations
    poule = relationship("Poule", back_populates="invitations")
    invitee = relationship("User", foreign_keys=[invitee_id])
    inviter = relationship("User", foreign_keys=[inviter_id])


class PouleScore(Base):
    """Table des scores des participants dans une poule
    Garde trace de toutes les tentatives si rejouable"""
    __tablename__ = "poule_scores"

    id = Column(Integer, primary_key=True, index=True)
    poule_id = Column(Integer, ForeignKey("poules.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Référence à la session de défi
    session_id = Column(Integer, ForeignKey("defi_sessions.id"), nullable=False, index=True)
    
    # Score de cette tentative
    score = Column(Integer, nullable=False)
    time_spent = Column(Integer, nullable=True)
    
    # Numéro de la tentative (1, 2, 3, etc.)
    attempt_number = Column(Integer, nullable=False, default=1)
    
    # Date
    played_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relations
    poule = relationship("Poule", back_populates="scores")
    user = relationship("User")
    session = relationship("DefiSession")


class PouleBestScore(Base):
    """Table des meilleurs scores par participant dans chaque poule, pour affichage rapide du classement"""
    __tablename__ = "poule_best_scores"

    id = Column(Integer, primary_key=True, index=True)
    poule_id = Column(Integer, ForeignKey("poules.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Meilleur score
    best_score = Column(Integer, nullable=False)
    best_time_spent = Column(Integer, nullable=True)
    
    # Référence à la meilleure session
    best_session_id = Column(Integer, ForeignKey("defi_sessions.id"), nullable=True)
    
    # Nombre total de tentatives
    total_attempts = Column(Integer, nullable=False, default=1)
    
    # Position dans le classement (màj périodiquement)
    rank = Column(Integer, nullable=True)
    
    # Dates
    first_played_at = Column(TIMESTAMP, server_default=func.now())
    last_played_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        UniqueConstraint("poule_id", "user_id", name="uq_poule_best_score"),
    )
    
    # Relations
    poule = relationship("Poule")
    user = relationship("User")
    best_session = relationship("DefiSession")