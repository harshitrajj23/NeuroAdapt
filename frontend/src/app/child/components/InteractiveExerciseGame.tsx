"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Sparkles,
  Trophy,
  Target,
  Brain,
  Lightbulb,
  Puzzle,
  RotateCcw,
  Check,
  Zap,
  Clock,
  ArrowRight,
  Star,
} from "lucide-react";

export interface ExercisePlayConfig {
  exerciseId: number;
  exerciseName: string;
  domain: string;
  difficulty: number;
  assignmentId?: number | null;
  notes?: string;
}

interface InteractiveGameProps {
  config: ExercisePlayConfig;
  childId: number;
  apiUrl: string;
  onClose: () => void;
  onComplete: (result: { score: number; accuracy: number; nextDifficulty: number }) => void;
}

export default function InteractiveExerciseGame({
  config,
  childId,
  apiUrl,
  onClose,
  onComplete,
}: InteractiveGameProps) {
  const [gameState, setGameState] = useState<"ready" | "playing" | "finished">("ready");
  const [score, setScore] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [errors, setErrors] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [completionResult, setCompletionResult] = useState<any>(null);

  const startTimeRef = useRef<number>(0);
  const totalResponseTimeRef = useRef<number>(0);

  // ATTENTION GAME STATE (Target Spotting)
  const [targetSymbol, setTargetSymbol] = useState("⭐");
  const [gridSymbols, setGridSymbols] = useState<string[]>([]);
  const [round, setRound] = useState(1);
  const totalRounds = 5;

  // MEMORY GAME STATE (Pair Matching)
  const [memoryCards, setMemoryCards] = useState<Array<{ id: number; symbol: string; flipped: boolean; matched: boolean }>>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);

  // REASONING GAME STATE (Sequence Completion)
  const [sequencePattern, setSequencePattern] = useState<string[]>([]);
  const [sequenceOptions, setSequenceOptions] = useState<string[]>([]);
  const [correctOption, setCorrectOption] = useState("");

  // Start the exercise
  const startExercise = () => {
    setGameState("playing");
    setScore(0);
    setErrors(0);
    setCorrectCount(0);
    setTotalAttempts(0);
    setRound(1);
    startTimeRef.current = Date.now();

    if (config.domain === "attention") {
      initAttentionRound(1);
    } else if (config.domain === "memory") {
      initMemoryGame();
    } else if (config.domain === "reasoning") {
      initReasoningRound(1);
    } else {
      initProblemSolvingRound(1);
    }
  };

  /* ───── 1. ATTENTION GAME (Focus Target Matrix) ───── */
  const initAttentionRound = (currentRound: number) => {
    const symbols = ["⭐", "🔷", "🟢", "🔺", "🔶", "🟣", "🌙", "⚡", "❤️"];
    const target = symbols[Math.floor(Math.random() * symbols.length)];
    setTargetSymbol(target);

    const gridSize = config.difficulty > 3 ? 12 : 9;
    const grid: string[] = [];
    const targetCount = Math.floor(Math.random() * 2) + 2; // 2-3 targets

    for (let i = 0; i < targetCount; i++) {
      grid.push(target);
    }
    while (grid.length < gridSize) {
      const distractor = symbols[Math.floor(Math.random() * symbols.length)];
      if (distractor !== target) {
        grid.push(distractor);
      }
    }
    // Shuffle
    setGridSymbols(grid.sort(() => Math.random() - 0.5));
  };

  const handleAttentionClick = (symbol: string, index: number) => {
    const isTarget = symbol === targetSymbol;
    setTotalAttempts((prev) => prev + 1);

    if (isTarget) {
      setCorrectCount((prev) => prev + 1);
      setScore((prev) => prev + 25 * config.difficulty);
      // Remove or mark clicked
      const newGrid = [...gridSymbols];
      newGrid[index] = "✓";
      setGridSymbols(newGrid);

      // Check if all targets found in this round
      const remainingTargets = newGrid.filter((s) => s === targetSymbol).length;
      if (remainingTargets === 0) {
        if (round >= totalRounds) {
          finishExercise(correctCount + 1, errors, score + 25 * config.difficulty);
        } else {
          setRound((r) => r + 1);
          initAttentionRound(round + 1);
        }
      }
    } else {
      setErrors((prev) => prev + 1);
    }
  };

  /* ───── 2. MEMORY GAME (Card Pairs) ───── */
  const initMemoryGame = () => {
    const symbols = ["🚀", "🎨", "🌟", "🧩", "🎯", "👑"];
    const pairCount = Math.min(symbols.length, 3 + Math.floor(config.difficulty / 2));
    const selected = symbols.slice(0, pairCount);
    const deck = [...selected, ...selected]
      .sort(() => Math.random() - 0.5)
      .map((sym, idx) => ({ id: idx, symbol: sym, flipped: false, matched: false }));
    setMemoryCards(deck);
    setFlippedIndices([]);
  };

  const handleCardClick = (index: number) => {
    if (flippedIndices.length >= 2 || memoryCards[index].flipped || memoryCards[index].matched) {
      return;
    }

    const newCards = [...memoryCards];
    newCards[index].flipped = true;
    const newFlipped = [...flippedIndices, index];
    setMemoryCards(newCards);
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setTotalAttempts((prev) => prev + 1);
      const [idx1, idx2] = newFlipped;
      if (newCards[idx1].symbol === newCards[idx2].symbol) {
        newCards[idx1].matched = true;
        newCards[idx2].matched = true;
        setCorrectCount((prev) => prev + 1);
        setScore((prev) => prev + 30 * config.difficulty);
        setFlippedIndices([]);

        const allMatched = newCards.every((c) => c.matched);
        if (allMatched) {
          finishExercise(correctCount + 1, errors, score + 30 * config.difficulty);
        }
      } else {
        setErrors((prev) => prev + 1);
        setTimeout(() => {
          newCards[idx1].flipped = false;
          newCards[idx2].flipped = false;
          setMemoryCards([...newCards]);
          setFlippedIndices([]);
        }, 800);
      }
    }
  };

  /* ───── 3. REASONING GAME (Pattern Sequence) ───── */
  const initReasoningRound = (currentRound: number) => {
    const patterns = [
      { seq: ["🔴", "🔵", "🔴", "🔵"], correct: "🔴", options: ["🔴", "🟢", "🟡", "🟣"] },
      { seq: ["⭐", "⭐", "🌙", "⭐", "⭐"], correct: "🌙", options: ["🌙", "⭐", "⚡", "☀️"] },
      { seq: ["1️⃣", "2️⃣", "3️⃣", "4️⃣"], correct: "5️⃣", options: ["5️⃣", "6️⃣", "1️⃣", "8️⃣"] },
      { seq: ["🔺", "🔷", "🔺", "🔷", "🔺"], correct: "🔷", options: ["🔷", "🔺", "🟣", "🟩"] },
      { seq: ["🐱", "🐶", "🐱", "🐶"], correct: "🐱", options: ["🐱", "🐭", "🐶", "🐰"] },
    ];
    const p = patterns[(currentRound - 1) % patterns.length];
    setSequencePattern(p.seq);
    setCorrectOption(p.correct);
    setSequenceOptions(p.options.sort(() => Math.random() - 0.5));
  };

  const handleReasoningOption = (option: string) => {
    setTotalAttempts((prev) => prev + 1);
    const isCorrect = option === correctOption;

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      const roundScore = score + 30 * config.difficulty;
      setScore(roundScore);

      if (round >= totalRounds) {
        finishExercise(correctCount + 1, errors, roundScore);
      } else {
        setRound((r) => r + 1);
        initReasoningRound(round + 1);
      }
    } else {
      setErrors((prev) => prev + 1);
    }
  };

  /* ───── 4. PROBLEM SOLVING (Path Puzzle) ───── */
  const initProblemSolvingRound = (currentRound: number) => {
    initReasoningRound(currentRound);
  };

  /* ───── FINISH & SUBMIT TO BACKEND ───── */
  const finishExercise = async (finalCorrect: number, finalErrors: number, finalScore: number) => {
    const totalTimeMs = Math.max(2000, Date.now() - startTimeRef.current);
    const attempts = Math.max(1, finalCorrect + finalErrors);
    const calcAccuracy = Math.min(100, Math.max(20, Math.round((finalCorrect / attempts) * 100)));

    setAccuracy(calcAccuracy);
    setGameState("finished");
    setSubmitting(true);

    try {
      const res = await fetch(`${apiUrl}/api/sessions/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_id: childId,
          exercise_id: config.exerciseId,
          difficulty: config.difficulty,
          score: finalScore,
          accuracy: calcAccuracy,
          response_time_ms: totalTimeMs,
          errors: finalErrors,
          assignment_id: config.assignmentId || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCompletionResult(data);
        onComplete({
          score: finalScore,
          accuracy: calcAccuracy,
          nextDifficulty: data.adaptive_next_difficulty || config.difficulty,
        });
      }
    } catch (err) {
      console.error("Session recording error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cd-modal-backdrop" style={{ zIndex: 100 }}>
      <div
        className="cd-modal-card"
        style={{
          maxWidth: "600px",
          width: "100%",
          padding: "32px",
          borderRadius: "24px",
          background: "white",
          boxShadow: "0 25px 60px rgba(124, 58, 237, 0.2)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {config.domain === "attention" && <Target className="h-5 w-5" />}
              {config.domain === "memory" && <Brain className="h-5 w-5" />}
              {config.domain === "reasoning" && <Lightbulb className="h-5 w-5" />}
              {config.domain === "problem_solving" && <Puzzle className="h-5 w-5" />}
            </div>
            <div>
              <h2 style={{ fontSize: "19px", fontWeight: 800, color: "#1A1035", margin: 0 }}>
                {config.exerciseName}
              </h2>
              <span style={{ fontSize: "12px", color: "#7C3AED", fontWeight: 600 }}>
                Level {config.difficulty} • {config.domain.replace("_", " ").toUpperCase()}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#F5F0FF",
              border: "none",
              borderRadius: "10px",
              padding: "8px",
              cursor: "pointer",
              color: "#6B6580",
            }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* READY STATE */}
        {gameState === "ready" && (
          <div style={{ textAlign: "center", padding: "24px 12px" }}>
            <div style={{ fontSize: "52px", marginBottom: "16px" }}>
              {config.domain === "attention" ? "🎯" : config.domain === "memory" ? "🧠" : "💡"}
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#1A1035", margin: "0 0 8px" }}>
              Ready to begin training?
            </h3>
            {config.notes && (
              <p
                style={{
                  background: "#F5F0FF",
                  padding: "10px 16px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  color: "#5B21B6",
                  margin: "0 auto 16px",
                  maxWidth: "400px",
                }}
              >
                📋 <strong>Clinician Instructions:</strong> {config.notes}
              </p>
            )}
            <p style={{ fontSize: "14px", color: "#6B6580", margin: "0 auto 24px", maxWidth: "380px" }}>
              Focus on accuracy and speed. When you finish, your performance is automatically submitted to your clinician.
            </p>
            <button
              onClick={startExercise}
              className="cd-hero-btn"
              style={{ padding: "14px 36px", fontSize: "16px", margin: "0 auto", display: "inline-flex" }}
            >
              <Zap className="h-5 w-5" /> Start Exercise Now
            </button>
          </div>
        )}

        {/* PLAYING STATE */}
        {gameState === "playing" && (
          <div>
            {/* Live Progress Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#7C3AED" }}>
                Score: {score} XP
              </span>
              <span style={{ fontSize: "12px", color: "#6B6580" }}>
                {config.domain !== "memory" ? `Round ${round}/${totalRounds}` : "Match all pairs"}
              </span>
            </div>

            {/* 1. ATTENTION GAME BOARD */}
            {config.domain === "attention" && (
              <div>
                <div
                  style={{
                    background: "#F5F0FF",
                    padding: "12px",
                    borderRadius: "14px",
                    textAlign: "center",
                    marginBottom: "18px",
                  }}
                >
                  <span style={{ fontSize: "13px", color: "#4C1D95", fontWeight: 600 }}>
                    Spot & click the target icon:
                  </span>
                  <span style={{ fontSize: "28px", marginLeft: "10px", verticalAlign: "middle" }}>
                    {targetSymbol}
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "12px",
                    margin: "0 auto",
                  }}
                >
                  {gridSymbols.map((sym, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAttentionClick(sym, idx)}
                      disabled={sym === "✓"}
                      style={{
                        height: "70px",
                        fontSize: "30px",
                        border: "2px solid #EDE9FE",
                        borderRadius: "16px",
                        background: sym === "✓" ? "#ECFDF5" : "white",
                        cursor: sym === "✓" ? "default" : "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. MEMORY GAME BOARD */}
            {config.domain === "memory" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "10px",
                  margin: "0 auto",
                }}
              >
                {memoryCards.map((card, idx) => (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(idx)}
                    style={{
                      height: "76px",
                      fontSize: card.flipped || card.matched ? "32px" : "18px",
                      border: "2px solid",
                      borderColor: card.matched ? "#10B981" : card.flipped ? "#7C3AED" : "#EDE9FE",
                      borderRadius: "16px",
                      background: card.matched ? "#ECFDF5" : card.flipped ? "#F5F0FF" : "linear-gradient(135deg, #7C3AED, #8B5CF6)",
                      color: "white",
                      cursor: card.matched ? "default" : "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {card.flipped || card.matched ? card.symbol : "❓"}
                  </button>
                ))}
              </div>
            )}

            {/* 3. REASONING / PROBLEM SOLVING BOARD */}
            {(config.domain === "reasoning" || config.domain === "problem_solving") && (
              <div>
                <div
                  style={{
                    background: "#F5F0FF",
                    padding: "20px",
                    borderRadius: "16px",
                    textAlign: "center",
                    marginBottom: "20px",
                  }}
                >
                  <span style={{ fontSize: "13px", color: "#4C1D95", fontWeight: 600, display: "block", marginBottom: "8px" }}>
                    Complete the sequence pattern:
                  </span>
                  <div style={{ display: "flex", justifyContent: "center", gap: "10px", fontSize: "28px" }}>
                    {sequencePattern.map((s, i) => (
                      <span key={i} style={{ padding: "6px 10px", background: "white", borderRadius: "10px" }}>
                        {s}
                      </span>
                    ))}
                    <span style={{ padding: "6px 14px", background: "#DDD6FE", borderRadius: "10px", fontWeight: 800, color: "#7C3AED" }}>
                      ?
                    </span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {sequenceOptions.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleReasoningOption(opt)}
                      style={{
                        padding: "16px",
                        fontSize: "26px",
                        border: "2px solid #EDE9FE",
                        borderRadius: "14px",
                        background: "white",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FINISHED STATE */}
        {gameState === "finished" && (
          <div style={{ textAlign: "center", padding: "20px 10px" }}>
            <div style={{ fontSize: "56px", marginBottom: "12px" }}>🎉</div>
            <h3 style={{ fontSize: "24px", fontWeight: 800, color: "#1A1035", margin: "0 0 6px" }}>
              Great Job! Exercise Completed!
            </h3>
            <p style={{ fontSize: "14px", color: "#6B6580", margin: "0 0 20px" }}>
              Telemetry recorded and dispatched directly to your supervising clinician.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "12px",
                marginBottom: "24px",
              }}
            >
              <div style={{ background: "#F5F0FF", padding: "16px", borderRadius: "14px" }}>
                <span style={{ fontSize: "11px", color: "#7C3AED", fontWeight: 700, textTransform: "uppercase" }}>Score</span>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#1A1035" }}>+{score} XP</div>
              </div>
              <div style={{ background: "#ECFDF5", padding: "16px", borderRadius: "14px" }}>
                <span style={{ fontSize: "11px", color: "#059669", fontWeight: 700, textTransform: "uppercase" }}>Accuracy</span>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#059669" }}>{accuracy}%</div>
              </div>
              <div style={{ background: "#FFFBEB", padding: "16px", borderRadius: "14px" }}>
                <span style={{ fontSize: "11px", color: "#D97706", fontWeight: 700, textTransform: "uppercase" }}>Adaptive Next</span>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#D97706" }}>
                  Lvl {completionResult?.adaptive_next_difficulty || config.difficulty}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="cd-hero-btn"
              style={{ padding: "12px 32px", margin: "0 auto", display: "inline-flex" }}
            >
              <Check className="h-4 w-4" /> Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
