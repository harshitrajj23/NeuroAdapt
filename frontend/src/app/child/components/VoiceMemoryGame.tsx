"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  Brain,
  Sparkles,
  Trophy,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Zap,
  ArrowRight,
  Clock,
  X,
  Radio,
  Loader2,
} from "lucide-react";
import { ExercisePlayConfig } from "./InteractiveExerciseGame";

interface VoiceMemoryGameProps {
  config: ExercisePlayConfig;
  childId: number;
  apiUrl: string;
  onClose: () => void;
  onComplete: () => void;
}

interface WordItem {
  id: number;
  word: string;
  icon: string;
  category: string;
}

// Multi-Level Curated Word Banks
const WORD_POOLS: Record<number, WordItem[]> = {
  1: [
    { id: 1, word: "apple", icon: "🍎", category: "Fruit" },
    { id: 2, word: "cat", icon: "🐱", category: "Animal" },
    { id: 3, word: "car", icon: "🚗", category: "Vehicle" },
  ],
  2: [
    { id: 1, word: "apple", icon: "🍎", category: "Fruit" },
    { id: 2, word: "dog", icon: "🐶", category: "Animal" },
    { id: 3, word: "sun", icon: "☀️", category: "Nature" },
    { id: 4, word: "balloon", icon: "🎈", category: "Toy" },
  ],
  3: [
    { id: 1, word: "apple", icon: "🍎", category: "Fruit" },
    { id: 2, word: "train", icon: "🚂", category: "Vehicle" },
    { id: 3, word: "tiger", icon: "🐯", category: "Animal" },
    { id: 4, word: "moon", icon: "🌙", category: "Space" },
    { id: 5, word: "bicycle", icon: "🚲", category: "Vehicle" },
  ],
  4: [
    { id: 1, word: "apple", icon: "🍎", category: "Fruit" },
    { id: 2, word: "train", icon: "🚂", category: "Vehicle" },
    { id: 3, word: "tiger", icon: "🐯", category: "Animal" },
    { id: 4, word: "moon", icon: "🌙", category: "Space" },
    { id: 5, word: "bicycle", icon: "🚲", category: "Vehicle" },
    { id: 6, word: "guitar", icon: "🎸", category: "Music" },
  ],
  5: [
    { id: 1, word: "apple", icon: "🍎", category: "Fruit" },
    { id: 2, word: "train", icon: "🚂", category: "Vehicle" },
    { id: 3, word: "tiger", icon: "🐯", category: "Animal" },
    { id: 4, word: "moon", icon: "🌙", category: "Space" },
    { id: 5, word: "bicycle", icon: "🚲", category: "Vehicle" },
    { id: 6, word: "guitar", icon: "🎸", category: "Music" },
    { id: 7, word: "rocket", icon: "🚀", category: "Space" },
  ],
  6: [
    { id: 1, word: "apple", icon: "🍎", category: "Fruit" },
    { id: 2, word: "train", icon: "🚂", category: "Vehicle" },
    { id: 3, word: "tiger", icon: "🐯", category: "Animal" },
    { id: 4, word: "moon", icon: "🌙", category: "Space" },
    { id: 5, word: "bicycle", icon: "🚲", category: "Vehicle" },
    { id: 6, word: "guitar", icon: "🎸", category: "Music" },
    { id: 7, word: "rocket", icon: "🚀", category: "Space" },
    { id: 8, word: "dolphin", icon: "🐬", category: "Animal" },
  ],
};

// Lightweight PCM WAV Encoder
function encodeWAV(samples: Float32Array, sampleRate = 16000): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate (16000 * 2)
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // 16-bit
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: "audio/wav" });
}

export default function VoiceMemoryGame({
  config,
  childId,
  apiUrl,
  onClose,
  onComplete,
}: VoiceMemoryGameProps) {
  const [currentDiff, setCurrentDiff] = useState<number>(Math.max(1, Math.min(6, config.difficulty || 3)));
  const diff = currentDiff;
  const targetWords: WordItem[] = WORD_POOLS[diff] || WORD_POOLS[3];

  const [phase, setPhase] = useState<"ready" | "study" | "recall" | "results">("ready");
  const [currentSpeakingIndex, setCurrentSpeakingIndex] = useState<number | null>(null);
  const [studyCountdown, setStudyCountdown] = useState<number>(6);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const [manualText, setManualText] = useState<string>("");
  const [audioVolume, setAudioVolume] = useState<number>(0);
  const [recalledWords, setRecalledWords] = useState<string[]>([]);
  const [missedWords, setMissedWords] = useState<string[]>([]);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [xpEarned, setXpEarned] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [nextLevelRec, setNextLevelRec] = useState<number>(diff);

  const shouldListenRef = useRef<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedSamplesRef = useRef<Float32Array[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const lastTranscribeTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // Initialize Speech Recognition (Client Web Speech API)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-US";

          recognition.onresult = (event: any) => {
            let currentTranscript = "";
            for (let i = 0; i < event.results.length; i++) {
              currentTranscript += event.results[i][0].transcript + " ";
            }
            const cleanText = currentTranscript.trim();
            if (cleanText) {
              setLiveTranscript(cleanText);
              setManualText((prev) => {
                const combined = `${prev} ${cleanText}`.trim();
                return Array.from(new Set(combined.split(/\s+/))).join(" ");
              });
            }
          };

          recognition.onerror = () => {
            // Non-fatal, server-side transcribe handles audio buffers
          };

          recognition.onend = () => {
            if (shouldListenRef.current) {
              setTimeout(() => {
                try {
                  if (shouldListenRef.current) recognition.start();
                } catch {}
              }, 300);
            }
          };

          recognitionRef.current = recognition;
        } catch {}
      }
    }

    return () => {
      cleanupAudio();
    };
  }, []);

  const cleanupAudio = () => {
    shouldListenRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  // Perform server-side audio transcription via /api/voice/transcribe
  const sendAudioForTranscription = async () => {
    if (recordedSamplesRef.current.length === 0 || isTranscribing) return;

    // Flatten collected Float32 audio samples
    const totalLength = recordedSamplesRef.current.reduce((acc, curr) => acc + curr.length, 0);
    if (totalLength < 8000) return; // Ignore less than 0.5s of audio

    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of recordedSamplesRef.current) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    // Downsample to 16000Hz WAV
    const wavBlob = encodeWAV(merged, 16000);
    setIsTranscribing(true);

    try {
      const formData = new FormData();
      formData.append("file", wavBlob, "recording.wav");

      const res = await fetch(`${apiUrl}/api/voice/transcribe`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.transcript && data.transcript.trim()) {
          const spoken = data.transcript.trim();
          setLiveTranscript((prev) => {
            const newWords = spoken.split(/\s+/);
            const existingWords = prev ? prev.trim().split(/\s+/) : [];
            return Array.from(new Set([...existingWords, ...newWords])).join(" ");
          });
          setManualText((prev) => {
            const newWords = spoken.split(/\s+/);
            const existingWords = prev ? prev.trim().split(/\s+/) : [];
            return Array.from(new Set([...existingWords, ...newWords])).join(" ");
          });
        }
      }
    } catch (err) {
      console.warn("Backend audio transcription notice:", err);
    } finally {
      setIsTranscribing(false);
    }
  };

  // Real Hardware Microphone Stream & High-Accuracy WAV Buffer Collector
  const startHardwareAudioStream = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        mediaStreamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx({ sampleRate: 16000 });
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);

          // Analyser for sound wave visualizer
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);

          // ScriptProcessor for PCM audio recording
          const processor = audioCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;
          recordedSamplesRef.current = [];

          processor.onaudioprocess = (e) => {
            if (!shouldListenRef.current) return;
            const channel = e.inputBuffer.getChannelData(0);
            recordedSamplesRef.current.push(new Float32Array(channel));

            // Auto-transcribe chunk every 3.5s of continuous speech
            const now = Date.now();
            if (now - lastTranscribeTimeRef.current > 3500 && recordedSamplesRef.current.length > 10) {
              lastTranscribeTimeRef.current = now;
              sendAudioForTranscription();
            }
          };

          source.connect(processor);
          processor.connect(audioCtx.destination);

          // Animate live volume visualizer
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const checkVolume = () => {
            if (!shouldListenRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioVolume(Math.min(100, Math.round(avg * 1.8)));
            animFrameRef.current = requestAnimationFrame(checkVolume);
          };
          checkVolume();
        }
      }
    } catch (err) {
      console.warn("Microphone access notice:", err);
    }
  };

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Reliable Cross-Browser Speech Player (HTML5 Audio + Server MP3 TTS stream)
  const speakText = (text: string, _rate?: number): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !text || !text.trim()) {
        resolve();
        return;
      }

      const cleanText = text.trim();

      try {
        if (activeAudioRef.current) {
          activeAudioRef.current.pause();
          activeAudioRef.current = null;
        }
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      } catch {}

      let isDone = false;
      const finish = () => {
        if (!isDone) {
          isDone = true;
          activeAudioRef.current = null;
          resolve();
        }
      };

      const words = cleanText.split(/\s+/).length;
      const maxMs = Math.max(1400, Math.min(8000, words * 400 + 1000));
      const timer = setTimeout(finish, maxMs);

      try {
        const audioUrl = `${apiUrl}/api/voice/tts?text=${encodeURIComponent(cleanText)}`;
        const audio = new Audio(audioUrl);
        activeAudioRef.current = audio;

        audio.onended = () => {
          clearTimeout(timer);
          finish();
        };

        audio.onerror = () => {
          try {
            if (window.speechSynthesis) {
              window.speechSynthesis.resume();
              const utterance = new SpeechSynthesisUtterance(cleanText);
              utterance.onend = () => {
                clearTimeout(timer);
                finish();
              };
              utterance.onerror = () => {
                clearTimeout(timer);
                finish();
              };
              window.speechSynthesis.speak(utterance);
              return;
            }
          } catch {}
          clearTimeout(timer);
          finish();
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("Audio playback notice:", err);
            clearTimeout(timer);
            finish();
          });
        }
      } catch (err) {
        clearTimeout(timer);
        finish();
      }
    });
  };

  // Phase 1: Start Study Phase (Speak words sequentially)
  const startStudyPhase = async () => {
    setPhase("study");
    setCurrentSpeakingIndex(null);
    startTimeRef.current = Date.now();

    // Intro narration
    await speakText(`Listen carefully and remember these ${targetWords.length} words.`);

    // Sequentially speak each word and highlight card
    for (let i = 0; i < targetWords.length; i++) {
      setCurrentSpeakingIndex(i);
      await speakText(targetWords[i].word, 0.8);
      await new Promise((r) => setTimeout(r, 450));
    }
    setCurrentSpeakingIndex(null);

    // Study countdown timer
    let count = 5;
    setStudyCountdown(count);
    const timer = setInterval(() => {
      count -= 1;
      setStudyCountdown(count);
      if (count <= 0) {
        clearInterval(timer);
        startRecallPhase();
      }
    }, 1000);
  };

  // Phase 2: Start Recall Phase (Listen to child's voice)
  const startRecallPhase = async () => {
    setPhase("recall");
    setLiveTranscript("");
    setManualText("");

    await speakText("Tell me everything you remember.");

    // Enable continuous listening & hardware audio capture
    startListeningEngine();
  };

  const startListeningEngine = async () => {
    shouldListenRef.current = true;
    setIsListening(true);
    lastTranscribeTimeRef.current = Date.now();
    await startHardwareAudioStream();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch {}
    }
  };

  const stopListeningEngine = async () => {
    shouldListenRef.current = false;
    setIsListening(false);
    setAudioVolume(0);

    // Finalize pending audio chunk transcription
    await sendAudioForTranscription();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListeningEngine();
    } else {
      startListeningEngine();
    }
  };

  // Quick word chip click helper
  const handleAddWordChip = (word: string) => {
    setManualText((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return word;
      if (trimmed.toLowerCase().includes(word.toLowerCase())) return trimmed;
      return `${trimmed} ${word}`;
    });
  };

  // Phase 3: Evaluate Recall & Submit Session
  const evaluateAndSubmit = async () => {
    await stopListeningEngine();
    const elapsedMs = Math.max(2000, Date.now() - startTimeRef.current);

    // Combine voice transcript + manual input
    const fullSpokenText = `${liveTranscript} ${manualText}`.toLowerCase();

    // Tokenize & normalize
    const cleanTokens = fullSpokenText
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .map((t) => t.trim().toLowerCase());

    const matched: string[] = [];
    const missed: string[] = [];

    targetWords.forEach((item) => {
      const target = item.word.toLowerCase();
      // Match exact token, plural, or substring
      const isFound = cleanTokens.some(
        (token) =>
          token === target ||
          token === `${target}s` ||
          token === `${target}es` ||
          (target.length > 4 && token.includes(target))
      );

      if (isFound) {
        matched.push(item.word);
      } else {
        missed.push(item.word);
      }
    });

    const recallCount = matched.length;
    const totalCount = targetWords.length;
    const calcAccuracy = Math.round((recallCount / totalCount) * 100);
    const earnedXp = recallCount * 35 + diff * 20;
    const calculatedErrors = missed.length;

    setRecalledWords(matched);
    setMissedWords(missed);
    setAccuracy(calcAccuracy);
    setXpEarned(earnedXp);

    // Adaptive difficulty calculation
    let nextDiff = diff;
    if (calcAccuracy >= 80) nextDiff = Math.min(10, diff + 1);
    else if (calcAccuracy < 60) nextDiff = Math.max(1, diff - 1);
    setNextLevelRec(nextDiff);

    setPhase("results");
    setSubmitting(true);

    // Persist real telemetry to PostgreSQL
    try {
      await fetch(`${apiUrl}/api/sessions/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_id: childId,
          exercise_id: config.exerciseId || 7,
          domain: "memory",
          difficulty: diff,
          accuracy: calcAccuracy,
          response_time_ms: elapsedMs,
          score: earnedXp,
          errors: calculatedErrors,
          assignment_id: config.assignmentId || null,
        }),
      });
    } catch (err) {
      console.error("Error logging voice session:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cd-modal-backdrop" style={{ zIndex: 9999 }}>
      <div
        className="cd-modal-card"
        style={{
          maxWidth: "680px",
          width: "100%",
          padding: "32px",
          borderRadius: "28px",
          background: "white",
          boxShadow: "0 25px 75px rgba(124, 58, 237, 0.25)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 6px 16px rgba(124, 58, 237, 0.25)",
              }}
            >
              <Mic className="h-6 w-6" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#1A1035", margin: 0 }}>
                  Voice Memory Challenge
                </h2>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "12px",
                    background: "#EDE9FE",
                    color: "#6D28D9",
                  }}
                >
                  Level {diff} • {targetWords.length} Words
                </span>
              </div>
              <p style={{ fontSize: "12.5px", color: "#6B6580", margin: "2px 0 0" }}>
                Verbal Working Memory & Auditory Retention Retraining
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              cleanupAudio();
              onClose();
            }}
            className="cd-modal-close-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* 1. READY STATE                                                   */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {phase === "ready" && (
          <div style={{ textAlign: "center", padding: "24px 12px" }}>
            <div
              style={{
                width: "84px",
                height: "84px",
                borderRadius: "26px",
                background: "linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)",
                color: "#7C3AED",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px",
                boxShadow: "0 8px 24px rgba(124, 58, 237, 0.15)",
              }}
            >
              <Brain className="h-10 w-10" strokeWidth={2} />
            </div>
            <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#1A1035", marginBottom: "8px" }}>
              Listen Carefully & Recall
            </h3>
            <p style={{ fontSize: "14.5px", color: "#6B6580", maxWidth: "440px", margin: "0 auto 24px", lineHeight: "1.5" }}>
              I will speak <strong>{targetWords.length} words</strong> aloud. Listen closely, keep them in your working memory, and speak them back when prompted!
            </p>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 20px",
                background: "#F5F3FF",
                borderRadius: "14px",
                marginBottom: "28px",
                color: "#6D28D9",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              <Volume2 className="h-4 w-4" /> Dual Client + Server Speech Recognition Ready
            </div>

            <div>
              <button
                onClick={startStudyPhase}
                className="cd-btn cd-btn--primary"
                style={{
                  padding: "14px 36px",
                  fontSize: "16px",
                  fontWeight: 700,
                  borderRadius: "16px",
                  boxShadow: "0 8px 24px rgba(124, 58, 237, 0.3)",
                }}
              >
                Start Memory Challenge <ArrowRight className="h-5 w-5 ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* 2. STUDY / LISTENING PHASE                                       */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {phase === "study" && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "16px" }}>
              <Volume2 className="h-5 w-5 text-violet-600 animate-pulse" />
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#1A1035" }}>
                Listen carefully and remember these {targetWords.length} words:
              </span>
            </div>

            {/* Word Display Cards */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "14px",
                justifyContent: "center",
                margin: "24px 0 28px",
              }}
            >
              {targetWords.map((item, idx) => {
                const isCurrentlySpoken = currentSpeakingIndex === idx;
                return (
                  <div
                    key={item.id}
                    style={{
                      padding: "16px 20px",
                      borderRadius: "20px",
                      background: isCurrentlySpoken ? "linear-gradient(135deg, #7C3AED, #A78BFA)" : "#F5F3FF",
                      color: isCurrentlySpoken ? "white" : "#1A1035",
                      border: isCurrentlySpoken ? "2px solid #6D28D9" : "2px solid #EDE9FE",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                      minWidth: "105px",
                      transform: isCurrentlySpoken ? "scale(1.08)" : "scale(1)",
                      boxShadow: isCurrentlySpoken ? "0 10px 25px rgba(124, 58, 237, 0.3)" : "0 2px 8px rgba(0,0,0,0.03)",
                      transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  >
                    <span style={{ fontSize: "36px" }}>{item.icon}</span>
                    <span style={{ fontSize: "15px", fontWeight: 800, textTransform: "capitalize" }}>
                      {item.word}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Countdown / Advance */}
            <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <div style={{ fontSize: "13px", color: "#6B6580" }}>
                Memory study window closes in: <strong style={{ color: "#7C3AED", fontSize: "16px" }}>{studyCountdown}s</strong>
              </div>
              <button
                onClick={startRecallPhase}
                className="cd-btn"
                style={{
                  background: "#FAF8FF",
                  border: "1px solid #DDD6FE",
                  color: "#6D28D9",
                  padding: "8px 20px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                I&apos;m Ready to Recall Now
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* 3. RECALL / VOICE CAPTURE PHASE                                  */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {phase === "recall" && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ marginBottom: "16px" }}>
              <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#1A1035", marginBottom: "4px" }}>
                🎙️ Tell me everything you remember!
              </h3>
              <p style={{ fontSize: "13.5px", color: "#6B6580", margin: 0 }}>
                Speak clearly into your microphone, tap word badges, or type below.
              </p>
            </div>

            {/* Glowing Microphone Button & Live Audio Waveform */}
            <div style={{ position: "relative", display: "inline-flex", flexDirection: "column", alignItems: "center", margin: "12px 0 16px" }}>
              <button
                onClick={toggleListening}
                style={{
                  width: "88px",
                  height: "88px",
                  borderRadius: "50%",
                  background: isListening
                    ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
                    : "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
                  color: "white",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: isListening
                    ? `0 0 0 ${8 + Math.round(audioVolume / 8)}px rgba(16, 185, 129, 0.25), 0 8px 30px rgba(16, 185, 129, 0.4)`
                    : "0 0 0 8px rgba(124, 58, 237, 0.15), 0 8px 30px rgba(124, 58, 237, 0.3)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                title={isListening ? "Microphone active — speak your words" : "Click to start microphone"}
              >
                {isListening ? <Mic className="h-10 w-10 animate-pulse" /> : <MicOff className="h-10 w-10" />}
              </button>

              {/* Real-time Audio Spectrum Indicator */}
              <div style={{ display: "flex", alignItems: "center", gap: "5px", height: "24px", marginTop: "12px" }}>
                {[0.4, 0.8, 1.2, 0.7, 0.5].map((factor, idx) => {
                  const barHeight = isListening ? Math.max(6, Math.min(24, Math.round(audioVolume * factor * 0.35))) : 4;
                  return (
                    <div
                      key={idx}
                      style={{
                        width: "4px",
                        height: `${barHeight}px`,
                        borderRadius: "3px",
                        background: isListening ? "#10B981" : "#DDD6FE",
                        transition: "height 0.1s ease",
                      }}
                    />
                  );
                })}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: isListening ? "#059669" : "#6D28D9" }}>
                  {isListening ? "🔴 Recording Voice" : "Tap Microphone to Speak"}
                </span>
                {isTranscribing && (
                  <span style={{ fontSize: "11px", color: "#7C3AED", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                    <Loader2 className="h-3 w-3 animate-spin" /> transcribing...
                  </span>
                )}
              </div>
            </div>

            {/* Spoken Transcript Live Box */}
            <div
              style={{
                background: "#FAF8FF",
                border: "1.5px dashed #DDD6FE",
                borderRadius: "18px",
                padding: "14px 18px",
                minHeight: "64px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "14px",
              }}
            >
              {liveTranscript ? (
                <span style={{ fontSize: "15px", fontWeight: 600, color: "#1A1035", fontStyle: "italic" }}>
                  &ldquo;{liveTranscript}&rdquo;
                </span>
              ) : (
                <span style={{ fontSize: "13.5px", color: "#9A94A9" }}>
                  {isListening ? "Speak words into mic (or tap chips below)..." : "Say remembered words or use quick badges below"}
                </span>
              )}
            </div>

            {/* Quick Word Helper Badges */}
            <div style={{ marginBottom: "16px", textAlign: "left" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#6B6580", display: "block", marginBottom: "6px" }}>
                Quick Recalled Word Chips (tap to add):
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {targetWords.map((item) => {
                  const alreadyInText = `${liveTranscript} ${manualText}`.toLowerCase().includes(item.word.toLowerCase());
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleAddWordChip(item.word)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "12px",
                        border: alreadyInText ? "1.5px solid #10B981" : "1px solid #E2E8F0",
                        background: alreadyInText ? "#ECFDF5" : "#FFFFFF",
                        color: alreadyInText ? "#065F46" : "#4A4560",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span>{item.icon}</span>
                      <span style={{ textTransform: "capitalize" }}>{item.word}</span>
                      {alreadyInText && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Manual fallback input */}
            <div style={{ marginBottom: "20px" }}>
              <input
                type="text"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Or type remembered words (e.g. apple train tiger)..."
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "14px",
                  border: "1px solid #E2E8F0",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") evaluateAndSubmit();
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              {isListening && (
                <button
                  onClick={sendAudioForTranscription}
                  className="cd-btn"
                  disabled={isTranscribing}
                  style={{
                    background: "#EDE9FE",
                    color: "#6D28D9",
                    padding: "13px 20px",
                    fontSize: "14px",
                    fontWeight: 700,
                    borderRadius: "14px",
                  }}
                >
                  {isTranscribing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Volume2 className="h-4 w-4 mr-1.5" />}
                  Transcribe Voice
                </button>
              )}
              <button
                onClick={evaluateAndSubmit}
                className="cd-btn cd-btn--primary"
                style={{
                  padding: "13px 32px",
                  fontSize: "15px",
                  fontWeight: 700,
                  borderRadius: "14px",
                  boxShadow: "0 6px 20px rgba(124, 58, 237, 0.25)",
                }}
              >
                Submit Memory Recall <CheckCircle2 className="h-4.5 w-4.5 ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* 4. RESULTS & COGNITIVE BREAKDOWN                                 */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {phase === "results" && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "22px",
                background: accuracy >= 80 ? "linear-gradient(135deg, #10B981, #34D399)" : "linear-gradient(135deg, #7C3AED, #A78BFA)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
                boxShadow: "0 8px 24px rgba(124, 58, 237, 0.2)",
              }}
            >
              <Trophy className="h-8 w-8" />
            </div>

            <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#1A1035", marginBottom: "4px" }}>
              {accuracy >= 80 ? "Outstanding Recall! 🌟" : accuracy >= 60 ? "Great Memory Effort! 👍" : "Good Try! Keep Training 🧠"}
            </h3>
            <p style={{ fontSize: "13.5px", color: "#6B6580", marginBottom: "20px" }}>
              Telemetry analyzed and synced with your clinician
            </p>

            {/* Metrics Row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "12px",
                marginBottom: "24px",
              }}
            >
              <div style={{ background: "#F5F3FF", padding: "14px", borderRadius: "16px", border: "1px solid #EDE9FE" }}>
                <span style={{ fontSize: "11.5px", color: "#6B6580", display: "block" }}>Words Recalled</span>
                <span style={{ fontSize: "22px", fontWeight: 800, color: "#6D28D9" }}>
                  {recalledWords.length} / {targetWords.length}
                </span>
              </div>
              <div style={{ background: "#F0FDF4", padding: "14px", borderRadius: "16px", border: "1px solid #DCFCE7" }}>
                <span style={{ fontSize: "11.5px", color: "#6B6580", display: "block" }}>Recall Accuracy</span>
                <span style={{ fontSize: "22px", fontWeight: 800, color: "#16A34A" }}>
                  {accuracy}%
                </span>
              </div>
              <div style={{ background: "#FFFBEB", padding: "14px", borderRadius: "16px", border: "1px solid #FEF3C7" }}>
                <span style={{ fontSize: "11.5px", color: "#6B6580", display: "block" }}>XP Earned</span>
                <span style={{ fontSize: "22px", fontWeight: 800, color: "#D97706" }}>
                  +{xpEarned} XP
                </span>
              </div>
            </div>

            {/* Word by Word Visual Comparison */}
            <div style={{ marginBottom: "24px", textAlign: "left" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1A1035", display: "block", marginBottom: "10px" }}>
                Word-by-Word Recall Evaluation:
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {targetWords.map((item) => {
                  const wasRecalled = recalledWords.includes(item.word);
                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "14px",
                        background: wasRecalled ? "#ECFDF5" : "#FEF2F2",
                        border: wasRecalled ? "1.5px solid #10B981" : "1.5px solid #EF4444",
                        color: wasRecalled ? "#065F46" : "#991B1B",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "13.5px",
                        fontWeight: 700,
                      }}
                    >
                      <span>{item.icon}</span>
                      <span style={{ textTransform: "capitalize" }}>{item.word}</span>
                      {wasRecalled ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Adaptive Next Step Callout */}
            <div
              style={{
                background: "#FAF8FF",
                border: "1px solid #DDD6FE",
                borderRadius: "16px",
                padding: "14px 18px",
                marginBottom: "24px",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <Zap className="h-5 w-5 text-violet-600 flex-shrink-0" />
              <div>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#6D28D9", textTransform: "uppercase" }}>
                  Adaptive Personalization Engine
                </span>
                <p style={{ fontSize: "13px", color: "#1A1035", margin: "2px 0 0" }}>
                  {accuracy >= 80
                    ? `Level Up! Your next session is calibrated to Level ${nextLevelRec} (${WORD_POOLS[nextLevelRec]?.length || nextLevelRec + 2} words).`
                    : accuracy >= 60
                    ? `Maintaining Level ${diff} (${targetWords.length} words) to consolidate auditory endurance.`
                    : `Calibrating next challenge to Level ${nextLevelRec} (${WORD_POOLS[nextLevelRec]?.length || 3} words) to build foundational recall.`}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              {nextLevelRec > diff ? (
                <button
                  onClick={() => {
                    setCurrentDiff(nextLevelRec);
                    setTimeout(() => startStudyPhase(), 50);
                  }}
                  className="cd-btn cd-btn--primary"
                  style={{
                    background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                    padding: "12px 28px",
                    borderRadius: "14px",
                    fontWeight: 700,
                    boxShadow: "0 6px 20px rgba(16, 185, 129, 0.35)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Zap className="h-4 w-4" /> Play Level {nextLevelRec} Now ➔
                </button>
              ) : (
                <button
                  onClick={startStudyPhase}
                  className="cd-btn"
                  style={{
                    background: "#F5F3FF",
                    color: "#6D28D9",
                    border: "1px solid #DDD6FE",
                    padding: "12px 24px",
                    borderRadius: "14px",
                    fontWeight: 600,
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" /> Play Again
                </button>
              )}
              <button
                onClick={() => {
                  cleanupAudio();
                  onComplete();
                  onClose();
                }}
                className={nextLevelRec > diff ? "cd-btn cd-btn--secondary" : "cd-btn cd-btn--primary"}
                style={{
                  padding: "12px 28px",
                  borderRadius: "14px",
                  fontWeight: 700,
                }}
              >
                Back to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
