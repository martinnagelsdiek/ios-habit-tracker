import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { FrequencyType } from "./create";

export interface TodayHabit {
  id: number;
  name: string;
  description: string | null;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  frequencyType: FrequencyType;
  dueDate: Date;
  frequencyDay: number | null;
  recursOnWeekday: boolean;
  isCompleted: boolean;
  currentStreak: number;
}

interface TodayResponse {
  habits: TodayHabit[];
  completionRate: number;
}

// Retrieves today's habits with completion status based on due dates and recurrence.
export const getTodayHabits = api<void, TodayResponse>(
  { auth: true, expose: true, method: "GET", path: "/habits/today" },
  async () => {
    const auth = getAuthData()!;
    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0];
    
    // Get all active habits for the user
    const allHabits = await db.queryAll<{
      id: number;
      name: string;
      description: string | null;
      frequency_type: FrequencyType;
      due_date: Date;
      frequency_day: number | null;
      recurs_on_weekday: boolean;
      category_name: string;
      category_color: string;
      category_icon: string;
      created_at: Date;
    }>`
      SELECT 
        h.id,
        h.name,
        h.description,
        h.frequency_type,
        h.due_date,
        h.frequency_day,
        h.recurs_on_weekday,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        h.created_at
      FROM habits h
      JOIN categories c ON h.category_id = c.id
      WHERE h.user_id = ${auth.userID} AND h.is_active = TRUE
      ORDER BY h.due_date ASC
    `;

    const todayHabits: TodayHabit[] = [];
    
    for (const habit of allHabits) {
      // Check if this habit should appear today based on its due date and recurrence
      if (shouldShowHabitToday(habit, today)) {
        // Check if completed today
        const completion = await db.queryRow`
          SELECT id 
          FROM habit_completions 
          WHERE habit_id = ${habit.id} AND completion_date = ${todayDateString}
        `;
        
        // Calculate current streak
        const completions = await db.queryAll<{ completion_date: string }>`
          SELECT completion_date 
          FROM habit_completions 
          WHERE habit_id = ${habit.id}
          ORDER BY completion_date DESC
        `;
        
        const currentStreak = calculateCurrentStreak(completions.map(c => c.completion_date), habit.frequency_type);
        
        todayHabits.push({
          id: habit.id,
          name: habit.name,
          description: habit.description,
          categoryName: habit.category_name,
          categoryColor: habit.category_color,
          categoryIcon: habit.category_icon,
          frequencyType: habit.frequency_type,
          dueDate: habit.due_date,
          frequencyDay: habit.frequency_day,
          recursOnWeekday: habit.recurs_on_weekday,
          isCompleted: !!completion,
          currentStreak,
        });
      }
    }
    
    const completionRate = todayHabits.length > 0 
      ? Math.round((todayHabits.filter(h => h.isCompleted).length / todayHabits.length) * 100)
      : 0;
    
    return { habits: todayHabits, completionRate };
  }
);

function shouldShowHabitToday(habit: any, today: Date): boolean {
  const dueDate = new Date(habit.due_date);
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  
  // Don't show habits due in the future
  if (dueDateOnly > todayDateOnly) return false;
  
  switch (habit.frequency_type) {
    case 'daily':
      // Show every day from the due date onwards
      return dueDateOnly <= todayDateOnly;
      
    case 'weekly':
      // Show once a week based on due date
      return shouldShowWeeklyHabit(dueDate, today, habit.recurs_on_weekday, habit.frequency_day);
      
    case 'monthly':
      // Show once a month based on due date
      return shouldShowMonthlyHabit(dueDate, today, habit.recurs_on_weekday, habit.frequency_day);
      
    case 'quarterly':
      // Show once every 3 months based on due date
      return shouldShowQuarterlyHabit(dueDate, today, habit.recurs_on_weekday, habit.frequency_day);
      
    case 'semi-annually':
      // Show once every 6 months based on due date
      return shouldShowSemiAnnuallyHabit(dueDate, today, habit.recurs_on_weekday, habit.frequency_day);
      
    case 'annually':
      // Show once a year based on due date
      return shouldShowAnnuallyHabit(dueDate, today, habit.recurs_on_weekday);
      
    default:
      return false;
  }
}

function shouldShowWeeklyHabit(dueDate: Date, today: Date, recursOnWeekday: boolean, frequencyDay: number | null): boolean {
  if (recursOnWeekday) {
    // Recur on the same weekday as the due date
    const dueDateWeekday = dueDate.getDay();
    const todayWeekday = today.getDay();
    
    if (todayWeekday !== dueDateWeekday) return false;
    
    // Check if enough weeks have passed
    const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= 0 && daysDiff % 7 === 0;
  } else {
    // Recur on exact dates (every 7 days from due date)
    const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= 0 && daysDiff % 7 === 0;
  }
}

function shouldShowMonthlyHabit(dueDate: Date, today: Date, recursOnWeekday: boolean, frequencyDay: number | null): boolean {
  if (recursOnWeekday) {
    // Recur on the same weekday of the month (e.g., first Monday of each month)
    return shouldShowSameWeekdayOfMonth(dueDate, today);
  } else {
    // Recur on the same date of each month
    if (today.getDate() !== dueDate.getDate()) return false;
    
    // Check if this is the due date or a month after
    const monthsDiff = (today.getFullYear() - dueDate.getFullYear()) * 12 + (today.getMonth() - dueDate.getMonth());
    return monthsDiff >= 0;
  }
}

function shouldShowQuarterlyHabit(dueDate: Date, today: Date, recursOnWeekday: boolean, frequencyDay: number | null): boolean {
  if (recursOnWeekday) {
    return shouldShowSameWeekdayOfQuarter(dueDate, today);
  } else {
    if (today.getDate() !== dueDate.getDate()) return false;
    
    const monthsDiff = (today.getFullYear() - dueDate.getFullYear()) * 12 + (today.getMonth() - dueDate.getMonth());
    return monthsDiff >= 0 && monthsDiff % 3 === 0;
  }
}

function shouldShowSemiAnnuallyHabit(dueDate: Date, today: Date, recursOnWeekday: boolean, frequencyDay: number | null): boolean {
  if (recursOnWeekday) {
    return shouldShowSameWeekdayOfSemiYear(dueDate, today);
  } else {
    if (today.getDate() !== dueDate.getDate()) return false;
    
    const monthsDiff = (today.getFullYear() - dueDate.getFullYear()) * 12 + (today.getMonth() - dueDate.getMonth());
    return monthsDiff >= 0 && monthsDiff % 6 === 0;
  }
}

function shouldShowAnnuallyHabit(dueDate: Date, today: Date, recursOnWeekday: boolean): boolean {
  if (recursOnWeekday) {
    return shouldShowSameWeekdayOfYear(dueDate, today);
  } else {
    // Same date each year
    return today.getMonth() === dueDate.getMonth() && today.getDate() === dueDate.getDate();
  }
}

function shouldShowSameWeekdayOfMonth(dueDate: Date, today: Date): boolean {
  // Check if today is the same weekday and same week-of-month as due date
  if (today.getDay() !== dueDate.getDay()) return false;
  
  const dueDateWeekOfMonth = Math.ceil(dueDate.getDate() / 7);
  const todayWeekOfMonth = Math.ceil(today.getDate() / 7);
  
  return dueDateWeekOfMonth === todayWeekOfMonth;
}

function shouldShowSameWeekdayOfQuarter(dueDate: Date, today: Date): boolean {
  // Simplified: show on same weekday, same week of the quarter month
  if (today.getDay() !== dueDate.getDay()) return false;
  
  const monthsDiff = (today.getFullYear() - dueDate.getFullYear()) * 12 + (today.getMonth() - dueDate.getMonth());
  if (monthsDiff < 0 || monthsDiff % 3 !== 0) return false;
  
  return shouldShowSameWeekdayOfMonth(dueDate, today);
}

function shouldShowSameWeekdayOfSemiYear(dueDate: Date, today: Date): boolean {
  if (today.getDay() !== dueDate.getDay()) return false;
  
  const monthsDiff = (today.getFullYear() - dueDate.getFullYear()) * 12 + (today.getMonth() - dueDate.getMonth());
  if (monthsDiff < 0 || monthsDiff % 6 !== 0) return false;
  
  return shouldShowSameWeekdayOfMonth(dueDate, today);
}

function shouldShowSameWeekdayOfYear(dueDate: Date, today: Date): boolean {
  if (today.getDay() !== dueDate.getDay()) return false;
  
  // Same month and same week of month
  if (today.getMonth() !== dueDate.getMonth()) return false;
  
  return shouldShowSameWeekdayOfMonth(dueDate, today);
}

function calculateCurrentStreak(completionDates: string[], frequencyType: FrequencyType): number {
  if (completionDates.length === 0) return 0;

  const dates = completionDates.map(d => new Date(d + 'T00:00:00Z')).sort((a, b) => b.getTime() - a.getTime());
  const today = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z');
  
  let currentStreak = 0;
  
  // For daily habits, check consecutive days
  if (frequencyType === 'daily') {
    let checkDate = new Date(today);
    for (const date of dates) {
      if (date.getTime() === checkDate.getTime()) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  } else {
    // For non-daily habits, count consecutive expected occurrences
    // This is a simplified approach - could be made more sophisticated
    currentStreak = dates.length;
  }
  
  return currentStreak;
}