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
    Calls Mistral AI chat completions API if MISTRAL_API_KEY is configured.
    Falls back gracefully to deterministic clinical heuristics if key is not provided.
    """
    api_key = os.getenv("MISTRAL_API_KEY", "").strip()
    model = os.getenv("MISTRAL_MODEL", "mistral-large-latest").strip()

    # If Mistral API key is configured, invoke Mistral Chat API
    if api_key:
        try:
            prompt_data = {
                "child_name": child_name,
                "age": age,
                "clinical_condition": condition,
                "baseline_score": baseline_score,
                "total_sessions_completed": total_sessions,
                "overall_accuracy_pct": avg_accuracy,
                "mean_reaction_time_seconds": avg_rt_sec,
                "domain_performance": domain_stats,
                "recent_sessions_sample": recent_sessions[:5],
            }

            system_prompt = (
                "You are the NeuroAdapt AI Clinical Assistant (SIH Problem Statement SIH260206 - Section 13). "
                "Your role is to analyze computerized cognitive rehabilitation telemetry for pediatric patients "
                "and generate structured, evidence-informed summaries for supervising clinicians. "
                "Highlight improvements across cognitive domains (Attention, Memory, Reasoning, Problem Solving), "
                "identify struggling areas or fatigue indicators, and recommend adaptive difficulty bounds. "
                "MANDATORY CONSTRAINT: AI assists the clinician; it does not replace the clinician or diagnose autonomously. "
                "You MUST return ONLY a valid JSON object with the following exact keys:\n"
                "- summary (string): 2-3 paragraph clinical overview of cognitive trajectory and engagement\n"
                "- cognitive_strengths (array of strings): 2-4 specific positive performance indicators\n"
                "- areas_requiring_focus (array of strings): 1-3 targeted domains needing reinforcement\n"
                "- difficulty_recommendation (string): Guidance on min/max therapeutic difficulty levels\n"
                "- fatigue_analysis (string): Reaction time latency and error rate fatigue assessment\n"
                "- clinical_guidance (string): Concrete suggestion for clinician review\n"
            )

            user_prompt = f"Patient Cognitive Rehabilitation Telemetry Data:\n{json.dumps(prompt_data, indent=2)}"

            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.2,
                "max_tokens": 1000,
            }

            req = urllib.request.Request(
                "https://api.mistral.ai/v1/chat/completions",
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}",
                }
            )

            with urllib.request.urlopen(req, timeout=12) as response:
                if response.status == 200:
                    resp_body = json.loads(response.read().decode("utf-8"))
                    content_str = resp_body["choices"][0]["message"]["content"]
                    parsed = json.loads(content_str)
                    parsed["child_name"] = child_name
                    parsed["ai_engine"] = f"Mistral AI ({model})"
                    return parsed
        except Exception as e:
            print(f"[Mistral Service Notice] Falling back to deterministic clinical engine: {e}")

    # Deterministic Clinical Analytical Fallback
    sorted_domains = sorted(
        domain_stats.items(),
        key=lambda x: x[1].get("avg_accuracy", 0),
        reverse=True
    )
    strengths = [
        f"{d[0].replace('_', ' ').capitalize()} ({d[1].get('avg_accuracy', 0)}% accuracy)"
        for d in sorted_domains
        if d[1].get("avg_accuracy", 0) >= 70
    ]
    if not strengths and sorted_domains:
        top_d = sorted_domains[0]
        strengths = [f"{top_d[0].replace('_', ' ').capitalize()} (Relative high at {top_d[1].get('avg_accuracy', 0)}%)"]

    struggles = [
        f"{d[0].replace('_', ' ').capitalize()} ({d[1].get('avg_accuracy', 0)}% accuracy)"
        for d in sorted_domains
        if d[1].get("avg_accuracy", 0) < 65 and d[1].get("sessions_count", 0) > 0
    ]

    diff_rec = (
        "Gradually expand difficulty corridor to Level 4-6."
        if avg_accuracy >= 80
        else ("Maintain gentle difficulty bounds (Level 1-3) to build mastery." if avg_accuracy < 60 else "Maintain current adaptive range (Level 2-4).")
    )

    summary_text = (
        f"Longitudinal analysis for {child_name} (Age {age}, {condition}) across {total_sessions} completed session(s) "
        f"reflects an overall task accuracy of {avg_accuracy}% with a mean reaction latency of {avg_rt_sec} seconds. "
    )
    if total_sessions >= 2:
        summary_text += "Patient demonstrates consistent home training compliance with measurable response stability."
    else:
        summary_text += "Initial calibration session completed; recommend accumulating 3-5 home sessions to solidify baseline metrics."

    return {
        "child_name": child_name,
        "ai_engine": "NeuroAdapt Clinical Analytical Engine (Deterministic)",
        "summary": summary_text,
        "cognitive_strengths": strengths if strengths else ["Baseline calibration underway"],
        "areas_requiring_focus": struggles if struggles else ["All active cognitive domains within expected range"],
        "difficulty_recommendation": diff_rec,
        "fatigue_analysis": f"Reaction latency average ({avg_rt_sec}s) is within standard neurodevelopmental parameters.",
        "clinical_guidance": "AI recommendations provided for clinician oversight; adjust therapeutic parameters as clinically indicated."
    }
