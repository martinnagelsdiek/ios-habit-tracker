import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface HabitProgress {
  habitId: number;
  habitName: string;
  categoryName: string;
  categoryColor: string;
  currentStreak: number;
  longestStreak: number;
  completedToday: boolean;
  weeklyCompletionRate: number; // percentage
  monthlyCompletionRate: number; // percentage
  totalCompletions: number;
}

interface ProgressResponse {
  progress: HabitProgress[];
}

// Retrieves progress statistics for all user habits.
export const getProgress = api<void, ProgressResponse>(
  { auth: true, expose: true, method: "GET", path: "/habits/progress" },
  async () => {
    const auth = getAuthData()!;
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const habits = await db.queryAll<{
      habit_id: number;
      habit_name: string;
      category_name: string;
      category_color: string;
      total_completions: number;
      completed_today: boolean;
      weekly_completions: number;
      monthly_completions: number;
    }>`
      SELECT 
        h.id as habit_id,
        h.name as habit_name,
        c.name as category_name,
        c.color as category_color,
        COUNT(hc.id) as total_completions,
        COUNT(CASE WHEN hc.completion_date = ${today} THEN 1 END) > 0 as completed_today,
        COUNT(CASE WHEN hc.completion_date >= ${weekAgo} THEN 1 END) as weekly_completions,
        COUNT(CASE WHEN hc.completion_date >= ${monthAgo} THEN 1 END) as monthly_completions
      FROM habits h
      JOIN categories c ON h.category_id = c.id
      LEFT JOIN habit_completions hc ON h.id = hc.habit_id
      WHERE h.user_id = ${auth.userID} AND h.is_active = TRUE
      GROUP BY h.id, h.name, c.name, c.color
      ORDER BY h.created_at DESC
    `;

    const progress: HabitProgress[] = [];
    
    for (const habit of habits) {
      // Calculate streaks
      const completions = await db.queryAll<{ completion_date: string }>`
        SELECT completion_date 
        FROM habit_completions 
        WHERE habit_id = ${habit.habit_id}
        ORDER BY completion_date DESC
      `;
      
      const { currentStreak, longestStreak } = calculateStreaks(completions.map(c => c.completion_date));
      
      progress.push({
        habitId: habit.habit_id,
        habitName: habit.habit_name,
        categoryName: habit.category_name,
        categoryColor: habit.category_color,
        currentStreak,
        longestStreak,
        completedToday: habit.completed_today,
        weeklyCompletionRate: Math.round((habit.weekly_completions / 7) * 100),
        monthlyCompletionRate: Math.round((habit.monthly_completions / 30) * 100),
        totalCompletions: habit.total_completions,
      });
    }
    
    return { progress };
  }
);

function calculateStreaks(completionDates: string[]): { currentStreak: number; longestStreak: number } {
  if (completionDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const dates = completionDates.map(d => new Date(d + 'T00:00:00Z')).sort((a, b) => b.getTime() - a.getTime());
  const today = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z');
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  // Calculate current streak
  let checkDate = new Date(today);
  for (const date of dates) {
    if (date.getTime() === checkDate.getTime()) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  // Calculate longest streak
  for (let i = 0; i < dates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prevDate = dates[i - 1];
      const currDate = dates[i];
      const daysDiff = Math.round((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);
  
  return { currentStreak, longestStreak };
}
