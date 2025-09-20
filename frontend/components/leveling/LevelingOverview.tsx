import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useBackend } from "../../hooks/useBackend";
import { OverallLevelCard } from "./OverallLevelCard";
import { CategoryCard } from "./CategoryCard";
import { RadarChart } from "./RadarChart";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";

export function LevelingOverview() {
  const backend = useBackend();

  const { data, isLoading, error } = useQuery({
    queryKey: ["leveling-summary"],
    queryFn: async () => {
      try {
        return await backend.leveling.getSummary();
      } catch (err) {
        console.error("Leveling API error:", err);
        throw err;
      }
    },
    refetchInterval: 5 * 60 * 1000, // Reduced to 5 minutes for mobile
    retry: 1,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });

  // Memoize expensive calculations
  const { categoriesWithProgress, radarChartData } = useMemo(() => {
    if (!data?.categories) {
      return { categoriesWithProgress: [], radarChartData: [] };
    }

    const withProgress = data.categories.filter(cat => cat.level > 1 || cat.xp > 0);
    const sorted = withProgress.sort((a, b) => b.level - a.level || b.xp - a.xp);
    
    const radarData = data.categories.map(cat => ({
      categoryName: cat.categoryName,
      categoryColor: cat.categoryColor,
      level: cat.level,
      rank: cat.rank,
      xp: cat.xp,
      last7DayCompletions: cat.last7DayCompletions
    }));

    return { 
      categoriesWithProgress: sorted, 
      radarChartData: radarData 
    };
  }, [data?.categories]);

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
    console.error("Leveling query error:", error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isAuthError = errorMessage.includes('authentication') || errorMessage.includes('credentials');
    
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <div className="flex items-center gap-2 text-destructive justify-center">
                <AlertCircle className="w-4 h-4" />
                {isAuthError ? 'Authentication Required' : 'Failed to load leveling data'}
              </div>
              <p className="text-sm text-muted-foreground">
                {isAuthError 
                  ? 'Please sign in to view your leveling progress'
                  : `Error: ${errorMessage}`
                }
              </p>
              {isAuthError && (
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Refresh Page
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data || !data.healthy) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 justify-center">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-semibold">Leveling System Initializing</h3>
              </div>
              <p className="text-muted-foreground max-w-md mx-auto">
                The leveling system is being set up in the background. 
                Database migrations are still in progress. Please check back in a few moments.
              </p>
              {data?.error && (
                <p className="text-xs text-muted-foreground mt-2">
                  Technical details: {data.error}
                </p>
              )}
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
      <RadarChart categories={radarChartData} />

      {/* Category Progress Cards */}
      {categoriesWithProgress.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Category Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoriesWithProgress.map((category) => (
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