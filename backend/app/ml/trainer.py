"""
ML Trainer & Model Benchmarking Script for NeuroAdapt.
Compares Scratch Decision Tree vs Scikit-Learn RandomForest & GradientBoosting.
"""

import json
import os
import time
from typing import Dict, Any

from .dataset_generator import generate_session_dataset
from .scratch_decision_tree import ScratchDecisionTreeClassifier

def train_and_benchmark() -> Dict[str, Any]:
    # 1. Generate synthetic dataset
    dataset = generate_session_dataset(1500)
    
    # Feature columns: domain_idx, prev_difficulty, accuracy, mean_response_time_ms, error_count, rolling_accuracy_5, rolling_rt_ms_5, domain_fatigue_score
    feature_keys = [
        "domain_idx", "prev_difficulty", "accuracy",
        "mean_response_time_ms", "error_count", "rolling_accuracy_5",
        "rolling_rt_ms_5", "domain_fatigue_score"
    ]
    
    X = [[row[k] for k in feature_keys] for row in dataset]
    y = [row["difficulty_action"] for row in dataset]  # "decrease", "maintain", "increase"

    # Train/Test Split (80/20)
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]

    metrics = {}

    # 2. Benchmark Scratch Decision Tree
    t0 = time.time()
    scratch_model = ScratchDecisionTreeClassifier(min_samples_split=4, max_depth=6)
    scratch_model.fit(X_train, y_train)
    t_train_scratch = time.time() - t0

    t0 = time.time()
    y_pred_scratch = scratch_model.predict(X_test)
    t_infer_scratch = (time.time() - t0) / len(X_test)

    correct_scratch = sum(1 for p, r in zip(y_pred_scratch, y_test) if p == r)
    acc_scratch = correct_scratch / len(y_test)

    metrics["scratch_decision_tree"] = {
        "accuracy": round(acc_scratch, 4),
        "train_time_sec": round(t_train_scratch, 4),
        "avg_infer_latency_ms": round(t_infer_scratch * 1000, 4)
    }

    # 3. Benchmark Scikit-Learn models if installed
    try:
        from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
        from sklearn.metrics import accuracy_score

        # Random Forest
        rf = RandomForestClassifier(n_estimators=50, max_depth=6, random_state=42)
        t0 = time.time()
        rf.fit(X_train, y_train)
        t_train_rf = time.time() - t0
        y_pred_rf = rf.predict(X_test)
        acc_rf = accuracy_score(y_test, y_pred_rf)
        metrics["random_forest"] = {
            "accuracy": round(float(acc_rf), 4),
            "train_time_sec": round(t_train_rf, 4)
        }

        # Gradient Boosting
        gb = GradientBoostingClassifier(n_estimators=50, max_depth=4, random_state=42)
        t0 = time.time()
        gb.fit(X_train, y_train)
        t_train_gb = time.time() - t0
        y_pred_gb = gb.predict(X_test)
        acc_gb = accuracy_score(y_test, y_pred_gb)
        metrics["gradient_boosting"] = {
            "accuracy": round(float(acc_gb), 4),
            "train_time_sec": round(t_train_gb, 4)
        }

    except ImportError:
        pass

    results = {
        "benchmark_summary": metrics,
        "dataset_size": len(dataset),
        "feature_count": len(feature_keys)
    }

    return results

if __name__ == "__main__":
    benchmark_res = train_and_benchmark()
    print("NeuroAdapt ML Benchmark Results:")
    print(json.dumps(benchmark_res, indent=2))
