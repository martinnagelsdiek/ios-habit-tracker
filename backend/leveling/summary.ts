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
}

export const getSummary = api<{}, LevelingSummaryResponse>(
  { auth: true, expose: true, method: "GET", path: "/leveling/summary" },
  async () => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    try {
      // Try to get user overall progress (if table exists)
      let userProgress;
      try {
        userProgress = await db.queryRow<{
          overall_level: number;
          overall_current_xp: number;
          overall_total_xp: number;
        }>`
          SELECT overall_level, overall_current_xp, overall_total_xp
          FROM user_progress
          WHERE user_id = ${userId}
        `;
      } catch (err) {
        // Table might not exist yet - create default progress
        userProgress = null;
      }

      // Create default if doesn't exist
      if (!userProgress) {
        userProgress = { overall_level: 1, overall_current_xp: 0, overall_total_xp: 0 };
      }

      // Get basic categories (these should already exist)
      const basicCategories = await db.query<{
        id: number;
        name: string;
        color: string;
        icon: string;
      }>`
        SELECT id, name, color, icon
        FROM categories
        ORDER BY name
      `;

      const categories: CategorySummary[] = [];
      for await (const cat of basicCategories) {
        // Try to get actual category progress
        let categoryProgress;
        try {
          categoryProgress = await db.queryRow<{
            level: number;
            xp: number;
            rank: string;
          }>`
            SELECT level, xp, rank
            FROM category_progress
            WHERE user_id = ${userId} AND category_id = ${cat.id}
          `;
        } catch (err) {
          categoryProgress = null;
        }

        // Get last 7 days completions count
        let completionsCount = 0;
        try {
          const result = await db.queryRow<{ count: number }>`
            SELECT COUNT(*) as count
            FROM habit_completions hc
            JOIN habits h ON hc.habit_id = h.id
            WHERE h.user_id = ${userId} 
              AND h.category_id = ${cat.id}
              AND hc.completion_date >= DATE('now', '-7 days')
          `;
          completionsCount = result?.count || 0;
        } catch (err) {
          // Ignore error, keep default 0
        }

        categories.push({
          categoryId: cat.id,
          categoryName: cat.name,
          categoryColor: cat.color,
          categoryIcon: cat.icon,
          level: categoryProgress?.level || 1,
          xp: categoryProgress?.xp || 0,
          rank: categoryProgress?.rank || 'Novice',
          last7DayCompletions: completionsCount
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
        todayXPByHabit: {}
      };
    } catch (error) {
      console.error("Error in getSummary:", error);
      throw APIError.internal("Failed to fetch leveling summary", error as Error);
    }
  }
);