import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../hooks/useBackend";
import type { Habit, FrequencyType } from "~backend/habits/create";
import type { Category } from "~backend/habits/categories";

interface EditHabitDialogProps {
  habit: Habit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onHabitUpdated: () => void;
}

export function EditHabitDialog({ habit, open, onOpenChange, onHabitUpdated }: EditHabitDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [frequencyType, setFrequencyType] = useState<FrequencyType>("daily");
  const backend = useBackend();
  const [dueDate, setDueDate] = useState<string>("");
  const [frequencyDay, setFrequencyDay] = useState<string>("");
  const [recursOnWeekday, setRecursOnWeekday] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => backend.habits.getCategories(),
    enabled: open,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (habit && open) {
      setName(habit.name);
      setDescription(habit.description || "");
      setCategoryId(habit.categoryId.toString());
      setFrequencyType(habit.frequencyType);
      setDueDate(habit.dueDate.toISOString().split('T')[0]);
      setFrequencyDay(habit.frequencyDay?.toString() || "");
      setRecursOnWeekday(habit.recursOnWeekday);
    }
  }, [habit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habit) return;

    setIsLoading(true);
    try {
      await backend.habits.editHabit({
        id: habit.id,
        name: name.trim(),
        description: description.trim() || undefined,
        categoryId: parseInt(categoryId),
        frequencyType,
        dueDate,
        frequencyDay: frequencyDay ? parseInt(frequencyDay) : undefined,
        recursOnWeekday: frequencyType !== "daily" ? recursOnWeekday : undefined,
      });

      toast({
        title: "Habit updated",
        description: "Your habit has been successfully updated.",
      });
      
      onHabitUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update habit:", error);
      toast({
        title: "Error",
        description: "Failed to update habit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategoryId("");
    setFrequencyType("daily");
    setFrequencyDay("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Habit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter habit name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter habit description"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categoriesData?.categories?.map((category: Category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="frequencyType">Frequency</Label>
            <Select value={frequencyType} onValueChange={(value) => {
              setFrequencyType(value as FrequencyType);
              setFrequencyDay(""); // Reset frequency day when changing type
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="semi-annually">Semi-annually</SelectItem>
                <SelectItem value="annually">Annually</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {frequencyType !== "daily" && frequencyType !== "annually" && (
            <div className="space-y-2">
              <Label>Recurrence Pattern</Label>
              <Select value={recursOnWeekday ? "weekday" : "date"} onValueChange={(value) => setRecursOnWeekday(value === "weekday")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekday">Same weekday pattern</SelectItem>
                  <SelectItem value="date">Exact date pattern</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {recursOnWeekday 
                  ? `Repeats on the same weekday as the due date (e.g., every Monday)` 
                  : `Repeats on the exact same date pattern (e.g., every 7 days from due date)`}
              </p>
            </div>
          )}
          
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Updating..." : "Update Habit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}