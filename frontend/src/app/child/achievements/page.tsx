"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Star, Lock } from "lucide-react";
import { useChildContext } from "../layout";

interface Achievement {
  id: string;
  title: string;
  icon: string;
  description: string;
  earned: boolean;
}

export default function AchievementsPage() {
  const { user, apiUrl } = useChildContext();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/child/${user.id}/achievements`);
        if (res.ok) {
          const data = await res.json();
          setAchievements(data.achievements || []);
          setTotalSessions(data.total_sessions || 0);
          setTotalScore(data.total_score || 0);
        }
      } catch {
        setAchievements([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, apiUrl]);

  if (loading) {
    return <div className="cd-page-loading"><div className="cd-loading-spinner" /><span>Loading achievements...</span></div>;
  }

  const earned = achievements.filter(a => a.earned);
  const locked = achievements.filter(a => !a.earned);

  return (
    <>
      <div className="cd-page-header">
        <h1 className="cd-page-heading">Achievements</h1>
        <p className="cd-page-desc">Collect badges as you grow stronger</p>
      </div>

      {/* Summary stats */}
      <div className="cd-achievements-summary">
        <div className="cd-achievement-summary-card">
          <Trophy className="h-6 w-6 text-amber-500" />
          <div>
            <span className="cd-achievement-summary-val">{earned.length}/{achievements.length}</span>
            <span className="cd-achievement-summary-lbl">Badges Earned</span>
          </div>
        </div>
        <div className="cd-achievement-summary-card">
          <Star className="h-6 w-6 text-violet-500" />
          <div>
            <span className="cd-achievement-summary-val">{totalScore.toLocaleString()}</span>
            <span className="cd-achievement-summary-lbl">Total XP</span>
          </div>
        </div>
        <div className="cd-achievement-summary-card">
          <Trophy className="h-6 w-6 text-violet-500" />
          <div>
            <span className="cd-achievement-summary-val">{totalSessions}</span>
            <span className="cd-achievement-summary-lbl">Sessions Played</span>
          </div>
        </div>
      </div>

      {/* Earned section */}
      {earned.length > 0 && (
        <div className="cd-section">
          <h2 className="cd-section-title">🏆 Earned</h2>
          <p className="cd-section-subtitle">Badges you&apos;ve unlocked through hard work</p>
          <div className="cd-achievements-full-grid">
            {earned.map((a, i) => (
              <div key={a.id} className="cd-achievement-full-card cd-achievement-full-card--earned" style={{ animationDelay: `${i * 60}ms` }}>
                <span className="cd-achievement-full-emoji">{a.icon}</span>
                <h3 className="cd-achievement-full-title">{a.title}</h3>
                <p className="cd-achievement-full-desc">{a.description}</p>
                <span className="cd-achievement-full-status cd-achievement-full-status--earned">Earned ✓</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked section */}
      {locked.length > 0 && (
        <div className="cd-section">
          <h2 className="cd-section-title">🔒 Locked</h2>
          <p className="cd-section-subtitle">Keep training to unlock these badges</p>
          <div className="cd-achievements-full-grid">
            {locked.map((a, i) => (
              <div key={a.id} className="cd-achievement-full-card cd-achievement-full-card--locked" style={{ animationDelay: `${i * 60}ms` }}>
                <span className="cd-achievement-full-emoji">{a.icon}</span>
                <h3 className="cd-achievement-full-title">{a.title}</h3>
                <p className="cd-achievement-full-desc">{a.description}</p>
                <span className="cd-achievement-full-status cd-achievement-full-status--locked">
                  <Lock className="h-3 w-3" /> Locked
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {achievements.length === 0 && (
        <div className="cd-empty-state">
          <span className="cd-empty-emoji">🏅</span>
          <p>Start training to begin earning achievements!</p>
        </div>
      )}

      <footer className="cd-footer">
        <span>NeuroAdapt © 2026 — AI-assisted cognitive rehabilitation</span>
      </footer>
    </>
  );
}
