import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Target, Edit, Trash2 } from "lucide-react";
import { EditHabitDialog } from "./EditHabitDialog";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import type { Habit } from "~backend/habits/create";

interface HabitsListProps {
  habits: Habit[];
  onHabitsChange: () => void;
}

export function HabitsList({ habits, onHabitsChange }: HabitsListProps) {
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);
  // Group habits by category
  const habitsByCategory = habits.reduce((acc, habit) => {
    if (!acc[habit.categoryName]) {
      acc[habit.categoryName] = [];
    }
    acc[habit.categoryName].push(habit);
    return acc;
  }, {} as Record<string, Habit[]>);

  return (
    <div className="space-y-6">
      {Object.entries(habitsByCategory).map(([categoryName, categoryHabits]) => (
        <div key={categoryName}>
          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: categoryHabits[0].categoryColor }}
            />
            {categoryName}
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {categoryHabits.map((habit) => (
              <Card key={habit.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-start justify-between">
                    <span className="line-clamp-1">{habit.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex-shrink-0">
                        <Target className="w-3 h-3 mr-1" />
                        {habit.frequencyType}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingHabit(habit)}
                          className="h-6 w-6 p-0 hover:bg-muted"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeletingHabit(habit)}
                          className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {habit.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {habit.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Due: {new Date(habit.dueDate).toLocaleDateString()}
                    </div>
                    <div>Created: {new Date(habit.createdAt).toLocaleDateString()}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
      
      <EditHabitDialog
        habit={editingHabit}
        open={!!editingHabit}
        onOpenChange={(open) => !open && setEditingHabit(null)}
        onHabitUpdated={onHabitsChange}
      />
      
      <DeleteConfirmationDialog
        habit={deletingHabit}
        open={!!deletingHabit}
        onOpenChange={(open) => !open && setDeletingHabit(null)}
        onHabitDeleted={onHabitsChange}
      />
    </div>
  );
}
