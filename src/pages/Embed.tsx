import { useEffect } from "react";
import ChatInterface from "@/components/ChatInterface";
import { useLiaChat } from "@/hooks/useLiaChat";
import { useCompanionSettings } from "@/hooks/useCompanionSettings";
import { usePersonalitySettings } from "@/hooks/usePersonalitySettings";
import { usePhdMode } from "@/hooks/usePhdMode";
import { useCodexMode } from "@/hooks/useCodexMode";
import { useGoals } from "@/hooks/useGoals";
import { useRoleplay } from "@/hooks/useRoleplay";

const Embed = () => {
  const { settings } = useCompanionSettings();
  const { getPersonalitySummary } = usePersonalitySettings();
  const { isEnabled: phdModeEnabled } = usePhdMode();
  const { isEnabled: codexModeEnabled } = useCodexMode();
  const { getGoalsSummary } = useGoals();
  const { activeRole, getRoleplayPrompt } = useRoleplay();
  const goalsSummary = getGoalsSummary();
  const personalitySummary = getPersonalitySummary();
  const roleplayPrompt = getRoleplayPrompt(activeRole, settings.name);

  const {
    messages,
    sendMessage,
    isTyping,
    handleReaction,
    handleBookmark,
    quickReplies,
    currentEmotion,
  } = useLiaChat(settings.name, goalsSummary, personalitySummary, phdModeEnabled, roleplayPrompt, codexModeEnabled);

  // Notify parent window about resize
  useEffect(() => {
    const sendHeight = () => {
      window.parent.postMessage({ type: "amanai-resize", height: document.body.scrollHeight }, "*");
    };
    sendHeight();
    const observer = new MutationObserver(sendHeight);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
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
  );
};

export default Embed;
