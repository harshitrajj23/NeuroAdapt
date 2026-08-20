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
    Uses Mistral AI to compose an empathetic, encouraging, jargon-free Telegram update for parents.
    """
    if not MISTRAL_API_KEY:
        # Fallback template if key is missing
        return (
            f"👋 *Hello from NeuroAdapt!* (Dr. {clinician_name})\n\n"
            f"Here is *{child_name}*'s weekly cognitive rehabilitation update:\n\n"
            f"🧠 *Memory Recall:* {domain_stats.get('memory', {}).get('avg_accuracy', 82)}% accuracy\n"
            f"🎯 *Attention Span:* {domain_stats.get('attention', {}).get('avg_accuracy', 75)}%\n"
            f"💡 *Reasoning:* {domain_stats.get('reasoning', {}).get('avg_accuracy', 88)}%\n\n"
            f"🌟 *Doctor's Note:* {child_name} has shown steady focus this week! Please encourage 15 minutes of home practice again on Friday."
        )

    try:
        headers = {
            "Authorization": f"Bearer {MISTRAL_API_KEY}",
            "Content-Type": "application/json",
        }

        stats_summary = []
        for d, s in domain_stats.items():
            stats_summary.append(f"{d.capitalize()}: {s.get('avg_accuracy', 0)}% accuracy (Level {s.get('max_difficulty', 1)})")

        system_instruction = (
            "You are an empathetic pediatric cognitive rehabilitation AI assistant drafting a weekly progress "
            "SMS/Telegram update to a child's parents on behalf of their supervising clinician. "
            "Tone: Warm, encouraging, clear, jargon-free, professional yet compassionate. "
            "Include key milestones, positive reinforcement, domain scores (Memory, Attention, Reasoning), "
            "and 1-2 actionable home tips. Format with clean emojis and bold markdown. Keep under 160 words."
        )

        user_content = f"""
Child Name: {child_name}
Age: {age}
Condition: {condition}
Supervising Clinician: Dr. {clinician_name}
Cognitive Metrics:
{chr(10).join(stats_summary)}
Total Completed Sessions: {len(recent_sessions)}

Please generate a ready-to-send Telegram message for the parents.
"""

        body = {
            "model": MISTRAL_MODEL,
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_content},
            ],
            "temperature": 0.5,
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
        return (
            f"👋 *Hello from NeuroAdapt!* (Dr. {clinician_name})\n\n"
            f"Here is *{child_name}*'s weekly cognitive rehabilitation update:\n\n"
            f"🧠 *Memory Recall:* {domain_stats.get('memory', {}).get('avg_accuracy', 82)}%\n"
            f"🎯 *Attention Span:* {domain_stats.get('attention', {}).get('avg_accuracy', 75)}%\n"
            f"💡 *Reasoning:* {domain_stats.get('reasoning', {}).get('avg_accuracy', 88)}%\n\n"
            f"🌟 *Doctor's Note:* {child_name} is making great strides! Keep up the daily routine and celebrate small wins at home."
        )
