import { api } from "encore.dev/api";
import db from "../db";

interface HealthResponse {
  tablesExist: boolean;
  error?: string;
}

export const checkHealth = api<{}, HealthResponse>(
  { expose: true, method: "GET", path: "/leveling/health" },
  async () => {
    try {
      // Check if leveling tables exist
      await db.queryRow`
        SELECT 1 FROM user_progress LIMIT 1
      `;
      
      await db.queryRow`
        SELECT 1 FROM category_progress LIMIT 1
      `;
      
      await db.queryRow`
        SELECT 1 FROM streaks LIMIT 1
      `;
      
      return {
        tablesExist: true
      };
    } catch (error) {
      console.log("Leveling tables not available:", error);
      return {
        tablesExist: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
);