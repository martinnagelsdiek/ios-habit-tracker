import { useState } from "react";
import { UserButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { NotificationSettings } from "./NotificationSettings";

export function Header() {
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  
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
