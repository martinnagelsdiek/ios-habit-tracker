import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Target, Sparkles } from "lucide-react";
import { CreateHabitDialog } from "./CreateHabitDialog";
import { HabitTemplatesDialog } from "./HabitTemplatesDialog";
import { HabitsList } from "./HabitsList";
import type { HabitTemplate } from "~backend/habits/templates";

export function HabitsView() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTemplatesDialogOpen, setIsTemplatesDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<HabitTemplate | undefined>();
  const backend = useBackend();

  const { data: habitsData, isLoading, refetch } = useQuery({
    queryKey: ["habits"],
    queryFn: () => backend.habits.listHabits(),
  });

  const habits = habitsData?.habits || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-muted rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-24 animate-pulse"></div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Habits</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsTemplatesDialogOpen(true)}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Habit
          </Button>
        </div>
      </div>

      {habits.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No habits yet</h3>
              <p className="mb-4">Create your first habit to start building better routines.</p>
              <div className="flex gap-2 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => setIsTemplatesDialogOpen(true)}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Browse Templates
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Custom
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <HabitsList habits={habits} onHabitsChange={() => refetch()} />
      )}

      <CreateHabitDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
        selectedTemplate={selectedTemplate}
      />
      
      <HabitTemplatesDialog
        open={isTemplatesDialogOpen}
        onOpenChange={setIsTemplatesDialogOpen}
        onTemplateSelect={(template) => {
          setSelectedTemplate(template);
          setIsCreateDialogOpen(true);
          setIsTemplatesDialogOpen(false);
        }}
      />
    </div>
  );
}
