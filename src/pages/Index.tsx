import { HelmetProvider, Helmet } from "react-helmet-async";
import LiaAvatar from "@/components/LiaAvatar";
import ChatInterface from "@/components/ChatInterface";
import CompanionSettingsDialog from "@/components/CompanionSettingsDialog";
import MemoryViewerDialog from "@/components/MemoryViewerDialog";
import FloatingClouds from "@/components/FloatingClouds";
import FloatingSparkles from "@/components/FloatingSparkles";
import ConfettiCelebration from "@/components/ConfettiCelebration";
import MoodIndicator from "@/components/MoodIndicator";
import FieldLogDialog from "@/components/FieldLogDialog";
import DiseaseGallery from "@/components/DiseaseGallery";
import ToolbarMenu from "@/components/ToolbarMenu";
import { useLiaChat } from "@/hooks/useLiaChat";
import { useCompanionSettings } from "@/hooks/useCompanionSettings";
import { usePersonalitySettings } from "@/hooks/usePersonalitySettings";
import { usePhdMode } from "@/hooks/usePhdMode";
import { useCodexMode } from "@/hooks/useCodexMode";
import { useGoals } from "@/hooks/useGoals";
import { useTheme } from "@/hooks/useTheme";
import { useRoleplay } from "@/hooks/useRoleplay";
import { useLanguage, LANGUAGE_LABELS, type AppLanguage } from "@/hooks/useLanguage";
import liaAvatar from "@/assets/amanai-avatar.png";
import { Trash2, Sun, Moon, Brain, Code2, BookOpen, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Index = () => {
  const { settings, updateName, updateAvatar, resetSettings } = useCompanionSettings();
  const { 
    settings: personalitySettings, 
    updateSetting: updatePersonality, 
    resetSettings: resetPersonality,
    getPersonalitySummary 
  } = usePersonalitySettings();
  const { isEnabled: phdModeEnabled, toggle: togglePhdMode } = usePhdMode();
  const { isEnabled: codexModeEnabled, toggle: toggleCodexMode } = useCodexMode();
  const { getGoalsSummary } = useGoals();
  const { theme, toggleTheme, isNight } = useTheme();
  const { activeRole, setActiveRole, getRoleplayPrompt } = useRoleplay();
  const { language, changeLanguage } = useLanguage();
  const goalsSummary = getGoalsSummary();
  const personalitySummary = getPersonalitySummary();
  const roleplayPrompt = getRoleplayPrompt(activeRole, settings.name);
  const { 
    messages, 
    sendMessage, 
    isTyping, 
    currentEmotion, 
    isTalking, 
    memory, 
    resetConversation, 
    handleReaction,
    handleBookmark,
    quickReplies,
    showCelebration,
    setShowCelebration,
  } = useLiaChat(settings.name, goalsSummary, personalitySummary, phdModeEnabled, roleplayPrompt, codexModeEnabled, language);

  const languages: AppLanguage[] = ["en", "hi", "od"];

  return (
    <HelmetProvider>
      <Helmet>
        <title>{settings.name} — BloomSense Agricultural Intelligence</title>
        <meta name="description" content={`Chat with ${settings.name}, the BloomSense Master Botanist. Expert plant identification, disease diagnosis, IPM strategies, and Ayurvedic plant care.`} />
      </Helmet>

      {/* Confetti celebration for milestones */}
      <ConfettiCelebration 
        trigger={showCelebration} 
        onComplete={() => setShowCelebration(false)} 
      />

      {/* Floating clouds background */}
      <FloatingClouds isNight={isNight} />
      
      {/* Magical floating sparkles */}
      <FloatingSparkles />

      <div className="h-[100dvh] flex flex-col relative z-10 overflow-hidden">
        {/* Mobile: Sticky header with compact avatar */}
        <div className="lg:hidden sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b border-border/50 shadow-sm px-3 py-2">
          <div className="flex items-center gap-2.5">
            <LiaAvatar 
              emotion={currentEmotion} 
              isTalking={isTalking} 
              customAvatarUrl={settings.avatarUrl}
              compact
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-display font-bold text-gradient truncate leading-tight">
                {settings.name}
              </h1>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                <span>Online</span>
                {codexModeEnabled && (
                  <span className="flex items-center gap-0.5 bg-primary/15 text-primary px-1 py-0.5 rounded-full font-semibold text-[9px]">
                    <Code2 className="w-2.5 h-2.5" />
                    Codex
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              {/* Language selector - mobile */}
              <div className="flex items-center bg-muted/60 rounded-full p-0.5 mr-1">
                {languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => changeLanguage(lang)}
                    className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold transition-all ${
                      language === lang
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {LANGUAGE_LABELS[lang].short}
                  </button>
                ))}
              </div>
              <ToolbarMenu
                isNight={isNight}
                onToggleTheme={toggleTheme}
                companionName={settings.name}
                compact
              />
              <FieldLogDialog
                messages={messages}
                companionName={settings.name}
                trigger={
                  <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-primary/20">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                  </Button>
                }
              />
              <DiseaseGallery
                trigger={
                  <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-primary/20">
                    <Bug className="w-3.5 h-3.5 text-primary" />
                  </Button>
                }
                onAskAbout={(name) => sendMessage(`Tell me about ${name} disease - diagnosis and treatment`)}
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-destructive/20">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border/50 mx-4 max-w-[calc(100vw-2rem)]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Memory?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will erase all conversation history and {settings.name} will forget everything about you.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={resetConversation} className="bg-destructive hover:bg-destructive/80">
                      Clear Memory
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <CompanionSettingsDialog
                settings={settings}
                onUpdateName={updateName}
                onUpdateAvatar={updateAvatar}
                onReset={resetSettings}
                defaultAvatarUrl={liaAvatar}
                personalitySettings={personalitySettings}
                onUpdatePersonality={updatePersonality}
                onResetPersonality={resetPersonality}
                phdModeEnabled={phdModeEnabled}
                onTogglePhdMode={togglePhdMode}
                codexModeEnabled={codexModeEnabled}
                onToggleCodexMode={toggleCodexMode}
                activeRole={activeRole}
                onRoleChange={setActiveRole}
              />
            </div>
          </div>
        </div>

        {/* Desktop layout */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* Avatar Section - Desktop only, sticky */}
          <div className="hidden lg:flex lg:w-1/2 lg:sticky lg:top-0 lg:h-screen flex-col items-center justify-center p-8 lg:p-12 relative">
            {/* Desktop toolbar - clean flex row */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              {/* Language selector - desktop */}
              <div className="flex items-center bg-card/60 backdrop-blur-sm border border-border/50 rounded-full p-1 shadow-sm">
                {languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => changeLanguage(lang)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                      language === lang
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {LANGUAGE_LABELS[lang].short}
                  </button>
                ))}
              </div>
              <ToolbarMenu
                isNight={isNight}
                onToggleTheme={toggleTheme}
                companionName={settings.name}
              />
              <MemoryViewerDialog
                memory={memory}
                companionName={settings.name}
                onClearMemory={resetConversation}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-card/60 backdrop-blur-sm border border-border/50 hover:bg-primary/20 shadow-sm"
                  >
                    <Brain className="w-4 h-4 text-primary" />
                  </Button>
                }
              />
              <FieldLogDialog
                messages={messages}
                companionName={settings.name}
              />
              <DiseaseGallery onAskAbout={(name) => sendMessage(`Tell me about ${name} disease - diagnosis and treatment`)} />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-card/60 backdrop-blur-sm border border-border/50 hover:bg-destructive/20 shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border/50">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Memory?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will erase all conversation history and {settings.name} will forget everything about you. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={resetConversation} className="bg-destructive hover:bg-destructive/80">
                      Clear Memory
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <CompanionSettingsDialog
                settings={settings}
                onUpdateName={updateName}
                onUpdateAvatar={updateAvatar}
                onReset={resetSettings}
                defaultAvatarUrl={liaAvatar}
                personalitySettings={personalitySettings}
                onUpdatePersonality={updatePersonality}
                onResetPersonality={resetPersonality}
                phdModeEnabled={phdModeEnabled}
                onTogglePhdMode={togglePhdMode}
                codexModeEnabled={codexModeEnabled}
                onToggleCodexMode={toggleCodexMode}
                activeRole={activeRole}
                onRoleChange={setActiveRole}
              />
            </div>

            {/* Background decorations - soft sky accents */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-20 left-10 w-32 h-32 bg-primary/15 rounded-full blur-3xl" />
              <div className="absolute bottom-20 right-10 w-40 h-40 bg-lia-purple/10 rounded-full blur-3xl" />
              <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-lia-cyan/15 rounded-full blur-2xl" />
            </div>

            {/* Title */}
            <div className="text-center mb-8 z-10">
              <h1 className="text-5xl lg:text-6xl font-display font-bold text-gradient mb-2">
                {settings.name}
              </h1>
              <p className="text-muted-foreground font-body">
                BloomSense Master Botanist 🌿
              </p>
              {memory.userName && (
                <p className="text-sm text-primary mt-2 font-medium">
                  💖 Remembers: {memory.userName}
                </p>
              )}
            </div>

            {/* Avatar */}
            <div className="relative z-10">
              <LiaAvatar 
                emotion={currentEmotion} 
                isTalking={isTalking} 
                customAvatarUrl={settings.avatarUrl}
              />
            </div>

            {/* Status indicator with mood */}
            <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground z-10 bg-card/60 px-4 py-2 rounded-full backdrop-blur-sm border border-border/50">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span>Online</span>
              <MoodIndicator mood={currentEmotion} />
              {codexModeEnabled && (
                <span className="flex items-center gap-1 bg-primary/15 text-primary px-2 py-0.5 rounded-full text-xs font-semibold">
                  <Code2 className="w-3 h-3" />
                  Codex
                </span>
              )}
            </div>

            {/* Memory stats */}
            {memory.totalMessages > 0 && (
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground/70 z-10">
                <span>💬 {memory.totalMessages} messages</span>
                {memory.topics.length > 0 && (
                  <span>🏷️ {memory.topics.slice(0, 3).join(", ")}</span>
                )}
              </div>
            )}

            {/* Footer credit */}
            <p className="mt-8 text-[10px] text-muted-foreground/40 z-10 font-body tracking-wide">
              Powered by BloomSense 🌿 Made with 💚 by cpmishra
            </p>
          </div>

          {/* Chat Section */}
          <div className="flex-1 lg:w-1/2 flex flex-col bg-card/40 backdrop-blur-sm lg:border-l border-border/50 shadow-lg min-h-0 lg:h-screen">
            <ChatInterface
              messages={messages}
              onSendMessage={sendMessage}
              onReact={handleReaction}
              onBookmark={handleBookmark}
              isTyping={isTyping}
              companionName={settings.name}
              quickReplies={quickReplies}
              currentMood={currentEmotion}
            />
          </div>
        </div>
      </div>
    </HelmetProvider>
  );
};

export default Index;
