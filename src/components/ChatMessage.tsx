interface ChatMessageProps {
  content: string;
  isUser: boolean;
  timestamp?: Date;
  imageUrl?: string;
}

// Simple markdown-like formatting for problem solutions
const formatContent = (text: string): React.ReactNode => {
  // Split by line and process each
  const lines = text.split('\n');
  
  return lines.map((line, i) => {
    // Bold text: **text**
    let formattedLine: React.ReactNode = line;
    
    // Handle headers/bold markers like **Problem**: or 📝 **Problem**:
    if (line.includes('**')) {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      formattedLine = parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} className="font-semibold text-primary">{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    }
    
    return (
      <span key={i}>
        {formattedLine}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
};

const ChatMessage = ({ content, isUser, timestamp, imageUrl }: ChatMessageProps) => {
  // Detect if this is a structured problem-solving response
  const isProblemSolution = !isUser && (
    content.includes('📝') || 
    content.includes('🔍') || 
    content.includes('📊') || 
    content.includes('✅') ||
    content.includes('💡') ||
    content.includes('**Solution**') ||
    content.includes('**Answer**')
  );

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} animate-slide-in`}
    >
      <div
        className={`max-w-[90%] sm:max-w-[80%] px-3 py-2 sm:px-4 sm:py-3 rounded-2xl ${
          isUser
            ? "bg-lia-pink/20 border border-lia-pink/30 rounded-br-md"
            : isProblemSolution 
              ? "bg-card/80 border border-primary/30 rounded-bl-md backdrop-blur-sm shadow-sm"
              : "bg-card/60 border border-lia-purple/20 rounded-bl-md backdrop-blur-sm"
        }`}
      >
        {imageUrl && (
          <div className="mb-2">
            <img 
              src={imageUrl} 
              alt="Generated image" 
              className="rounded-xl max-w-full h-auto shadow-lg"
              loading="lazy"
            />
          </div>
        )}
        <div className={`text-foreground leading-relaxed text-sm sm:text-base ${isProblemSolution ? 'whitespace-pre-wrap' : ''}`}>
          {formatContent(content)}
        </div>
        {timestamp && (
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 opacity-60">
            {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
