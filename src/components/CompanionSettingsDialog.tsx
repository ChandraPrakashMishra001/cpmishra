import { useState, useRef } from "react";
import { Settings, Upload, RotateCcw, X, Sparkles, GraduationCap, Theater } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { CompanionSettings } from "@/hooks/useCompanionSettings";
import { PersonalitySettings, ToneLevel, PERSONALITY_LABELS } from "@/hooks/usePersonalitySettings";
import { RoleplayCharacter, ROLEPLAY_OPTIONS } from "@/hooks/useRoleplay";
import PersonalitySlider from "./PersonalitySlider";
import { toast } from "sonner";

// Constants for avatar validation
const MAX_AVATAR_SIZE_MB = 2; // Smaller limit for avatars stored in localStorage
const MAX_AVATAR_SIZE_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024;

interface CompanionSettingsDialogProps {
  settings: CompanionSettings;
  onUpdateName: (name: string) => void;
  onUpdateAvatar: (url: string | null) => void;
  onReset: () => void;
  defaultAvatarUrl: string;
  personalitySettings: PersonalitySettings;
  onUpdatePersonality: (key: keyof PersonalitySettings, value: ToneLevel) => void;
  onResetPersonality: () => void;
  phdModeEnabled: boolean;
  onTogglePhdMode: () => void;
  activeRole: RoleplayCharacter;
  onRoleChange: (role: RoleplayCharacter) => void;
}

const CompanionSettingsDialog = ({
  settings,
  onUpdateName,
  onUpdateAvatar,
  onReset,
  defaultAvatarUrl,
  personalitySettings,
  onUpdatePersonality,
  onResetPersonality,
  phdModeEnabled,
  onTogglePhdMode,
  activeRole,
  onRoleChange,
}: CompanionSettingsDialogProps) => {
  const [name, setName] = useState(settings.name);
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size before processing
      if (file.size > MAX_AVATAR_SIZE_BYTES) {
        toast.error(`Avatar too large! Please use an image under ${MAX_AVATAR_SIZE_MB}MB~ 📷`);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        // Verify base64 size doesn't exceed safe limit for localStorage
        const base64Size = result.length * 0.75;
        if (base64Size > 3 * 1024 * 1024) {
          toast.error("Avatar too large after processing. Please use a smaller image~ 📷");
          return;
        }
        onUpdateAvatar(result);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = () => {
    onUpdateName(name);
    setOpen(false);
  };

  const currentAvatar = settings.avatarUrl || defaultAvatarUrl;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-14 left-2 z-20 bg-card/40 backdrop-blur-sm border border-border/30 hover:bg-card/60"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border/50 backdrop-blur-xl max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-gradient">
            Customize Your Companion
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="appearance" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Upload className="w-3.5 h-3.5" />
              Look
            </TabsTrigger>
            <TabsTrigger value="personality" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Personality
            </TabsTrigger>
            <TabsTrigger value="roleplay" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Theater className="w-3.5 h-3.5" />
              Roleplay
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-6">
            {/* Avatar Preview and Upload */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <img
                  src={currentAvatar}
                  alt={settings.name}
                  className="w-32 h-32 rounded-full object-cover border-2 border-lia-pink/50 glow-avatar"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Upload className="w-8 h-8 text-lia-pink" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-lia-pink/30 hover:bg-lia-pink/10"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
                {settings.avatarUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdateAvatar(null)}
                    className="text-muted-foreground"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="companion-name" className="text-foreground">
                Companion Name
              </Label>
              <Input
                id="companion-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter a name..."
                className="bg-background/50 border-border/50 focus:border-lia-pink"
              />
            </div>

            {/* Appearance Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={onReset}
                className="flex-1 border-destructive/30 hover:bg-destructive/10 text-destructive"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-lia-pink hover:bg-lia-pink-glow text-primary-foreground"
              >
                Save Changes
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="personality" className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Adjust how {settings.name} communicates with you~
            </p>

            {/* PhD Mode Toggle */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-accent/20">
                    <GraduationCap className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <Label htmlFor="phd-mode" className="text-sm font-medium cursor-pointer">
                      PhD Expert Mode
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Rigorous academic explanations with deep analysis
                    </p>
                  </div>
                </div>
                <Switch
                  id="phd-mode"
                  checked={phdModeEnabled}
                  onCheckedChange={onTogglePhdMode}
                />
              </div>
            </div>

            {/* Personality Sliders */}
            {(Object.keys(PERSONALITY_LABELS) as Array<keyof typeof PERSONALITY_LABELS>).map((key) => (
              <PersonalitySlider
                key={key}
                settingKey={key}
                value={personalitySettings[key]}
                onChange={(value) => onUpdatePersonality(key, value)}
              />
            ))}

            {/* Personality Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={onResetPersonality}
                className="flex-1 border-destructive/30 hover:bg-destructive/10 text-destructive"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Personality
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="roleplay" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose how {settings.name} acts around you~
            </p>

            <div className="grid grid-cols-2 gap-2">
              {ROLEPLAY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    onRoleChange(option.id);
                    toast.success(`${settings.name} is now your ${option.label}! ${option.emoji}`);
                  }}
                  className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all duration-200 ${
                    activeRole === option.id
                      ? "bg-primary/15 border-primary/40 shadow-sm shadow-primary/10"
                      : "bg-card/50 border-border/30 hover:bg-card/80 hover:border-border/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{option.emoji}</span>
                    <span className={`text-sm font-medium ${activeRole === option.id ? "text-primary" : "text-foreground"}`}>
                      {option.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    {option.description}
                  </p>
                </button>
              ))}
            </div>

            {activeRole !== "default" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onRoleChange("default");
                  toast.info("Back to default mode~");
                }}
                className="w-full border-border/30"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-2" />
                Reset to Default
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CompanionSettingsDialog;
