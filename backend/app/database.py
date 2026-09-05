"""
Database configuration for NeuroAdapt FastAPI backend.
Supports SQLite out-of-the-box (switchable to PostgreSQL via DATABASE_URL).
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./neuroadapt.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {
    "connect_timeout": 10,
}

if "sqlite" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        connect_args=connect_args,
        echo=False
    )
else:
    engine = create_engine(
        DATABASE_URL,
        connect_args=connect_args,
        pool_size=15,
        max_overflow=10,
        pool_timeout=15,
        pool_recycle=300,
        pool_pre_ping=True,
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
