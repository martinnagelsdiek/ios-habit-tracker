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
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get user overall progress
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
      await db.exec`
        INSERT INTO user_progress (user_id, overall_level, overall_current_xp, overall_total_xp)
        VALUES (${userId}, 1, 0, 0)
      `;
      userProgress = { overall_level: 1, overall_current_xp: 0, overall_total_xp: 0 };
    }

    // Get category progress with completion counts
    const categoryData = await db.query<{
      category_id: number;
      category_name: string;
      category_color: string;
      category_icon: string;
      level: number;
      xp: number;
      rank: string;
      last_7d_completions: number;
    }>`
      SELECT 
        c.id as category_id,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        COALESCE(cp.level, 1) as level,
        COALESCE(cp.xp, 0) as xp,
        COALESCE(cp.rank, 'Novice') as rank,
        COALESCE(completion_counts.count, 0) as last_7d_completions
      FROM categories c
      LEFT JOIN category_progress cp ON c.id = cp.category_id AND cp.user_id = ${userId}
      LEFT JOIN (
        SELECT 
          h.category_id,
          COUNT(hc.id) as count
        FROM habit_completions hc
        JOIN habits h ON hc.habit_id = h.id
        WHERE h.user_id = ${userId}
          AND hc.completion_date >= ${sevenDaysAgo}
          AND hc.completion_date <= ${today}
        GROUP BY h.category_id
      ) completion_counts ON c.id = completion_counts.category_id
      ORDER BY c.name
    `;

    // Get today's XP by habit
    const todayXPRows = await db.query<{
      habit_id: number;
      estimated_xp: number;
    }>`
      SELECT 
        hc.habit_id,
        SUM(
          CASE 
            WHEN h.difficulty = 'trivial' THEN 5
            WHEN h.difficulty = 'easy' THEN 10
            WHEN h.difficulty = 'normal' THEN 20
            WHEN h.difficulty = 'hard' THEN 35
            WHEN h.difficulty = 'epic' THEN 60
            ELSE 20
          END
        ) as estimated_xp
      FROM habit_completions hc
      JOIN habits h ON hc.habit_id = h.id
      WHERE h.user_id = ${userId}
        AND hc.completion_date = ${today}
        AND hc.xp_applied = true
      GROUP BY hc.habit_id
    `;

    const todayXPByHabit: Record<number, number> = {};
    for await (const row of todayXPRows) {
      todayXPByHabit[row.habit_id] = row.estimated_xp;
    }

    const categories: CategorySummary[] = [];
    for await (const row of categoryData) {
      categories.push({
        categoryId: row.category_id,
        categoryName: row.category_name,
        categoryColor: row.category_color,
        categoryIcon: row.category_icon,
        level: row.level,
        xp: row.xp,
        rank: row.rank,
        last7DayCompletions: row.last_7d_completions
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
      todayXPByHabit
    };
  }
);