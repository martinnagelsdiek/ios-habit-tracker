import { useQuery } from "@tanstack/react-query";
import backend from "~backend/client";
import { OverallLevelCard } from "./OverallLevelCard";
import { CategoryCard } from "./CategoryCard";
import { RadarChart } from "./RadarChart";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";

export function LevelingOverview() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["leveling-summary"],
    queryFn: () => backend.leveling.getSummary(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading your progress...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              Failed to load leveling data
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const categoriesWithProgress = data.categories.filter(cat => cat.level > 1 || cat.xp > 0);

  return (
    <div className="space-y-6">
      {/* Overall Level */}
      <OverallLevelCard
        level={data.overall.level}
        currentXP={data.overall.currentXP}
        neededXP={data.overall.neededXP}
        totalXP={data.overall.totalXP}
      />

      {/* Skills Radar Chart */}
      <RadarChart 
        categories={data.categories.map(cat => ({
          categoryName: cat.categoryName,
          categoryColor: cat.categoryColor,
          level: cat.level,
          rank: cat.rank,
          xp: cat.xp,
          last7DayCompletions: cat.last7DayCompletions
        }))}
      />

      {/* Category Progress Cards */}
      {categoriesWithProgress.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Category Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoriesWithProgress
              .sort((a, b) => b.level - a.level || b.xp - a.xp)
              .map((category) => (
                <CategoryCard
                  key={category.categoryId}
                  categoryId={category.categoryId}
                  categoryName={category.categoryName}
                  categoryColor={category.categoryColor}
                  categoryIcon={category.categoryIcon}
                  level={category.level}
                  xp={category.xp}
                  rank={category.rank}
                  last7DayCompletions={category.last7DayCompletions}
                />
              ))}
          </div>
        </div>
      )}

      {categoriesWithProgress.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Start Your Journey</h3>
              <p className="text-muted-foreground">
                Complete some habits to begin earning XP and leveling up your skills!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}