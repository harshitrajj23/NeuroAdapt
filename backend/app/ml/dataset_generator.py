"""
Synthetic Data Generator for NeuroAdapt Child Cognitive Exercise Sessions.
Generates tabular dataset simulating child performance across domain sessions.
"""

import random
from typing import List, Dict, Any

DOMAINS = ["attention", "memory", "reasoning", "problem_solving"]
DIFFICULTIES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

def generate_session_dataset(num_samples: int = 1200) -> List[Dict[str, Any]]:
    """
    Generates realistic session telemetry data for model training:
    Features:
      - domain (encoded 0..3)
      - prev_difficulty (1..10)
      - accuracy (0.0 .. 1.0)
      - mean_response_time_ms (300 .. 4000)
      - error_count (0 .. 15)
      - rolling_accuracy_5 (0.0 .. 1.0)
      - rolling_rt_ms_5 (300 .. 4000)
      - domain_fatigue_score (0.0 .. 1.0)
    Target label:
      - recommended_next_difficulty (1..10)
      - difficulty_category ("easy", "medium", "hard" / "decrease", "maintain", "increase")
    """
    random.seed(42)
    dataset = []

    for _ in range(num_samples):
        domain_idx = random.randint(0, 3)
        prev_diff = random.randint(1, 10)
        
        # Archetype selection: 0 = Fast Learner, 1 = Struggling, 2 = Oscillating
        archetype = random.choices([0, 1, 2], weights=[0.4, 0.4, 0.2])[0]

        if archetype == 0:  # High performance
            accuracy = round(random.uniform(0.80, 1.0), 3)
            mean_rt = random.randint(400, 1500)
            error_count = random.randint(0, 2)
            rolling_acc = round(random.uniform(0.75, 1.0), 3)
            rolling_rt = random.randint(450, 1600)
            fatigue = round(random.uniform(0.0, 0.3), 2)
            # Recommend difficulty increase (clamp to max 10)
            next_diff = min(10, prev_diff + (1 if accuracy > 0.88 else 0))
            category = "increase" if next_diff > prev_diff else "maintain"

        elif archetype == 1:  # Low performance / Struggling
            accuracy = round(random.uniform(0.20, 0.60), 3)
            mean_rt = random.randint(2000, 4500)
            error_count = random.randint(5, 14)
            rolling_acc = round(random.uniform(0.25, 0.60), 3)
            rolling_rt = random.randint(2200, 4800)
            fatigue = round(random.uniform(0.4, 0.9), 2)
            # Recommend difficulty decrease (clamp to min 1)
            next_diff = max(1, prev_diff - (1 if accuracy < 0.55 else 0))
            category = "decrease" if next_diff < prev_diff else "maintain"

        else:  # Moderate / Oscillating
            accuracy = round(random.uniform(0.60, 0.80), 3)
            mean_rt = random.randint(1200, 2600)
            error_count = random.randint(2, 6)
            rolling_acc = round(random.uniform(0.60, 0.78), 3)
            rolling_rt = random.randint(1300, 2500)
            fatigue = round(random.uniform(0.2, 0.6), 2)
            next_diff = prev_diff
            category = "maintain"

        dataset.append({
            "domain_idx": domain_idx,
            "prev_difficulty": prev_diff,
            "accuracy": accuracy,
            "mean_response_time_ms": mean_rt,
            "error_count": error_count,
            "rolling_accuracy_5": rolling_acc,
            "rolling_rt_ms_5": rolling_rt,
            "domain_fatigue_score": fatigue,
            "recommended_next_difficulty": next_diff,
            "difficulty_action": category  # "decrease", "maintain", "increase"
        })

    return dataset

if __name__ == "__main__":
    data = generate_session_dataset(10)
    print(f"Generated {len(data)} sample records. First sample:")
    print(data[0])
