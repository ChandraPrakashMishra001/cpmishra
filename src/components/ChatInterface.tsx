import { useRef, useEffect, useState, useCallback } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import VoiceInterface from "./VoiceInterface";
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
  onVoiceSpeaking?: (speaking: boolean) => void;
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
  onVoiceSpeaking,
  quickReplies = [],
  currentMood = "happy"
}: ChatInterfaceProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState(false);

  const handleVoiceSpeaking = useCallback((speaking: boolean) => {
    setIsVoiceSpeaking(speaking);
    onVoiceSpeaking?.(speaking);
  }, [onVoiceSpeaking]);

  const handleVoiceTranscript = useCallback((text: string, isUser: boolean) => {
    // Voice transcripts are added to the chat
    onSendMessage(isUser ? text : `[Voice] ${text}`);
  }, [onSendMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleQuickReply = (suggestion: string) => {
    onSendMessage(suggestion);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-5 overscroll-contain scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary/20 to-lia-pink/20 flex items-center justify-center mb-4 shadow-lg shadow-primary/10">
              <span className="text-3xl sm:text-4xl">💬</span>
            </div>
            <p className="text-foreground/80 text-lg sm:text-xl font-display font-semibold mb-1">
              Hey there! ✨
            </p>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xs">
              I'm {companionName} — ask me anything, share a photo, or just chat~
            </p>
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
      <div className="p-2.5 sm:p-4 border-t border-border/20 bg-gradient-to-t from-background/80 to-background/40 backdrop-blur-md safe-area-inset-bottom">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex-1 min-w-0">
            <ChatInput onSend={onSendMessage} disabled={isTyping} companionName={companionName} />
          </div>
          <VoiceInterface 
            onSpeakingChange={handleVoiceSpeaking}
            onTranscript={handleVoiceTranscript}
            companionName={companionName}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
