/**
 * Database client and dynamic data helper for NeuroAdapt Child Portal.
 * Interacts directly with Supabase PostgreSQL and handles session recordings.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export interface ChildRecord {
  id: number;
  name: string;
  age: number;
  caregiver_id?: number | null;
  clinician_id?: number | null;
  clinician_name?: string;
  profile_data?: Record<string, unknown>;
  created_at: string;
}

export interface SessionWithPerformance {
  id: number;
  child_id: number;
  exercise_id: number;
  exercise_name?: string;
  domain?: string;
  started_at: string;
  completed_at?: string;
  score?: number;
  accuracy?: number;
  response_time?: number;
  errors?: number;
  difficulty?: number;
}

export interface DynamicChildData {
  child: ChildRecord;
  totalSessions: number;
  stars: number;
  streakDays: number;
  hasPlayedQuiz: boolean;
  domainScores: {
    attention: number | null;
    memory: number | null;
    reasoning: number | null;
    processing: number | null;
  };
  weeklyTrend: Array<{ day: string; accuracy: number; date: string }>;
  activeDaysOfWeek: number[]; // 0 for Sun, 1 for Mon, ..., 6 for Sat
  recentAchievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    unlocked: boolean;
    progress: string;
  }>;
}

/**
 * Fetch child profile and real session records from Supabase.
 */
export async function fetchChildDashboardData(): Promise<DynamicChildData> {
  // 1. Get logged in user from localStorage if available
  let loggedInUser: { id?: number; name?: string; email?: string } | null = null;
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('neuroadapt_user');
      if (saved) loggedInUser = JSON.parse(saved);
    } catch {
      // ignore
    }
  }

  // 2. Fetch children from Supabase
  let child: ChildRecord = {
    id: 1,
    name: loggedInUser?.name || 'Harshit',
    age: 8,
    clinician_name: 'Dr. Rajesh Mehta',
    created_at: new Date().toISOString(),
  };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/children?select=*&order=id.desc`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (res.ok) {
      const children: ChildRecord[] = await res.json();
      if (children && children.length > 0) {
        if (loggedInUser?.name) {
          const matched = children.find(
            (c) => c.name.toLowerCase() === loggedInUser?.name?.toLowerCase()
          );
          child = matched || children[0];
        } else {
          child = children[0];
        }
      }
    }
  } catch (err) {
    console.warn('Could not fetch child from Supabase:', err);
  }

  // Override name if logged in
  if (loggedInUser?.name) {
    child.name = loggedInUser.name;
  }

  // 3. Fetch real sessions and performance
  let sessions: SessionWithPerformance[] = [];
  try {
    const sRes = await fetch(
      `${SUPABASE_URL}/rest/v1/sessions?child_id=eq.${child.id}&select=*,exercise:exercises(name,domain),performance(*)`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    if (sRes.ok) {
      const sData = await sRes.json();
      if (Array.isArray(sData)) {
        sessions = sData.map((s) => {
          const perf = Array.isArray(s.performance) && s.performance[0] ? s.performance[0] : {};
          return {
            id: s.id,
            child_id: s.child_id,
            exercise_id: s.exercise_id,
            exercise_name: s.exercise?.name,
            domain: s.exercise?.domain,
            started_at: s.started_at,
            completed_at: s.completed_at,
            score: perf.score || 0,
            accuracy: perf.accuracy || 0,
            response_time: perf.response_time || 0,
            errors: perf.errors || 0,
            difficulty: perf.difficulty || 1,
          };
        });
      }
    }
  } catch (err) {
    console.warn('Could not fetch sessions from Supabase:', err);
  }

  // Also check localStorage for local sessions played during this session
  if (typeof window !== 'undefined') {
    try {
      const localSessions = JSON.parse(localStorage.getItem(`neuroadapt_local_sessions_${child.id}`) || '[]');
      if (Array.isArray(localSessions)) {
        sessions = [...sessions, ...localSessions];
      }
    } catch {}
  }

  const hasPlayedQuiz = sessions.length > 0;
  const totalSessions = sessions.length;

  // Calculate stars: 20 stars per completed session, plus stored claimed stars
  let storedStars = 0;
  if (typeof window !== 'undefined') {
    try {
      storedStars = parseInt(localStorage.getItem(`neuroadapt_stars_${child.id}`) || '0', 10);
    } catch {}
  }
  const stars = storedStars > 0 ? storedStars : totalSessions * 20;

  // Calculate real domain scores
  let attentionScore: number | null = null;
  let memoryScore: number | null = null;
  let reasoningScore: number | null = null;
  let processingScore: number | null = null;

  if (hasPlayedQuiz) {
    const calcDomain = (domain: string) => {
      const matches = sessions.filter((s) => s.domain === domain || (!s.domain && domain === 'memory'));
      if (matches.length === 0) return null;
      const sum = matches.reduce((acc, m) => acc + (m.score || (m.accuracy ? m.accuracy * 100 : 85)), 0);
      return Math.round(sum / matches.length);
    };

    attentionScore = calcDomain('attention');
    memoryScore = calcDomain('memory');
    reasoningScore = calcDomain('reasoning');
    processingScore = calcDomain('problem_solving') || calcDomain('processing');
  }

  // Calculate active days of week
  const activeDaysOfWeek: number[] = [];
  sessions.forEach((s) => {
    try {
      const date = new Date(s.started_at);
      const day = date.getDay(); // 0 is Sun, 1 is Mon...
      if (!activeDaysOfWeek.includes(day)) activeDaysOfWeek.push(day);
    } catch {}
  });

  const streakDays = activeDaysOfWeek.length;

  // Calculate weekly trend
  const weeklyTrend: Array<{ day: string; accuracy: number; date: string }> = [];
  if (hasPlayedQuiz) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    sessions.slice(-7).forEach((s) => {
      const date = new Date(s.started_at);
      const dayLabel = days[date.getDay()];
      weeklyTrend.push({
        day: dayLabel,
        accuracy: Math.round(s.accuracy && s.accuracy <= 1 ? s.accuracy * 100 : (s.accuracy || 90)),
        date: date.toLocaleDateString(),
      });
    });
  }

  // Calculate real achievements status
  const recentAchievements = [
    {
      id: 'first-step',
      title: 'First Step',
      description: 'Complete your first cognitive training game.',
      icon: '🚀',
      unlocked: totalSessions >= 1,
      progress: `${Math.min(totalSessions, 1)} / 1`,
    },
    {
      id: 'focus-star',
      title: 'Focus Explorer',
      description: 'Complete 3 cognitive training challenges.',
      icon: '🎯',
      unlocked: totalSessions >= 3,
      progress: `${Math.min(totalSessions, 3)} / 3`,
    },
    {
      id: 'memory-master',
      title: 'Memory Master',
      description: 'Achieve 100% precision in Memory Match.',
      icon: '🧠',
      unlocked: sessions.some((s) => (s.accuracy || 0) >= 0.95 || (s.score || 0) >= 95),
      progress: sessions.some((s) => (s.accuracy || 0) >= 0.95) ? '1 / 1' : '0 / 1',
    },
    {
      id: 'streak-champion',
      title: 'Streak Pro',
      description: 'Maintain an active daily training streak.',
      icon: '🔥',
      unlocked: streakDays >= 3,
      progress: `${Math.min(streakDays, 3)} / 3 days`,
    },
  ];

  return {
    child,
    totalSessions,
    stars,
    streakDays,
    hasPlayedQuiz,
    domainScores: {
      attention: attentionScore,
      memory: memoryScore,
      reasoning: reasoningScore,
      processing: processingScore,
    },
    weeklyTrend,
    activeDaysOfWeek,
    recentAchievements,
  };
}

/**
 * Record a completed game session into Supabase and update local storage.
 */
export async function recordGameSession(
  childId: number,
  exerciseId: number,
  score: number,
  accuracy: number,
  durationSeconds: number,
  starsEarned: number
): Promise<void> {
  const now = new Date().toISOString();

  // 1. Try to insert session into Supabase
  try {
    const sRes = await fetch(`${SUPABASE_URL}/rest/v1/sessions`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        child_id: childId,
        exercise_id: exerciseId,
        started_at: now,
        completed_at: now,
      }),
    });

    if (sRes.ok) {
      const [insertedSession] = await sRes.json();
      if (insertedSession?.id) {
        // Insert performance record
        await fetch(`${SUPABASE_URL}/rest/v1/performance`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: insertedSession.id,
            score: score,
            accuracy: accuracy,
            response_time: durationSeconds * 1000,
            errors: 0,
            difficulty: 1,
          }),
        });
      }
    }
  } catch (err) {
    console.warn('Could not post session to Supabase, saving locally:', err);
  }

  // 2. Save session locally
  if (typeof window !== 'undefined') {
    try {
      const localKey = `neuroadapt_local_sessions_${childId}`;
      const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
      const newRecord = {
        id: Date.now(),
        child_id: childId,
        exercise_id: exerciseId,
        domain: 'memory',
        started_at: now,
        completed_at: now,
        score,
        accuracy,
        response_time: durationSeconds * 1000,
      };
      localStorage.setItem(localKey, JSON.stringify([...existing, newRecord]));

      // Update stars
      const starKey = `neuroadapt_stars_${childId}`;
      const currentStars = parseInt(localStorage.getItem(starKey) || '0', 10);
      localStorage.setItem(starKey, (currentStars + starsEarned).toString());
    } catch {}
  }
}
