import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Zap } from "lucide-react";
import { NotificationSettings } from "./NotificationSettings";
import { useBackend } from "../hooks/useBackend";
import { FEATURE_LEVELING } from "../config";

export function Header() {
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const backend = useBackend();
  
  const { data: levelingData } = useQuery({
    queryKey: ["leveling-summary"],
    queryFn: () => backend.leveling.getSummary(),
    enabled: FEATURE_LEVELING,
    refetchInterval: 60000, // Refresh every minute
  });
  
  return (
    <>
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-4xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">H</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground">Habit Tracker</h1>
          </div>
          <div className="flex items-center gap-2">
            {FEATURE_LEVELING && levelingData && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-500" />
                L{levelingData.overall.level}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotificationSettings(true)}
              className="h-8 w-8 p-0"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>
      
      <NotificationSettings
        open={showNotificationSettings}
        onOpenChange={setShowNotificationSettings}
      />
    </>
  );
}
