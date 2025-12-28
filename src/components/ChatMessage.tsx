interface ChatMessageProps {
  content: string;
  isUser: boolean;
  timestamp?: Date;
}

const ChatMessage = ({ content, isUser, timestamp }: ChatMessageProps) => {
  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} animate-slide-in`}
    >
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          isUser
            ? "bg-lia-pink/20 border border-lia-pink/30 rounded-br-md"
            : "bg-card/60 border border-lia-purple/20 rounded-bl-md backdrop-blur-sm"
        }`}
      >
        <p className="text-foreground leading-relaxed">{content}</p>
        {timestamp && (
          <p className="text-xs text-muted-foreground mt-1 opacity-60">
            {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
