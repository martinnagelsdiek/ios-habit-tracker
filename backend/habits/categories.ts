import { api } from "encore.dev/api";
import db from "../db";

export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
}

interface CategoriesResponse {
  categories: Category[];
}

// Retrieves all available habit categories.
export const getCategories = api<void, CategoriesResponse>(
  { expose: true, method: "GET", path: "/categories" },
  async () => {
    const categories = await db.queryAll<Category>`
      SELECT id, name, color, icon FROM categories ORDER BY name
    `;
    return { categories };
  }
);
