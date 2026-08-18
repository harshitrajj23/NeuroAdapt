'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X, Trophy, Sparkles, RotateCcw, Star, CheckCircle2, Play } from 'lucide-react';

interface CardItem {
  id: number;
  symbol: string;
  label: string;
  color: string;
}

const CARD_DATA = [
  { symbol: '🧠', label: 'Brain', color: 'from-pink-500 to-rose-500' },
  { symbol: '🌟', label: 'Star', color: 'from-amber-400 to-yellow-500' },
  { symbol: '🚀', label: 'Rocket', color: 'from-blue-500 to-indigo-500' },
  { symbol: '🎨', label: 'Palette', color: 'from-purple-500 to-violet-600' },
];

interface MemoryGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReward: (starsEarned: number) => void;
  soundEnabled?: boolean;
}

export default function MemoryGameModal({
  isOpen,
  onClose,
  onReward,
  soundEnabled = true,
}: MemoryGameModalProps) {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  // Play synthesized joyful sound effect using Web Audio API
  const playSound = (type: 'flip' | 'match' | 'win') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'flip') {
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'match') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'win') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24);
        osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.36); // C6
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch {
      // Audio context might be restricted
    }
  };

  const startNewGame = () => {
    // 4 cards (2 pairs: Brain & Star) for quick snappy child cognitive play
    const pair1 = CARD_DATA[0];
    const pair2 = CARD_DATA[1];
    const deck = [
      { id: 1, ...pair1 },
      { id: 2, ...pair1 },
      { id: 3, ...pair2 },
      { id: 4, ...pair2 },
    ].sort(() => Math.random() - 0.5);

    setCards(deck);
    setFlippedIndices([]);
    setMatchedPairs([]);
    setMoves(0);
    setIsWon(false);
    setRewardClaimed(false);
  };

  useEffect(() => {
    if (isOpen) {
      startNewGame();
    }
  }, [isOpen]);

  const handleCardClick = (index: number) => {
    if (
      flippedIndices.length === 2 ||
      flippedIndices.includes(index) ||
      matchedPairs.includes(cards[index].label) ||
      isWon
    ) {
      return;
    }

    playSound('flip');
    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((prev) => prev + 1);
      const [firstIndex, secondIndex] = newFlipped;
      const firstCard = cards[firstIndex];
      const secondCard = cards[secondIndex];

      if (firstCard.label === secondCard.label) {
        playSound('match');
        const newMatched = [...matchedPairs, firstCard.label];
        setMatchedPairs(newMatched);
        setFlippedIndices([]);

        // Total 2 pairs (4 cards)
        if (newMatched.length === 2) {
          setIsWon(true);
          playSound('win');
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
            });
          } catch {
            // ignore if confetti unavailable
          }
        }
      } else {
        setTimeout(() => {
          setFlippedIndices([]);
        }, 850);
      }
    }
  };

  const handleClaimReward = () => {
    if (!rewardClaimed) {
      setRewardClaimed(true);
      onReward(20);
      playSound('win');
      try {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.5 },
        });
      } catch {
        // ignore
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-violet-100 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-500 text-white shadow-md shadow-violet-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Memory Match Mini-Game</h3>
              <p className="text-xs text-slate-500 font-medium">Find matching pairs to earn stars!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stats bar */}
        <div className="my-4 flex items-center justify-between rounded-2xl bg-violet-50/80 px-4 py-2.5 border border-violet-100/80">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-700">
            <span>Pairs Found:</span>
            <span className="rounded-md bg-white px-2 py-0.5 text-violet-900 shadow-xs border border-violet-200">
              {matchedPairs.length} / 2
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-700">
            <span>Moves:</span>
            <span className="rounded-md bg-white px-2 py-0.5 text-violet-900 shadow-xs border border-violet-200">
              {moves}
            </span>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 gap-3.5 my-5">
          {cards.map((card, idx) => {
            const isFlipped = flippedIndices.includes(idx) || matchedPairs.includes(card.label);
            const isMatched = matchedPairs.includes(card.label);

            return (
              <button
                key={`${card.id}-${idx}`}
                type="button"
                onClick={() => handleCardClick(idx)}
                className={`relative flex h-28 w-full items-center justify-center rounded-2xl text-3xl font-bold transition-all duration-300 transform select-none ${
                  isFlipped
                    ? isMatched
                      ? 'bg-emerald-50 border-2 border-emerald-400 text-emerald-600 shadow-md shadow-emerald-500/10'
                      : 'bg-white border-2 border-violet-500 shadow-lg shadow-violet-500/15'
                    : 'bg-gradient-to-br from-violet-500 to-indigo-600 border-2 border-violet-400 text-white shadow-md hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {isFlipped ? (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-3xl animate-in zoom-in-50 duration-200">{card.symbol}</span>
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      {card.label}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="text-2xl opacity-80">❓</span>
                    <span className="text-[10px] font-semibold text-violet-100 mt-1">TAP ME</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Win Banner & Actions */}
        {isWon ? (
          <div className="mt-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-violet-500/10 p-4 text-center border border-amber-300/40">
            <div className="flex items-center justify-center gap-1.5 text-amber-600 font-bold mb-1">
              <Trophy className="h-5 w-5 fill-amber-400 text-amber-500" />
              <span>Challenge Complete!</span>
            </div>
            <p className="text-xs text-slate-600 font-medium mb-3">
              Great memory! You completed it in {moves} moves.
            </p>

            {rewardClaimed ? (
              <div className="flex flex-col sm:flex-row items-center gap-2 justify-center">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3.5 py-2 rounded-xl">
                  <CheckCircle2 className="h-4 w-4" />
                  +20 Stars Added to Balance!
                </div>
                <button
                  type="button"
                  onClick={startNewGame}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 transition-colors shadow-sm"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Play Again
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-2 justify-center">
                <button
                  type="button"
                  onClick={handleClaimReward}
                  className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-amber-500/30 hover:brightness-105 transition-all animate-bounce"
                >
                  <Star className="h-4 w-4 fill-white" />
                  Claim +20 Stars
                </button>
                <button
                  type="button"
                  onClick={startNewGame}
                  className="flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restart
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="flex items-center gap-1">
              <Play className="h-3.5 w-3.5 text-violet-500 fill-violet-500" />
              Flip 2 cards to find matching pairs
            </span>
            <button
              type="button"
              onClick={startNewGame}
              className="flex items-center gap-1 text-violet-600 hover:text-violet-800 font-semibold"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
