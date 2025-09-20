import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { xpNeededForNext } from "./engine";

export interface CategorySummary {
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  level: number;
  xp: number;
  rank: string;
  last7DayCompletions: number;
}

export interface LevelingSummaryResponse {
  overall: {
    level: number;
    currentXP: number;
    neededXP: number;
    totalXP: number;
  };
  categories: CategorySummary[];
  todayXPByHabit: Record<number, number>;
  healthy: boolean;
  error?: string;
}

export const getSummary = api<{}, LevelingSummaryResponse>(
  { auth: true, expose: true, method: "GET", path: "/leveling/summary" },
  async () => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    try {
      // First check if leveling tables exist (integrated health check)
      let tablesExist = true;
      let healthError: string | undefined;
      
      try {
        await db.queryRow`SELECT 1 FROM user_progress LIMIT 1`;
        await db.queryRow`SELECT 1 FROM category_progress LIMIT 1`;
      } catch (err) {
        tablesExist = false;
        healthError = err instanceof Error ? err.message : 'Unknown error';
      }

      if (!tablesExist) {
        return {
          overall: { level: 1, currentXP: 0, neededXP: 100, totalXP: 0 },
          categories: [],
          todayXPByHabit: {},
          healthy: false,
          error: healthError
        };
      }

      // Try to get user overall progress
      let userProgress = await db.queryRow<{
        overall_level: number;
        overall_current_xp: number;
        overall_total_xp: number;
      }>`
        SELECT overall_level, overall_current_xp, overall_total_xp
        FROM user_progress
        WHERE user_id = ${userId}
      `;

      // Create default if doesn't exist
      if (!userProgress) {
        userProgress = { overall_level: 1, overall_current_xp: 0, overall_total_xp: 0 };
      }

      // Single optimized query to get all category data at once
      const categoryData = await db.query<{
        id: number;
        name: string;
        color: string;
        icon: string;
        level: number | null;
        xp: number | null;
        rank: string | null;
        completions_count: number;
      }>`
        SELECT 
          c.id,
          c.name,
          c.color,
          c.icon,
          cp.level,
          cp.xp,
          cp.rank,
          COALESCE(cc.completions_count, 0) as completions_count
        FROM categories c
        LEFT JOIN category_progress cp ON c.id = cp.category_id AND cp.user_id = ${userId}
        LEFT JOIN (
          SELECT 
            h.category_id,
            COUNT(*) as completions_count
          FROM habit_completions hc
          JOIN habits h ON hc.habit_id = h.id
          WHERE h.user_id = ${userId} 
            AND hc.completion_date >= DATE('now', '-7 days')
          GROUP BY h.category_id
        ) cc ON c.id = cc.category_id
        ORDER BY c.name
      `;

      const categories: CategorySummary[] = [];
      for await (const cat of categoryData) {
        categories.push({
          categoryId: cat.id,
          categoryName: cat.name,
          categoryColor: cat.color,
          categoryIcon: cat.icon,
          level: cat.level || 1,
          xp: cat.xp || 0,
          rank: cat.rank || 'Novice',
          last7DayCompletions: cat.completions_count
        });
      }

      return {
        overall: {
          level: userProgress.overall_level,
          currentXP: userProgress.overall_current_xp,
          neededXP: xpNeededForNext(userProgress.overall_level),
          totalXP: userProgress.overall_total_xp
        },
        categories,
        todayXPByHabit: {},
        healthy: true
      };
    } catch (error) {
      console.error("Error in getSummary:", error);
      return {
        overall: { level: 1, currentXP: 0, neededXP: 100, totalXP: 0 },
        categories: [],
        todayXPByHabit: {},
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
);