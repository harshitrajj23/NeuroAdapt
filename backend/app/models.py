"""
SQLAlchemy ORM Models for NeuroAdapt Platform (SIH260206).
Matches Section 17 Database Schema requirements.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship

from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False)  # "child", "clinician", "admin"
    created_at = Column(DateTime, default=datetime.utcnow)

class Child(Base):
    __tablename__ = "children"

    id = Column(Integer, primary_key=True, index=True)
    caregiver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    clinician_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String(120), nullable=False)
    age = Column(Integer, nullable=False, default=8)
    profile_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    domain = Column(String(50), nullable=False)  # "attention", "memory", "reasoning", "problem_solving"
    difficulty = Column(Integer, default=1)
    configuration = Column(JSON, nullable=True)

class TherapyPlan(Base):
    __tablename__ = "therapy_plans"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False)
    clinician_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_domains = Column(JSON, nullable=False)  # list of target domains
    min_difficulty = Column(Integer, default=1)
    max_difficulty = Column(Integer, default=10)
    schedule_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class SessionRecord(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class Performance(Base):
    __tablename__ = "performance"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    score = Column(Integer, default=0)
    accuracy = Column(Float, default=0.0)
    response_time = Column(Float, default=0.0)  # ms
    errors = Column(Integer, default=0)
    difficulty = Column(Integer, default=1)

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=True)
    recommended_difficulty = Column(Integer, nullable=False)
    recommended_exercise = Column(String(100), nullable=False)
    model_version = Column(String(50), default="ScratchDecisionTree_v1")
    created_at = Column(DateTime, default=datetime.utcnow)

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False)
    clinician_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    difficulty = Column(Integer, default=1)
    status = Column(String(30), default="pending")  # "pending", "completed"
    notes = Column(Text, nullable=True)
    assigned_date = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=True)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="assignment")  # "assignment", "session_complete", "alert"
    link = Column(String(200), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class VoiceInterview(Base):
    __tablename__ = "voice_interviews"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False)
    duration_seconds = Column(Integer, default=75)
    challenges_completed = Column(Integer, default=3)
    overall_accuracy = Column(Float, default=0.0)
    memory_accuracy = Column(Float, default=0.0)
    attention_accuracy = Column(Float, default=0.0)
    reasoning_accuracy = Column(Float, default=0.0)
    response_latency_ms = Column(Float, default=0.0)
    latency_delta_percent = Column(Float, default=0.0)
    adaptive_changes = Column(JSON, nullable=True)
    ai_observation = Column(Text, nullable=True)
    transcript = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)



