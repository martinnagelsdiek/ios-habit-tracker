import { api } from "encore.dev/api";
import db from "../db";

export interface HabitTemplate {
  id: number;
  name: string;
  description: string | null;
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  frequencyType: string;
  suggestedFrequencyDay: number | null;
  suggestedRecursOnWeekday: boolean;
  tags: string[];
}

export interface TemplatesByCategory {
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  templates: HabitTemplate[];
}

interface GetTemplatesResponse {
  templatesByCategory: TemplatesByCategory[];
}

interface SearchTemplatesRequest {
  query?: string;
  categoryId?: number;
}

interface SearchTemplatesResponse {
  templates: HabitTemplate[];
}

interface CreateFromTemplateRequest {
  templateId: number;
  dueDate: string; // YYYY-MM-DD format
  customName?: string; // optional custom name override
  customDescription?: string; // optional custom description override
  frequencyDay?: number; // optional override for frequency day
  recursOnWeekday?: boolean; // optional override for recurs on weekday
}

// Retrieves all habit templates organized by category.
export const getTemplates = api<void, GetTemplatesResponse>(
  { expose: true, method: "GET", path: "/habits/templates" },
  async () => {
    const templatesData = await db.queryAll<{
      template_id: number;
      template_name: string;
      template_description: string | null;
      frequency_type: string;
      suggested_frequency_day: number | null;
      suggested_recurs_on_weekday: boolean;
      tags: string[];
      category_id: number;
      category_name: string;
      category_color: string;
      category_icon: string;
    }>`
      SELECT 
        ht.id as template_id,
        ht.name as template_name,
        ht.description as template_description,
        ht.frequency_type,
        ht.suggested_frequency_day,
        ht.suggested_recurs_on_weekday,
        ht.tags,
        c.id as category_id,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon
      FROM habit_templates ht
      JOIN categories c ON ht.category_id = c.id
      ORDER BY c.name, ht.name
    `;

    // Group templates by category
    const categoryMap = new Map<number, TemplatesByCategory>();
    
    for (const row of templatesData) {
      if (!categoryMap.has(row.category_id)) {
        categoryMap.set(row.category_id, {
          categoryId: row.category_id,
          categoryName: row.category_name,
          categoryColor: row.category_color,
          categoryIcon: row.category_icon,
          templates: []
        });
      }

      const category = categoryMap.get(row.category_id)!;
      category.templates.push({
        id: row.template_id,
        name: row.template_name,
        description: row.template_description,
        categoryId: row.category_id,
        categoryName: row.category_name,
        categoryColor: row.category_color,
        categoryIcon: row.category_icon,
        frequencyType: row.frequency_type,
        suggestedFrequencyDay: row.suggested_frequency_day,
        suggestedRecursOnWeekday: row.suggested_recurs_on_weekday,
        tags: row.tags || []
      });
    }

    return {
      templatesByCategory: Array.from(categoryMap.values())
    };
  }
);

// Search habit templates by name, description, or tags.
export const searchTemplates = api<SearchTemplatesRequest, SearchTemplatesResponse>(
  { expose: true, method: "GET", path: "/habits/templates/search" },
  async (req) => {
    if (req.categoryId && req.query) {
      // Both category and search query
      const searchTerm = `%${req.query.toLowerCase()}%`;
      const templatesData = await db.queryAll<{
        template_id: number;
        template_name: string;
        template_description: string | null;
        frequency_type: string;
        suggested_frequency_day: number | null;
        suggested_recurs_on_weekday: boolean;
        tags: string[];
        category_id: number;
        category_name: string;
        category_color: string;
        category_icon: string;
      }>`
        SELECT 
          ht.id as template_id,
          ht.name as template_name,
          ht.description as template_description,
          ht.frequency_type,
          ht.suggested_frequency_day,
          ht.suggested_recurs_on_weekday,
          ht.tags,
          c.id as category_id,
          c.name as category_name,
          c.color as category_color,
          c.icon as category_icon
        FROM habit_templates ht
        JOIN categories c ON ht.category_id = c.id
        WHERE ht.category_id = ${req.categoryId} AND (
          LOWER(ht.name) LIKE ${searchTerm} OR 
          LOWER(ht.description) LIKE ${searchTerm} OR 
          EXISTS (
            SELECT 1 FROM unnest(ht.tags) as tag 
            WHERE LOWER(tag) LIKE ${searchTerm}
          )
        )
        ORDER BY ht.name
      `;
      
      const templates: HabitTemplate[] = templatesData.map(row => ({
        id: row.template_id,
        name: row.template_name,
        description: row.template_description,
        categoryId: row.category_id,
        categoryName: row.category_name,
        categoryColor: row.category_color,
        categoryIcon: row.category_icon,
        frequencyType: row.frequency_type,
        suggestedFrequencyDay: row.suggested_frequency_day,
        suggestedRecursOnWeekday: row.suggested_recurs_on_weekday,
        tags: row.tags || []
      }));

      return { templates };
    } else if (req.categoryId) {
      // Only category filter
      const templatesData = await db.queryAll<{
        template_id: number;
        template_name: string;
        template_description: string | null;
        frequency_type: string;
        suggested_frequency_day: number | null;
        suggested_recurs_on_weekday: boolean;
        tags: string[];
        category_id: number;
        category_name: string;
        category_color: string;
        category_icon: string;
      }>`
        SELECT 
          ht.id as template_id,
          ht.name as template_name,
          ht.description as template_description,
          ht.frequency_type,
          ht.suggested_frequency_day,
          ht.suggested_recurs_on_weekday,
          ht.tags,
          c.id as category_id,
          c.name as category_name,
          c.color as category_color,
          c.icon as category_icon
        FROM habit_templates ht
        JOIN categories c ON ht.category_id = c.id
        WHERE ht.category_id = ${req.categoryId}
        ORDER BY ht.name
      `;
      
      const templates: HabitTemplate[] = templatesData.map(row => ({
        id: row.template_id,
        name: row.template_name,
        description: row.template_description,
        categoryId: row.category_id,
        categoryName: row.category_name,
        categoryColor: row.category_color,
        categoryIcon: row.category_icon,
        frequencyType: row.frequency_type,
        suggestedFrequencyDay: row.suggested_frequency_day,
        suggestedRecursOnWeekday: row.suggested_recurs_on_weekday,
        tags: row.tags || []
      }));

      return { templates };
    } else if (req.query) {
      // Only search query
      const searchTerm = `%${req.query.toLowerCase()}%`;
      const templatesData = await db.queryAll<{
        template_id: number;
        template_name: string;
        template_description: string | null;
        frequency_type: string;
        suggested_frequency_day: number | null;
        suggested_recurs_on_weekday: boolean;
        tags: string[];
        category_id: number;
        category_name: string;
        category_color: string;
        category_icon: string;
      }>`
        SELECT 
          ht.id as template_id,
          ht.name as template_name,
          ht.description as template_description,
          ht.frequency_type,
          ht.suggested_frequency_day,
          ht.suggested_recurs_on_weekday,
          ht.tags,
          c.id as category_id,
          c.name as category_name,
          c.color as category_color,
          c.icon as category_icon
        FROM habit_templates ht
        JOIN categories c ON ht.category_id = c.id
        WHERE (
          LOWER(ht.name) LIKE ${searchTerm} OR 
          LOWER(ht.description) LIKE ${searchTerm} OR 
          EXISTS (
            SELECT 1 FROM unnest(ht.tags) as tag 
            WHERE LOWER(tag) LIKE ${searchTerm}
          )
        )
        ORDER BY ht.name
      `;
      
      const templates: HabitTemplate[] = templatesData.map(row => ({
        id: row.template_id,
        name: row.template_name,
        description: row.template_description,
        categoryId: row.category_id,
        categoryName: row.category_name,
        categoryColor: row.category_color,
        categoryIcon: row.category_icon,
        frequencyType: row.frequency_type,
        suggestedFrequencyDay: row.suggested_frequency_day,
        suggestedRecursOnWeekday: row.suggested_recurs_on_weekday,
        tags: row.tags || []
      }));

      return { templates };
    } else {
      // No filters, return all templates
      const templatesData = await db.queryAll<{
        template_id: number;
        template_name: string;
        template_description: string | null;
        frequency_type: string;
        suggested_frequency_day: number | null;
        suggested_recurs_on_weekday: boolean;
        tags: string[];
        category_id: number;
        category_name: string;
        category_color: string;
        category_icon: string;
      }>`
        SELECT 
          ht.id as template_id,
          ht.name as template_name,
          ht.description as template_description,
          ht.frequency_type,
          ht.suggested_frequency_day,
          ht.suggested_recurs_on_weekday,
          ht.tags,
          c.id as category_id,
          c.name as category_name,
          c.color as category_color,
          c.icon as category_icon
        FROM habit_templates ht
        JOIN categories c ON ht.category_id = c.id
        ORDER BY ht.name
      `;
      
      const templates: HabitTemplate[] = templatesData.map(row => ({
        id: row.template_id,
        name: row.template_name,
        description: row.template_description,
        categoryId: row.category_id,
        categoryName: row.category_name,
        categoryColor: row.category_color,
        categoryIcon: row.category_icon,
        frequencyType: row.frequency_type,
        suggestedFrequencyDay: row.suggested_frequency_day,
        suggestedRecursOnWeekday: row.suggested_recurs_on_weekday,
        tags: row.tags || []
      }));

      return { templates };
    }
  }
);