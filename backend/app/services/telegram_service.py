import os
import requests
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_DEFAULT_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
MISTRAL_MODEL = os.getenv("MISTRAL_MODEL", "mistral-large-latest")


def send_telegram_message(message: str, chat_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Sends formatted markdown text to parent via Telegram Bot API.
    """
    token = os.getenv("TELEGRAM_BOT_TOKEN") or TELEGRAM_BOT_TOKEN
    target_chat = chat_id or os.getenv("TELEGRAM_CHAT_ID") or TELEGRAM_DEFAULT_CHAT_ID

    if not token:
        return {"success": False, "error": "TELEGRAM_BOT_TOKEN is not configured in backend/.env"}

    if not target_chat:
        return {"success": False, "error": "TELEGRAM_CHAT_ID is not configured in backend/.env"}

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": str(target_chat).strip(),
        "text": message.strip(),
        "parse_mode": "Markdown",
    }

    try:
        res = requests.post(url, json=payload, timeout=10)
        data = res.json()
        if res.status_code == 200 and data.get("ok"):
            return {
                "success": True,
                "message_id": data.get("result", {}).get("message_id"),
                "chat_id": target_chat,
            }
        else:
            return {
                "success": False,
                "error": data.get("description", f"Telegram HTTP {res.status_code}"),
            }
    except Exception as e:
        return {"success": False, "error": str(e)}


def generate_parent_update_prompt(
    child_name: str,
    age: int,
    condition: str,
    clinician_name: str,
    domain_stats: Dict[str, Any],
    recent_sessions: List[Dict[str, Any]],
) -> str:
    """
    Uses Mistral AI to compose an empathetic, encouraging, jargon-free Telegram update for parents
    based strictly on 100% real telemetry from the database.
    """
    stats_summary = []
    active_domains_text = []
    for d, s in domain_stats.items():
        count = s.get("sessions_count", 0)
        acc = s.get("avg_accuracy", 0.0)
        lvl = s.get("max_difficulty", 1)
        if count > 0:
            stats_summary.append(f"- {d.replace('_', ' ').title()}: {acc}% accuracy ({count} sessions completed, Level {lvl})")
            active_domains_text.append(f"{d.replace('_', ' ').title()} ({acc}%)")
        else:
            stats_summary.append(f"- {d.replace('_', ' ').title()}: 0 sessions completed (Not yet started / Queued)")

    if not MISTRAL_API_KEY:
        # Fallback template strictly based on real data
        active_lines = []
        if domain_stats.get("memory", {}).get("sessions_count", 0) > 0:
            active_lines.append(f"🧠 *Memory:* {domain_stats['memory']['avg_accuracy']}%")
        if domain_stats.get("attention", {}).get("sessions_count", 0) > 0:
            active_lines.append(f"🎯 *Attention:* {domain_stats['attention']['avg_accuracy']}%")
        if domain_stats.get("reasoning", {}).get("sessions_count", 0) > 0:
            active_lines.append(f"💡 *Reasoning:* {domain_stats['reasoning']['avg_accuracy']}%")
        if domain_stats.get("problem_solving", {}).get("sessions_count", 0) > 0:
            active_lines.append(f"🧩 *Problem-Solving:* {domain_stats['problem_solving']['avg_accuracy']}%")

        domain_block = "\n".join(active_lines) if active_lines else "📊 *Initial baseline assessments in progress*"

        return (
            f"👋 *Weekly Update for {child_name} ({age} yrs)* — From Dr. {clinician_name}\n\n"
            f"**Dear Parents,**\n"
            f"{child_name} completed {len(recent_sessions)} rehabilitation sessions this week.\n\n"
            f"{domain_block}\n\n"
            f"🌟 *Doctor's Note:* Keep celebrating every effort at home! Consistency is key to steady neurocognitive recovery."
        )

    try:
        headers = {
            "Authorization": f"Bearer {MISTRAL_API_KEY}",
            "Content-Type": "application/json",
        }

        system_instruction = (
            "You are an empathetic pediatric cognitive rehabilitation AI assistant drafting a weekly progress "
            "Telegram update to a child's parents on behalf of their supervising clinician. "
            "CRITICAL ACCURACY RULES:\n"
            "1. ONLY quote the exact domain accuracies and session numbers provided below in 'Cognitive Metrics'.\n"
            "2. NEVER invent, hallucinate, or assume percentages. If a domain has 0 sessions or 0% accuracy (e.g., Reasoning or Attention), do NOT claim they scored high in it — state that it has not been started yet or is scheduled for next week.\n"
            "3. Focus positive reinforcement on the domains that have actual completed sessions.\n"
            "Tone: Warm, encouraging, clear, jargon-free, professional yet compassionate. Format with clean emojis and bold markdown. Keep under 150 words."
        )

        user_content = f"""
Child Name: {child_name}
Age: {age}
Condition: {condition}
Supervising Clinician: Dr. {clinician_name}
Cognitive Metrics (Actual Telemetry):
{chr(10).join(stats_summary)}
Total Completed Sessions: {len(recent_sessions)}

Please generate the ready-to-send Telegram message for the parents based ONLY on the above actual telemetry.
"""

        body = {
            "model": MISTRAL_MODEL,
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_content},
            ],
            "temperature": 0.3,
            "max_tokens": 300,
        }

        res = requests.post("https://api.mistral.ai/v1/chat/completions", headers=headers, json=body, timeout=12)
        if res.status_code == 200:
            data = res.json()
            return data["choices"][0]["message"]["content"].strip()
        else:
            raise Exception(f"Mistral API returned {res.status_code}")
    except Exception as e:
        print("Mistral Telegram prompt fallback notice:", e)
        active_lines = []
        for d in ["memory", "attention", "reasoning", "problem_solving"]:
            s = domain_stats.get(d, {})
            if s.get("sessions_count", 0) > 0:
                active_lines.append(f"• *{d.replace('_', ' ').title()}:* {s.get('avg_accuracy', 0)}%")
        domain_block = "\n".join(active_lines) if active_lines else "• *Initial baseline assessments in progress*"

        return (
            f"👋 *Weekly Update for {child_name} ({age} yrs)* — From Dr. {clinician_name}\n\n"
            f"**Dear Parents,**\n"
            f"{child_name} completed {len(recent_sessions)} therapy sessions this week!\n\n"
            f"{domain_block}\n\n"
            f"🌟 *Doctor's Note:* Great effort this week. Let's keep up the daily routine at home!"
        )

