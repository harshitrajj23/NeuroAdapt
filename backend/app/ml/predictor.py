"""
Predictor and Safety Boundary Enforcer for NeuroAdapt.
Converts live session telemetry into bounded next difficulty recommendation.
"""

from typing import Dict, Any
from .scratch_decision_tree import ScratchDecisionTreeClassifier
from .dataset_generator import generate_session_dataset

# Global single instance of trained model for fast inference
_trained_model = None

def get_trained_model() -> ScratchDecisionTreeClassifier:
    global _trained_model
    if _trained_model is None:
        dataset = generate_session_dataset(1200)
        feature_keys = [
            "domain_idx", "prev_difficulty", "accuracy",
            "mean_response_time_ms", "error_count", "rolling_accuracy_5",
            "rolling_rt_ms_5", "domain_fatigue_score"
        ]
        X = [[row[k] for k in feature_keys] for row in dataset]
        y = [row["difficulty_action"] for row in dataset]
        
        model = ScratchDecisionTreeClassifier(min_samples_split=4, max_depth=6)
        model.fit(X, y)
        _trained_model = model
    return _trained_model

def predict_next_difficulty(
    domain_idx: int,
    prev_difficulty: int,
    accuracy: float,
    mean_rt_ms: float,
    error_count: int,
    rolling_accuracy_5: float,
    rolling_rt_ms_5: float,
    fatigue_score: float = 0.2,
    min_bound: int = 1,
    max_bound: int = 10
) -> Dict[str, Any]:
    """
    Predicts difficulty action using ML model and applies clinical safety constraints.
    Safety principle: Difficulty shift is clamped to max +/- 1 step per session.
    """
    model = get_trained_model()
    feature_vector = [[
        domain_idx, prev_difficulty, accuracy,
        mean_rt_ms, error_count, rolling_accuracy_5,
        rolling_rt_ms_5, fatigue_score
    ]]

    predicted_action = model.predict(feature_vector)[0]  # "decrease", "maintain", "increase"

    # Convert action to target recommendation
    if predicted_action == "increase":
        raw_next = prev_difficulty + 1
    elif predicted_action == "decrease":
        raw_next = prev_difficulty - 1
    else:
        raw_next = prev_difficulty

    # Apply therapeutic safety bounds
    clamped_next = max(min_bound, min(max_bound, raw_next))
    
    # Calculate step delta
    delta = clamped_next - prev_difficulty

    return {
        "prev_difficulty": prev_difficulty,
        "predicted_action": predicted_action,
        "raw_recommended_difficulty": raw_next,
        "clamped_recommended_difficulty": clamped_next,
        "delta": delta,
        "applied_bounds": {"min": min_bound, "max": max_bound},
        "model_used": "ScratchDecisionTreeClassifier"
    }

if __name__ == "__main__":
    res = predict_next_difficulty(
        domain_idx=0, prev_difficulty=5, accuracy=0.92,
        mean_rt_ms=850, error_count=0, rolling_accuracy_5=0.88,
        rolling_rt_ms_5=900
    )
    print("Inference Result:", res)
