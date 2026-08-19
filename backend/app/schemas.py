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
    age: Optional[int] = 8
    condition: Optional[str] = "Cognitive Support"

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

class ChildCreateRequest(BaseModel):
    name: str
    age: int = 8
    clinician_id: Optional[int] = None
    caregiver_id: Optional[int] = None
    condition: Optional[str] = "Developmental Cognitive Support"
    baseline_score: Optional[int] = 70

class TherapyPlanCreateRequest(BaseModel):
    child_id: int
    clinician_id: Optional[int] = None
    target_domains: List[str] = ["attention", "memory", "reasoning"]
    min_difficulty: int = 1
    max_difficulty: int = 10
    schedule_notes: Optional[str] = "3 sessions per week, 15 minutes each"

class AssignmentCreateRequest(BaseModel):
    child_id: int
    clinician_id: Optional[int] = None
    exercise_id: int
    difficulty: int = 1
    notes: Optional[str] = None

class SessionCompletionPayload(BaseModel):
    child_id: int
    exercise_id: int
    difficulty: int = 1
    score: int = 0
    accuracy: float = 0.0
    response_time_ms: float = 0.0
    errors: int = 0
    assignment_id: Optional[int] = None


