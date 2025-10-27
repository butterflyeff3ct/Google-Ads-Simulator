"""
Database Models for Google Ads Simulator
"""
from sqlalchemy import Column, Integer, String, DateTime, Float, Text, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    provider = Column(String(50), nullable=False)  # google, microsoft, etc.
    profile_pic = Column(String(500), nullable=True)
    status = Column(String(20), default="active")  # active, inactive, suspended
    signup_timestamp = Column(DateTime, default=datetime.utcnow)
    first_login = Column(DateTime, nullable=True)
    last_login = Column(DateTime, nullable=True)
    approval_date = Column(DateTime, nullable=True)
    denial_reason = Column(Text, nullable=True)
    reapply_count = Column(Integer, default=0)
    added_by = Column(String(100), default="system")
    notes = Column(Text, nullable=True)
    
    # Relationships
    activities = relationship("UserActivity", back_populates="user", cascade="all, delete-orphan")
    campaigns = relationship("Campaign", back_populates="user", cascade="all, delete-orphan")
    simulations = relationship("Simulation", back_populates="user", cascade="all, delete-orphan")

class UserActivity(Base):
    __tablename__ = "user_activities"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    session_id = Column(String(100), nullable=False, index=True)
    login_time = Column(DateTime, nullable=False)
    logout_time = Column(DateTime, nullable=True)
    status = Column(String(20), default="active")  # active, ended, timeout
    duration_mins = Column(Integer, default=0)
    page_views = Column(Integer, default=0)
    actions_taken = Column(JSON, default=list)  # Store as JSON array
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    last_activity = Column(DateTime, nullable=True)
    idle_timeout = Column(Integer, default=15)
    
    # Relationships
    user = relationship("User", back_populates="activities")

class Campaign(Base):
    __tablename__ = "campaigns"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50), default="search")
    daily_budget = Column(Float, nullable=False)
    bidding_strategy = Column(String(50), default="manual_cpc")
    status = Column(String(20), default="draft")  # draft, active, paused, completed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    campaign_data = Column(JSON, nullable=True)  # Store full campaign configuration
    
    # Relationships
    user = relationship("User", back_populates="campaigns")
    simulations = relationship("Simulation", back_populates="campaign")

class Simulation(Base):
    __tablename__ = "simulations"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    campaign_id = Column(String(36), ForeignKey("campaigns.id"), nullable=True, index=True)
    simulation_type = Column(String(50), default="auction")  # auction, keyword_planner, etc.
    settings = Column(JSON, nullable=True)  # Simulation settings
    results = Column(JSON, nullable=True)  # Simulation results
    status = Column(String(20), default="running")  # running, completed, failed
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    execution_time_ms = Column(Integer, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="simulations")
    campaign = relationship("Campaign", back_populates="simulations")

class KeywordData(Base):
    __tablename__ = "keyword_data"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    keyword = Column(String(255), nullable=False, index=True)
    match_type = Column(String(20), nullable=False)  # exact, phrase, broad
    avg_cpc = Column(Float, nullable=True)
    competition = Column(String(20), nullable=True)  # low, medium, high
    search_volume = Column(Integer, nullable=True)
    quality_score = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AccessRequest(Base):
    __tablename__ = "access_requests"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    company = Column(String(255), nullable=True)
    role = Column(String(100), nullable=True)
    reason = Column(Text, nullable=True)
    status = Column(String(20), default="pending")  # pending, approved, denied
    requested_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
