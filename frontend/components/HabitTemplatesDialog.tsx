import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Search, Clock, ArrowLeft, Plus, Filter } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { HabitTemplate, TemplatesByCategory } from "~backend/habits/templates";

interface HabitTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateSelect?: (template: HabitTemplate) => void;
}

export function HabitTemplatesDialog({ open, onOpenChange, onTemplateSelect }: HabitTemplatesDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<HabitTemplate | null>(null);
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");

  const backend = useBackend();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: templatesData, isLoading } = useQuery({
    queryKey: ["habit-templates"],
    queryFn: () => backend.habits.getTemplates(),
  });

  const { data: searchResults } = useQuery({
    queryKey: ["habit-templates-search", searchQuery, selectedCategoryId],
    queryFn: () => backend.habits.searchTemplates({ 
      query: searchQuery || undefined,
      categoryId: selectedCategoryId === "all" ? undefined : parseInt(selectedCategoryId)
    }),
    enabled: searchQuery.length > 0 || selectedCategoryId !== "all",
  });

  const createFromTemplateMutation = useMutation({
    mutationFn: (template: HabitTemplate) =>
      backend.habits.createHabit({
        name: template.name,
        description: template.description || undefined,
        categoryId: template.categoryId,
        frequencyType: template.frequencyType as any,
        dueDate,
        frequencyDay: template.suggestedFrequencyDay || undefined,
        recursOnWeekday: template.suggestedRecursOnWeekday,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["today-habits"] });
      toast({
        title: "Success",
        description: "Habit created from template!",
      });
      onOpenChange(false);
      resetDialog();
    },
    onError: (error) => {
      console.error("Failed to create habit from template:", error);
      toast({
        title: "Error",
        description: "Failed to create habit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetDialog = () => {
    setSearchQuery("");
    setSelectedTemplate(null);
    setDueDate(new Date().toISOString().split('T')[0]);
    setSelectedCategoryId("all");
  };

  const handleTemplateClick = (template: HabitTemplate) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
      onOpenChange(false);
      resetDialog();
    } else {
      setSelectedTemplate(template);
    }
  };

  const handleCreateFromTemplate = () => {
    if (selectedTemplate) {
      createFromTemplateMutation.mutate(selectedTemplate);
    }
  };

  // Get all templates in a flat list
  const allTemplates = useMemo(() => {
    if (searchQuery.length > 0 || selectedCategoryId !== "all") {
      return searchResults?.templates || [];
    }
    
    const templates: HabitTemplate[] = [];
    templatesData?.templatesByCategory.forEach(category => {
      templates.push(...category.templates);
    });
    return templates;
  }, [templatesData, searchResults, searchQuery, selectedCategoryId]);

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    if (!templatesData) return [];
    return templatesData.templatesByCategory.map(cat => ({
      id: cat.categoryId,
      name: cat.categoryName,
      color: cat.categoryColor,
      icon: cat.categoryIcon
    }));
  }, [templatesData]);

  const TemplateCard = ({ template }: { template: HabitTemplate }) => {
    const IconComponent = LucideIcons[template.categoryIcon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
    
    return (
      <div 
        className="p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
        onClick={() => handleTemplateClick(template)}
      >
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-2 mt-0.5">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: template.categoryColor }}
            />
            {IconComponent && <IconComponent className="w-4 h-4 flex-shrink-0" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-sm leading-tight">{template.name}</h4>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground capitalize">
                  {template.frequencyType}
                </span>
              </div>
            </div>
            
            {template.description && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {template.description}
              </p>
            )}
            
            <div className="flex items-center justify-between mt-3">
              <Badge variant="outline" className="text-xs">
                {template.categoryName}
              </Badge>
              
              {template.tags.length > 0 && (
                <div className="flex gap-1">
                  {template.tags.slice(0, 2).map((tag) => (
                    <span 
                      key={tag} 
                      className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                  {template.tags.length > 2 && (
                    <span className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                      +{template.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (selectedTemplate) {
    const IconComponent = LucideIcons[selectedTemplate.categoryIcon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
    
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTemplate(null)}
                className="p-1 h-auto"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <DialogTitle>Create Habit from Template</DialogTitle>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted">
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedTemplate.categoryColor }}
                  />
                  {IconComponent && <IconComponent className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{selectedTemplate.name}</h4>
                  {selectedTemplate.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedTemplate.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {selectedTemplate.frequencyType}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {selectedTemplate.categoryName}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Start Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setSelectedTemplate(null)}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleCreateFromTemplate}
                disabled={createFromTemplateMutation.isPending}
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                {createFromTemplateMutation.isPending ? "Creating..." : "Create Habit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); if (!open) resetDialog(); }}>
      <DialogContent className="sm:max-w-3xl h-[700px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Habit Templates</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col min-h-0">
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => {
                    const IconComponent = LucideIcons[category.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
                    return (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {IconComponent && <IconComponent className="w-3 h-3" />}
                          {category.name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              
              {(searchQuery || selectedCategoryId !== "all") && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategoryId("all");
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Loading templates...</p>
            </div>
          ) : (
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="space-y-3 pr-4">
                  {allTemplates.length > 0 ? (
                    <>
                      <div className="text-sm text-muted-foreground mb-3">
                        {allTemplates.length} template{allTemplates.length !== 1 ? 's' : ''} found
                      </div>
                      {allTemplates.map((template) => (
                        <TemplateCard key={template.id} template={template} />
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-2">No templates found</p>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your search or filter criteria
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}