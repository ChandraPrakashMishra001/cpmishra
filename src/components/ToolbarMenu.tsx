import { Sun, Moon, Target, Bell, Menu, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { GoalsDialog } from "./GoalsDialog";
import { NotificationsDialog } from "./NotificationsDialog";
import { useState } from "react";
import { LANGUAGE_LABELS, type AppLanguage } from "@/hooks/useLanguage";

interface ToolbarMenuProps {
  isNight: boolean;
  onToggleTheme: () => void;
  companionName: string;
  compact?: boolean;
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
}

const ToolbarMenu = ({ isNight, onToggleTheme, companionName, compact = false }: ToolbarMenuProps) => {
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={
              compact
                ? "w-7 h-7 hover:bg-primary/20"
                : "bg-card/60 backdrop-blur-sm border border-border/50 hover:bg-primary/20 shadow-sm"
            }
          >
            <Menu className={compact ? "w-3.5 h-3.5 text-primary" : "w-4 h-4 text-primary"} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-card/95 backdrop-blur-md border-border/50">
          <DropdownMenuItem onClick={onToggleTheme} className="cursor-pointer gap-2">
            {isNight ? (
              <Sun className="w-4 h-4 text-yellow-500" />
            ) : (
              <Moon className="w-4 h-4 text-primary" />
            )}
            <span>{isNight ? "Light Mode" : "Dark Mode"}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setNotificationsOpen(true)} className="cursor-pointer gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <span>Notifications</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setGoalsOpen(true)} className="cursor-pointer gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span>Your Goals</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs rendered outside the dropdown */}
      <GoalsDialog
        open={goalsOpen}
        onOpenChange={setGoalsOpen}
      />
      <NotificationsDialog
        companionName={companionName}
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
      />
    </>
  );
};

export default ToolbarMenu;
