'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  LayoutDashboard,
  Gamepad2,
  TrendingUp,
  Trophy,
  Gift,
  Calendar,
  Smile,
  User,
  Settings,
  Star,
  Flame,
  Clock,
  Target,
  Sparkles,
  Zap,
  Brain,
  ChevronRight,
  Menu,
  X,
  Bell,
  CheckCircle2,
  Play,
  Volume2,
  VolumeX,
  Eye,
  Activity,
  Heart,
  BarChart2,
  Lock,
  LogOut,
  Check,
  Award,
  Layers,
  Compass,
  Filter,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TabType, RecommendedGame, RewardItem, ChildSettings } from './types';
import MemoryGameModal from './components/MemoryGameModal';
import { fetchChildDashboardData, recordGameSession, DynamicChildData } from './db';

const ALL_GAMES: RecommendedGame[] = [
  {
    id: 'memory-match',
    title: 'Memory Match',
    category: 'Memory & Recall',
    description: 'Find matching visual patterns and train your spatial memory.',
    duration: '5 mins',
    stars: 20,
    difficulty: 'Easy',
    color: 'from-blue-500 to-indigo-600',
    icon: 'Brain',
  },
  {
    id: 'pattern-explorer',
    title: 'Pattern Explorer',
    category: 'Visual Reasoning',
    description: 'Complete sequences of colorful shapes and boost logic reasoning.',
    duration: '8 mins',
    stars: 25,
    difficulty: 'Medium',
    color: 'from-purple-500 to-violet-600',
    icon: 'Sparkles',
  },
  {
    id: 'attention-builder',
    title: 'Attention Builder',
    category: 'Focus & Speed',
    description: 'Tap targets while ignoring distractions to sharpen sustained focus.',
    duration: '6 mins',
    stars: 20,
    difficulty: 'Easy',
    color: 'from-amber-500 to-orange-600',
    icon: 'Target',
  },
  {
    id: 'spatial-matrix',
    title: 'Spatial Matrix',
    category: 'Spatial Reasoning',
    description: 'Rotate and fit geometric shapes into matching visual slots.',
    duration: '7 mins',
    stars: 30,
    difficulty: 'Medium',
    color: 'from-fuchsia-500 to-pink-600',
    icon: 'Layers',
  },
  {
    id: 'speed-spark',
    title: 'Speed Spark',
    category: 'Processing Speed',
    description: 'Respond rapidly to auditory and visual cognitive cues.',
    duration: '4 mins',
    stars: 15,
    difficulty: 'Easy',
    color: 'from-teal-500 to-emerald-600',
    icon: 'Zap',
  },
  {
    id: 'logic-quest',
    title: 'Logic Quest',
    category: 'Executive Function',
    description: 'Plan sequential multi-step problem solving pathways.',
    duration: '10 mins',
    stars: 35,
    difficulty: 'Hard',
    color: 'from-orange-500 to-red-600',
    icon: 'Compass',
  },
];

const INITIAL_REWARDS: RewardItem[] = [
  {
    id: 'hat-space',
    name: 'Cosmic Astronaut Helmet',
    cost: 100,
    category: 'Hat',
    icon: '🧑‍🚀',
    purchased: false,
    equipped: false,
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'hat-crown',
    name: 'Golden Champion Crown',
    cost: 150,
    category: 'Hat',
    icon: '👑',
    purchased: false,
    equipped: false,
    color: 'from-amber-400 to-yellow-500',
  },
  {
    id: 'skin-brain',
    name: 'Supercharged Brain Mascot',
    cost: 200,
    category: 'Skin',
    icon: '🧠✨',
    purchased: false,
    equipped: false,
    color: 'from-violet-500 to-purple-600',
  },
  {
    id: 'badge-star',
    name: 'Star Galaxy Frame',
    cost: 80,
    category: 'Badge',
    icon: '🌌',
    purchased: false,
    equipped: false,
    color: 'from-fuchsia-500 to-pink-600',
  },
  {
    id: 'powerup-booster',
    name: '2x Star Booster (3 Days)',
    cost: 120,
    category: 'PowerUp',
    icon: '⚡',
    purchased: false,
    equipped: false,
    color: 'from-emerald-400 to-teal-500',
  },
  {
    id: 'skin-robot',
    name: 'Cyber Robot Mascot Skin',
    cost: 250,
    category: 'Skin',
    icon: '🤖',
    purchased: false,
    equipped: false,
    color: 'from-cyan-500 to-blue-600',
  },
];

const MOODS = [
  {
    id: 'happy',
    label: 'Happy & Energetic',
    emoji: '😊',
    bgColor: 'bg-amber-50 hover:bg-amber-100/80 border-amber-200 text-amber-900',
    activeColor: 'bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-500/25',
    encouragement: 'Awesome energy! You are primed to conquer today’s challenges with peak focus!',
  },
  {
    id: 'calm',
    label: 'Calm & Relaxed',
    emoji: '😌',
    bgColor: 'bg-blue-50 hover:bg-blue-100/80 border-blue-200 text-blue-900',
    activeColor: 'bg-blue-500 text-white border-blue-600 shadow-lg shadow-blue-500/25',
    encouragement: 'A calm mind is super powerful for pattern matching and steady cognitive reasoning.',
  },
  {
    id: 'okay',
    label: 'Feeling Okay',
    emoji: '😐',
    bgColor: 'bg-purple-50 hover:bg-purple-100/80 border-purple-200 text-purple-900',
    activeColor: 'bg-purple-500 text-white border-purple-600 shadow-lg shadow-purple-500/25',
    encouragement: 'Let’s play a fun quick challenge together to boost your cognitive alertness today!',
  },
  {
    id: 'tired',
    label: 'A Bit Tired',
    emoji: '😴',
    bgColor: 'bg-rose-50 hover:bg-rose-100/80 border-rose-200 text-rose-900',
    activeColor: 'bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/25',
    encouragement: 'Take it easy today. A short 5-minute session is all you need to keep your daily streak alive.',
  },
];

export default function ChildDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dbData, setDbData] = useState<DynamicChildData | null>(null);
  const [rewards, setRewards] = useState<RewardItem[]>(INITIAL_REWARDS);
  const [selectedMood, setSelectedMood] = useState<string>('happy');
  const [gameCategoryFilter, setGameCategoryFilter] = useState<string>('all');
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  const [settings, setSettings] = useState<ChildSettings>({
    soundEffects: true,
    highContrast: false,
    reducedMotion: false,
  });

  // Load real data from Supabase / PostgreSQL database
  const loadData = useCallback(async () => {
    try {
      const data = await fetchChildDashboardData();
      setDbData(data);
    } catch (err) {
      console.warn('Failed to load child dynamic data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sound synthesizer for UI clicks
  const playUiSound = (freq = 440, type: OscillatorType = 'sine') => {
    if (!settings.soundEffects || typeof window === 'undefined') return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Audio fallback
    }
  };

  const showToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => {
      setNotificationToast(null);
    }, 3500);
  };

  const handleTabChange = (tab: TabType) => {
    playUiSound(550);
    setActiveTab(tab);
    setMobileMenuOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: settings.reducedMotion ? 'auto' : 'smooth' });
    }
  };

  const handleGameReward = async (starsEarned: number) => {
    if (!dbData) return;
    try {
      await recordGameSession(dbData.child.id, 3, 100, 1.0, 30, starsEarned);
      await loadData();
      showToast(`🎉 You completed the challenge and earned +${starsEarned} Stars!`);
    } catch (err) {
      console.warn('Failed to record session:', err);
    }
  };

  const handlePurchaseReward = (rewardId: string) => {
    if (!dbData) return;
    const item = rewards.find((r) => r.id === rewardId);
    if (!item) return;

    if (item.purchased) {
      setRewards((prev) =>
        prev.map((r) => {
          if (r.category === item.category) {
            return { ...r, equipped: r.id === rewardId ? !r.equipped : false };
          }
          return r;
        })
      );
      playUiSound(600);
      showToast(`${item.name} status updated!`);
      return;
    }

    if (dbData.stars < item.cost) {
      playUiSound(220, 'sawtooth');
      showToast(`⭐ You need ${item.cost - dbData.stars} more stars to unlock this item!`);
      return;
    }

    // Purchase
    const newStars = dbData.stars - item.cost;
    setDbData({ ...dbData, stars: newStars });
    if (typeof window !== 'undefined') {
      localStorage.setItem(`neuroadapt_stars_${dbData.child.id}`, newStars.toString());
    }

    setRewards((prev) =>
      prev.map((r) => {
        if (r.id === rewardId) {
          return { ...r, purchased: true, equipped: true };
        }
        if (r.category === item.category) {
          return { ...r, equipped: false };
        }
        return r;
      })
    );

    playUiSound(784);
    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch {}
    showToast(`✨ Unlocked ${item.name}!`);
  };

  const currentMoodObj = MOODS.find((m) => m.id === selectedMood) || MOODS[0];

  // Dynamic values from database
  const childName = dbData?.child.name || 'Learner';
  const starsCount = dbData?.stars ?? 0;
  const streakCount = dbData?.streakDays ?? 0;
  const hasPlayedQuiz = dbData?.hasPlayedQuiz ?? false;
  const totalSessions = dbData?.totalSessions ?? 0;
  const domainScores = dbData?.domainScores ?? {
    attention: null,
    memory: null,
    reasoning: null,
    processing: null,
  };
  const weeklyTrend = dbData?.weeklyTrend ?? [];
  const activeDaysOfWeek = dbData?.activeDaysOfWeek ?? [];
  const achievementsList = dbData?.recentAchievements ?? [];

  // Filtered games in Training Suite
  const filteredGames =
    gameCategoryFilter === 'all'
      ? ALL_GAMES
      : ALL_GAMES.filter((g) =>
          g.category.toLowerCase().includes(gameCategoryFilter.toLowerCase())
        );

  /* ─────────────────────────────────────────────────────────────
     RENDER SIDEBAR NAVIGATION LINKS (Grouped & Generously Spaced)
     ───────────────────────────────────────────────────────────── */
  const navSections = [
    {
      title: 'TRAINING & DISCOVERY',
      items: [
        { id: 'home' as const, label: 'Home', icon: LayoutDashboard },
        { id: 'training' as const, label: 'Training Suite', icon: Gamepad2, badge: '6 Games' },
        { id: 'progress' as const, label: 'My Progress', icon: TrendingUp },
      ],
    },
    {
      title: 'AWARDS & SCHEDULE',
      items: [
        {
          id: 'achievements' as const,
          label: 'Achievements',
          icon: Trophy,
          badge: `${achievementsList.filter((a) => a.unlocked).length}/${achievementsList.length || 4}`,
        },
        { id: 'rewards' as const, label: 'Star Store', icon: Gift, badge: `${starsCount} ⭐` },
        { id: 'calendar' as const, label: 'Weekly Schedule', icon: Calendar },
      ],
    },
    {
      title: 'PERSONAL & SETTINGS',
      items: [
        { id: 'wellbeing' as const, label: 'Mood Check-in', icon: Smile, badge: '😊' },
        { id: 'profile' as const, label: 'My Profile', icon: User },
        { id: 'settings' as const, label: 'Audio & Accessibility', icon: Settings },
      ],
    },
  ];

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col justify-between p-5 overflow-y-auto custom-scrollbar">
      <div>
        {/* Top Logo & Junior Portal Badge */}
        <div className="flex items-center gap-3.5 px-2 pb-5 mb-6 border-b border-violet-100/90">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 text-white shadow-md shadow-violet-500/25 flex-shrink-0">
            <Brain className="h-7 w-7" strokeWidth={2.4} />
          </div>
          <div>
            <div className="text-xl font-black tracking-tight text-slate-900 leading-none">
              Neuro<span className="text-violet-600">Adapt</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-wider text-violet-600">
                Junior Learner
              </span>
            </div>
          </div>
        </div>

        {/* Grouped Navigation Links (With distinct large gaps between sections) */}
        <div>
          {navSections.map((section, sIdx) => (
            <div
              key={sIdx}
              className="sidebar-section-group"
              style={{ marginBottom: sIdx === navSections.length - 1 ? '16px' : '28px' }}
            >
              <div
                className="sidebar-section-title"
                style={{
                  padding: '0 10px 10px 10px',
                  fontSize: '11px',
                  fontWeight: '900',
                  letterSpacing: '0.08em',
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                }}
              >
                {section.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleTabChange(item.id)}
                      className={`sidebar-nav-btn ${
                        isActive
                          ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/30'
                          : 'text-slate-600 hover:bg-violet-50 hover:text-violet-700'
                      }`}
                      style={{
                        padding: '13px 16px',
                        borderRadius: '16px',
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%',
                      }}
                    >
                      <Icon
                        className={`h-5 w-5 flex-shrink-0 ${
                          isActive ? 'text-white' : 'text-slate-400'
                        }`}
                        strokeWidth={isActive ? 2.6 : 2.1}
                      />
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`ml-auto text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-white/25 text-white'
                              : 'bg-violet-100 text-violet-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar Footer / Dynamic Mascot Card & Exit Button */}
      <div className="pt-4 border-t border-slate-100" style={{ marginTop: '16px' }}>
        {/* Mascot Card */}
        <div
          className="sidebar-mascot-box rounded-3xl bg-gradient-to-br from-violet-500/15 via-purple-500/10 to-amber-500/15 border-2 border-violet-100 shadow-xs"
          style={{ padding: '16px', borderRadius: '22px', marginBottom: '12px' }}
        >
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-14 flex-shrink-0">
              <Image
                src="/brain_mascot.png"
                alt="Neuro Mascot"
                fill
                className="object-contain animate-bounce-subtle"
                priority
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-900 truncate">
                Great job, {childName}!
              </p>
              <div className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black text-amber-800 mt-1">
                <span>🔥 {streakCount}-Day Streak</span>
              </div>
            </div>
          </div>

          {/* Daily Goal Progress */}
          <div className="space-y-1.5 pt-2.5 mt-2.5 border-t border-violet-200/60">
            <div className="flex justify-between text-[11px] font-bold text-slate-600">
              <span>Daily Goal</span>
              <span className="text-violet-700 font-extrabold">
                {Math.min(totalSessions, 3)} / 3 Done
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-violet-200/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500"
                style={{ width: `${Math.min(Math.round((totalSessions / 3) * 100), 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Large Exit Button */}
        <Link
          href="/auth"
          className="sidebar-exit-btn rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-xs font-black text-slate-700 hover:text-slate-900 transition-all shadow-xs"
          style={{ padding: '13px 16px', borderRadius: '16px' }}
        >
          <LogOut className="h-4 w-4 text-slate-500" />
          <span>Exit Portal</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div
      className={`min-h-screen bg-[#F8F7FC] text-[#1e1b4b] relative antialiased ${
        settings.highContrast ? 'contrast-125' : ''
      }`}
    >
      {/* ─────────────────────────────────────────────────────────────
         DESKTOP SIDEBAR (Fixed 272px width)
         ───────────────────────────────────────────────────────────── */}
      <aside className="child-sidebar fixed inset-y-0 left-0 z-30 hidden w-[272px] min-w-[272px] max-w-[272px] border-r border-violet-100/80 bg-white lg:flex lg:flex-col shadow-xs">
        {renderSidebarContent()}
      </aside>

      {/* ─────────────────────────────────────────────────────────────
         MOBILE DRAWER & BACKDROP
         ───────────────────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Slide-over Menu */}
          <div className="child-sidebar fixed inset-y-0 left-0 w-[290px] max-w-[85vw] bg-white shadow-2xl z-10 border-r border-violet-100">
            <div className="absolute top-4 right-4 z-20">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {renderSidebarContent()}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
         MAIN CONTENT AREA (Spacious & Clean Layout)
         ───────────────────────────────────────────────────────────── */}
      <main className="child-main-layout w-full min-w-0 lg:pl-[272px]">
        <div className="w-full px-6 sm:px-8 lg:px-12 py-8 max-w-7xl mx-auto">
          {/* ═══════════════════════════════════════════════════════════
             MAIN HEADER (Dynamic Real User Name & Stars)
             ═══════════════════════════════════════════════════════════ */}
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Left Header Greeting & Mobile Toggle */}
            <div className="flex items-center gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50 lg:hidden"
                aria-label="Open mobile menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-violet-300 bg-violet-100 shadow-xs">
                <Image
                  src="/child_avatar.png"
                  alt={`${childName}'s Avatar`}
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 truncate">
                  <span>Hi {childName}!</span>
                  <span className="inline-block animate-bounce">👋</span>
                </h1>
                <p className="text-xs sm:text-sm font-medium text-slate-500 truncate mt-0.5">
                  {hasPlayedQuiz
                    ? 'Ready to continue your adaptive brain training challenge today?'
                    : 'Welcome to NeuroAdapt! Complete your first challenge below.'}
                </p>
              </div>
            </div>

            {/* Right Header Controls */}
            <div className="flex items-center gap-3 self-end sm:self-auto flex-shrink-0">
              {/* Notification Button */}
              <button
                type="button"
                onClick={() =>
                  showToast(
                    hasPlayedQuiz
                      ? '🔔 Keep up your daily cognitive training streak!'
                      : '🔔 Welcome! Complete your first challenge to earn 20 stars!'
                  )
                }
                className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/90 bg-white text-slate-600 shadow-xs hover:bg-slate-50 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-violet-600 ring-2 ring-white" />
              </button>

              {/* Real Star Balance Badge */}
              <div className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 px-5 py-2.5 text-white font-extrabold text-sm shadow-md shadow-amber-500/20 border border-amber-300">
                <Star className="h-4.5 w-4.5 fill-white text-white" />
                <span>{starsCount} Stars</span>
              </div>
            </div>
          </header>

          {/* Toast Notification */}
          {notificationToast && (
            <div className="mb-6 flex items-center justify-between rounded-2xl bg-slate-900 px-5 py-3.5 text-white text-sm font-medium shadow-lg animate-in fade-in slide-in-from-top-2">
              <span>{notificationToast}</span>
              <button
                onClick={() => setNotificationToast(null)}
                className="ml-3 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
             TAB 1: HOME (Focused, Spacious, No Duplicate Congestion)
             ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'home' && (
            <div className="space-y-8">
              {/* 1. TODAY'S FEATURED CHALLENGE HERO CARD */}
              <div className="relative w-full min-w-0 overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-7 sm:p-9 text-white shadow-xl shadow-purple-500/15 border border-purple-400/30">
                <div className="absolute top-0 right-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-indigo-500/30 blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  {/* Left Column */}
                  <div className="flex-1 min-w-0 max-w-xl">
                    <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md mb-3.5 border border-white/20">
                      <Sparkles className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
                      <span>Today&apos;s Featured Training</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2.5">
                      Pattern Master Challenge
                    </h2>

                    <p className="text-sm sm:text-base text-purple-100 font-medium leading-relaxed mb-6">
                      Train your working memory, recognize patterns, and improve logic reasoning with interactive visual puzzles.
                    </p>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                      <div className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-xs border border-white/15">
                        <Clock className="h-3.5 w-3.5 text-purple-200" />
                        <span>5 mins</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-xs border border-white/15">
                        <Target className="h-3.5 w-3.5 text-purple-200" />
                        <span>Level 1</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-xl bg-amber-400/25 px-3.5 py-1.5 text-xs font-bold text-amber-200 border border-amber-300/30">
                        <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                        <span>+20 Stars</span>
                      </div>
                    </div>

                    {/* Start Button */}
                    <button
                      type="button"
                      onClick={() => {
                        playUiSound(600);
                        setIsGameModalOpen(true);
                      }}
                      className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-white px-7 py-4 text-sm font-extrabold text-violet-700 shadow-lg shadow-black/10 hover:bg-purple-50 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <Play className="h-4.5 w-4.5 fill-violet-700" />
                      <span>Start Daily Training</span>
                    </button>
                  </div>

                  {/* Right Column: 3D Artwork */}
                  <div className="hidden sm:flex flex-shrink-0 items-center justify-center w-44 sm:w-52 md:w-60 self-center">
                    <div className="relative h-44 w-44 sm:h-52 sm:w-52 md:h-56 md:w-56">
                      <Image
                        src="/brain-3d.png"
                        alt="3D Brain Training"
                        fill
                        className="object-contain drop-shadow-2xl animate-float"
                        priority
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. COGNITIVE PERFORMANCE DOMAINS (Spacious & Clean) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                      Cognitive Performance Overview
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                      {hasPlayedQuiz
                        ? 'Real-time scores calculated from your completed sessions'
                        : 'No quiz sessions completed yet. Play your first challenge to compute scores.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange('progress')}
                    className="flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-800"
                  >
                    <span>Full Analytics</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                  {[
                    {
                      id: 'attention',
                      name: 'ATTENTION',
                      score: domainScores.attention,
                      color: 'text-amber-600',
                      bgLight: 'bg-amber-50',
                      borderColor: 'border-amber-200/80',
                      barColor: 'bg-amber-500',
                      icon: <Target className="h-5 w-5 text-amber-600" />,
                    },
                    {
                      id: 'memory',
                      name: 'MEMORY',
                      score: domainScores.memory,
                      color: 'text-blue-600',
                      bgLight: 'bg-blue-50',
                      borderColor: 'border-blue-200/80',
                      barColor: 'bg-blue-500',
                      icon: <Brain className="h-5 w-5 text-blue-600" />,
                    },
                    {
                      id: 'reasoning',
                      name: 'REASONING',
                      score: domainScores.reasoning,
                      color: 'text-emerald-600',
                      bgLight: 'bg-emerald-50',
                      borderColor: 'border-emerald-200/80',
                      barColor: 'bg-emerald-500',
                      icon: <Sparkles className="h-5 w-5 text-emerald-600" />,
                    },
                    {
                      id: 'processing',
                      name: 'PROCESSING',
                      score: domainScores.processing,
                      color: 'text-purple-600',
                      bgLight: 'bg-purple-50',
                      borderColor: 'border-purple-200/80',
                      barColor: 'bg-purple-500',
                      icon: <Zap className="h-5 w-5 text-purple-600" />,
                    },
                  ].map((domain) => (
                    <div
                      key={domain.id}
                      className={`w-full min-w-0 rounded-3xl bg-white p-6 border ${domain.borderColor} shadow-xs hover:shadow-md transition-all duration-200`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${domain.bgLight}`}>
                          {domain.icon}
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold ${
                            domain.score !== null
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {domain.score !== null ? 'Evaluated' : 'No Quiz Yet'}
                        </span>
                      </div>

                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                        {domain.name}
                      </div>

                      <div className="flex items-baseline gap-1 mb-3.5">
                        <span className="text-3xl font-black text-slate-900">
                          {domain.score !== null ? domain.score : '--'}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">/ 100</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${domain.barColor}`}
                          style={{ width: `${domain.score !== null ? domain.score : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. DAILY STATUS & CLINICIAN GUIDANCE (Clean 2-Column Section) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Streak & Daily Goal Card */}
                <div className="rounded-3xl bg-white p-6 sm:p-7 border border-amber-200/80 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                          <Flame className="h-6 w-6 fill-amber-500" />
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Training Streak
                          </div>
                          <div className="text-2xl font-black text-slate-900">
                            {streakCount} {streakCount === 1 ? 'Day' : 'Days'} Active
                          </div>
                        </div>
                      </div>
                      <span className="rounded-xl bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
                        🔥 Active Streak
                      </span>
                    </div>

                    {/* Mon-Sun Day Pills */}
                    <div className="grid grid-cols-7 gap-2 text-center mb-6">
                      {[
                        { label: 'M', dayIdx: 1 },
                        { label: 'T', dayIdx: 2 },
                        { label: 'W', dayIdx: 3 },
                        { label: 'T', dayIdx: 4 },
                        { label: 'F', dayIdx: 5 },
                        { label: 'S', dayIdx: 6 },
                        { label: 'S', dayIdx: 0 },
                      ].map((d, idx) => {
                        const isDone = activeDaysOfWeek.includes(d.dayIdx);
                        return (
                          <div key={idx} className="flex flex-col items-center gap-1.5">
                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-2xl text-xs font-black transition-all ${
                                isDone
                                  ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200/70'
                              }`}
                            >
                              {isDone ? <Check className="h-4 w-4 stroke-[3]" /> : '•'}
                            </div>
                            <span className="text-[11px] font-bold text-slate-500">{d.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Daily Goal Bar */}
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                      <span>Today&apos;s Daily Target</span>
                      <span className="text-violet-700 font-extrabold">
                        {Math.min(totalSessions, 3)} / 3 Challenges Completed
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500"
                        style={{ width: `${Math.min(Math.round((totalSessions / 3) * 100), 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Clinician Care Guidance Card */}
                <div className="rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 sm:p-7 text-white shadow-md shadow-violet-600/15 border border-violet-400/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-xs">
                        <Heart className="h-5 w-5 fill-white" />
                      </div>
                      <div>
                        <div className="text-sm font-extrabold text-purple-100">
                          {dbData?.child.clinician_name || 'Dr. Rajesh Mehta (Clinician)'}
                        </div>
                        <div className="text-xs text-purple-300">Care Plan Guidance Note</div>
                      </div>
                    </div>

                    <p className="text-sm text-purple-50 font-medium leading-relaxed mb-6">
                      {hasPlayedQuiz
                        ? `“Great effort on your recent training, ${childName}! Consistent short sessions strengthen neural pathways and working memory. Keep up the good work!”`
                        : `“Welcome to your cognitive portal, ${childName}! Start with easy 5-minute memory and pattern recognition games to evaluate your cognitive baseline.”`}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/20">
                    <span className="text-xs font-bold text-purple-200">
                      Rehabilitation Plan #CP-2026
                    </span>
                    <button
                      type="button"
                      onClick={() => handleTabChange('training')}
                      className="inline-flex items-center gap-1 text-xs font-extrabold text-white bg-white/20 hover:bg-white/30 px-3.5 py-1.5 rounded-xl transition-colors"
                    >
                      <span>Explore Training Suite</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
             TAB 2: TRAINING SUITE (Full Dedicated Game Catalog)
             ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'training' && (
            <div className="space-y-8">
              {/* Header Banner */}
              <div className="rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 p-8 text-white shadow-lg shadow-violet-500/15">
                <div className="flex items-center gap-3 mb-2">
                  <Gamepad2 className="h-7 w-7 text-amber-300" />
                  <h2 className="text-2xl sm:text-3xl font-extrabold">Cognitive Training Suite</h2>
                </div>
                <p className="text-sm text-purple-100 max-w-xl">
                  Choose a targeted exercise to train specific cognitive faculties including working memory, attention focus, pattern reasoning, and processing speed.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2.5 pb-2">
                {[
                  { id: 'all', label: 'All Exercises (6)' },
                  { id: 'memory', label: 'Memory & Recall' },
                  { id: 'reasoning', label: 'Visual Reasoning' },
                  { id: 'focus', label: 'Focus & Attention' },
                  { id: 'speed', label: 'Processing Speed' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      playUiSound(500);
                      setGameCategoryFilter(f.id);
                    }}
                    className={`rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
                      gameCategoryFilter === f.id
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                        : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Game Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGames.map((game) => (
                  <div
                    key={game.id}
                    className="w-full min-w-0 rounded-3xl bg-white p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="rounded-xl bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700 border border-violet-100">
                          {game.category}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-extrabold text-amber-600">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                          +{game.stars} Stars
                        </span>
                      </div>

                      <h4 className="text-lg font-black text-slate-900 mb-2">{game.title}</h4>
                      <p className="text-xs sm:text-sm text-slate-500 font-medium mb-6 leading-relaxed">
                        {game.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{game.duration}</span>
                        <span>•</span>
                        <span>{game.difficulty}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          playUiSound(600);
                          setIsGameModalOpen(true);
                        }}
                        className="flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-violet-500/20 hover:bg-violet-700 transition-colors"
                      >
                        <Play className="h-3.5 w-3.5 fill-white" />
                        <span>Play Exercise</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
             TAB 3: MY PROGRESS (Dedicated Analytics & SVG Chart)
             ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'progress' && (
            <div className="space-y-8">
              {/* Header Banner */}
              <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-lg shadow-blue-500/15">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="h-7 w-7 text-amber-300" />
                  <h2 className="text-2xl sm:text-3xl font-extrabold">Cognitive Analytics & Progress</h2>
                </div>
                <p className="text-sm text-blue-100 max-w-xl">
                  Review your cognitive performance progression curve, session consistency, and domain benchmarks over time.
                </p>
              </div>

              {/* 3 Summary Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="rounded-3xl bg-white p-6 border border-violet-100 shadow-xs">
                  <div className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-1">
                    Completed Sessions
                  </div>
                  <div className="text-3xl font-black text-slate-900">{totalSessions}</div>
                  <div className="text-xs text-slate-500 font-medium mt-1">
                    {totalSessions > 0 ? 'Recorded in database' : 'No sessions recorded yet'}
                  </div>
                </div>

                <div className="rounded-3xl bg-white p-6 border border-amber-100 shadow-xs">
                  <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
                    Total Stars Earned
                  </div>
                  <div className="text-3xl font-black text-slate-900">{starsCount} ⭐</div>
                  <div className="text-xs text-slate-500 font-medium mt-1">
                    Available in Star Store
                  </div>
                </div>

                <div className="rounded-3xl bg-white p-6 border border-blue-100 shadow-xs">
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                    Active Daily Streak
                  </div>
                  <div className="text-3xl font-black text-slate-900">{streakCount} Days</div>
                  <div className="text-xs text-slate-500 font-medium mt-1">
                    Consecutive practice days
                  </div>
                </div>
              </div>

              {/* Weekly Progression Chart Card */}
              <div className="w-full min-w-0 rounded-3xl bg-white p-7 sm:p-8 border border-slate-200/80 shadow-xs">
                <div className="mb-6">
                  <h3 className="text-lg font-black text-slate-900">Weekly Accuracy Progression Curve</h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                    Cognitive accuracy percentage logged across your recent training sessions
                  </p>
                </div>

                {hasPlayedQuiz && weeklyTrend.length > 0 ? (
                  <div className="w-full overflow-hidden pt-2">
                    <svg viewBox="0 0 650 220" className="w-full h-auto max-h-64" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGradient2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      <line x1="40" y1="30" x2="620" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1="40" y1="80" x2="620" y2="80" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1="40" y1="130" x2="620" y2="130" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1="40" y1="180" x2="620" y2="180" stroke="#e2e8f0" strokeWidth="1" />

                      {weeklyTrend.map((pt, i) => {
                        const x = 90 + i * 85;
                        const y = 180 - (pt.accuracy / 100) * 140;
                        return (
                          <g key={i}>
                            <circle cx={x} cy={y} r="6" fill="#ffffff" stroke="#7c3aed" strokeWidth="3.5" />
                            <text x={x} y="205" textAnchor="middle" className="text-[12px] fill-slate-500 font-bold">
                              {pt.day}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center rounded-2xl bg-slate-50/80 text-center border-2 border-dashed border-slate-200">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 mb-3.5">
                      <BarChart2 className="h-7 w-7" />
                    </div>
                    <h4 className="text-base font-extrabold text-slate-800 mb-1">
                      No Session Progression Data Recorded Yet
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mb-5">
                      Complete your first training challenge to generate your dynamic accuracy progression curve.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        playUiSound(600);
                        setIsGameModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-violet-500/20 hover:bg-violet-700 transition-colors"
                    >
                      <Play className="h-4 w-4 fill-white" />
                      <span>Start First Training Session</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
             TAB 4: ACHIEVEMENTS (Trophy Room)
             ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'achievements' && (
            <div className="space-y-8">
              {/* Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 p-8 text-white shadow-lg shadow-amber-500/15">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Trophy className="h-7 w-7 text-white" />
                    <h2 className="text-2xl sm:text-3xl font-extrabold">Trophy Room & Badges</h2>
                  </div>
                  <p className="text-sm text-amber-100 max-w-lg">
                    Badges unlocked based on real cognitive training milestones and session consistency.
                  </p>
                </div>
                <div className="rounded-2xl bg-white/20 px-5 py-2.5 text-white font-extrabold text-sm border border-white/30 self-start sm:self-auto">
                  {achievementsList.filter((a) => a.unlocked).length} / {achievementsList.length} Badges Unlocked
                </div>
              </div>

              {/* Achievements Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
                {achievementsList.map((ach) => (
                  <div
                    key={ach.id}
                    className={`w-full min-w-0 rounded-3xl p-6 border transition-all ${
                      ach.unlocked
                        ? 'bg-white border-amber-200/90 shadow-xs'
                        : 'bg-slate-50/80 border-slate-200/80 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-4xl">{ach.icon}</span>
                      {ach.unlocked ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-800 flex items-center gap-1.5 border border-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Unlocked
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-extrabold text-slate-600 flex items-center gap-1.5">
                          <Lock className="h-3 w-3" />
                          Locked ({ach.progress})
                        </span>
                      )}
                    </div>

                    <h4 className="text-lg font-black text-slate-900 mb-1.5">{ach.title}</h4>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mb-4">{ach.description}</p>

                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${ach.unlocked ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        style={{ width: ach.unlocked ? '100%' : '30%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
             TAB 5: STAR STORE (Customizations)
             ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'rewards' && (
            <div className="space-y-8">
              {/* Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 p-8 text-white shadow-lg shadow-purple-500/15">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Gift className="h-7 w-7 text-amber-300" />
                    <h2 className="text-2xl sm:text-3xl font-extrabold">Star Store & Customizations</h2>
                  </div>
                  <p className="text-sm text-purple-100 max-w-lg">
                    Spend your real stars earned from cognitive games to unlock avatars, hats, and bonus boosters!
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-white/20 px-5 py-2.5 text-white font-extrabold text-sm border border-white/30 self-start sm:self-auto">
                  <Star className="h-5 w-5 fill-amber-300 text-amber-300" />
                  <span>{starsCount} Stars Available</span>
                </div>
              </div>

              {/* Reward Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rewards.map((item) => {
                  const canAfford = starsCount >= item.cost;
                  return (
                    <div
                      key={item.id}
                      className="w-full min-w-0 rounded-3xl bg-white p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                            {item.category}
                          </span>
                          <span className="flex items-center gap-1 text-xs font-black text-amber-600">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                            {item.cost} Stars
                          </span>
                        </div>

                        <div className="my-5 flex h-24 w-full items-center justify-center rounded-2xl bg-violet-50/70 text-5xl">
                          {item.icon}
                        </div>

                        <h4 className="text-base font-black text-slate-900 mb-1">{item.name}</h4>
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                        {item.purchased ? (
                          <button
                            type="button"
                            onClick={() => handlePurchaseReward(item.id)}
                            className={`w-full rounded-2xl py-3 text-xs font-black transition-all ${
                              item.equipped
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {item.equipped ? '✓ Equipped' : 'Equip Item'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handlePurchaseReward(item.id)}
                            disabled={!canAfford}
                            className={`w-full rounded-2xl py-3 text-xs font-black transition-all ${
                              canAfford
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-md hover:brightness-105'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {canAfford ? `Unlock for ${item.cost} ⭐` : `Need ${item.cost - starsCount} more ⭐`}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
             TAB 6: CALENDAR (Weekly Schedule)
             ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'calendar' && (
            <div className="space-y-8">
              <div className="rounded-3xl bg-white p-7 sm:p-8 border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="h-7 w-7 text-violet-600" />
                  <h2 className="text-2xl font-black text-slate-900">Weekly Training Schedule</h2>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-500 mb-8">
                  Recommended daily cognitive practice routine prescribed by clinician care plan.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                  {[
                    { day: 'Mon', status: activeDaysOfWeek.includes(1) ? 'Completed ✅' : 'Scheduled', time: '10 mins' },
                    { day: 'Tue', status: 'Today 🎯', time: '10 mins', isToday: true },
                    { day: 'Wed', status: activeDaysOfWeek.includes(3) ? 'Completed ✅' : 'Upcoming', time: '10 mins' },
                    { day: 'Thu', status: activeDaysOfWeek.includes(4) ? 'Completed ✅' : 'Upcoming', time: '10 mins' },
                    { day: 'Fri', status: 'Review Session', time: '15 mins', highlight: true },
                    { day: 'Sat', status: 'Bonus Practice', time: '5 mins' },
                    { day: 'Sun', status: 'Rest / Fun', time: '0 mins' },
                  ].map((slot, i) => (
                    <div
                      key={i}
                      className={`rounded-3xl p-5 border text-center transition-all ${
                        slot.isToday
                          ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/20'
                          : slot.highlight
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      <div className="text-xs font-bold uppercase tracking-wider opacity-80">{slot.day}</div>
                      <div className="text-sm font-black my-2">{slot.status}</div>
                      <div className="text-[11px] font-semibold opacity-90">{slot.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
             TAB 7: WELLBEING (Mood Check-in)
             ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'wellbeing' && (
            <div className="space-y-8">
              <div className="rounded-3xl bg-white p-7 sm:p-8 border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-3 mb-2">
                  <Smile className="h-7 w-7 text-amber-500" />
                  <h2 className="text-2xl font-black text-slate-900">How are you feeling right now?</h2>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-500 mb-8">
                  Checking in helps our adaptive engine adjust exercise difficulty dynamically for your comfort.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {MOODS.map((mood) => {
                    const isSelected = selectedMood === mood.id;
                    return (
                      <button
                        key={mood.id}
                        type="button"
                        onClick={() => {
                          playUiSound(580);
                          setSelectedMood(mood.id);
                        }}
                        className={`flex flex-col items-center justify-center rounded-3xl p-6 border-2 transition-all duration-200 ${
                          isSelected ? mood.activeColor : mood.bgColor
                        }`}
                      >
                        <span className="text-4xl mb-2">{mood.emoji}</span>
                        <span className="text-sm font-black">{mood.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-3xl bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10 p-6 border border-violet-100">
                  <div className="flex items-center gap-2 text-violet-700 font-extrabold text-sm mb-1.5">
                    <Sparkles className="h-4.5 w-4.5" />
                    <span>NeuroAdapt Guidance</span>
                  </div>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed">
                    {currentMoodObj.encouragement}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
             TAB 8: PROFILE (Real Database Profile)
             ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'profile' && (
            <div className="space-y-8">
              <div className="rounded-3xl bg-white p-7 sm:p-8 border border-slate-200/80 shadow-xs">
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-slate-100">
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-3xl border-4 border-violet-200 bg-violet-100">
                    <Image src="/child_avatar.png" alt={childName} fill className="object-cover" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-3xl font-black text-slate-900">{childName}</h2>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                      Learner ID: #NA-{dbData?.child.id || '101'} • Age {dbData?.child.age || 8}
                    </p>
                    <span className="inline-block mt-3 rounded-full bg-violet-100 px-4 py-1 text-xs font-extrabold text-violet-700">
                      Active Cognitive Rehabilitation Track
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8">
                  <div className="rounded-3xl bg-slate-50 p-6 border border-slate-200/70">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Assigned Clinician
                    </div>
                    <div className="text-base font-black text-slate-800">
                      {dbData?.child.clinician_name || 'Dr. Rajesh Mehta, MD'}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">Neuro-Development Specialist</div>
                  </div>

                  <div className="rounded-3xl bg-slate-50 p-6 border border-slate-200/70">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Completed Sessions
                    </div>
                    <div className="text-base font-black text-slate-800">{totalSessions} Sessions</div>
                    <div className="text-xs text-slate-500 mt-0.5">Recorded in Supabase Database</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
             TAB 9: SETTINGS
             ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'settings' && (
            <div className="space-y-8">
              <div className="rounded-3xl bg-white p-7 sm:p-8 border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-3 mb-2">
                  <Settings className="h-7 w-7 text-slate-700" />
                  <h2 className="text-2xl font-black text-slate-900">Dashboard Audio & Accessibility</h2>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-500 mb-8">
                  Customize the interface for your comfort, sensory sensitivity, and focus.
                </p>

                <div className="space-y-5">
                  {/* Sound Toggle */}
                  <div className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 border border-slate-200/70">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                        {settings.soundEffects ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">Sound Effects</div>
                        <div className="text-xs text-slate-500">Play joyful audio cues for interactive events</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSettings((prev) => ({ ...prev, soundEffects: !prev.soundEffects }));
                        showToast(`Sound effects ${!settings.soundEffects ? 'enabled' : 'disabled'}`);
                      }}
                      className={`relative h-7 w-12 rounded-full transition-colors ${
                        settings.soundEffects ? 'bg-violet-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          settings.soundEffects ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* High Contrast Toggle */}
                  <div className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 border border-slate-200/70">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                        <Eye className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">High Contrast Mode</div>
                        <div className="text-xs text-slate-500">Increase visual sharpness for easier reading</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSettings((prev) => ({ ...prev, highContrast: !prev.highContrast }));
                        showToast(`High contrast ${!settings.highContrast ? 'enabled' : 'disabled'}`);
                      }}
                      className={`relative h-7 w-12 rounded-full transition-colors ${
                        settings.highContrast ? 'bg-violet-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          settings.highContrast ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Reduced Motion Toggle */}
                  <div className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 border border-slate-200/70">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">Reduced Motion</div>
                        <div className="text-xs text-slate-500">Minimizes screen animations</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSettings((prev) => ({ ...prev, reducedMotion: !prev.reducedMotion }));
                        showToast(`Reduced motion ${!settings.reducedMotion ? 'enabled' : 'disabled'}`);
                      }}
                      className={`relative h-7 w-12 rounded-full transition-colors ${
                        settings.reducedMotion ? 'bg-violet-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          settings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
         PLAYABLE MEMORY MATCH MINI-GAME MODAL
         ───────────────────────────────────────────────────────────── */}
      <MemoryGameModal
        isOpen={isGameModalOpen}
        onClose={() => setIsGameModalOpen(false)}
        onReward={handleGameReward}
        soundEnabled={settings.soundEffects}
      />
    </div>
  );
}
