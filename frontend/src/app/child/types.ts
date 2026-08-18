export type TabType =
  | 'home'
  | 'training'
  | 'progress'
  | 'achievements'
  | 'rewards'
  | 'calendar'
  | 'wellbeing'
  | 'profile'
  | 'settings';

export interface CognitiveDomain {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  change: string;
  trend: 'up' | 'down';
  color: string;
  bgLight: string;
  borderColor: string;
  iconName: string;
}

export interface RecommendedGame {
  id: string;
  title: string;
  category: string;
  description: string;
  duration: string;
  stars: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  color: string;
  icon: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  date: string;
  unlocked: boolean;
  progress?: number;
}

export interface RewardItem {
  id: string;
  name: string;
  cost: number;
  category: 'Hat' | 'Badge' | 'Skin' | 'PowerUp';
  icon: string;
  purchased: boolean;
  equipped: boolean;
  color: string;
}

export interface ChildSettings {
  soundEffects: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
}
