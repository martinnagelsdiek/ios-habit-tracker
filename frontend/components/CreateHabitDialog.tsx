import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Sparkles } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { FrequencyType } from "~backend/habits/create";
import type { HabitTemplate } from "~backend/habits/templates";
import { HabitTemplatesDialog } from "./HabitTemplatesDialog";

interface CreateHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTemplate?: HabitTemplate;
}

export function CreateHabitDialog({ open, onOpenChange, selectedTemplate }: CreateHabitDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [frequencyType, setFrequencyType] = useState<FrequencyType>("daily");
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]); // Default to today
  const [frequencyDay, setFrequencyDay] = useState<string>("");
  const [recursOnWeekday, setRecursOnWeekday] = useState<boolean>(true);
  const [showTemplates, setShowTemplates] = useState(false);

  const backend = useBackend();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => backend.habits.getCategories(),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; categoryId: number; frequencyType: FrequencyType; dueDate: string; frequencyDay?: number; recursOnWeekday?: boolean }) =>
      backend.habits.createHabit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["today-habits"] });
      toast({
        title: "Success",
        description: "Habit created successfully!",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      console.error("Failed to create habit:", error);
      toast({
        title: "Error",
        description: "Failed to create habit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategoryId("");
    setFrequencyType("daily");
    setDueDate(new Date().toISOString().split('T')[0]);
    setFrequencyDay("");
    setRecursOnWeekday(true);
  };

  // Fill form with template data when selectedTemplate changes
  useEffect(() => {
    if (selectedTemplate) {
      setName(selectedTemplate.name);
      setDescription(selectedTemplate.description || "");
      setCategoryId(selectedTemplate.categoryId.toString());
      setFrequencyType(selectedTemplate.frequencyType as FrequencyType);
      setFrequencyDay(selectedTemplate.suggestedFrequencyDay?.toString() || "");
      setRecursOnWeekday(selectedTemplate.suggestedRecursOnWeekday);
    }
  }, [selectedTemplate]);

  const handleTemplateSelect = (template: HabitTemplate) => {
    setName(template.name);
    setDescription(template.description || "");
    setCategoryId(template.categoryId.toString());
    setFrequencyType(template.frequencyType as FrequencyType);
    setFrequencyDay(template.suggestedFrequencyDay?.toString() || "");
    setRecursOnWeekday(template.suggestedRecursOnWeekday);
    setShowTemplates(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId) return;

    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      categoryId: parseInt(categoryId),
      frequencyType,
      dueDate,
      frequencyDay: frequencyDay ? parseInt(frequencyDay) : undefined,
      recursOnWeekday: frequencyType !== "daily" ? recursOnWeekday : undefined,
    });
  };

  const categories = categoriesData?.categories || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Habit</DialogTitle>
        </DialogHeader>
        
        <div className="mb-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowTemplates(true)}
            className="w-full"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Browse Habit Templates
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Habit Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Morning workout"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => {
                  const IconComponent = LucideIcons[category.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
                  return (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {IconComponent && <IconComponent className="w-4 h-4" />}
                        {category.name}
                      </div>
                    </SelectItem>
                  );
                })}
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

          {frequencyType === "weekly" && !recursOnWeekday && (
            <div className="space-y-2">
              <Label htmlFor="frequencyDay">Day of Week</Label>
              <Select value={frequencyDay} onValueChange={setFrequencyDay}>
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your habit..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim() || !categoryId || createMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending ? "Creating..." : "Create Habit"}
            </Button>
          </div>
        </form>
      </DialogContent>
      
      <HabitTemplatesDialog
        open={showTemplates}
        onOpenChange={setShowTemplates}
        onTemplateSelect={handleTemplateSelect}
      />
    </Dialog>
  );
}
