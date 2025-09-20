import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  level: number;
  xp: number;
  rank: string;
  last7DayCompletions: number;
  className?: string;
}

// Memoized component for better performance
export const CategoryCard = memo(function CategoryCard({
  categoryName,
  categoryColor,
  categoryIcon,
  level,
  xp,
  rank,
  last7DayCompletions,
  className
}: CategoryCardProps) {
  // Memoize expensive calculations
  const progressData = useMemo(() => {
    const xpToNext = level < 100 ? Math.round(100 * Math.pow(level + 1, 1.6)) : 0;
    const currentLevelXP = level > 1 ? Math.round(100 * Math.pow(level, 1.6)) : 0;
    const progressXP = xp - currentLevelXP;
    const neededXP = xpToNext - currentLevelXP;
    const progressPercent = neededXP > 0 ? (progressXP / neededXP) * 100 : 100;

    return {
      progressXP,
      neededXP,
      progressPercent: Math.max(0, Math.min(100, progressPercent))
    };
  }, [level, xp]);

  // Memoize rank color calculation
  const rankColorClass = useMemo(() => {
    switch (rank) {
      case "Legendary": return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20";
      case "Grandmaster": return "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20";
      case "Master": return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20";
      case "Expert": return "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20";
      case "Adept": return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20";
      case "Apprentice": return "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20";
      default: return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20";
    }
  }, [rank]);

  // Memoize icon component
  const IconComponent = useMemo(() => {
    return (LucideIcons as any)[categoryIcon] as LucideIcon || LucideIcons.Target;
  }, [categoryIcon]);

  return (
    <Card className={cn("relative overflow-hidden hover:shadow-md transition-all", className)}>
      <div 
        className="absolute inset-0 opacity-5"
        style={{ backgroundColor: categoryColor }}
      />
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: categoryColor }}
            >
              <IconComponent className="w-4 h-4" />
            </div>
            {categoryName}
          </CardTitle>
          <div className="text-right">
            <div className="text-2xl font-bold">L{level}</div>
            <Badge className={cn("text-xs", rankColorClass)}>
              {rank}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {level < 100 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">To Level {level + 1}</span>
              <span className="font-medium">
                {progressData.progressXP.toLocaleString()} / {progressData.neededXP.toLocaleString()} XP
              </span>
            </div>
            <Progress 
              value={progressData.progressPercent} 
              className="h-2"
            />
          </div>
        )}
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Last 7 days</span>
          <span className="font-medium">
            {last7DayCompletions} {last7DayCompletions === 1 ? 'completion' : 'completions'}
          </span>
        </div>
        
        <div className="flex justify-between items-center text-sm pt-2 border-t">
          <span className="text-muted-foreground">Total XP</span>
          <span className="font-semibold">
            {xp.toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
});