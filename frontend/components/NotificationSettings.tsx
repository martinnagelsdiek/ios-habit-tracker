import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Bell, Settings } from "lucide-react";

interface NotificationSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationSettings({ open, onOpenChange }: NotificationSettingsProps) {
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [browserNotifications, setBrowserNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const backend = useBackend();
  const { toast } = useToast();

  const { data: settings } = useQuery({
    queryKey: ["notification-settings"],
    queryFn: () => backend.habits.getNotificationSettings(),
    enabled: open,
  });

  const updateMutation = useMutation({
    mutationFn: (settings: { email?: boolean; browser?: boolean; sound?: boolean }) =>
      backend.habits.updateNotificationSettings({ settings }),
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Failed to update notification settings:", error);
      toast({
        title: "Error", 
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const testMutation = useMutation({
    mutationFn: (habitId: number) => backend.habits.testNotification({ habitId }),
    onSuccess: () => {
      toast({
        title: "Test Notification Sent",
        description: "Check your notification settings are working.",
      });
    },
    onError: (error) => {
      console.error("Failed to send test notification:", error);
      toast({
        title: "Test Failed",
        description: "Could not send test notification.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (settings) {
      setEmailNotifications(settings.email || false);
      setBrowserNotifications(settings.browser || true);
      setSoundEnabled(settings.sound || true);
    }
  }, [settings]);

  const handleSave = () => {
    updateMutation.mutate({
      email: emailNotifications,
      browser: browserNotifications,
      sound: soundEnabled,
    });
  };

  const requestBrowserPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setBrowserNotifications(true);
          toast({
            title: "Permission Granted",
            description: "Browser notifications are now enabled.",
          });
        } else {
          toast({
            title: "Permission Denied",
            description: "Browser notifications require permission to work.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error requesting notification permission:", error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Notification Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive habit reminders via email
                </p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Browser Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Show notifications in your browser
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!browserNotifications && 'Notification' in window && Notification.permission !== 'granted' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={requestBrowserPermission}
                  >
                    Enable
                  </Button>
                )}
                <Switch
                  checked={browserNotifications}
                  onCheckedChange={setBrowserNotifications}
                  disabled={'Notification' in window && Notification.permission === 'denied'}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sound Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Play sound with notifications
                </p>
              </div>
              <Switch
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
            </div>
          </div>

          {'Notification' in window && Notification.permission === 'denied' && (
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                Browser notifications are blocked. Enable them in your browser settings to receive reminders.
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex-1"
            >
              {updateMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}