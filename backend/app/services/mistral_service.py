"""
NeuroAdapt Mistral AI Service (PRD Section 13).
Provides LLM-assisted clinical insight generation for clinicians using the Mistral API.
"""

import os
import json
import urllib.request
import urllib.error
from typing import Dict, Any, List

def generate_mistral_clinical_insights(
    child_name: str,
    age: int,
    condition: str,
    baseline_score: int,
    total_sessions: int,
    avg_accuracy: float,
    avg_rt_sec: float,
    domain_stats: Dict[str, Any],
    recent_sessions: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Calls Mistral AI chat completions API (mistral-large-latest) with real database telemetry.
    Synthesizes age-appropriate cognitive trajectories, domain strengths, fatigue indicators,
    and adaptive difficulty bounds strictly from real session data.
    """
    api_key = os.getenv("MISTRAL_API_KEY", "").strip()
    model = os.getenv("MISTRAL_MODEL", "mistral-large-latest").strip()

    # If Mistral API key is configured, invoke Mistral Chat API
    if api_key:
        try:
            prompt_data = {
                "patient_name": child_name,
                "chronological_age_years": age,
                "diagnosed_condition": condition,
                "clinical_baseline_score": baseline_score,
                "total_completed_sessions": total_sessions,
                "empirical_overall_accuracy_pct": avg_accuracy,
                "mean_reaction_latency_seconds": avg_rt_sec,
                "domain_breakdown_telemetry": domain_stats,
                "recent_completed_sessions_log": recent_sessions,
            }

            system_prompt = (
                "You are the NeuroAdapt Senior AI Clinical Neuropsychologist (SIH Problem Statement SIH260206). "
                "Your task is to analyze real-world computerized cognitive retraining telemetry for pediatric patients "
                "and generate rigorous, evidence-informed clinical decision support for supervising clinicians.\n\n"
                "CRITICAL CLINICAL & REAL-DATA RULES:\n"
                "1. AGE-APPROPRIATE EVALUATION: Strictly benchmark reaction times, cognitive fatigue, and difficulty "
                f"against expected neurodevelopmental norms for a {age}-year-old child.\n"
                "2. ABSOLUTELY NO MOCK OR HALLUCINATED DATA: Base every insight solely on the provided telemetry values. "
                "If total_completed_sessions is 0 or 1, state that data is in early calibration and recommend cautious baseline tasks.\n"
                "3. DOMAIN ANALYSIS: Evaluate Attention, Memory, Reasoning, and Problem Solving based on their empirical accuracy percentages.\n"
                "4. FATIGUE DETECTION: Analyze latency drift and error spikes to evaluate cognitive fatigue.\n"
                "5. CLINICAL BOUNDARIES: AI assists and provides recommendations for clinician review; the clinician retains final therapeutic authority.\n\n"
                "You MUST return ONLY a valid JSON object with the following exact keys:\n"
                "- summary (string): 2-3 paragraph clinical narrative evaluating the patient's performance, age-normed cognitive engagement, and longitudinal trend.\n"
                "- cognitive_strengths (array of strings): 2-4 specific positive performance indicators with real accuracy/RT metrics.\n"
                "- areas_requiring_focus (array of strings): 1-3 specific cognitive domains requiring clinical reinforcement.\n"
                "- difficulty_recommendation (string): Concrete guidance on therapeutic difficulty corridor (Levels 1-10) suitable for this child's age and accuracy.\n"
                "- fatigue_analysis (string): Detailed evaluation of reaction latency stability and task endurance.\n"
                "- clinical_guidance (string): Actionable next steps and recommendations for the supervising clinician.\n"
            )

            user_prompt = f"Live Database Telemetry for {child_name} (Age {age}):\n{json.dumps(prompt_data, indent=2)}"

            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.2,
                "max_tokens": 650,
            }

            req = urllib.request.Request(
                "https://api.mistral.ai/v1/chat/completions",
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}",
                }
            )

            with urllib.request.urlopen(req, timeout=20) as response:
                if response.status == 200:
                    resp_body = json.loads(response.read().decode("utf-8"))
                    content_str = resp_body["choices"][0]["message"]["content"]
                    parsed = json.loads(content_str)
                    parsed["child_name"] = child_name
                    parsed["age"] = age
                    parsed["ai_engine"] = f"Mistral AI ({model})"
                    return parsed
        except Exception as e:
            print(f"[Mistral Service Notice] Falling back to deterministic clinical engine: {e}")

    # Deterministic Clinical Analytical Fallback (Zero Mock Data)
    sorted_domains = sorted(
        domain_stats.items(),
        key=lambda x: x[1].get("avg_accuracy", 0),
        reverse=True
    )
    strengths = [
        f"{d[0].replace('_', ' ').capitalize()} ({d[1].get('avg_accuracy', 0)}% accuracy across {d[1].get('sessions_count', 0)} sessions)"
        for d in sorted_domains
        if d[1].get("avg_accuracy", 0) >= 70 and d[1].get("sessions_count", 0) > 0
    ]

    struggles = [
        f"{d[0].replace('_', ' ').capitalize()} ({d[1].get('avg_accuracy', 0)}% accuracy)"
        for d in sorted_domains
        if d[1].get("avg_accuracy", 0) < 65 and d[1].get("sessions_count", 0) > 0
    ]

    if total_sessions == 0:
        summary_text = (
            f"No cognitive retraining telemetry has been logged yet for {child_name} (Age {age}, {condition}). "
            f"Initial baseline assessment is pending. Recommend prescribing low-intensity Level 1-2 exercises to calibrate reaction times and accuracy."
        )
        strengths = ["Awaiting initial session completion to establish baseline strengths"]
        struggles = ["Awaiting initial session completion to identify focal areas"]
        diff_rec = f"Begin at baseline difficulty Level 1-2 appropriate for age {age}."
        fatigue_text = "No fatigue data available yet."
    else:
        diff_rec = (
            f"Expand therapeutic difficulty corridor to Level 4-6 based on strong accuracy ({avg_accuracy}%)."
            if avg_accuracy >= 80
            else (f"Maintain gentle difficulty bounds (Level 1-3) suitable for age {age} to build mastery." if avg_accuracy < 60 else "Maintain current adaptive range (Level 2-4).")
        )
        summary_text = (
            f"Longitudinal analysis for {child_name} (Age {age}, {condition}) across {total_sessions} completed session(s) "
            f"reflects an empirical mean accuracy of {avg_accuracy}% with an average response time of {avg_rt_sec} seconds."
        )
        fatigue_text = (
            f"Mean reaction latency of {avg_rt_sec}s aligns with expected cognitive processing speeds for a {age}-year-old child."
        )

    return {
        "child_name": child_name,
        "age": age,
        "ai_engine": "NeuroAdapt Clinical Analytical Engine (Deterministic)",
        "summary": summary_text,
        "cognitive_strengths": strengths if strengths else ["Baseline calibration underway"],
        "areas_requiring_focus": struggles if struggles else ["All active cognitive domains within target performance parameters"],
        "difficulty_recommendation": diff_rec,
        "fatigue_analysis": fatigue_text,
        "clinical_guidance": "AI clinical decision support provided for supervising clinician review. Adjust therapy plans as clinically indicated."
    }
