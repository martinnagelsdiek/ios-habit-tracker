import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TodayHabit } from "~backend/habits/today";

interface HabitCardProps {
  habit: TodayHabit;
  onToggleCompletion: () => void;
  isLoading?: boolean;
}

export function HabitCard({ habit, onToggleCompletion, isLoading }: HabitCardProps) {
  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      habit.isCompleted && "ring-2 ring-green-500/20 bg-green-50/50 dark:bg-green-950/20"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: habit.categoryColor }}
              />
              <span className="text-xs text-muted-foreground font-medium">
                {habit.categoryName}
              </span>
              <Badge variant="outline" className="text-xs ml-auto">
                {habit.frequencyType} • Due: {habit.dueDate.toLocaleDateString()}
              </Badge>
            </div>
            
            <h3 className={cn(
              "font-medium text-sm mb-1 line-clamp-2",
              habit.isCompleted && "line-through text-muted-foreground"
            )}>
              {habit.name}
            </h3>
            
            {habit.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {habit.description}
              </p>
            )}
            
            {habit.currentStreak > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Flame className="w-3 h-3 mr-1" />
                {habit.currentStreak} day streak
              </Badge>
            )}
          </div>
          
          <Button
            size="sm"
            variant={habit.isCompleted ? "default" : "outline"}
            onClick={onToggleCompletion}
            disabled={isLoading}
            className={cn(
              "flex-shrink-0 h-8 w-8 p-0",
              habit.isCompleted && "bg-green-600 hover:bg-green-700 text-white"
            )}
          >
            <Check className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
