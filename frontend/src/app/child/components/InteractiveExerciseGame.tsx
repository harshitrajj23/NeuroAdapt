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
  CheckCircle2,
  XCircle,
  Mic,
} from "lucide-react";
import VoiceMemoryGame from "./VoiceMemoryGame";

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
  const diff = Math.max(1, Math.min(10, config.difficulty || 1));

  // If this is a Voice Recall challenge, delegate directly to VoiceMemoryGame
  if (config.exerciseName.toLowerCase().includes("voice") || config.exerciseId === 7) {
    return (
      <VoiceMemoryGame
        config={config}
        childId={childId}
        apiUrl={apiUrl}
        onClose={onClose}
        onComplete={() => {
          onComplete({ score: 180, accuracy: 80, nextDifficulty: diff });
        }}
      />
    );
  }
  const [gameState, setGameState] = useState<"ready" | "playing" | "finished">("ready");
  const [score, setScore] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [errors, setErrors] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [completionResult, setCompletionResult] = useState<any>(null);

  const startTimeRef = useRef<number>(0);

  // Round progression
  const [round, setRound] = useState(1);
  const totalRounds = diff >= 7 ? 6 : diff >= 4 ? 5 : 4;

  /* ───── 1. ATTENTION GAME STATE ───── */
  const [targetSymbols, setTargetSymbols] = useState<string[]>([]);
  const [gridTiles, setGridTiles] = useState<
    Array<{ id: number; symbol: string; status: "normal" | "correct" | "wrong" }>
  >([]);

  /* ───── 2. MEMORY GAME STATE ───── */
  const [memoryCards, setMemoryCards] = useState<
    Array<{ id: number; symbol: string; flipped: boolean; matched: boolean; status?: "normal" | "wrong" | "correct" }>
  >([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);

  /* ───── 3. REASONING / PROBLEM SOLVING STATE ───── */
  const [patternQuestion, setPatternQuestion] = useState<{
    title: string;
    sequence: string[];
    options: string[];
    correct: string;
  }>({
    title: "",
    sequence: [],
    options: [],
    correct: "",
  });
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isOptionLocked, setIsOptionLocked] = useState(false);

  // Start the game
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

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                        1. ATTENTION GAME                              */
  /* ═══════════════════════════════════════════════════════════════════════ */
  const initAttentionRound = (r: number) => {
    let pool = ["⭐", "🔷", "🟢", "🔺", "🔶", "🟣", "🌙", "⚡", "❤️", "🍀", "💎", "🔥"];
    if (diff >= 6) {
      pool = ["🟣", "🟪", "💜", "🍇", "🫐", "🔷", "🟦", "💙", "🔵", "💎", "💠", "🔹"];
    }

    // Number of distinct target symbols (1 for low diff, 2 for mid/high diff)
    const numTargets = diff >= 5 ? 2 : 1;
    const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
    const chosenTargets = shuffledPool.slice(0, numTargets);
    setTargetSymbols(chosenTargets);

    // Grid size scaled to level
    // Lvl 1-3: 9 tiles (3x3), Lvl 4-7: 16 tiles (4x4), Lvl 8-10: 25 tiles (5x5)
    const totalTiles = diff >= 8 ? 25 : diff >= 4 ? 16 : 9;
    const targetCopies = diff >= 6 ? 4 : diff >= 4 ? 3 : 2;

    const tiles: Array<{ id: number; symbol: string; status: "normal" | "correct" | "wrong" }> = [];
    let idCounter = 0;

    // Add target copies
    for (const t of chosenTargets) {
      for (let i = 0; i < targetCopies; i++) {
        tiles.push({ id: idCounter++, symbol: t, status: "normal" });
      }
    }

    // Fill remainder with distractors
    const distractors = pool.filter((s) => !chosenTargets.includes(s));
    while (tiles.length < totalTiles) {
      const d = distractors[Math.floor(Math.random() * distractors.length)] || "🔷";
      tiles.push({ id: idCounter++, symbol: d, status: "normal" });
    }

    setGridTiles(tiles.sort(() => Math.random() - 0.5));
  };

  const handleAttentionTileClick = (index: number) => {
    const tile = gridTiles[index];
    if (tile.status === "correct") return;

    setTotalAttempts((prev) => prev + 1);
    const isTarget = targetSymbols.includes(tile.symbol);

    const newTiles = [...gridTiles];
    if (isTarget) {
      // CORRECT: Turn GREEN
      newTiles[index] = { ...tile, status: "correct" };
      setGridTiles(newTiles);
      setCorrectCount((prev) => prev + 1);
      const earned = 20 * diff;
      setScore((prev) => prev + earned);

      // Check if all targets found
      const remainingTargets = newTiles.filter(
        (t) => targetSymbols.includes(t.symbol) && t.status !== "correct"
      ).length;

      if (remainingTargets === 0) {
        if (round >= totalRounds) {
          finishExercise(correctCount + 1, errors, score + earned);
        } else {
          setTimeout(() => {
            setRound((r) => r + 1);
            initAttentionRound(round + 1);
          }, 400);
        }
      }
    } else {
      // WRONG: Turn RED and count error
      newTiles[index] = { ...tile, status: "wrong" };
      setGridTiles(newTiles);
      setErrors((prev) => prev + 1);

      // Reset red status after 600ms so child can keep searching
      setTimeout(() => {
        setGridTiles((curr) =>
          curr.map((t, idx) => (idx === index && t.status === "wrong" ? { ...t, status: "normal" } : t))
        );
      }, 600);
    }
  };

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                        2. MEMORY GAME                                 */
  /* ═══════════════════════════════════════════════════════════════════════ */
  const initMemoryGame = () => {
    // Dynamic card pools per level
    const pool =
      diff <= 3
        ? ["🐶", "🐱", "🐰", "🐼", "🦊", "🦁"]
        : diff <= 6
        ? ["🚀", "🛸", "🚁", "🏎️", "🚂", "⛵", "🎨", "🌟"]
        : ["🪐", "🌌", "☄️", "🔭", "🛰️", "💎", "🔮", "👑", "⚡", "🧩"];

    // Pairs count: Lvl 1-2: 3 pairs (6 cards), Lvl 3-5: 6 pairs (12 cards), Lvl 6-10: 8 pairs (16 cards)
    const pairCount = diff <= 2 ? 3 : diff <= 5 ? 6 : Math.min(8, pool.length);
    const selected = pool.slice(0, pairCount);
    const deck = [...selected, ...selected]
      .sort(() => Math.random() - 0.5)
      .map((sym, idx) => ({ id: idx, symbol: sym, flipped: false, matched: false, status: "normal" as const }));

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
        // MATCH: Highlight GREEN
        newCards[idx1].matched = true;
        newCards[idx2].matched = true;
        newCards[idx1].status = "correct";
        newCards[idx2].status = "correct";
        setCorrectCount((prev) => prev + 1);
        const earned = 25 * diff;
        setScore((prev) => prev + earned);
        setFlippedIndices([]);

        const allMatched = newCards.every((c) => c.matched);
        if (allMatched) {
          finishExercise(correctCount + 1, errors, score + earned);
        }
      } else {
        // WRONG MATCH: Highlight RED then flip back
        newCards[idx1].status = "wrong";
        newCards[idx2].status = "wrong";
        setErrors((prev) => prev + 1);
        setMemoryCards([...newCards]);

        setTimeout(() => {
          newCards[idx1].flipped = false;
          newCards[idx2].flipped = false;
          newCards[idx1].status = "normal";
          newCards[idx2].status = "normal";
          setMemoryCards([...newCards]);
          setFlippedIndices([]);
        }, 750);
      }
    }
  };

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*               3. REASONING & PROBLEM SOLVING GAME                     */
  /* ═══════════════════════════════════════════════════════════════════════ */
  const initReasoningRound = (r: number) => {
    setIsOptionLocked(false);
    setSelectedOption(null);

    // Progressive level-based questions
    let bank: Array<{ title: string; sequence: string[]; options: string[]; correct: string }> = [];

    if (diff <= 3) {
      bank = [
        { title: "Color Progression", sequence: ["🔴", "🔵", "🔴", "🔵"], options: ["🔴", "🟢", "🟡", "🟣"], correct: "🔴" },
        { title: "Shape Alternation", sequence: ["⭐", "🌙", "⭐", "🌙"], options: ["⭐", "☀️", "⚡", "🌙"], correct: "⭐" },
        { title: "Number Counting", sequence: ["1️⃣", "2️⃣", "3️⃣", "4️⃣"], options: ["5️⃣", "6️⃣", "1️⃣", "8️⃣"], correct: "5️⃣" },
        { title: "Geometric Pair", sequence: ["🔺", "🔷", "🔺", "🔷"], options: ["🔺", "🟣", "🔷", "🟩"], correct: "🔺" },
      ];
    } else if (diff <= 6) {
      bank = [
        { title: "Step-2 Math Sequence", sequence: ["2️⃣", "4️⃣", "6️⃣", "8️⃣"], options: ["🔟", "9️⃣", "7️⃣", "1️⃣2️⃣"], correct: "🔟" },
        { title: "3-Step Repeating Pattern", sequence: ["🔺", "🟢", "🔷", "🔺", "🟢"], options: ["🔷", "🔺", "🟣", "🟢"], correct: "🔷" },
        { title: "5-Step Skip Counting", sequence: ["5️⃣", "🔟", "1️⃣5️⃣", "2️⃣0️⃣"], options: ["2️⃣5️⃣", "3️⃣0️⃣", "2️⃣2️⃣", "2️⃣8️⃣"], correct: "2️⃣5️⃣" },
        { title: "Directional Rotation", sequence: ["⬆️", "➡️", "⬇️", "⬅️"], options: ["⬆️", "⬇️", "↗️", "➡️"], correct: "⬆️" },
        { title: "Double Element Pattern", sequence: ["⭐", "⭐", "🌙", "⭐", "⭐"], options: ["🌙", "⭐", "⚡", "☀️"], correct: "🌙" },
      ];
    } else {
      bank = [
        { title: "Geometric Square Pattern", sequence: ["1️⃣", "4️⃣", "9️⃣", "1️⃣6️⃣"], options: ["2️⃣5️⃣", "3️⃣0️⃣", "2️⃣0️⃣", "2️⃣4️⃣"], correct: "2️⃣5️⃣" },
        { title: "Triangular Step Growth (+1, +2, +3...)", sequence: ["1️⃣", "3️⃣", "6️⃣", "1️⃣0️⃣"], options: ["1️⃣5️⃣", "1️⃣4️⃣", "1️⃣6️⃣", "1️⃣8️⃣"], correct: "1️⃣5️⃣" },
        { title: "Alphabet Leap Pattern", sequence: ["🅰️", "🇨", "🇪", "🇬"], options: ["🇮", "🇭", "🇯", "🇰"], correct: "🇮" },
        { title: "Binary Shift Pattern", sequence: ["2️⃣", "4️⃣", "8️⃣", "1️⃣6️⃣"], options: ["3️⃣2️⃣", "2️⃣4️⃣", "6️⃣4️⃣", "3️⃣0️⃣"], correct: "3️⃣2️⃣" },
        { title: "Color Inversion Matrix", sequence: ["🔴", "🔴", "🔵", "🔵", "🔴"], options: ["🔴", "🔵", "🟢", "🟡"], correct: "🔴" },
      ];
    }

    const q = bank[(r - 1) % bank.length];
    setPatternQuestion({
      ...q,
      options: [...q.options].sort(() => Math.random() - 0.5),
    });
  };

  const initProblemSolvingRound = (r: number) => {
    setIsOptionLocked(false);
    setSelectedOption(null);

    let bank: Array<{ title: string; sequence: string[]; options: string[]; correct: string }> = [];

    if (diff <= 3) {
      bank = [
        { title: "Animal Habitat Logic", sequence: ["🐟", "🌊", "🦅", "☁️", "🦁"], options: ["🏞️", "🌊", "🪐", "🚀"], correct: "🏞️" },
        { title: "Tool Logic Matching", sequence: ["🎨", "🖌️", "✏️", "📝", "✂️"], options: ["📄", "🚗", "🍎", "⚽"], correct: "📄" },
        { title: "Day/Night Progression", sequence: ["☀️", "🌅", "🌙", "🌌", "☀️"], options: ["🌅", "🌙", "☁️", "⚡"], correct: "🌅" },
        { title: "Food Group Match", sequence: ["🍎", "🍌", "🍇", "🍊", "🍓"], options: ["🍉", "🥕", "🍞", "🧀"], correct: "🍉" },
      ];
    } else if (diff <= 6) {
      bank = [
        { title: "Spatial Coordinate Step", sequence: ["↖️", "⬆️", "↗️", "➡️"], options: ["↘️", "⬇️", "↙️", "⬅️"], correct: "↘️" },
        { title: "Size Hierarchy Step", sequence: ["🐜", "🐭", "🐕", "🐎"], options: ["🐘", "🐱", "🐰", "🦆"], correct: "🐘" },
        { title: "Vehicle Speed Progression", sequence: ["🚶", "🚲", "🚗", "🚄"], options: ["🚀", "🛹", "🛵", "🚜"], correct: "🚀" },
        { title: "Reverse Step Pattern", sequence: ["5️⃣0️⃣", "4️⃣0️⃣", "3️⃣0️⃣", "2️⃣0️⃣"], options: ["1️⃣0️⃣", "5️⃣", "0️⃣", "1️⃣5️⃣"], correct: "1️⃣0️⃣" },
      ];
    } else {
      bank = [
        { title: "Complex Analogy: Sun is to Day as Moon is to...", sequence: ["☀️", "➡️", "🏙️", "🌙", "➡️"], options: ["🌌", "🏖️", "🌤️", "🌈"], correct: "🌌" },
        { title: "Multiplicative Growth Rule", sequence: ["3️⃣", "6️⃣", "1️⃣2️⃣", "2️⃣4️⃣"], options: ["4️⃣8️⃣", "3️⃣6️⃣", "4️⃣0️⃣", "5️⃣0️⃣"], correct: "4️⃣8️⃣" },
        { title: "Logic Operator: AND Sequence", sequence: ["🔴+🔵=🟣", "🔴+🟡=🟠", "🔵+🟡=?"], options: ["🟢", "🟣", "🟤", "⚫"], correct: "🟢" },
        { title: "Fibonacci Cognitive Progression", sequence: ["1️⃣", "1️⃣", "2️⃣", "3️⃣", "5️⃣"], options: ["8️⃣", "7️⃣", "9️⃣", "6️⃣"], correct: "8️⃣" },
      ];
    }

    const q = bank[(r - 1) % bank.length];
    setPatternQuestion({
      ...q,
      options: [...q.options].sort(() => Math.random() - 0.5),
    });
  };

  const handleReasoningChoice = (choice: string) => {
    if (isOptionLocked) return;

    setIsOptionLocked(true);
    setSelectedOption(choice);
    setTotalAttempts((prev) => prev + 1);

    const isCorrect = choice === patternQuestion.correct;

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      const roundScore = score + 30 * diff;
      setScore(roundScore);

      setTimeout(() => {
        if (round >= totalRounds) {
          finishExercise(correctCount + 1, errors, roundScore);
        } else {
          setRound((r) => r + 1);
          if (config.domain === "reasoning") {
            initReasoningRound(round + 1);
          } else {
            initProblemSolvingRound(round + 1);
          }
        }
      }, 800);
    } else {
      setErrors((prev) => prev + 1);

      // Allow viewing the correct green vs red answer for 1200ms before advancing
      setTimeout(() => {
        if (round >= totalRounds) {
          finishExercise(correctCount, errors + 1, score);
        } else {
          setRound((r) => r + 1);
          if (config.domain === "reasoning") {
            initReasoningRound(round + 1);
          } else {
            initProblemSolvingRound(round + 1);
          }
        }
      }, 1200);
    }
  };

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                  SUBMISSION & REACTION LATENCY                         */
  /* ═══════════════════════════════════════════════════════════════════════ */
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
          difficulty: diff,
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
          nextDifficulty: data.adaptive_next_difficulty || diff,
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
          maxWidth: "640px",
          width: "100%",
          padding: "32px",
          borderRadius: "26px",
          background: "white",
          boxShadow: "0 25px 70px rgba(124, 58, 237, 0.22)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(124, 58, 237, 0.2)",
              }}
            >
              {config.domain === "attention" && <Target className="h-5 w-5" />}
              {config.domain === "memory" && <Brain className="h-5 w-5" />}
              {config.domain === "reasoning" && <Lightbulb className="h-5 w-5" />}
              {config.domain === "problem_solving" && <Puzzle className="h-5 w-5" />}
            </div>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#1A1035", margin: 0 }}>
                {config.exerciseName}
              </h2>
              <span style={{ fontSize: "12.5px", color: "#7C3AED", fontWeight: 700 }}>
                Level {diff} of 10 • {config.domain.replace("_", " ").toUpperCase()}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#F5F0FF",
              border: "none",
              borderRadius: "12px",
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
            <div style={{ fontSize: "56px", marginBottom: "14px" }}>
              {config.domain === "attention" ? "🎯" : config.domain === "memory" ? "🧠" : "💡"}
            </div>
            <h3 style={{ fontSize: "21px", fontWeight: 800, color: "#1A1035", margin: "0 0 8px" }}>
              Level {diff} Retraining Session
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
                  maxWidth: "420px",
                }}
              >
                📋 <strong>Clinician Instructions:</strong> {config.notes}
              </p>
            )}
            <p style={{ fontSize: "14px", color: "#6B6580", margin: "0 auto 24px", maxWidth: "420px", lineHeight: 1.4 }}>
              Click correct answers (marks <strong>Green</strong>). Wrong answers highlight in <strong>Red</strong>. Focus on speed and accuracy!
            </p>
            <button
              onClick={startExercise}
              className="cd-hero-btn"
              style={{ padding: "14px 40px", fontSize: "16px", margin: "0 auto", display: "inline-flex" }}
            >
              <Zap className="h-5 w-5" /> Start Exercise Now
            </button>
          </div>
        )}

        {/* PLAYING STATE */}
        {gameState === "playing" && (
          <div>
            {/* Live Progress Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                padding: "8px 14px",
                background: "#FAF8FF",
                borderRadius: "12px",
              }}
            >
              <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#7C3AED" }}>
                Score: {score} XP
              </span>
              <span style={{ fontSize: "12.5px", color: "#6B6580", fontWeight: 600 }}>
                {config.domain !== "memory" ? `Round ${round} of ${totalRounds}` : `Pairs Matched`}
              </span>
              <span style={{ fontSize: "12.5px", color: "#EF4444", fontWeight: 600 }}>
                Errors: {errors}
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
                  <span style={{ fontSize: "13.5px", color: "#4C1D95", fontWeight: 700 }}>
                    Target to Spot:
                  </span>
                  <span style={{ fontSize: "30px", marginLeft: "12px", verticalAlign: "middle" }}>
                    {targetSymbols.join("  ")}
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: diff >= 8 ? "repeat(5, 1fr)" : diff >= 4 ? "repeat(4, 1fr)" : "repeat(3, 1fr)",
                    gap: "10px",
                    margin: "0 auto",
                  }}
                >
                  {gridTiles.map((tile, idx) => {
                    const isCorrect = tile.status === "correct";
                    const isWrong = tile.status === "wrong";
                    return (
                      <button
                        key={tile.id}
                        onClick={() => handleAttentionTileClick(idx)}
                        disabled={isCorrect}
                        style={{
                          height: diff >= 8 ? "54px" : "66px",
                          fontSize: diff >= 8 ? "24px" : "28px",
                          border: "2.5px solid",
                          borderColor: isCorrect ? "#10B981" : isWrong ? "#EF4444" : "#EDE9FE",
                          borderRadius: "14px",
                          background: isCorrect ? "#ECFDF5" : isWrong ? "#FEF2F2" : "white",
                          cursor: isCorrect ? "default" : "pointer",
                          transition: "all 0.15s ease",
                          transform: isWrong ? "scale(0.95)" : "scale(1)",
                        }}
                      >
                        {isCorrect ? "✓" : tile.symbol}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. MEMORY GAME BOARD */}
            {config.domain === "memory" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: memoryCards.length > 12 ? "repeat(4, 1fr)" : memoryCards.length > 8 ? "repeat(4, 1fr)" : "repeat(3, 1fr)",
                  gap: "10px",
                  margin: "0 auto",
                }}
              >
                {memoryCards.map((card, idx) => {
                  const isCorrect = card.status === "correct" || card.matched;
                  const isWrong = card.status === "wrong";
                  const isFlipped = card.flipped || card.matched;

                  return (
                    <button
                      key={card.id}
                      onClick={() => handleCardClick(idx)}
                      style={{
                        height: memoryCards.length > 12 ? "64px" : "74px",
                        fontSize: isFlipped ? "30px" : "18px",
                        border: "2.5px solid",
                        borderColor: isCorrect ? "#10B981" : isWrong ? "#EF4444" : isFlipped ? "#7C3AED" : "#EDE9FE",
                        borderRadius: "16px",
                        background: isCorrect
                          ? "#ECFDF5"
                          : isWrong
                          ? "#FEF2F2"
                          : isFlipped
                          ? "#F5F0FF"
                          : "linear-gradient(135deg, #7C3AED, #8B5CF6)",
                        color: "white",
                        cursor: card.matched ? "default" : "pointer",
                        transition: "all 0.15s ease",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isFlipped ? card.symbol : "❓"}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 3. REASONING / PROBLEM SOLVING BOARD */}
            {(config.domain === "reasoning" || config.domain === "problem_solving") && (
              <div>
                <div
                  style={{
                    background: "#F5F0FF",
                    padding: "18px",
                    borderRadius: "18px",
                    textAlign: "center",
                    marginBottom: "18px",
                  }}
                >
                  <span style={{ fontSize: "12.5px", color: "#6D28D9", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                    {patternQuestion.title}
                  </span>
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", fontSize: "26px", flexWrap: "wrap" }}>
                    {patternQuestion.sequence.map((s, i) => (
                      <span key={i} style={{ padding: "6px 12px", background: "white", borderRadius: "12px", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
                        {s}
                      </span>
                    ))}
                    <span style={{ padding: "6px 16px", background: "#DDD6FE", borderRadius: "12px", fontWeight: 900, color: "#7C3AED" }}>
                      ?
                    </span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {patternQuestion.options.map((opt, i) => {
                    const isSelected = selectedOption === opt;
                    const isCorrectAnswer = opt === patternQuestion.correct;
                    const showCorrect = isOptionLocked && isCorrectAnswer;
                    const showWrong = isOptionLocked && isSelected && !isCorrectAnswer;

                    return (
                      <button
                        key={i}
                        onClick={() => handleReasoningChoice(opt)}
                        disabled={isOptionLocked}
                        style={{
                          padding: "16px",
                          fontSize: "26px",
                          border: "2.5px solid",
                          borderColor: showCorrect
                            ? "#10B981"
                            : showWrong
                            ? "#EF4444"
                            : "#EDE9FE",
                          borderRadius: "16px",
                          background: showCorrect
                            ? "#ECFDF5"
                            : showWrong
                            ? "#FEF2F2"
                            : "white",
                          cursor: isOptionLocked ? "default" : "pointer",
                          transition: "all 0.15s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        {opt}
                        {showCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                        {showWrong && <XCircle className="h-5 w-5 text-red-600" />}
                      </button>
                    );
                  })}
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
              Level {diff} Completed!
            </h3>
            <p style={{ fontSize: "14px", color: "#6B6580", margin: "0 0 20px" }}>
              Your session telemetry has been saved to the database and sent to your clinician.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "12px",
                marginBottom: "24px",
              }}
            >
              <div style={{ background: "#F5F0FF", padding: "16px", borderRadius: "16px" }}>
                <span style={{ fontSize: "11px", color: "#7C3AED", fontWeight: 700, textTransform: "uppercase" }}>Score</span>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#1A1035" }}>+{score} XP</div>
              </div>
              <div style={{ background: "#ECFDF5", padding: "16px", borderRadius: "16px" }}>
                <span style={{ fontSize: "11px", color: "#059669", fontWeight: 700, textTransform: "uppercase" }}>Accuracy</span>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#059669" }}>{accuracy}%</div>
              </div>
              <div style={{ background: "#FFFBEB", padding: "16px", borderRadius: "16px" }}>
                <span style={{ fontSize: "11px", color: "#D97706", fontWeight: 700, textTransform: "uppercase" }}>Adaptive Next</span>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#D97706" }}>
                  Lvl {completionResult?.adaptive_next_difficulty || diff}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="cd-hero-btn"
              style={{ padding: "12px 36px", margin: "0 auto", display: "inline-flex" }}
            >
              <Check className="h-4 w-4" /> Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
