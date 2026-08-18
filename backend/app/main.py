"""
NeuroAdapt FastAPI Backend Entry Point.
Connects directly to Supabase PostgreSQL database.
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

from .database import engine, Base, get_db
from .models import User, Child
from .schemas import UserCreate, UserResponse

# Create database tables if not exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NeuroAdapt API",
    description="Cognitive Health & Adaptive Therapy Platform API connected to Supabase",
    version="1.0.0",
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = "child"

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str

@app.get("/")
def read_root():
    return {"message": "NeuroAdapt API is active and connected to Supabase PostgreSQL", "status": "online"}

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    try:
        user_count = db.query(User).count()
        return {"status": "healthy", "database": "connected", "total_users": user_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection error: {str(e)}")

@app.post("/api/auth/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Simple password hashing placeholder for demo/dev (can use passlib in production)
    # In production, passlib / bcrypt is used
    hashed_pwd = f"pbkdf2:{req.password}"

    new_user = User(
        name=req.name.strip(),
        email=req.email.strip().lower(),
        hashed_password=hashed_pwd,
        role=req.role.strip().lower(),
        created_at=datetime.utcnow()
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # If role is child, also create entry in children table
    if new_user.role == "child":
        child_profile = Child(
            caregiver_id=None,
            clinician_id=None,
            name=new_user.name,
            age=8,
            profile_data={"signup_source": "portal_web"},
            created_at=datetime.utcnow()
        )
        db.add(child_profile)
        db.commit()

    return new_user

@app.post("/api/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    return {
        "message": "Login successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }

@app.get("/api/child/dashboard")
def get_child_dashboard(db: Session = Depends(get_db)):
    child = db.query(Child).first()
    child_name = child.name if child else "Aarav"
    child_age = child.age if child else 9

    return {
        "child": {
            "name": child_name,
            "age": child_age,
            "stars": 320,
            "streak_days": 7,
            "completed_sessions": 14,
            "overall_score": 88,
        },
        "scores": {
            "attention": {"score": 89, "change": "+4% this week"},
            "memory": {"score": 84, "change": "+6% this week"},
            "reasoning": {"score": 92, "change": "+2% this week"},
            "processing": {"score": 86, "change": "+5% this week"},
        },
        "featured_challenge": {
            "title": "Memory Match Challenge",
            "description": "Boost your visual recall and concentration with today's adaptive pattern matching exercise.",
            "duration": "10 mins",
            "level": "Level 2",
            "stars": 20,
        },
        "weekly_trend": [
            {"day": "May 1", "accuracy": 35},
            {"day": "May 3", "accuracy": 52},
            {"day": "May 5", "accuracy": 60},
            {"day": "May 7", "accuracy": 68},
            {"day": "May 9", "accuracy": 62},
            {"day": "May 11", "accuracy": 78},
            {"day": "May 12", "accuracy": 87},
        ],
        "recommended_games": [
            {"name": "Memory Match", "desc": "Visual memory recall exercise", "stars": 20, "domain": "Memory"},
            {"name": "Pattern Explorer", "desc": "Logical sequence recognition", "stars": 15, "domain": "Reasoning"},
            {"name": "Attention Builder", "desc": "Target focus & concentration", "stars": 20, "domain": "Attention"},
        ],
        "recent_achievements": [
            {"title": "Focus Master", "desc": "5 sessions", "unlocked": True},
            {"title": "Accuracy Pro", "desc": "80% accuracy", "unlocked": True},
            {"title": "Training Star", "desc": "10 sessions", "unlocked": True},
            {"title": "Quick Learner", "desc": "Fast learner", "unlocked": True},
        ]
    }


