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
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 sm:py-6 space-y-3 sm:space-y-4 overscroll-contain">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-muted-foreground text-base sm:text-lg font-display">
              Start chatting with {companionName}! 💖
            </p>
            <p className="text-muted-foreground/60 text-xs sm:text-sm mt-2">
              Ask me anything - math, homework, or just chat~
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
          <div className="flex items-center gap-2 text-muted-foreground animate-slide-in px-1">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-lia-pink rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-lia-pink rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-lia-pink rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs sm:text-sm">{companionName} is thinking...</span>
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

      {/* Input area - optimized for mobile */}
      <div className="p-2 sm:p-4 border-t border-border/30 bg-background/50 backdrop-blur-sm safe-area-inset-bottom">
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
