import { useQuery } from "@tanstack/react-query";
import { useBackend } from "../../hooks/useBackend";
import { OverallLevelCard } from "./OverallLevelCard";
import { CategoryCard } from "./CategoryCard";
import { RadarChart } from "./RadarChart";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";

export function LevelingOverview() {
  const backend = useBackend();
  
  // First check if leveling system is available
  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ["leveling-health"],
    queryFn: async () => {
      try {
        return await backend.leveling.checkHealth();
      } catch (err) {
        console.error("Health check failed:", err);
        return { tablesExist: false, error: "Service unavailable" };
      }
    },
    retry: 1,
    staleTime: 60000, // Cache for 1 minute
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["leveling-summary"],
    queryFn: async () => {
      try {
        // Check if the leveling service exists on the backend
        if (!backend.leveling || !backend.leveling.getSummary) {
          throw new Error("Leveling service not available on backend");
        }
        return await backend.leveling.getSummary();
      } catch (err) {
        console.error("Leveling API error:", err);
        throw err;
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 1, // Only retry once to avoid spam
    enabled: healthData?.tablesExist === true, // Only run if tables exist
  });

  if (healthLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking leveling system...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (healthData && !healthData.tablesExist) {
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
              {healthData.error && (
                <p className="text-xs text-muted-foreground mt-2">
                  Technical details: {healthData.error}
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
              {!isAuthError && (
                <p className="text-xs text-muted-foreground">
                  Check console for details
                </p>
              )}
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