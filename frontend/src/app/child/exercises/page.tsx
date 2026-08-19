"use client";

import React, { useState, useEffect } from "react";
import {
  Brain,
  Target,
  Puzzle,
  Lightbulb,
  Play,
  Zap,
  Search,
  Filter,
  Clock,
  Mic,
} from "lucide-react";
import { useChildContext } from "../layout";
import InteractiveExerciseGame, { ExercisePlayConfig } from "../components/InteractiveExerciseGame";

const DOMAIN_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  attention: { label: "Attention", color: "#7C3AED", icon: <Target className="h-7 w-7" strokeWidth={1.6} /> },
  memory: { label: "Memory", color: "#8B5CF6", icon: <Brain className="h-7 w-7" strokeWidth={1.6} /> },
  reasoning: { label: "Reasoning", color: "#6D28D9", icon: <Lightbulb className="h-7 w-7" strokeWidth={1.6} /> },
  problem_solving: { label: "Problem Solving", color: "#9333EA", icon: <Puzzle className="h-7 w-7" strokeWidth={1.6} /> },
};

interface ExerciseData {
  id: number;
  name: string;
  domain: string;
  difficulty: number;
  configuration: Record<string, unknown>;
}

export default function ExercisesPage() {
  const { user, apiUrl } = useChildContext();
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [domainLevels, setDomainLevels] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGameConfig, setActiveGameConfig] = useState<ExercisePlayConfig | null>(null);

  const fetchExercisesAndStats = async () => {
    try {
      const [exRes, dashRes] = await Promise.all([
        fetch(`${apiUrl}/api/exercises`),
        user?.id ? fetch(`${apiUrl}/api/child/dashboard/${user.id}`) : Promise.resolve(null),
      ]);

      if (exRes.ok) {
        const data = await exRes.json();
        setExercises(Array.isArray(data) ? data : []);
      }

      if (dashRes && dashRes.ok) {
        const dashData = await dashRes.json();
        if (dashData.domain_stats) {
          const lvls: Record<string, number> = {};
          dashData.domain_stats.forEach((d: any) => {
            lvls[d.domain] = d.level || 1;
          });
          setDomainLevels(lvls);
        }
      }
    } catch {
      setExercises([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercisesAndStats();
  }, [apiUrl, user?.id]);

  const difficultyLabel = (d: number) => (d <= 2 ? "Easy" : d <= 5 ? "Medium" : "Hard");
  const difficultyColor = (d: string) => {
    if (d === "Easy") return { bg: "#ECFDF5", text: "#059669" };
    if (d === "Medium") return { bg: "#FFF7ED", text: "#D97706" };
    return { bg: "#FEF2F2", text: "#DC2626" };
  };

  const filtered = exercises.filter((ex) => {
    const matchesDomain = filter === "all" || ex.domain === filter;
    const matchesSearch = !searchQuery || ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  const handleStartGame = (ex: ExerciseData) => {
    const currentLevel = domainLevels[ex.domain] || ex.difficulty || 1;
    setActiveGameConfig({
      exerciseId: ex.id,
      exerciseName: ex.name,
      domain: ex.domain,
      difficulty: currentLevel,
    });
  };

  if (loading) {
    return (
      <div className="cd-page-loading">
        <div className="cd-loading-spinner" />
        <span>Loading exercises...</span>
      </div>
    );
  }

  return (
    <>
      {/* Page header */}
      <div className="cd-page-header">
        <h1 className="cd-page-heading">Exercises</h1>
        <p className="cd-page-desc">Interactive cognitive retraining modules</p>
      </div>

      {/* Filters bar */}
      <div className="cd-filters-bar">
        <div className="cd-search-box">
          <Search className="h-4 w-4 cd-search-icon" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="cd-search-input"
          />
        </div>
        <div className="cd-filter-chips">
          <button
            className={`cd-filter-chip ${filter === "all" ? "cd-filter-chip--active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All Modules
          </button>
          {Object.entries(DOMAIN_CONFIG).map(([key, config]) => (
            <button
              key={key}
              className={`cd-filter-chip ${filter === key ? "cd-filter-chip--active" : ""}`}
              onClick={() => setFilter(key)}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Exercises grid */}
      {filtered.length === 0 ? (
        <div className="cd-empty-state">
          <span className="cd-empty-emoji">🔍</span>
          <p>{exercises.length === 0 ? "No exercises configured yet." : "No exercises match your filter."}</p>
        </div>
      ) : (
        <div className="cd-exercises-page-grid">
          {filtered.map((ex, i) => {
            const domConf = DOMAIN_CONFIG[ex.domain] || DOMAIN_CONFIG.attention;
            const liveDiff = domainLevels[ex.domain] || ex.difficulty || 1;
            const dl = difficultyLabel(liveDiff);
            const dc = difficultyColor(dl);
            return (
              <div key={ex.id} className="cd-exercise-page-card" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="cd-exercise-page-icon" style={{ background: `${domConf.color}0D` }}>
                  <div style={{ color: domConf.color }}>{domConf.icon}</div>
                </div>
                <div className="cd-exercise-page-tags">
                  <span style={{ background: `${domConf.color}12`, color: domConf.color }} className="cd-exercise-domain-tag">
                    {domConf.label}
                  </span>
                  <span style={{ background: dc.bg, color: dc.text }} className="cd-exercise-diff-tag">
                    {dl}
                  </span>
                  {ex.name.toLowerCase().includes("voice") && (
                    <span style={{ background: "#EDE9FE", color: "#6D28D9", display: "inline-flex", alignItems: "center", gap: "3px" }} className="cd-exercise-diff-tag">
                      <Mic className="h-3 w-3" /> Voice AI
                    </span>
                  )}
                </div>
                <h3 className="cd-exercise-page-title">{ex.name}</h3>
                <div className="cd-exercise-page-meta">
                  <span>
                    <Zap className="h-3.5 w-3.5" /> Level {liveDiff}/10
                  </span>
                </div>
                <button
                  onClick={() => handleStartGame(ex)}
                  className="cd-exercise-page-play"
                  style={{ background: domConf.color }}
                >
                  <Play className="h-4 w-4" fill="white" /> Start Exercise
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Game Runner Modal */}
      {activeGameConfig && (
        <InteractiveExerciseGame
          config={activeGameConfig}
          childId={user?.id || 1}
          apiUrl={apiUrl}
          onClose={() => setActiveGameConfig(null)}
          onComplete={() => {
            fetchExercisesAndStats();
          }}
        />
      )}

      <footer className="cd-footer">
        <span>NeuroAdapt © 2026 — AI-assisted cognitive rehabilitation</span>
      </footer>
    </>
  );
}
