import { Bell, BellOff, Clock, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

interface NotificationsDialogProps {
  trigger?: React.ReactNode;
  companionName: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const NotificationsDialog = ({ trigger, companionName, open, onOpenChange }: NotificationsDialogProps) => {
  const {
    settings,
    permission,
    isSupported,
    requestPermission,
    updateSettings,
    sendMotivationalMessage,
  } = useNotifications();

  const handleEnableNotifications = async () => {
    await requestPermission();
  };

  const handleTestNotification = () => {
    sendMotivationalMessage();
  };

  const isControlled = open !== undefined;

  if (!isSupported) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {!isControlled && (
          <DialogTrigger asChild>
            {trigger || (
              <Button
                variant="ghost"
                size="icon"
                className="bg-card/40 backdrop-blur-sm border border-border/30 hover:bg-lia-pink/20"
              >
                <BellOff className="w-4 h-4 text-muted-foreground" />
              </Button>
            )}
          </DialogTrigger>
        )}
        <DialogContent className="bg-card border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BellOff className="w-5 h-5 text-muted-foreground" />
              Notifications Not Supported
            </DialogTitle>
            <DialogDescription>
              Your browser doesn't support push notifications. Try using a modern browser or installing the app.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger || (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "bg-card/40 backdrop-blur-sm border border-border/30",
                settings.enabled ? "hover:bg-lia-pink/20" : "hover:bg-muted/20"
              )}
            >
              {settings.enabled ? (
                <Bell className="w-4 h-4 text-lia-pink" />
              ) : (
                <BellOff className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="bg-card border-border/50 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bell className="w-5 h-5 text-lia-pink" />
            Notifications from {companionName}
          </DialogTitle>
          <DialogDescription>
            Let {companionName} send you reminders and motivational messages to help you stay on track!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {permission !== "granted" ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-lia-pink/20 flex items-center justify-center">
                <Bell className="w-8 h-8 text-lia-pink animate-pulse" />
              </div>
              <div className="space-y-2">
                <p className="font-medium">Enable notifications</p>
                <p className="text-sm text-muted-foreground">
                  {companionName} wants to send you goal reminders and sweet motivational messages!
                </p>
              </div>
              <Button
                onClick={handleEnableNotifications}
                className="bg-lia-pink hover:bg-lia-pink/80 text-white"
              >
                <Bell className="w-4 h-4 mr-2" />
                Enable Notifications
              </Button>
              {permission === "denied" && (
                <p className="text-xs text-destructive">
                  Notifications were blocked. Please enable them in your browser settings.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Goal Reminders */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-lia-pink/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-lia-pink" />
                  </div>
                  <div>
                    <Label className="font-medium">Goal Reminders</Label>
                    <p className="text-xs text-muted-foreground">
                      Get reminded about your active goals
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.goalReminders}
                  onCheckedChange={(checked) => updateSettings({ goalReminders: checked })}
                />
              </div>

              {/* Motivational Messages */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-lia-purple/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-lia-purple" />
                  </div>
                  <div>
                    <Label className="font-medium">Motivational Messages</Label>
                    <p className="text-xs text-muted-foreground">
                      Sweet encouragement from {companionName}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.motivationalMessages}
                  onCheckedChange={(checked) => updateSettings({ motivationalMessages: checked })}
                />
              </div>

              {/* Reminder Time */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-lia-blue/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-lia-blue" />
                  </div>
                  <div>
                    <Label className="font-medium">Reminder Time</Label>
                    <p className="text-xs text-muted-foreground">
                      Daily check-in time
                    </p>
                  </div>
                </div>
                <Input
                  type="time"
                  value={settings.reminderTime}
                  onChange={(e) => updateSettings({ reminderTime: e.target.value })}
                  className="w-24 text-center bg-background/50"
                />
              </div>

              {/* Test Notification */}
              <div className="pt-2">
                <Button
                  variant="outline"
                  className="w-full border-lia-pink/30 hover:bg-lia-pink/10"
                  onClick={handleTestNotification}
                >
                  <Sparkles className="w-4 h-4 mr-2 text-lia-pink" />
                  Send Test Notification
                </Button>
              </div>

              {/* Disable */}
              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <span className="text-sm text-muted-foreground">Notifications enabled</span>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => updateSettings({ enabled: checked })}
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
