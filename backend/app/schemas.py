"""
Pydantic Schemas for Request & Response Serialization.
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    name: str
    email: str
    role: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class SessionCompleteRequest(BaseModel):
    child_id: int
    exercise_id: int
    domain: str
    difficulty: int
    score: int
    accuracy: float
    response_time_ms: float
    errors: int

class PersonalizationPredictRequest(BaseModel):
    domain_idx: int
    prev_difficulty: int
    accuracy: float
    mean_response_time_ms: float
    error_count: int
    rolling_accuracy_5: float
    rolling_rt_ms_5: float
    fatigue_score: Optional[float] = 0.2
    min_bound: Optional[int] = 1
    max_bound: Optional[int] = 10

class ClinicianAISummaryRequest(BaseModel):
    child_id: int
    child_name: str
    age: int
    sessions_completed: int
    recent_accuracy_avg: float
    recent_reaction_time_ms: float
    domain_breakdown: Dict[str, float]
    struggling_domains: List[str]
