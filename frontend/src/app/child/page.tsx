"use client";

import React, { useState, useEffect } from "react";
import {
  Brain,
  Target,
  Puzzle,
  Lightbulb,
  ChevronRight,
  Flame,
  Star,
  Zap,
  Clock,
  TrendingUp,
  Play,
  Activity,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  CircleDot,
  Calendar,
  ClipboardList,
  UserCheck,
} from "lucide-react";
import { useChildContext } from "./layout";
import InteractiveExerciseGame, { ExercisePlayConfig } from "./components/InteractiveExerciseGame";

/* ═══════════════════════════════════════════════════════════════════════ */
/*                       TYPES                                           */
/* ═══════════════════════════════════════════════════════════════════════ */

interface ActiveAssignment {
  id: number;
  exercise_id: number;
  exercise_name: string;
  domain: string;
  difficulty: number;
  notes: string;
  clinician_name: string;
  assigned_date: string | null;
}

interface DashboardData {
  user: { id: number; name: string; email: string; role: string };
  child_id: number | null;
  stats: {
    total_sessions: number;
    today_sessions: number;
    total_exercises_done: number;
    avg_accuracy: number;
    total_xp: number;
    total_time_min: number;
    streak_days: number;
  };
  active_assignments?: ActiveAssignment[];
  domain_stats: Record<string, {
    sessions: number;
    accuracy: number;
    avg_score: number;
    level: number;
    progress: number;
    max_difficulty: number;
  }>;
  recent_sessions: Array<{
    id: number;
    exercise: string;
    domain: string;
    score: number;
    accuracy: number;
    response_time: number;
    errors: number;
    difficulty: number;
    date: string | null;
    completed: boolean;
  }>;
}

interface ExerciseData {
  id: number;
  name: string;
  domain: string;
  difficulty: number;
  configuration: Record<string, unknown>;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                        ANIMATED PROGRESS RING                         */
/* ═══════════════════════════════════════════════════════════════════════ */

function ProgressRing({
  progress,
  size = 72,
  strokeWidth = 5,
  color = "#7C3AED",
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 300);
    return () => clearTimeout(timer);
  }, [progress]);

  const dashOffset = circumference - (animatedProgress / 100) * circumference;

  return (
    <svg width={size} height={size} className="cd-progress-ring">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F3EFFE" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                     DOMAIN CONFIG & CARDS                             */
/* ═══════════════════════════════════════════════════════════════════════ */

const DOMAIN_CONFIG: Record<
  string,
  { label: string; color: string; bgGradient: string; icon: React.ReactNode }
> = {
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

/* ═══════════════════════════════════════════════════════════════════════ */
/*                        WELCOME HERO                                   */
/* ═══════════════════════════════════════════════════════════════════════ */

function WelcomeHero({
  userName,
  stats,
  onStartSession,
}: {
  userName: string;
  stats: DashboardData["stats"];
  onStartSession: () => void;
}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="cd-welcome-hero">
      <div className="cd-welcome-hero-bg" />
      <div className="cd-welcome-hero-content">
        <div className="cd-welcome-hero-left">
          <div className="cd-welcome-badge">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Today&apos;s Training</span>
          </div>
          <h1 className="cd-welcome-heading">
            {greeting}, <span className="cd-welcome-name">{userName}</span>! 👋
          </h1>
          <p className="cd-welcome-subtitle">
            {stats.total_sessions > 0
              ? "You're doing amazing! Let's keep building your cognitive power today."
              : "Welcome to NeuroAdapt! Complete your assigned sessions to build cognitive strength."}
          </p>
          <div className="cd-welcome-stats-row">
            <div className="cd-welcome-stat">
              <Flame className="h-4.5 w-4.5 text-orange-500" />
              <span className="cd-welcome-stat-value">{stats.streak_days}</span>
              <span className="cd-welcome-stat-label">day streak</span>
            </div>
            <div className="cd-welcome-stat-divider" />
            <div className="cd-welcome-stat">
              <Star className="h-4.5 w-4.5 text-amber-500" />
              <span className="cd-welcome-stat-value">{stats.total_xp.toLocaleString()}</span>
              <span className="cd-welcome-stat-label">total XP</span>
            </div>
            <div className="cd-welcome-stat-divider" />
            <div className="cd-welcome-stat">
              <Activity className="h-4.5 w-4.5 text-violet-300" />
              <span className="cd-welcome-stat-value">{stats.total_sessions}</span>
              <span className="cd-welcome-stat-label">sessions</span>
            </div>
          </div>
        </div>
        <div className="cd-welcome-hero-right">
          <button onClick={onStartSession} className="cd-start-session-btn">
            <div className="cd-start-session-icon">
              <Play className="h-6 w-6" fill="currentColor" />
            </div>
            <div className="cd-start-session-text">
              <span className="cd-start-session-title">Start Training</span>
              <span className="cd-start-session-sub">Begin session</span>
            </div>
            <ChevronRight className="h-5 w-5 cd-start-session-arrow" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                      QUICK STATS BAR                                  */
/* ═══════════════════════════════════════════════════════════════════════ */

function QuickStatsBar({ stats }: { stats: DashboardData["stats"] }) {
  const items = [
    { label: "Sessions Completed", value: String(stats.total_sessions), icon: <Activity className="h-5 w-5" />, color: "#7C3AED" },
    { label: "Avg. Accuracy", value: `${stats.avg_accuracy}%`, icon: <Target className="h-5 w-5" />, color: "#8B5CF6" },
    { label: "Time Spent", value: `${stats.total_time_min} min`, icon: <Clock className="h-5 w-5" />, color: "#6D28D9" },
    { label: "Exercises Done", value: String(stats.total_exercises_done), icon: <CheckCircle2 className="h-5 w-5" />, color: "#9333EA" },
  ];

  return (
    <div className="cd-quick-stats">
      {items.map((stat, i) => (
        <div key={i} className="cd-quick-stat-card" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="cd-quick-stat-icon" style={{ background: `${stat.color}12`, color: stat.color }}>
            {stat.icon}
          </div>
          <div className="cd-quick-stat-info">
            <span className="cd-quick-stat-value">{stat.value}</span>
            <span className="cd-quick-stat-label">{stat.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                   ACTIVE CLINICIAN ASSIGNMENTS BANNER                 */
/* ═══════════════════════════════════════════════════════════════════════ */

function ActiveAssignmentsBanner({
  assignments,
  onPlayAssignment,
}: {
  assignments: ActiveAssignment[];
  onPlayAssignment: (a: ActiveAssignment) => void;
}) {
  if (!assignments || assignments.length === 0) return null;

  return (
    <div className="cd-section" style={{ marginBottom: "28px" }}>
      <div className="cd-section-header">
        <div>
          <h2 className="cd-section-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ClipboardList className="h-5 w-5 text-violet-600" /> Prescribed by Your Clinician
          </h2>
          <p className="cd-section-subtitle">Active cognitive assignments assigned by your therapy team</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
        {assignments.map((a) => (
          <div
            key={a.id}
            style={{
              background: "linear-gradient(135deg, #FAF8FF 0%, #FFFFFF 100%)",
              border: "1.5px solid #DDD6FE",
              borderRadius: "20px",
              padding: "22px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 8px 24px rgba(124, 58, 237, 0.08)",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span
                  style={{
                    background: "#7C3AED",
                    color: "white",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: "6px",
                    textTransform: "uppercase",
                  }}
                >
                  {a.domain} • Level {a.difficulty}
                </span>
                <span style={{ fontSize: "11.5px", color: "#6B6580", fontWeight: 600 }}>
                  👨‍⚕️ {a.clinician_name}
                </span>
              </div>
              <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#1A1035", margin: "0 0 6px" }}>
                {a.exercise_name}
              </h3>
              <p style={{ fontSize: "12.5px", color: "#6B6580", margin: "0 0 16px", lineHeight: 1.4 }}>
                {a.notes || "Complete this assigned retraining session to build cognitive endurance."}
              </p>
            </div>

            <button
              onClick={() => onPlayAssignment(a)}
              className="cd-hero-btn"
              style={{ padding: "10px 20px", fontSize: "13.5px", justifyContent: "center" }}
            >
              <Play className="h-4 w-4" fill="currentColor" /> Play Prescribed Exercise
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                 COGNITIVE DOMAIN PROGRESS CARDS                       */
/* ═══════════════════════════════════════════════════════════════════════ */

function CognitiveDomainCards({
  domainStats,
}: {
  domainStats: DashboardData["domain_stats"];
}) {
  return (
    <div className="cd-section">
      <div className="cd-section-header">
        <div>
          <h2 className="cd-section-title">Cognitive Domains</h2>
          <p className="cd-section-subtitle">Your progress across all training areas</p>
        </div>
      </div>
      <div className="cd-domain-grid">
        {Object.entries(DOMAIN_CONFIG).map(([key, config], i) => {
          const stats = domainStats[key] || {
            sessions: 0,
            accuracy: 0,
            avg_score: 0,
            level: 0,
            progress: 0,
            max_difficulty: 1,
          };
          return (
            <div key={key} className="cd-domain-card" style={{ animationDelay: `${i * 90}ms` }}>
              <div className="cd-domain-card-top">
                <div className="cd-domain-icon-wrap" style={{ background: `${config.color}15`, color: config.color }}>
                  {config.icon}
                </div>
                <span className="cd-domain-level-badge">Lvl {stats.level}</span>
              </div>
              <h3 className="cd-domain-name">{config.label}</h3>
              <div className="cd-domain-ring-section">
                <div className="cd-domain-ring-wrapper">
                  <ProgressRing progress={stats.progress} size={72} strokeWidth={5.5} color={config.color} />
                  <span className="cd-domain-ring-pct">{stats.progress}%</span>
                </div>
                <div className="cd-domain-stats-mini">
                  <div className="cd-domain-stat-mini-row">
                    <span>Sessions</span>
                    <strong>{stats.sessions}</strong>
                  </div>
                  <div className="cd-domain-stat-mini-row">
                    <span>Accuracy</span>
                    <strong>{stats.accuracy}%</strong>
                  </div>
                  <div className="cd-domain-stat-mini-row">
                    <span>Avg Score</span>
                    <strong>{stats.avg_score}</strong>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                 EXERCISES LIST                                        */
/* ═══════════════════════════════════════════════════════════════════════ */

function ExercisesList({
  exercises,
  onPlayExercise,
}: {
  exercises: ExerciseData[];
  onPlayExercise: (ex: ExerciseData) => void;
}) {
  return (
    <div className="cd-section">
      <div className="cd-section-header">
        <div>
          <h2 className="cd-section-title">Cognitive Exercises</h2>
          <p className="cd-section-subtitle">Playable retraining games</p>
        </div>
      </div>
      <div className="cd-exercises-list">
        {exercises.map((ex, i) => {
          const domConf = DOMAIN_CONFIG[ex.domain] || DOMAIN_CONFIG.attention;
          return (
            <div key={ex.id} className="cd-exercise-card" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="cd-exercise-icon" style={{ background: `${domConf.color}15`, color: domConf.color }}>
                {domConf.icon}
              </div>
              <div className="cd-exercise-body">
                <div className="cd-exercise-meta">
                  <span className="cd-exercise-domain-pill" style={{ background: `${domConf.color}10`, color: domConf.color }}>
                    {domConf.label}
                  </span>
                  <span className="cd-exercise-diff-pill">Level {ex.difficulty}</span>
                </div>
                <h3 className="cd-exercise-name">{ex.name}</h3>
              </div>
              <button onClick={() => onPlayExercise(ex)} className="cd-exercise-play-btn">
                <Play className="h-4 w-4" fill="currentColor" /> Play
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                 RECENT SESSIONS TABLE                                 */
/* ═══════════════════════════════════════════════════════════════════════ */

function RecentSessions({ sessions }: { sessions: DashboardData["recent_sessions"] }) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="cd-section">
        <div className="cd-section-header">
          <div>
            <h2 className="cd-section-title">Recent Sessions</h2>
            <p className="cd-section-subtitle">Your latest training activity</p>
          </div>
        </div>
        <div className="cd-empty-state">
          <span className="cd-empty-emoji">🎮</span>
          <p>No sessions yet. Play an exercise above to record your performance!</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  return (
    <div className="cd-section">
      <div className="cd-section-header">
        <div>
          <h2 className="cd-section-title">Recent Sessions</h2>
          <p className="cd-section-subtitle">Your latest telemetry sent to clinician</p>
        </div>
      </div>
      <div className="cd-sessions-table-wrap custom-scrollbar">
        <table className="cd-sessions-table">
          <thead>
            <tr>
              <th>Exercise</th>
              <th>Domain</th>
              <th>Score</th>
              <th>Accuracy</th>
              <th>Time</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s, i) => {
              const domConf = DOMAIN_CONFIG[s.domain] || DOMAIN_CONFIG.attention;
              return (
                <tr key={s.id} className="cd-session-row" style={{ animationDelay: `${i * 60}ms` }}>
                  <td className="cd-session-exercise">{s.exercise}</td>
                  <td>
                    <span className="cd-session-domain-badge" style={{ background: `${domConf.color}12`, color: domConf.color }}>
                      {domConf.label}
                    </span>
                  </td>
                  <td className="cd-session-score">{s.score.toLocaleString()}</td>
                  <td>
                    <div className="cd-session-accuracy-bar-wrap">
                      <div className="cd-session-accuracy-bar">
                        <div
                          className="cd-session-accuracy-fill"
                          style={{
                            width: `${s.accuracy}%`,
                            background: s.accuracy >= 80 ? "#059669" : "#7C3AED",
                          }}
                        />
                      </div>
                      <span className="cd-session-accuracy-text">{s.accuracy}%</span>
                    </div>
                  </td>
                  <td className="cd-session-time">{s.response_time}s</td>
                  <td className="cd-session-date">{formatDate(s.date)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                        MAIN DASHBOARD PAGE                            */
/* ═══════════════════════════════════════════════════════════════════════ */

export default function ChildDashboard() {
  const { user, apiUrl } = useChildContext();
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGameConfig, setActiveGameConfig] = useState<ExercisePlayConfig | null>(null);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [dashRes, exRes] = await Promise.all([
        fetch(`${apiUrl}/api/child/dashboard/${user.id}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(`${apiUrl}/api/exercises`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
      ]);

      if (dashRes) {
        setDashData(dashRes);
      }
      setExercises(Array.isArray(exRes) ? exRes : []);
    } catch {
      // Keep existing data or empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, apiUrl]);

  const handleStartSession = () => {
    if (dashData?.active_assignments && dashData.active_assignments.length > 0) {
      const a = dashData.active_assignments[0];
      setActiveGameConfig({
        exerciseId: a.exercise_id,
        exerciseName: a.exercise_name,
        domain: a.domain,
        difficulty: a.difficulty,
        assignmentId: a.id,
        notes: a.notes,
      });
    } else if (exercises.length > 0) {
      const ex = exercises[0];
      setActiveGameConfig({
        exerciseId: ex.id,
        exerciseName: ex.name,
        domain: ex.domain,
        difficulty: ex.difficulty || 1,
      });
    }
  };

  const handlePlayAssignment = (a: ActiveAssignment) => {
    setActiveGameConfig({
      exerciseId: a.exercise_id,
      exerciseName: a.exercise_name,
      domain: a.domain,
      difficulty: a.difficulty,
      assignmentId: a.id,
      notes: a.notes,
    });
  };

  const handlePlayExercise = (ex: ExerciseData) => {
    setActiveGameConfig({
      exerciseId: ex.id,
      exerciseName: ex.name,
      domain: ex.domain,
      difficulty: ex.difficulty || 1,
    });
  };

  if (loading || !dashData) {
    return (
      <div className="cd-page-loading">
        <div className="cd-loading-spinner" />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  const displayName = dashData.user.name || user?.name || "User";

  return (
    <>
      <WelcomeHero userName={displayName} stats={dashData.stats} onStartSession={handleStartSession} />
      <QuickStatsBar stats={dashData.stats} />

      {/* Active Clinician Assignments Banner */}
      <ActiveAssignmentsBanner
        assignments={dashData.active_assignments || []}
        onPlayAssignment={handlePlayAssignment}
      />

      <CognitiveDomainCards domainStats={dashData.domain_stats} />

      <ExercisesList exercises={exercises} onPlayExercise={handlePlayExercise} />

      <RecentSessions sessions={dashData.recent_sessions} />

      {/* Interactive Playable Game Modal */}
      {activeGameConfig && (
        <InteractiveExerciseGame
          config={activeGameConfig}
          childId={dashData.child_id || dashData.user.id}
          apiUrl={apiUrl}
          onClose={() => setActiveGameConfig(null)}
          onComplete={() => {
            fetchData();
          }}
        />
      )}

      <footer className="cd-footer">
        <span>NeuroAdapt © 2026 — AI-assisted cognitive rehabilitation</span>
      </footer>
    </>
  );
}
