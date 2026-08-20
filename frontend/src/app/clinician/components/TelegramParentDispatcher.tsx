"use client";

import React, { useState, useEffect } from "react";
import {
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit3,
  Loader2,
  RefreshCw,
  Phone,
  MessageSquare,
} from "lucide-react";

interface TelegramParentDispatcherProps {
  childId: number;
  childName: string;
  clinicianId?: number;
  clinicianName?: string;
  apiUrl: string;
}

export default function TelegramParentDispatcher({
  childId,
  childName,
  clinicianId,
  clinicianName = "Dr. Poorvik",
  apiUrl,
}: TelegramParentDispatcherProps) {
  const [draftMessage, setDraftMessage] = useState<string>("");
  const [targetChatId, setTargetChatId] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [dispatchStatus, setDispatchStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [lastDeliveredAt, setLastDeliveredAt] = useState<string | null>(null);

  // Generate AI Draft using Mistral AI
  const handleGenerateAIDraft = async () => {
    setIsGenerating(true);
    setDispatchStatus("idle");
    setStatusMessage("");

    try {
      const url = `${apiUrl}/api/clinician/telegram/draft/${childId}?clinician_id=${clinicianId || 6}`;
      const res = await fetch(url, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setDraftMessage(data.draft || "");
        if (data.default_chat_id && !targetChatId) {
          setTargetChatId(data.default_chat_id);
        }
      } else {
        setStatusMessage("Failed to generate AI draft. Please try again.");
        setDispatchStatus("error");
      }
    } catch (err) {
      console.error(err);
      setStatusMessage("Network error while communicating with AI service.");
      setDispatchStatus("error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Dispatch to Telegram
  const handleSendToTelegram = async () => {
    if (!draftMessage.trim()) {
      setStatusMessage("Please generate or enter a message before sending.");
      setDispatchStatus("error");
      return;
    }

    setIsSending(true);
    setDispatchStatus("idle");
    setStatusMessage("");

    try {
      const res = await fetch(`${apiUrl}/api/clinician/telegram/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_id: childId,
          message: draftMessage,
          chat_id: targetChatId.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDispatchStatus("success");
        setStatusMessage(`Delivered to Telegram successfully! (Msg ID: ${data.message_id || "sent"})`);
        setLastDeliveredAt(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
      } else {
        const errData = await res.json().catch(() => ({}));
        setStatusMessage(errData.detail || "Failed to dispatch message to Telegram.");
        setDispatchStatus("error");
      }
    } catch (err) {
      console.error(err);
      setStatusMessage("Failed to connect to Telegram service.");
      setDispatchStatus("error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="cl-card"
      style={{
        background: "linear-gradient(135deg, #FFFFFF 0%, #F0F9FF 100%)",
        border: "1.5px solid #BAE6FD",
        borderRadius: "24px",
        padding: "26px",
        boxShadow: "0 10px 30px rgba(14, 165, 233, 0.08)",
        marginBottom: "32px",
      }}
    >
      {/* Card Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 18px rgba(14, 165, 233, 0.28)",
            }}
          >
            <Send className="h-5 w-5" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ fontSize: "19px", fontWeight: 800, color: "#0F172A", margin: 0 }}>
                Parent Telegram Dispatcher
              </h3>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  padding: "3px 8px",
                  borderRadius: "10px",
                  background: "#E0F2FE",
                  color: "#0369A1",
                  textTransform: "uppercase",
                }}
              >
                Direct SMS / Telegram
              </span>
            </div>
            <p style={{ fontSize: "12.5px", color: "#64748B", margin: "2px 0 0" }}>
              Send AI-generated, jargon-free weekly progress updates directly to {childName}&apos;s parents
            </p>
          </div>
        </div>

        {/* Generate AI Button */}
        <button
          onClick={handleGenerateAIDraft}
          disabled={isGenerating}
          style={{
            background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
            color: "white",
            border: "none",
            padding: "10px 18px",
            borderRadius: "12px",
            fontWeight: 700,
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            cursor: isGenerating ? "not-allowed" : "pointer",
            boxShadow: "0 4px 14px rgba(124, 58, 237, 0.25)",
            opacity: isGenerating ? 0.75 : 1,
          }}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Drafting with Mistral AI...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-purple-200" /> ✨ Generate AI Parent Update
            </>
          )}
        </button>
      </div>

      {/* Message Textarea */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "flex", alignItems: "center", gap: "4px" }}>
            <Edit3 className="h-3.5 w-3.5 text-sky-600" /> Message Preview (Editable):
          </span>
          {draftMessage && (
            <span style={{ fontSize: "11px", color: "#94A3B8" }}>
              {draftMessage.length} characters · {draftMessage.split(/\s+/).filter(Boolean).length} words
            </span>
          )}
        </div>
        <textarea
          value={draftMessage}
          onChange={(e) => setDraftMessage(e.target.value)}
          placeholder="Click 'Generate AI Parent Update' above to auto-compose a personalized message with Mistral AI, or type your message here..."
          rows={6}
          style={{
            width: "100%",
            borderRadius: "14px",
            border: "1.5px solid #CBD5E1",
            padding: "14px 16px",
            fontSize: "13.5px",
            lineHeight: "1.5",
            fontFamily: "inherit",
            color: "#1E293B",
            background: "#FFFFFF",
            outline: "none",
            boxSizing: "border-box",
            resize: "vertical",
          }}
        />
      </div>

      {/* Footer Controls: Chat ID & Send Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          paddingTop: "6px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#475569" }}>
            Telegram Chat ID:
          </span>
          <input
            type="text"
            value={targetChatId}
            onChange={(e) => setTargetChatId(e.target.value)}
            placeholder="e.g. 5505512441"
            style={{
              padding: "7px 12px",
              borderRadius: "10px",
              border: "1px solid #CBD5E1",
              fontSize: "12.5px",
              width: "140px",
              outline: "none",
              color: "#0F172A",
              fontWeight: 600,
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {lastDeliveredAt && (
            <span style={{ fontSize: "11.5px", color: "#059669", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Last sent today at {lastDeliveredAt}
            </span>
          )}

          <button
            onClick={handleSendToTelegram}
            disabled={isSending || !draftMessage.trim()}
            style={{
              background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
              color: "white",
              border: "none",
              padding: "10px 22px",
              borderRadius: "12px",
              fontWeight: 800,
              fontSize: "13.5px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: isSending || !draftMessage.trim() ? "not-allowed" : "pointer",
              boxShadow: "0 4px 16px rgba(2, 132, 199, 0.3)",
              opacity: isSending || !draftMessage.trim() ? 0.65 : 1,
            }}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Dispatching...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> Send to Parent Telegram
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Banners */}
      {dispatchStatus === "success" && (
        <div
          style={{
            marginTop: "14px",
            padding: "10px 14px",
            borderRadius: "10px",
            background: "#ECFDF5",
            border: "1px solid #A7F3D0",
            color: "#065F46",
            fontSize: "12.5px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          {statusMessage}
        </div>
      )}

      {dispatchStatus === "error" && (
        <div
          style={{
            marginTop: "14px",
            padding: "10px 14px",
            borderRadius: "10px",
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            color: "#991B1B",
            fontSize: "12.5px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertCircle className="h-4 w-4 text-red-600" />
          {statusMessage}
        </div>
      )}
    </div>
  );
}
