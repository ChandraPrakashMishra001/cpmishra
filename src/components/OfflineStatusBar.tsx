import { Wifi, WifiOff, RefreshCw, CloudUpload } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface OfflineStatusBarProps {
  onSyncNow?: () => Promise<void> | void;
}

const OfflineStatusBar = ({ onSyncNow }: OfflineStatusBarProps) => {
  const isOnline = useOnlineStatus();
  const { pendingCount } = useOfflineQueue();
  const [syncing, setSyncing] = useState(false);

  if (isOnline && pendingCount === 0) return null;

  const handleSync = async () => {
    if (!onSyncNow || syncing) return;
    setSyncing(true);
    try {
      await onSyncNow();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 text-xs border-b border-border/50 ${
        isOnline
          ? "bg-primary/10 text-primary"
          : "bg-muted/60 text-muted-foreground"
      }`}
      role="status"
      aria-live="polite"
    >
      {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
      <span className="font-medium">{isOnline ? "Online" : "Offline mode"}</span>
      {!isOnline && (
        <span className="hidden sm:inline text-muted-foreground/80">
          · library, past logs and saving still work
        </span>
      )}
      {pendingCount > 0 && (
        <span className="flex items-center gap-1 ml-auto">
          <CloudUpload className="w-3.5 h-3.5" />
          {pendingCount} waiting to sync
          {isOnline && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${syncing ? "animate-spin" : ""}`} />
              Sync now
            </Button>
          )}
        </span>
      )}
    </div>
  );
};

export default OfflineStatusBar;
