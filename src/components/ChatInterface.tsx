import { useRef, useEffect, useCallback, memo } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import QuickReplies from "./QuickReplies";
import MoodIndicator from "./MoodIndicator";
import { Emotion } from "./LiaAvatar";

import { Reactions, ReactionType } from "./MessageReactions";

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  imageUrl?: string;
  reactions?: Reactions;
  userReactions?: ReactionType[];
  isBookmarked?: boolean;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string, imageUrl?: string) => void;
  onReact?: (messageId: string, reactionType: ReactionType) => void;
  onBookmark?: (messageId: string) => void;
  isTyping: boolean;
  companionName?: string;
  quickReplies?: string[];
  currentMood?: Emotion;
}

const ChatInterface = ({
  messages,
  onSendMessage,
  onReact,
  onBookmark,
  isTyping,
  companionName = "Lia",
  quickReplies = [],
  currentMood = "happy",
}: ChatInterfaceProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollRef = useRef(0);
  const isUserScrollingRef = useRef(false);

  // Throttled scroll prevents jank during fast token streaming
  const scrollToBottom = useCallback((smooth = false) => {
    const now = Date.now();
    if (!smooth && now - lastScrollRef.current < 120) return;
    lastScrollRef.current = now;
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "end" });
  }, []);

  // Pause auto-scroll if user scrolled up to read history
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      isUserScrollingRef.current = distanceFromBottom > 140;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (isUserScrollingRef.current) return;
    scrollToBottom(!isTyping);
  }, [messages, isTyping, scrollToBottom]);

  const handleQuickReply = useCallback(
    (suggestion: string) => onSendMessage(suggestion),
    [onSendMessage]
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-8 space-y-2.5 sm:space-y-5 overscroll-contain"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 animate-fade-in">
            <div className="relative mb-5">
              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary/20 via-accent/15 to-primary/10 flex items-center justify-center shadow-lg shadow-primary/10 border border-primary/20">
                <span className="text-3xl sm:text-5xl">🌿</span>
              </div>
            </div>
            <p className="text-foreground/90 text-lg sm:text-2xl font-display font-bold mb-1.5">
              Hi, I'm {companionName}! 🌿
            </p>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xs">How may I help you?</p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            content={msg.content}
            isUser={msg.isUser}
            timestamp={msg.timestamp}
            imageUrl={msg.imageUrl}
            reactions={msg.reactions}
            userReactions={msg.userReactions}
            isBookmarked={msg.isBookmarked}
            onReact={onReact ? (type) => onReact(msg.id, type) : undefined}
            onBookmark={onBookmark ? () => onBookmark(msg.id) : undefined}
          />
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-muted-foreground animate-slide-in px-1">
            <div className="flex gap-1 bg-card/40 backdrop-blur-md px-3 py-2 rounded-full border border-border/30 shadow-sm">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs sm:text-sm font-medium">{companionName} is analyzing...</span>
            <MoodIndicator mood={currentMood} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <QuickReplies suggestions={quickReplies} onSelect={handleQuickReply} visible={!isTyping && quickReplies.length > 0} />

      <div className="p-2 sm:p-3 border-t border-border/20 bg-gradient-to-t from-background/90 to-background/50 backdrop-blur-md safe-area-inset-bottom">
        <ChatInput onSend={onSendMessage} disabled={isTyping} companionName={companionName} />
      </div>
    </div>
  );
};

export default memo(ChatInterface);
