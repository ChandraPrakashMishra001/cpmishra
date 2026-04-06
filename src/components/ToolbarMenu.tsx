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

const languages: AppLanguage[] = ["en", "hi", "od"];

const ToolbarMenu = ({ isNight, onToggleTheme, companionName, compact = false, language, onChangeLanguage }: ToolbarMenuProps) => {
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
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="flex items-center gap-2 text-xs">
            <Globe className="w-3.5 h-3.5 text-primary" />
            Language
          </DropdownMenuLabel>
          <div className="flex items-center gap-1 px-2 pb-1.5">
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => onChangeLanguage(lang)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                  language === lang
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {LANGUAGE_LABELS[lang].short}
              </button>
            ))}
          </div>
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
