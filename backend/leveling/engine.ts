export type Difficulty = "trivial" | "easy" | "normal" | "hard" | "epic";
export type Cadence = "daily" | "weekly" | "custom";
export type Rank = "Novice" | "Apprentice" | "Adept" | "Expert" | "Master" | "Grandmaster" | "Legendary";

export const DIFFICULTY_BASE: Record<Difficulty, number> = {
  trivial: 5,
  easy: 10,
  normal: 20,
  hard: 35,
  epic: 60,
};

export function xpToReachLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(100 * Math.pow(level, 1.6));
}

export function xpNeededForNext(level: number): number {
  if (level >= 100) return 0;
  return xpToReachLevel(level + 1) - xpToReachLevel(level);
}

export function qualityFactor(amount?: number, target?: number): number {
  if (!target || !amount) return 1;
  const q = amount / target;
  return Math.max(0.25, Math.min(1.5, q));
}

export function streakBonus(habitXP: number, cadence: Cadence, streakCount: number): number {
  const rate = cadence === "weekly" ? 0.12 : 0.10;
  const cap = cadence === "weekly" ? 26 : 30;
  const raw = Math.floor(Math.min(streakCount, cap) * rate * habitXP);
  return Math.min(habitXP, raw); // cap at +100% of base
}

export function diminishingReturns(todayFracFromHabit: number): number {
  if (todayFracFromHabit <= 0.6) return 1;
  const overload = todayFracFromHabit - 0.6; // 0..0.4+
  return Math.max(0.5, 1 - 0.5 * (overload / 0.4)); // linear to 0.5
}

export function mapRank(level: number): Rank {
  if (level === 100) return "Legendary";
  if (level >= 95) return "Grandmaster";
  if (level >= 80) return "Master";
  if (level >= 60) return "Expert";
  if (level >= 40) return "Adept";
  if (level >= 20) return "Apprentice";
  return "Novice";
}

export interface ComputeXPParams {
  difficulty: Difficulty;
  cadence: Cadence;
  streakCount: number;
  amount?: number;
  target?: number;
  todayFracFromHabit: number; // 0..1 fraction of today's XP from this habit before this completion
}

export interface XPBreakdown {
  habitXP: number;
  streak: number;
  mult: number;
  categoryGain: number;
  overallGain: number;
}

export function computeXP(params: ComputeXPParams): XPBreakdown {
  const { difficulty, cadence, streakCount, amount, target, todayFracFromHabit } = params;
  
  const base = DIFFICULTY_BASE[difficulty];
  const q = qualityFactor(amount, target);
  const habitXP = Math.round(base * q);
  const s = streakBonus(habitXP, cadence, streakCount);
  const mult = diminishingReturns(todayFracFromHabit);
  const categoryGain = Math.round((habitXP + s) * mult);
  const overallGain = Math.round(0.75 * categoryGain);
  
  return { habitXP, streak: s, mult, categoryGain, overallGain };
}

export interface UserProgress {
  overallLevel: number;
  overallCurrentXP: number;
  overallTotalXP: number;
}

export interface CategoryProgress {
  level: number;
  xp: number;
  rank: Rank;
}

export function awardOverall(progress: UserProgress, xp: number): { leveledUp: boolean; newLevel: number } {
  const oldLevel = progress.overallLevel;
  progress.overallTotalXP += xp;
  progress.overallCurrentXP += xp;
  
  while (progress.overallLevel < 100 && 
         progress.overallCurrentXP >= xpNeededForNext(progress.overallLevel)) {
    progress.overallCurrentXP -= xpNeededForNext(progress.overallLevel);
    progress.overallLevel++;
  }
  
  return {
    leveledUp: progress.overallLevel > oldLevel,
    newLevel: progress.overallLevel
  };
}

export function awardCategory(cp: CategoryProgress, xp: number): { 
  leveledUp: boolean; 
  newLevel: number; 
  rankChanged: boolean; 
  newRank: Rank 
} {
  const oldLevel = cp.level;
  const oldRank = cp.rank;
  
  cp.xp += xp;
  while (cp.level < 100 && cp.xp >= xpToReachLevel(cp.level + 1)) {
    cp.level++;
  }
  
  const newRank = mapRank(cp.level);
  cp.rank = newRank;
  
  return {
    leveledUp: cp.level > oldLevel,
    newLevel: cp.level,
    rankChanged: newRank !== oldRank,
    newRank: newRank
  };
}