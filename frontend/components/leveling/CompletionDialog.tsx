import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Zap, Star, TrendingUp, Trophy, Loader2 } from "lucide-react";
import { useBackend } from "../../hooks/useBackend";
import type { TodayHabit } from "~backend/habits/today";

interface CompletionDialogProps {
  habit: TodayHabit | null;
  open: boolean;
  onClose: () => void;
}

export function CompletionDialog({ habit, open, onClose }: CompletionDialogProps) {
  const [amount, setAmount] = useState("");
  const backend = useBackend();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const levelingMutation = useMutation({
    mutationFn: (data: { habitId: number; amount?: number }) => 
      backend.leveling.completeHabit(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["today-habits"] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["leveling-summary"] });
      
      // Show XP toast
      const { breakdown, newLevels } = data;
      let message = `+${breakdown.categoryGain} Category XP, +${breakdown.overallGain} Overall XP`;
      
      if (newLevels.categoryLeveledUp) {
        message += ` • Level ${newLevels.categoryNewLevel}!`;
      }
      if (newLevels.categoryRankChanged) {
        message += ` • Rank: ${newLevels.categoryNewRank}!`;
      }
      if (newLevels.overallLeveledUp) {
        message += ` • Overall Level ${newLevels.overallNewLevel}!`;
      }

      toast({
        title: "Habit Completed! ⚡",
        description: message,
        duration: 5000,
      });
      
      handleClose();
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

  const fallbackMutation = useMutation({
    mutationFn: (habitId: number) => backend.habits.completeHabit({ habitId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-habits"] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      toast({
        title: "Habit Completed! ✅",
        description: "Great job on completing your habit!",
      });
      handleClose();
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

  const handleComplete = () => {
    if (!habit) return;

    // Try leveling system first, fallback to regular completion
    try {
      levelingMutation.mutate({
        habitId: habit.id,
        amount: amount ? parseInt(amount) : undefined,
      });
    } catch (error) {
      fallbackMutation.mutate(habit.id);
    }
  };

  const handleClose = () => {
    setAmount("");
    onClose();
  };

  if (!habit) return null;

  const hasTarget = false; // TodayHabit doesn't include target/unit info
  const isLoading = levelingMutation.isPending || fallbackMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: habit.categoryColor }}
            />
            Complete Habit
          </DialogTitle>
          <DialogDescription>
            Mark "{habit.name}" as completed for today
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount (optional)
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount if applicable"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
            />
            <p className="text-xs text-muted-foreground">
              Optional: Enter the amount you completed for better XP calculation
            </p>
          </div>

          {/* XP Preview (simplified for now) */}
          <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Zap className="w-4 h-4 text-yellow-500" />
              XP Preview
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Base XP
                </span>
                <span>~20 XP</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Category Gain
                </span>
                <span>~20 XP</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  Overall Gain
                </span>
                <span>~15 XP</span>
              </div>
            </div>
            
            <Separator />
            
            <div className="text-xs text-muted-foreground text-center">
              Actual XP may vary based on quality, streaks, and daily activity
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Completing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Complete Habit
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}