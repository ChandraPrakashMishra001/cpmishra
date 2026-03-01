import { useRef, useEffect, useCallback } from "react";
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
  currentMood = "happy"
}: ChatInterfaceProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleQuickReply = (suggestion: string) => {
    onSendMessage(suggestion);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-2.5 sm:px-6 py-3 sm:py-8 space-y-3 sm:space-y-5 overscroll-contain scroll-smooth" style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 animate-fade-in">
            <div className="relative mb-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary/20 via-accent/15 to-primary/10 flex items-center justify-center shadow-lg shadow-primary/10 border border-primary/20">
                <span className="text-4xl sm:text-5xl">💬</span>
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30">
                <span className="text-xs">✨</span>
              </div>
            </div>
            <p className="text-foreground/90 text-xl sm:text-2xl font-display font-bold mb-2">
              Hey there! ✨
            </p>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xs mb-4">
              I'm {companionName} — ask me anything, share a photo, or just chat~
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-xs">
              {["Tell me a joke 😄", "How are you? 💕", "Help me study 📚"].map((hint) => (
                <button
                  key={hint}
                  onClick={() => onSendMessage(hint)}
                  className="px-3 py-1.5 text-xs rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors font-medium"
                >
                  {hint}
                </button>
              ))}
            </div>
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
          <div className="flex items-center gap-2.5 text-muted-foreground animate-slide-in px-1">
            <div className="flex gap-1 bg-card/60 backdrop-blur-sm px-3 py-2 rounded-full border border-border/30 shadow-sm">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs sm:text-sm font-medium">{companionName} is thinking...</span>
            <MoodIndicator mood={currentMood} />
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies */}
      <QuickReplies
        suggestions={quickReplies}
        onSelect={handleQuickReply}
        visible={!isTyping && quickReplies.length > 0}
      />

      {/* Input area */}
      <div className="p-2 sm:p-4 border-t border-border/20 bg-gradient-to-t from-background/80 to-background/40 backdrop-blur-md safe-area-inset-bottom">
        <ChatInput onSend={onSendMessage} disabled={isTyping} companionName={companionName} />
      </div>
    </div>
  );
};

export default ChatInterface;
