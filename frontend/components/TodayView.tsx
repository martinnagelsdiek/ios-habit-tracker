import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import { HabitCard } from "./HabitCard";
import { CompletionDialog } from "./leveling/CompletionDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Target } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { FEATURE_LEVELING } from "../config";
import type { TodayHabit } from "~backend/habits/today";

export function TodayView() {
  const [completionHabit, setCompletionHabit] = useState<TodayHabit | null>(null);
  const backend = useBackend();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["today-habits"],
    queryFn: () => backend.habits.getTodayHabits(),
  });

  const completeMutation = useMutation({
    mutationFn: (habitId: number) => backend.habits.completeHabit({ habitId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-habits"] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
    },
    onError: (error) => {
      console.error("Failed to complete habit:", error);
      toast({
        title: "Error",
        description: "Failed to mark habit as complete",
        variant: "destructive",
      });
    },
  });

  const uncompleteMutation = useMutation({
    mutationFn: (habitId: number) => backend.habits.uncompleteHabit({ habitId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-habits"] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
    },
    onError: (error) => {
      console.error("Failed to uncomplete habit:", error);
      toast({
        title: "Error",
        description: "Failed to remove habit completion",
        variant: "destructive",
      });
    },
  });

  const handleToggleCompletion = (habit: TodayHabit) => {
    if (habit.isCompleted) {
      uncompleteMutation.mutate(habit.id);
    } else {
      // Use completion dialog for leveling system, or direct completion for fallback
      if (FEATURE_LEVELING) {
        setCompletionHabit(habit);
      } else {
        completeMutation.mutate(habit.id);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const habits = data?.habits || [];

  return (
    <div className="space-y-6">
      {/* Today's Habits */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Today's Habits</h2>
        {habits.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No habits scheduled for today. Check back tomorrow or create new habits!</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onToggleCompletion={() => handleToggleCompletion(habit)}
                isLoading={completeMutation.isPending || uncompleteMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completion Dialog for Leveling System */}
      {FEATURE_LEVELING && (
        <CompletionDialog
          habit={completionHabit}
          open={!!completionHabit}
          onClose={() => setCompletionHabit(null)}
        />
      )}
    </div>
  );
}
