"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Activity,
  Award,
  AlertTriangle,
  ClipboardCheck,
  TrendingUp,
  Target,
  Brain,
  Lightbulb,
  Puzzle,
  ChevronRight,
  ArrowUpRight,
  Clock,
  Sparkles,
  CheckCircle2,
  Stethoscope,
  Plus,
} from "lucide-react";
import { useClinicianContext } from "./layout";
import VoiceInterviewSummaryCard, { VoiceInterviewRecord } from "./components/VoiceInterviewSummaryCard";

/* ═══════════════════════════════════════════════════════════════════════ */
/*                       INTERFACES                                      */
/* ═══════════════════════════════════════════════════════════════════════ */

interface DashboardResponse {
  clinician: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  stats: {
    total_patients: number;
    total_sessions_monitored: number;
    avg_cohort_accuracy: number;
    active_therapy_plans: number;
    pending_alerts_count: number;
    total_xp_earned: number;
  };
  domain_summary: Record<string, {
    total_sessions: number;
    avg_accuracy: number;
    active_patients_count: number;
  }>;
  recent_sessions: Array<{
    session_id: number;
    child_id: number;
    child_name: string;
    exercise_name: string;
    domain: string;
    score: number;
    accuracy: number;
    response_time_sec: number;
    difficulty: number;
    date: string | null;
  }>;
  clinical_alerts: Array<{
    type: "critical" | "warning";
    child_id: number;
    child_name: string;
    message: string;
    timestamp: string | null;
    action: string;
  }>;
}

interface ChildSummary {
  id: number;
  name: string;
  age: number;
  condition: string;
  total_sessions: number;
  avg_accuracy: number;
  last_active: string | null;
  status: "On Track" | "Needs Review" | "Active" | "New";
}

const DOMAIN_CONFIG: Record<string, { label: string; color: string; bgGradient: string; icon: React.ReactNode }> = {
  attention: {
    label: "Attention",
    color: "#7C3AED",
    bgGradient: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
    icon: <Target className="h-5 w-5" strokeWidth={1.8} />,
  },
  memory: {
    label: "Memory",
    color: "#8B5CF6",
    bgGradient: "linear-gradient(135deg, #8B5CF6 0%, #C4B5FD 100%)",
    icon: <Brain className="h-5 w-5" strokeWidth={1.8} />,
  },
  reasoning: {
    label: "Reasoning",
    color: "#6D28D9",
    bgGradient: "linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)",
    icon: <Lightbulb className="h-5 w-5" strokeWidth={1.8} />,
  },
  problem_solving: {
    label: "Problem Solving",
    color: "#9333EA",
    bgGradient: "linear-gradient(135deg, #9333EA 0%, #C084FC 100%)",
    icon: <Puzzle className="h-5 w-5" strokeWidth={1.8} />,
  },
};

export default function ClinicianDashboard() {
  const { user, apiUrl, refreshTrigger } = useClinicianContext();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [patients, setPatients] = useState<ChildSummary[]>([]);
  const [latestInterview, setLatestInterview] = useState<VoiceInterviewRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchClinicianData = async () => {
      setLoading(true);
      try {
        const [dashRes, patRes, ivRes] = await Promise.all([
          fetch(`${apiUrl}/api/clinician/dashboard/${user.id}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`${apiUrl}/api/clinician/children/${user.id}`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
          fetch(`${apiUrl}/api/interviews/clinician/${user.id}`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
        ]);

        if (dashRes) {
          setData(dashRes);
        } else {
          // Zero state fallback if API down or empty
          setData({
            clinician: { id: user.id, name: user.name, email: user.email, role: user.role },
            stats: {
              total_patients: 0,
              total_sessions_monitored: 0,
              avg_cohort_accuracy: 0,
              active_therapy_plans: 0,
              pending_alerts_count: 0,
              total_xp_earned: 0,
            },
            domain_summary: {
              attention: { total_sessions: 0, avg_accuracy: 0, active_patients_count: 0 },
              memory: { total_sessions: 0, avg_accuracy: 0, active_patients_count: 0 },
              reasoning: { total_sessions: 0, avg_accuracy: 0, active_patients_count: 0 },
              problem_solving: { total_sessions: 0, avg_accuracy: 0, active_patients_count: 0 },
            },
            recent_sessions: [],
            clinical_alerts: [],
          });
        }

        setPatients(Array.isArray(patRes) ? patRes : []);
        if (Array.isArray(ivRes) && ivRes.length > 0) {
          setLatestInterview(ivRes[0]);
        }
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchClinicianData();
  }, [user, apiUrl, refreshTrigger]);

  if (loading || !data) {
    return (
      <div className="cl-loading">
        <div className="cl-loading-spinner" />
        <span>Loading Clinician Intelligence...</span>
      </div>
    );
  }

  const clinicianName = data.clinician.name || user?.name || "Clinician";

  return (
    <>
      {/* Clinician Hero Banner */}
      <div className="cl-hero-banner">
        <div className="cl-hero-banner-content">
          <div>
            <div className="cl-hero-badge">
              <Stethoscope className="h-3.5 w-3.5" />
              <span>Clinician Oversight Active</span>
            </div>
            <h1 className="cl-hero-title">Welcome back, {clinicianName}</h1>
            <p className="cl-hero-subtitle">
              Continuous home-based cognitive rehabilitation monitoring and AI-assisted difficulty personalization.
            </p>
          </div>

          <div className="cl-hero-metrics">
            <div className="cl-hero-metric-item">
              <span className="cl-hero-metric-val">{data.stats.total_patients}</span>
              <span className="cl-hero-metric-lbl">Total Patients</span>
            </div>
            <div className="cl-hero-metric-item">
              <span className="cl-hero-metric-val">{data.stats.avg_cohort_accuracy}%</span>
              <span className="cl-hero-metric-lbl">Cohort Accuracy</span>
            </div>
            <div className="cl-hero-metric-item">
              <span className="cl-hero-metric-val">{data.stats.total_sessions_monitored}</span>
              <span className="cl-hero-metric-lbl">Sessions Logged</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="cl-stats-grid">
        <div className="cl-stat-card">
          <div className="cl-stat-icon" style={{ background: "#7C3AED15", color: "#7C3AED" }}>
            <Users className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <div className="cl-stat-info">
            <span className="cl-stat-val">{data.stats.total_patients}</span>
            <span className="cl-stat-lbl">Active Patients</span>
          </div>
        </div>

        <div className="cl-stat-card">
          <div className="cl-stat-icon" style={{ background: "#8B5CF615", color: "#8B5CF6" }}>
            <Activity className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <div className="cl-stat-info">
            <span className="cl-stat-val">{data.stats.total_sessions_monitored}</span>
            <span className="cl-stat-lbl">Sessions Completed</span>
          </div>
        </div>

        <div className="cl-stat-card">
          <div className="cl-stat-icon" style={{ background: "#05966915", color: "#059669" }}>
            <TrendingUp className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <div className="cl-stat-info">
            <span className="cl-stat-val">{data.stats.avg_cohort_accuracy}%</span>
            <span className="cl-stat-lbl">Cohort Avg Accuracy</span>
          </div>
        </div>

        <div className="cl-stat-card">
          <div className="cl-stat-icon" style={{ background: "#9333EA15", color: "#9333EA" }}>
            <ClipboardCheck className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <div className="cl-stat-info">
            <span className="cl-stat-val">{data.stats.active_therapy_plans}</span>
            <span className="cl-stat-lbl">Active Therapy Plans</span>
          </div>
        </div>
      </div>

      {/* Clinical Alerts Section */}
      {data.clinical_alerts.length > 0 && (
        <div className="cl-alerts-section">
          <div className="cl-section-header">
            <div>
              <h2 className="cl-section-title">Clinical Alerts & Attention Required</h2>
              <p className="cl-section-subtitle">Real-time alerts based on patient accuracy thresholds and session frequency</p>
            </div>
          </div>
          {data.clinical_alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`cl-alert-card ${alert.type === "critical" ? "cl-alert-card--critical" : ""}`}
            >
              <div className="cl-alert-left">
                <div className="cl-alert-icon">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <span className="cl-alert-msg">{alert.message}</span>
                  {alert.timestamp && (
                    <span className="cl-alert-meta">
                      • {new Date(alert.timestamp).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              </div>
              <Link href={`/clinician/patients/${alert.child_id}`} className="cl-alert-btn">
                {alert.action} →
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Featured AI Voice Cognitive Session Summary */}
      {latestInterview && (
        <div className="cl-section" style={{ marginBottom: "32px" }}>
          <VoiceInterviewSummaryCard interview={latestInterview} />
        </div>
      )}

      {/* Cognitive Domain Overview Matrix */}
      <div className="cl-section">
        <div className="cl-section-header">
          <div>
            <h2 className="cl-section-title">Cohort Cognitive Domain Matrix</h2>
            <p className="cl-section-subtitle">Aggregated longitudinal progress across all core retraining modules</p>
          </div>
        </div>
        <div className="cl-domain-matrix">
          {Object.entries(DOMAIN_CONFIG).map(([key, config]) => {
            const domainData = data.domain_summary[key] || { total_sessions: 0, avg_accuracy: 0, active_patients_count: 0 };
            return (
              <div key={key} className="cl-domain-card">
                <div className="cl-domain-card-head">
                  <div className="cl-domain-icon" style={{ background: `${config.color}12`, color: config.color }}>
                    {config.icon}
                  </div>
                  <div>
                    <h3 className="cl-domain-name">{config.label}</h3>
                    <span style={{ fontSize: "11px", color: "#9A94A9" }}>
                      {domainData.active_patients_count} active patients
                    </span>
                  </div>
                </div>
                <div className="cl-domain-score">{domainData.avg_accuracy}%</div>
                <div className="cl-domain-bar">
                  <div
                    className="cl-domain-fill"
                    style={{ width: `${domainData.avg_accuracy}%`, background: config.bgGradient }}
                  />
                </div>
                <div className="cl-domain-meta-row">
                  <span>Total Sessions</span>
                  <strong>{domainData.total_sessions}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Patients Summary Table */}
      <div className="cl-section">
        <div className="cl-section-header">
          <div>
            <h2 className="cl-section-title">Assigned Child Patients</h2>
            <p className="cl-section-subtitle">Current status and cognitive training performance</p>
          </div>
          <Link href="/clinician/patients" className="cl-table-action-btn">
            View All Patients <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="cl-table-container custom-scrollbar">
          {patients.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "#9A94A9" }}>
              <Users className="h-10 w-10 text-violet-300" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontWeight: 600, color: "#1A1035" }}>No patients registered yet</p>
              <p style={{ fontSize: "13px" }}>Click &quot;Add Patient&quot; above to register your first child patient.</p>
            </div>
          ) : (
            <table className="cl-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Age / Condition</th>
                  <th>Sessions</th>
                  <th>Avg Accuracy</th>
                  <th>Status</th>
                  <th>Last Session</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {patients.slice(0, 6).map((patient) => {
                  const statusClass =
                    patient.status === "On Track"
                      ? "cl-status-badge--on-track"
                      : patient.status === "Needs Review"
                      ? "cl-status-badge--needs-review"
                      : patient.status === "Active"
                      ? "cl-status-badge--active"
                      : "cl-status-badge--new";

                  return (
                    <tr key={patient.id}>
                      <td>
                        <div className="cl-patient-name-cell">
                          <div className="cl-patient-avatar">{patient.name.charAt(0).toUpperCase()}</div>
                          <div>
                            <div className="cl-patient-name">{patient.name}</div>
                            <div className="cl-patient-age">ID: #{patient.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: "#1A1035" }}>{patient.age} yrs</div>
                        <div style={{ fontSize: "11.5px", color: "#9A94A9" }}>{patient.condition}</div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{patient.total_sessions}</td>
                      <td>
                        <strong style={{ color: patient.avg_accuracy >= 75 ? "#059669" : "#7C3AED" }}>
                          {patient.avg_accuracy}%
                        </strong>
                      </td>
                      <td>
                        <span className={`cl-status-badge ${statusClass}`}>{patient.status}</span>
                      </td>
                      <td style={{ color: "#77738A" }}>
                        {patient.last_active
                          ? new Date(patient.last_active).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
                          : "Never"}
                      </td>
                      <td>
                        <Link href={`/clinician/patients/${patient.id}`} className="cl-table-action-btn">
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Recent Sessions Feed */}
      <div className="cl-section">
        <div className="cl-section-header">
          <div>
            <h2 className="cl-section-title">Recent Patient Session Stream</h2>
            <p className="cl-section-subtitle">Real-time incoming cognitive retraining data from home sessions</p>
          </div>
        </div>

        <div className="cl-table-container custom-scrollbar">
          {data.recent_sessions.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", color: "#9A94A9" }}>
              <Clock className="h-8 w-8 text-violet-300" style={{ margin: "0 auto 8px" }} />
              <p style={{ fontSize: "14px" }}>No recent sessions logged yet.</p>
            </div>
          ) : (
            <table className="cl-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Exercise</th>
                  <th>Domain</th>
                  <th>Difficulty</th>
                  <th>Accuracy</th>
                  <th>Latency</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_sessions.map((s, idx) => {
                  const domConf = DOMAIN_CONFIG[s.domain] || DOMAIN_CONFIG.attention;
                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: "#1A1035" }}>{s.child_name}</td>
                      <td>{s.exercise_name}</td>
                      <td>
                        <span
                          style={{
                            background: `${domConf.color}15`,
                            color: domConf.color,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                        >
                          {domConf.label}
                        </span>
                      </td>
                      <td>Level {s.difficulty}</td>
                      <td>
                        <strong style={{ color: s.accuracy >= 80 ? "#059669" : "#7C3AED" }}>{s.accuracy}%</strong>
                      </td>
                      <td style={{ color: "#77738A" }}>{s.response_time_sec}s</td>
                      <td style={{ color: "#9A94A9" }}>
                        {s.date ? new Date(s.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <footer style={{ textAlign: "center", padding: "32px 0 12px", fontSize: "12.5px", color: "#B0ABBD" }}>
        NeuroAdapt Clinician Oversight Engine • Version 1.0 • Real PostgreSQL & Supabase Connected
      </footer>
    </>
  );
}
