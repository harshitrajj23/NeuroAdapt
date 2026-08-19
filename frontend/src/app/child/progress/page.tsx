"use client";

import React, { useState, useEffect } from "react";
import {
  Brain,
  Target,
  Puzzle,
  Lightbulb,
  TrendingUp,
  Activity,
  Clock,
  BarChart3,
} from "lucide-react";
import { useChildContext } from "../layout";

const DOMAIN_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  attention: { label: "Attention", color: "#7C3AED", icon: <Target className="h-5 w-5" strokeWidth={1.8} /> },
  memory: { label: "Memory", color: "#8B5CF6", icon: <Brain className="h-5 w-5" strokeWidth={1.8} /> },
  reasoning: { label: "Reasoning", color: "#6D28D9", icon: <Lightbulb className="h-5 w-5" strokeWidth={1.8} /> },
  problem_solving: { label: "Problem Solving", color: "#9333EA", icon: <Puzzle className="h-5 w-5" strokeWidth={1.8} /> },
};

interface TimelineEntry {
  date: string | null;
  domain: string;
  accuracy: number;
  score: number;
  difficulty: number;
  response_time: number;
}

interface DomainStat {
  sessions: number;
  accuracy: number;
  avg_score: number;
  level: number;
  progress: number;
  max_difficulty: number;
}

/* ─── Simple Bar Chart Component ─── */
function SimpleBarChart({ data, color, label }: { data: number[]; color: string; label: string }) {
  const maxVal = Math.max(...data, 1);
  return (
    <div className="cd-bar-chart">
      <span className="cd-bar-chart-label">{label}</span>
      <div className="cd-bar-chart-bars">
        {data.map((val, i) => (
          <div key={i} className="cd-bar-chart-col">
            <div className="cd-bar-chart-bar" style={{
              height: `${(val / maxVal) * 100}%`,
              background: color,
              animationDelay: `${i * 60}ms`,
            }} />
            <span className="cd-bar-chart-val">{Math.round(val)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Progress Ring ─── */
function ProgressRing({ progress, size = 100, strokeWidth = 8, color = "#7C3AED" }: {
  progress: number; size?: number; strokeWidth?: number; color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [animated, setAnimated] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnimated(progress), 300); return () => clearTimeout(t); }, [progress]);
  const offset = circumference - (animated / 100) * circumference;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#F3EFFE" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color}
        strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)" }}
      />
    </svg>
  );
}

export default function ProgressPage() {
  const { user, apiUrl } = useChildContext();
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [domainStats, setDomainStats] = useState<Record<string, DomainStat>>({});
  const [stats, setStats] = useState({ total_sessions: 0, avg_accuracy: 0, total_xp: 0, total_exercises_done: 0, total_time_min: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [progRes, dashRes] = await Promise.all([
          fetch(`${apiUrl}/api/child/${user.id}/progress`).then(r => r.ok ? r.json() : { timeline: [] }).catch(() => ({ timeline: [] })),
          fetch(`${apiUrl}/api/child/dashboard/${user.id}`).then(r => r.ok ? r.json() : null).catch(() => null),
        ]);
        setTimeline(progRes.timeline || []);
        if (dashRes) {
          setDomainStats(dashRes.domain_stats || {});
          setStats(dashRes.stats || stats);
        }
      } catch { /* fallback to zeros */ } finally { setLoading(false); }
    };
    load();
  }, [user, apiUrl]);

  if (loading) {
    return <div className="cd-page-loading"><div className="cd-loading-spinner" /><span>Loading progress...</span></div>;
  }

  // Build per-domain accuracy arrays for charts
  const domainTimelines: Record<string, number[]> = {};
  for (const entry of timeline) {
    if (!domainTimelines[entry.domain]) domainTimelines[entry.domain] = [];
    domainTimelines[entry.domain].push(entry.accuracy);
  }

  const hasData = timeline.length > 0;

  return (
    <>
      <div className="cd-page-header">
        <h1 className="cd-page-heading">Progress</h1>
        <p className="cd-page-desc">Track your cognitive growth across all domains</p>
      </div>

      {/* Overview stats */}
      <div className="cd-progress-overview">
        <div className="cd-progress-stat-card">
          <Activity className="h-5 w-5 text-violet-500" />
          <span className="cd-progress-stat-val">{stats.total_sessions}</span>
          <span className="cd-progress-stat-lbl">Total Sessions</span>
        </div>
        <div className="cd-progress-stat-card">
          <Target className="h-5 w-5 text-violet-500" />
          <span className="cd-progress-stat-val">{stats.avg_accuracy}%</span>
          <span className="cd-progress-stat-lbl">Avg Accuracy</span>
        </div>
        <div className="cd-progress-stat-card">
          <TrendingUp className="h-5 w-5 text-violet-500" />
          <span className="cd-progress-stat-val">{stats.total_xp}</span>
          <span className="cd-progress-stat-lbl">Total XP</span>
        </div>
        <div className="cd-progress-stat-card">
          <Clock className="h-5 w-5 text-violet-500" />
          <span className="cd-progress-stat-val">{stats.total_time_min} min</span>
          <span className="cd-progress-stat-lbl">Time Trained</span>
        </div>
      </div>

      {/* Domain breakdown cards */}
      <div className="cd-section">
        <h2 className="cd-section-title">Domain Breakdown</h2>
        <p className="cd-section-subtitle">Detailed performance per cognitive area</p>
        <div className="cd-progress-domain-grid">
          {Object.entries(DOMAIN_CONFIG).map(([key, conf]) => {
            const ds = domainStats[key] || { sessions: 0, accuracy: 0, avg_score: 0, level: 0, progress: 0, max_difficulty: 1 };
            const chartData = domainTimelines[key] || [];
            return (
              <div key={key} className="cd-progress-domain-card">
                <div className="cd-progress-domain-top">
                  <div className="cd-progress-domain-ring">
                    <ProgressRing progress={ds.progress} size={90} strokeWidth={7} color={conf.color} />
                    <span className="cd-progress-domain-pct" style={{ color: conf.color }}>{ds.progress}%</span>
                  </div>
                  <div className="cd-progress-domain-info">
                    <div className="cd-progress-domain-icon" style={{ color: conf.color }}>{conf.icon}</div>
                    <h3 className="cd-progress-domain-name">{conf.label}</h3>
                    <span className="cd-progress-domain-level" style={{ color: conf.color }}>Level {ds.level}</span>
                  </div>
                </div>
                <div className="cd-progress-domain-stats">
                  <div className="cd-progress-dstat"><span>Sessions</span><strong>{ds.sessions}</strong></div>
                  <div className="cd-progress-dstat"><span>Accuracy</span><strong>{ds.accuracy}%</strong></div>
                  <div className="cd-progress-dstat"><span>Avg Score</span><strong>{ds.avg_score}</strong></div>
                  <div className="cd-progress-dstat"><span>Max Diff.</span><strong>{ds.max_difficulty}</strong></div>
                </div>
                {chartData.length > 1 && (
                  <SimpleBarChart data={chartData.slice(-8)} color={conf.color} label="Accuracy trend" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline table */}
      {hasData && (
        <div className="cd-section">
          <h2 className="cd-section-title">Session Timeline</h2>
          <p className="cd-section-subtitle">All sessions in chronological order</p>
          <div className="cd-sessions-table-wrap custom-scrollbar">
            <table className="cd-sessions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Domain</th>
                  <th>Accuracy</th>
                  <th>Score</th>
                  <th>Difficulty</th>
                  <th>Response Time</th>
                </tr>
              </thead>
              <tbody>
                {timeline.slice().reverse().map((t, i) => {
                  const domConf = DOMAIN_CONFIG[t.domain] || DOMAIN_CONFIG.attention;
                  return (
                    <tr key={i} className="cd-session-row">
                      <td className="cd-session-date">{t.date ? new Date(t.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "—"}</td>
                      <td><span className="cd-session-domain-badge" style={{ background: `${domConf.color}12`, color: domConf.color }}>{domConf.label}</span></td>
                      <td className="cd-session-score">{t.accuracy}%</td>
                      <td className="cd-session-score">{t.score}</td>
                      <td>{t.difficulty}</td>
                      <td className="cd-session-time">{t.response_time}ms</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!hasData && (
        <div className="cd-empty-state">
          <span className="cd-empty-emoji">📊</span>
          <p>No progress data yet. Complete some exercises to see your analytics here!</p>
        </div>
      )}

      <footer className="cd-footer">
        <span>NeuroAdapt © 2026 — AI-assisted cognitive rehabilitation</span>
      </footer>
    </>
  );
}
