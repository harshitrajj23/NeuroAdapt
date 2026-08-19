"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart2,
  TrendingUp,
  Activity,
  Users,
  Target,
  Brain,
  Lightbulb,
  Puzzle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useClinicianContext } from "../layout";

interface AnalyticsResponse {
  cohort_size: number;
  total_sessions: number;
  domain_distribution: Record<string, {
    session_count: number;
    avg_accuracy: number;
    avg_response_time: number;
  }>;
  accuracy_distribution: Record<string, number>;
  avg_accuracy: number;
}

const DOMAIN_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  attention: { label: "Attention", color: "#7C3AED", icon: <Target className="h-5 w-5" strokeWidth={1.8} /> },
  memory: { label: "Memory", color: "#8B5CF6", icon: <Brain className="h-5 w-5" strokeWidth={1.8} /> },
  reasoning: { label: "Reasoning", color: "#6D28D9", icon: <Lightbulb className="h-5 w-5" strokeWidth={1.8} /> },
  problem_solving: { label: "Problem Solving", color: "#9333EA", icon: <Puzzle className="h-5 w-5" strokeWidth={1.8} /> },
};

export default function CohortAnalyticsPage() {
  const { user, apiUrl, refreshTrigger } = useClinicianContext();
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiUrl}/api/clinician/analytics/${user.id}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          setData({
            cohort_size: 0,
            total_sessions: 0,
            domain_distribution: {},
            accuracy_distribution: { "90-100%": 0, "75-89%": 0, "60-74%": 0, "<60%": 0 },
            avg_accuracy: 0,
          });
        }
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, apiUrl, refreshTrigger]);

  if (loading || !data) {
    return (
      <div className="cl-loading">
        <div className="cl-loading-spinner" />
        <span>Loading cohort analytics...</span>
      </div>
    );
  }

  const totalSessionsWithScores = Object.values(data.accuracy_distribution).reduce((a, b) => a + b, 0);

  return (
    <>
      <div className="cl-section-header" style={{ marginBottom: "20px" }}>
        <div>
          <h1 className="cl-topbar-title" style={{ fontSize: "26px" }}>Cohort Progress Analytics</h1>
          <p className="cl-section-subtitle">Longitudinal aggregated performance, domain distributions, and accuracy trends</p>
        </div>
      </div>

      {/* Cohort Stats Grid */}
      <div className="cl-stats-grid">
        <div className="cl-stat-card">
          <div className="cl-stat-icon" style={{ background: "#7C3AED12", color: "#7C3AED" }}>
            <Users className="h-6 w-6" />
          </div>
          <div className="cl-stat-info">
            <span className="cl-stat-val">{data.cohort_size}</span>
            <span className="cl-stat-lbl">Patients in Cohort</span>
          </div>
        </div>

        <div className="cl-stat-card">
          <div className="cl-stat-icon" style={{ background: "#8B5CF612", color: "#8B5CF6" }}>
            <Activity className="h-6 w-6" />
          </div>
          <div className="cl-stat-info">
            <span className="cl-stat-val">{data.total_sessions}</span>
            <span className="cl-stat-lbl">Aggregated Sessions</span>
          </div>
        </div>

        <div className="cl-stat-card">
          <div className="cl-stat-icon" style={{ background: "#05966912", color: "#059669" }}>
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="cl-stat-info">
            <span className="cl-stat-val">{data.avg_accuracy}%</span>
            <span className="cl-stat-lbl">Mean Cohort Accuracy</span>
          </div>
        </div>

        <div className="cl-stat-card">
          <div className="cl-stat-icon" style={{ background: "#9333EA12", color: "#9333EA" }}>
            <BarChart2 className="h-6 w-6" />
          </div>
          <div className="cl-stat-info">
            <span className="cl-stat-val">4</span>
            <span className="cl-stat-lbl">Cognitive Modules</span>
          </div>
        </div>
      </div>

      {/* Accuracy Distribution Card */}
      <div className="cl-section">
        <div className="cl-section-header">
          <div>
            <h2 className="cl-section-title">Accuracy Band Distribution</h2>
            <p className="cl-section-subtitle">Categorization of recorded home sessions by performance band</p>
          </div>
        </div>

        <div
          style={{
            background: "white",
            border: "1px solid #F0ECF9",
            borderRadius: "20px",
            padding: "24px",
          }}
        >
          {totalSessionsWithScores === 0 ? (
            <p style={{ color: "#9A94A9", textAlign: "center", margin: "20px 0" }}>
              No session performance records available to compute accuracy distribution.
            </p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
              {Object.entries(data.accuracy_distribution).map(([range, count]) => {
                const pct = totalSessionsWithScores > 0 ? Math.round((count / totalSessionsWithScores) * 100) : 0;
                const bandColor =
                  range === "90-100%"
                    ? "#059669"
                    : range === "75-89%"
                    ? "#7C3AED"
                    : range === "60-74%"
                    ? "#D97706"
                    : "#DC2626";

                return (
                  <div
                    key={range}
                    style={{
                      padding: "16px",
                      borderRadius: "14px",
                      background: "#FAFAFF",
                      border: "1px solid #F0ECF9",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontWeight: 700, color: "#1A1035", fontSize: "14px" }}>{range}</span>
                      <span style={{ fontWeight: 800, color: bandColor, fontSize: "16px" }}>{count} sessions</span>
                    </div>
                    <div style={{ height: "8px", borderRadius: "4px", background: "#E8E2F5", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: bandColor, borderRadius: "4px" }} />
                    </div>
                    <span style={{ fontSize: "11.5px", color: "#9A94A9", marginTop: "6px", display: "block" }}>
                      {pct}% of all completed sessions
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cross-Domain Breakdown */}
      <div className="cl-section">
        <div className="cl-section-header">
          <div>
            <h2 className="cl-section-title">Cross-Domain Longitudinal Metrics</h2>
            <p className="cl-section-subtitle">Detailed breakdown across Attention, Memory, Reasoning, and Problem Solving</p>
          </div>
        </div>

        <div className="cl-domain-matrix">
          {Object.entries(DOMAIN_CONFIG).map(([key, config]) => {
            const d = data.domain_distribution[key] || { session_count: 0, avg_accuracy: 0, avg_response_time: 0 };
            return (
              <div key={key} className="cl-domain-card">
                <div className="cl-domain-card-head">
                  <div className="cl-domain-icon" style={{ background: `${config.color}15`, color: config.color }}>
                    {config.icon}
                  </div>
                  <h3 className="cl-domain-name">{config.label}</h3>
                </div>
                <div className="cl-domain-score">{d.avg_accuracy}%</div>
                <div className="cl-domain-bar">
                  <div className="cl-domain-fill" style={{ width: `${d.avg_accuracy}%`, background: config.color }} />
                </div>
                <div className="cl-domain-meta-row" style={{ marginBottom: "4px" }}>
                  <span>Total Sessions</span>
                  <strong>{d.session_count}</strong>
                </div>
                <div className="cl-domain-meta-row">
                  <span>Avg Latency</span>
                  <strong>{d.avg_response_time}s</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <footer style={{ textAlign: "center", padding: "32px 0 12px", fontSize: "12.5px", color: "#B0ABBD" }}>
        NeuroAdapt Cohort Analytics Engine • Aggregated Real Clinical Metrics
      </footer>
    </>
  );
}
