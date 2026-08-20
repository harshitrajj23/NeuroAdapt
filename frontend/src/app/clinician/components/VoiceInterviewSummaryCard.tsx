"use client";

import React, { useState } from "react";
import {
  Mic,
  Brain,
  Sparkles,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  FileText,
  Activity,
  Clock,
  ChevronRight,
  X,
  Target,
  Lightbulb,
  Check,
  Award,
} from "lucide-react";

export interface VoiceInterviewRecord {
  id: number;
  child_id: number;
  child_name: string;
  duration_seconds: number;
  challenges_completed: number;
  overall_accuracy: number;
  memory_accuracy: number;
  attention_accuracy: number;
  reasoning_accuracy: number;
  response_latency_ms: number;
  latency_delta_percent: number;
  adaptive_changes: {
    memory?: string;
    attention?: string;
    reasoning?: string;
    [key: string]: string | undefined;
  };
  ai_observation: string;
  transcript: Array<{
    round: number;
    domain: string;
    title: string;
    spoken_prompt: string;
    target_answer: string;
    child_response: string;
    is_correct: boolean;
    latency_ms: number;
    accuracy?: number;
  }>;
  created_at: string | null;
}

export default function VoiceInterviewSummaryCard({
  interview,
}: {
  interview: VoiceInterviewRecord;
}) {
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);

  const durationMin = Math.floor(interview.duration_seconds / 60);
  const durationSec = interview.duration_seconds % 60;
  const formattedDuration = `${String(durationMin).padStart(2, "0")}:${String(durationSec).padStart(2, "0")}`;

  return (
    <>
      <div
        className="cl-card"
        style={{
          background: "linear-gradient(135deg, #FFFFFF 0%, #FAF8FF 100%)",
          border: "1.5px solid #EDE9FE",
          borderRadius: "24px",
          padding: "26px",
          boxShadow: "0 10px 30px rgba(124, 58, 237, 0.08)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Header Ribbon */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(124, 58, 237, 0.2)",
                }}
              >
                <Mic className="h-4 w-4" />
              </div>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  color: "#6D28D9",
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                }}
              >
                AI Cognitive Session Summary
              </span>
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#1A1035", margin: 0 }}>
              {interview.child_name} — Voice Cognitive Session
            </h3>
          </div>

          <div
            style={{
              padding: "6px 14px",
              borderRadius: "14px",
              background: "#F3E8FF",
              color: "#7E22CE",
              fontSize: "12.5px",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Sparkles className="h-3.5 w-3.5" /> Adaptive Multi-Domain
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "14px",
            padding: "16px 20px",
            background: "#FFFFFF",
            borderRadius: "18px",
            border: "1px solid #EDE9FE",
            marginBottom: "22px",
          }}
        >
          <div>
            <span style={{ fontSize: "12px", color: "#6B6580", display: "block" }}>Duration</span>
            <span style={{ fontSize: "20px", fontWeight: 800, color: "#1A1035" }}>{formattedDuration}</span>
          </div>
          <div>
            <span style={{ fontSize: "12px", color: "#6B6580", display: "block" }}>Challenges Completed</span>
            <span style={{ fontSize: "20px", fontWeight: 800, color: "#1A1035" }}>{interview.challenges_completed}</span>
          </div>
          <div>
            <span style={{ fontSize: "12px", color: "#6B6580", display: "block" }}>Overall Accuracy</span>
            <span style={{ fontSize: "20px", fontWeight: 800, color: "#10B981" }}>{interview.overall_accuracy}%</span>
          </div>
        </div>

        {/* Domain Progress Bars */}
        <div style={{ marginBottom: "22px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* MEMORY */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 800, marginBottom: "5px" }}>
                <span style={{ color: "#6D28D9", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Brain className="h-4 w-4" /> MEMORY
                </span>
                <span style={{ color: "#1A1035" }}>{interview.memory_accuracy}%</span>
              </div>
              <div style={{ width: "100%", height: "10px", borderRadius: "5px", background: "#F1EDFD", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${interview.memory_accuracy}%`,
                    height: "100%",
                    borderRadius: "5px",
                    background: "linear-gradient(90deg, #7C3AED, #A78BFA)",
                  }}
                />
              </div>
            </div>

            {/* ATTENTION */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 800, marginBottom: "5px" }}>
                <span style={{ color: "#BE185D", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Target className="h-4 w-4" /> ATTENTION
                </span>
                <span style={{ color: "#1A1035" }}>{interview.attention_accuracy}%</span>
              </div>
              <div style={{ width: "100%", height: "10px", borderRadius: "5px", background: "#FDF2F8", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${interview.attention_accuracy}%`,
                    height: "100%",
                    borderRadius: "5px",
                    background: "linear-gradient(90deg, #DB2777, #F472B6)",
                  }}
                />
              </div>
            </div>

            {/* REASONING */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 800, marginBottom: "5px" }}>
                <span style={{ color: "#B45309", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Lightbulb className="h-4 w-4" /> REASONING
                </span>
                <span style={{ color: "#1A1035" }}>{interview.reasoning_accuracy}%</span>
              </div>
              <div style={{ width: "100%", height: "10px", borderRadius: "5px", background: "#FEF3C7", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${interview.reasoning_accuracy}%`,
                    height: "100%",
                    borderRadius: "5px",
                    background: "linear-gradient(90deg, #D97706, #FBBF24)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Latency & Adaptive Changes Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "22px" }}>
          {/* Response Latency */}
          <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "18px", border: "1px solid #E2E8F0" }}>
            <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, display: "block", marginBottom: "6px" }}>
              Response Latency
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {interview.latency_delta_percent <= 0 ? (
                <TrendingDown className="h-5 w-5 text-emerald-600" />
              ) : (
                <TrendingUp className="h-5 w-5 text-amber-600" />
              )}
              <span style={{ fontSize: "17px", fontWeight: 800, color: interview.latency_delta_percent <= 0 ? "#059669" : "#D97706" }}>
                {interview.latency_delta_percent <= 0 ? "↓" : "↑"} {Math.abs(interview.latency_delta_percent)}% from baseline
              </span>
            </div>
            <span style={{ fontSize: "11.5px", color: "#94A3B8", marginTop: "4px", display: "block" }}>
              Avg: {(interview.response_latency_ms / 1000).toFixed(2)}s per answer
            </span>
          </div>

          {/* Adaptive Changes */}
          <div style={{ background: "#FAF5FF", padding: "16px", borderRadius: "18px", border: "1px solid #EDE9FE" }}>
            <span style={{ fontSize: "12px", color: "#7C3AED", fontWeight: 700, display: "block", marginBottom: "6px" }}>
              Adaptive Changes
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12.5px", fontWeight: 700, color: "#1A1035" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Check className="h-3.5 w-3.5 text-purple-600" /> {interview.adaptive_changes?.memory || "Memory difficulty +1"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Check className="h-3.5 w-3.5 text-pink-600" /> {interview.adaptive_changes?.attention || "Attention difficulty maintained"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Check className="h-3.5 w-3.5 text-amber-600" /> {interview.adaptive_changes?.reasoning || "Reasoning difficulty +1"}
              </div>
            </div>
          </div>
        </div>

        {/* AI Observation Card */}
        <div
          style={{
            background: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)",
            border: "1px solid #DDD6FE",
            borderRadius: "18px",
            padding: "16px 20px",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <Sparkles className="h-4 w-4 text-purple-700" />
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#6D28D9", textTransform: "uppercase" }}>
              AI Observation
            </span>
          </div>
          <p style={{ fontSize: "13.5px", color: "#1A1035", margin: 0, fontStyle: "italic", lineHeight: "1.5" }}>
            &ldquo;{interview.ai_observation}&rdquo;
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => setShowSessionModal(true)}
            className="cl-btn"
            style={{
              flex: 1,
              background: "#FFFFFF",
              border: "1.5px solid #DDD6FE",
              color: "#6D28D9",
              padding: "12px",
              borderRadius: "14px",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <Activity className="h-4 w-4" /> View Session
          </button>
          <button
            onClick={() => setShowTranscriptModal(true)}
            className="cl-btn cl-btn-primary"
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "14px",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <FileText className="h-4 w-4" /> View Transcript
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: VIEW SESSION DETAILS                                    */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {showSessionModal && (
        <div className="cl-modal-backdrop" style={{ zIndex: 9999 }}>
          <div className="cl-modal-card" style={{ maxWidth: "640px", width: "100%", padding: "30px", borderRadius: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#1A1035", margin: 0 }}>
                  {interview.child_name} — Cognitive Session Breakdown
                </h3>
                <span style={{ fontSize: "12.5px", color: "#6B6580" }}>
                  Adaptive Assessment Telemetry · Duration: {formattedDuration}
                </span>
              </div>
              <button onClick={() => setShowSessionModal(false)} className="cl-modal-close-btn">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
              <div style={{ background: "#F5F3FF", padding: "14px", borderRadius: "16px", textAlign: "center" }}>
                <span style={{ fontSize: "12px", color: "#6B6580" }}>Memory Retention</span>
                <span style={{ fontSize: "22px", fontWeight: 800, color: "#6D28D9", display: "block" }}>{interview.memory_accuracy}%</span>
              </div>
              <div style={{ background: "#FDF2F8", padding: "14px", borderRadius: "16px", textAlign: "center" }}>
                <span style={{ fontSize: "12px", color: "#6B6580" }}>Auditory Attention</span>
                <span style={{ fontSize: "22px", fontWeight: 800, color: "#BE185D", display: "block" }}>{interview.attention_accuracy}%</span>
              </div>
              <div style={{ background: "#FEF3C7", padding: "14px", borderRadius: "16px", textAlign: "center" }}>
                <span style={{ fontSize: "12px", color: "#6B6580" }}>Reasoning Deductions</span>
                <span style={{ fontSize: "22px", fontWeight: 800, color: "#B45309", display: "block" }}>{interview.reasoning_accuracy}%</span>
              </div>
            </div>

            <div style={{ background: "#F8FAFC", borderRadius: "18px", padding: "18px", marginBottom: "20px", border: "1px solid #E2E8F0" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#1A1035", marginBottom: "8px" }}>
                Adaptive Titration Decision Matrix
              </h4>
              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#475569", lineHeight: "1.6" }}>
                <li><strong>Memory Domain:</strong> {interview.adaptive_changes?.memory || "Memory difficulty +1 based on high recall threshold."}</li>
                <li><strong>Attention Domain:</strong> {interview.adaptive_changes?.attention || "Attention difficulty maintained for auditory pacing consolidation."}</li>
                <li><strong>Reasoning Domain:</strong> {interview.adaptive_changes?.reasoning || "Reasoning difficulty +1 following accurate arithmetic deduction."}</li>
              </ul>
            </div>

            <button onClick={() => setShowSessionModal(false)} className="cl-btn cl-btn-primary" style={{ width: "100%", padding: "12px" }}>
              Close Session Summary
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: VIEW INTERVIEW TRANSCRIPT                               */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {showTranscriptModal && (
        <div className="cl-modal-backdrop" style={{ zIndex: 9999 }}>
          <div className="cl-modal-card" style={{ maxWidth: "680px", width: "100%", padding: "30px", borderRadius: "24px", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#1A1035", margin: 0 }}>
                  {interview.child_name} — Dialogue Transcript
                </h3>
                <span style={{ fontSize: "12.5px", color: "#6B6580" }}>
                  Complete Question-by-Question Spoken Record
                </span>
              </div>
              <button onClick={() => setShowTranscriptModal(false)} className="cl-modal-close-btn">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
              {interview.transcript && interview.transcript.length > 0 ? (
                interview.transcript.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#FFFFFF",
                      border: "1.5px solid #EDE9FE",
                      borderRadius: "16px",
                      padding: "16px 18px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 800,
                          padding: "3px 8px",
                          borderRadius: "10px",
                          background: item.domain === "memory" ? "#EDE9FE" : item.domain === "attention" ? "#FCE7F3" : "#FEF3C7",
                          color: item.domain === "memory" ? "#6D28D9" : item.domain === "attention" ? "#BE185D" : "#B45309",
                          textTransform: "uppercase",
                        }}
                      >
                        Round {item.round} • {item.domain}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "11.5px", color: "#64748B", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Clock className="h-3 w-3" /> {(item.latency_ms / 1000).toFixed(2)}s
                        </span>
                        {item.is_correct ? (
                          <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#10B981", display: "flex", alignItems: "center", gap: "3px" }}>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Correct
                          </span>
                        ) : (
                          <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#EF4444" }}>Incorrect</span>
                        )}
                      </div>
                    </div>

                    <div style={{ fontSize: "13.5px", color: "#1A1035", marginBottom: "6px" }}>
                      <strong>🎙️ System:</strong> &ldquo;{item.spoken_prompt}&rdquo;
                    </div>
                    <div style={{ fontSize: "13.5px", color: "#6D28D9", background: "#F5F3FF", padding: "8px 12px", borderRadius: "10px" }}>
                      <strong>🗣️ {interview.child_name}:</strong> &ldquo;{item.child_response}&rdquo;
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", color: "#8E88A0", padding: "20px" }}>
                  No transcript entries logged for this session.
                </div>
              )}
            </div>

            <button onClick={() => setShowTranscriptModal(false)} className="cl-btn cl-btn-primary" style={{ width: "100%", padding: "12px" }}>
              Close Transcript
            </button>
          </div>
        </div>
      )}
    </>
  );
}
