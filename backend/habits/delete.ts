import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface DeleteHabitRequest {
  id: number;
}

export interface DeleteHabitResponse {
  success: boolean;
}

// Soft deletes a habit for the authenticated user by setting is_active to false.
export const deleteHabit = api<DeleteHabitRequest, DeleteHabitResponse>(
  { auth: true, expose: true, method: "DELETE", path: "/habits/:id" },
  async (req) => {
    const auth = getAuthData()!;
    
    // Check if habit exists and belongs to user
    const existingHabit = await db.queryRow`
      SELECT id FROM habits WHERE id = ${req.id} AND user_id = ${auth.userID} AND is_active = true
    `;
    if (!existingHabit) {
      throw APIError.notFound("habit not found");
    }

    // Soft delete by setting is_active to false
    await db.exec`
      UPDATE habits 
      SET is_active = false 
      WHERE id = ${req.id} AND user_id = ${auth.userID}
    `;

    return {
      success: true,
    };
  }
);