import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { Habit } from "~backend/habits/create";

interface DeleteConfirmationDialogProps {
  habit: Habit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onHabitDeleted: () => void;
}

export function DeleteConfirmationDialog({ habit, open, onOpenChange, onHabitDeleted }: DeleteConfirmationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!habit) return;

    setIsLoading(true);
    try {
      await backend.habits.deleteHabit({ id: habit.id });

      toast({
        title: "Habit deleted",
        description: "Your habit has been successfully deleted.",
      });
      
      onHabitDeleted();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to delete habit:", error);
      toast({
        title: "Error",
        description: "Failed to delete habit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Delete Habit
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{habit?.name}"? This action cannot be undone and will remove all progress data for this habit.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-2 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? "Deleting..." : "Delete Habit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}