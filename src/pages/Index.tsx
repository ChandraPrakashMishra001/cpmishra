import { HelmetProvider, Helmet } from "react-helmet-async";
import LiaAvatar from "@/components/LiaAvatar";
import ChatInterface from "@/components/ChatInterface";
import CompanionSettingsDialog from "@/components/CompanionSettingsDialog";
import FloatingClouds from "@/components/FloatingClouds";
import { GoalsDialog } from "@/components/GoalsDialog";
import { NotificationsDialog } from "@/components/NotificationsDialog";
import { useLiaChat } from "@/hooks/useLiaChat";
import { useCompanionSettings } from "@/hooks/useCompanionSettings";
import { useGoals } from "@/hooks/useGoals";
import liaAvatar from "@/assets/lia-avatar.png";
import { Trash2, Target, Bell } from "lucide-react";
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
  const { getGoalsSummary } = useGoals();
  const goalsSummary = getGoalsSummary();
  const { messages, sendMessage, isTyping, currentEmotion, isTalking, memory, resetConversation } = useLiaChat(settings.name, goalsSummary);

  return (
    <HelmetProvider>
      <Helmet>
        <title>{settings.name} - Your Anime AI Companion</title>
        <meta name="description" content={`Chat with ${settings.name}, your friendly anime AI companion. Have meaningful conversations with an expressive virtual friend.`} />
      </Helmet>

      {/* Floating clouds background */}
      <FloatingClouds />

      <div className="min-h-screen flex flex-col relative z-10">
        {/* Mobile: Sticky header with compact avatar */}
        <div className="lg:hidden sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border/50 shadow-sm p-3">
          <div className="flex items-center gap-4">
            <LiaAvatar 
              emotion={currentEmotion} 
              isTalking={isTalking} 
              customAvatarUrl={settings.avatarUrl}
              compact
            />
            <div className="flex-1">
              <h1 className="text-xl font-display font-bold text-gradient">
                {settings.name}
              </h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span>Online</span>
                {memory.userName && (
                  <span className="text-primary font-medium">• {memory.userName}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <NotificationsDialog companionName={settings.name} />
              <GoalsDialog 
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-card/80 backdrop-blur-sm border border-border/50 hover:bg-primary/20 shadow-sm"
                  >
                    <Target className="w-4 h-4 text-primary" />
                  </Button>
                }
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-card/40 backdrop-blur-sm border border-border/30 hover:bg-destructive/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border/50">
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
              />
            </div>
          </div>
        </div>

        {/* Desktop layout */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Avatar Section - Desktop only, sticky */}
          <div className="hidden lg:flex lg:w-1/2 lg:sticky lg:top-0 lg:h-screen flex-col items-center justify-center p-8 lg:p-12 relative">
            {/* Settings Button */}
            <CompanionSettingsDialog
              settings={settings}
              onUpdateName={updateName}
              onUpdateAvatar={updateAvatar}
              onReset={resetSettings}
              defaultAvatarUrl={liaAvatar}
            />

            {/* Notifications Button */}
            <NotificationsDialog 
              companionName={settings.name}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-40 z-20 bg-card/40 backdrop-blur-sm border border-border/30 hover:bg-lia-pink/20"
                >
                  <Bell className="w-4 h-4 text-lia-pink" />
                </Button>
              }
            />

            {/* Goals Button */}
            <GoalsDialog 
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-28 z-20 bg-card/40 backdrop-blur-sm border border-border/30 hover:bg-lia-pink/20"
                >
                  <Target className="w-4 h-4 text-lia-pink" />
                </Button>
              }
            />

            {/* Clear Memory Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-16 z-20 bg-card/40 backdrop-blur-sm border border-border/30 hover:bg-destructive/20"
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
                Your AI Companion ✨
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

            {/* Status indicator */}
            <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground z-10 bg-card/60 px-4 py-2 rounded-full backdrop-blur-sm border border-border/50">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span>Online & Ready to chat</span>
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
          </div>

          {/* Chat Section */}
          <div className="flex-1 lg:w-1/2 flex flex-col bg-card/40 backdrop-blur-sm border-l border-border/50 shadow-lg min-h-[calc(100vh-80px)] lg:min-h-screen">
            <ChatInterface
              messages={messages}
              onSendMessage={sendMessage}
              isTyping={isTyping}
              companionName={settings.name}
            />
          </div>
        </div>
      </div>
    </HelmetProvider>
  );
};

export default Index;
