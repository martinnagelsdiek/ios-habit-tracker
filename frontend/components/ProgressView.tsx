import { useQuery } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame, TrendingUp, Target, Award } from "lucide-react";
import type { HabitProgress } from "~backend/habits/progress";

export function ProgressView() {
  const backend = useBackend();

  const { data, isLoading } = useQuery({
    queryKey: ["progress"],
    queryFn: () => backend.habits.getProgress(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-2 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const progress = data?.progress || [];

  if (progress.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No progress data available. Start tracking habits to see your progress!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate overall stats
  const totalHabits = progress.length;
  const averageWeeklyRate = Math.round(
    progress.reduce((sum, p) => sum + p.weeklyCompletionRate, 0) / totalHabits
  );
  const averageMonthlyRate = Math.round(
    progress.reduce((sum, p) => sum + p.monthlyCompletionRate, 0) / totalHabits
  );
  const totalCurrentStreak = progress.reduce((sum, p) => sum + p.currentStreak, 0);
  const longestStreakHabit = progress.reduce((max, p) => 
    p.longestStreak > max.longestStreak ? p : max, progress[0]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Progress Overview</h2>
        
        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Habits</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHabits}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageWeeklyRate}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageMonthlyRate}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Streak</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{longestStreakHabit?.longestStreak || 0}</div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {longestStreakHabit?.habitName}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Individual Habit Progress */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Habit Details</h3>
        <div className="grid gap-4">
          {progress.map((habit) => (
            <ProgressCard key={habit.habitId} habit={habit} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ProgressCardProps {
  habit: HabitProgress;
}

function ProgressCard({ habit }: ProgressCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: habit.categoryColor }}
            />
            <div>
              <CardTitle className="text-base">{habit.habitName}</CardTitle>
              <p className="text-sm text-muted-foreground">{habit.categoryName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {habit.currentStreak > 0 && (
              <Badge variant="secondary">
                <Flame className="w-3 h-3 mr-1" />
                {habit.currentStreak} days
              </Badge>
            )}
            {habit.completedToday && (
              <Badge variant="default" className="bg-green-600">
                Completed Today
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Weekly</span>
              <span>{habit.weeklyCompletionRate}%</span>
            </div>
            <Progress value={habit.weeklyCompletionRate} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Monthly</span>
              <span>{habit.monthlyCompletionRate}%</span>
            </div>
            <Progress value={habit.monthlyCompletionRate} className="h-2" />
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Longest Streak</p>
            <p className="text-xl font-bold">{habit.longestStreak} days</p>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Total completions: {habit.totalCompletions}
        </div>
      </CardContent>
    </Card>
  );
}
