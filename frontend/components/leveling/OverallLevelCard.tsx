import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Zap, Crown, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface OverallLevelCardProps {
  level: number;
  currentXP: number;
  neededXP: number;
  totalXP: number;
  className?: string;
}

export function OverallLevelCard({ 
  level, 
  currentXP, 
  neededXP, 
  totalXP,
  className 
}: OverallLevelCardProps) {
  const progressPercent = neededXP > 0 ? (currentXP / neededXP) * 100 : 100;
  
  const getLevelColor = (level: number) => {
    if (level >= 90) return "from-yellow-400 to-orange-500";
    if (level >= 70) return "from-purple-400 to-pink-500";
    if (level >= 50) return "from-blue-400 to-cyan-500";
    if (level >= 30) return "from-green-400 to-emerald-500";
    return "from-gray-400 to-slate-500";
  };

  const getLevelIcon = (level: number) => {
    if (level >= 90) return Crown;
    if (level >= 50) return Star;
    return Zap;
  };

  const LevelIcon = getLevelIcon(level);

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-5",
        getLevelColor(level)
      )} />
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <LevelIcon className={cn(
              "w-5 h-5",
              level >= 90 ? "text-yellow-500" : 
              level >= 50 ? "text-purple-500" : "text-blue-500"
            )} />
            Overall Level
          </CardTitle>
          <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
            L{level}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress to Level {level + 1}</span>
            <span className="font-medium">
              {currentXP.toLocaleString()} / {neededXP.toLocaleString()} XP
            </span>
          </div>
          <Progress 
            value={progressPercent} 
            className="h-3"
          />
        </div>
        
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-sm text-muted-foreground">Total XP Earned</span>
          <span className="font-semibold text-lg">
            {totalXP.toLocaleString()}
          </span>
        </div>
        
        {level >= 90 && (
          <div className="text-center py-2">
            <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
              ✨ A new Gate has opened... ✨
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}