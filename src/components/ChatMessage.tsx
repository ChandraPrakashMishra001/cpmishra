import MessageReactions, { Reactions, ReactionType } from "./MessageReactions";

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  timestamp?: Date;
  imageUrl?: string;
  reactions?: Reactions;
  userReactions?: ReactionType[];
  onReact?: (type: ReactionType) => void;
}

// Format mathematical expressions for better readability
const formatMathExpression = (text: string): string => {
  return text
    // Fractions: a/b → a ÷ b or keep as fraction notation
    .replace(/(\d+)\s*\/\s*(\d+)/g, '$1/$2')
    // Exponents: x^2 → x²
    .replace(/\^2\b/g, '²')
    .replace(/\^3\b/g, '³')
    .replace(/\^4\b/g, '⁴')
    .replace(/\^5\b/g, '⁵')
    .replace(/\^6\b/g, '⁶')
    .replace(/\^7\b/g, '⁷')
    .replace(/\^8\b/g, '⁸')
    .replace(/\^9\b/g, '⁹')
    .replace(/\^0\b/g, '⁰')
    .replace(/\^1\b/g, '¹')
    // Square root
    .replace(/sqrt\(([^)]+)\)/gi, '√($1)')
    .replace(/√(\d+)/g, '√$1')
    // Multiplication
    .replace(/\s*\*\s*/g, ' × ')
    .replace(/(\d)\s*[xX]\s*(\d)/g, '$1 × $2')
    // Division symbol
    .replace(/\s*÷\s*/g, ' ÷ ')
    // Plus/minus with spacing
    .replace(/\s*\+\s*/g, ' + ')
    .replace(/\s*-\s*/g, ' − ')
    // Equals with spacing
    .replace(/\s*=\s*/g, ' = ')
    // Pi
    .replace(/\bpi\b/gi, 'π')
    // Infinity
    .replace(/\binfinity\b/gi, '∞')
    // Plus or minus
    .replace(/\+-/g, '±')
    // Subscripts for common cases
    .replace(/_(\d)/g, (_, d) => {
      const subs = '₀₁₂₃₄₅₆₇₈₉';
      return subs[parseInt(d)] || `_${d}`;
    });
};

// Simple markdown-like formatting for problem solutions
const formatContent = (text: string): React.ReactNode => {
  // Split by line and process each
  const lines = text.split('\n');
  
  return lines.map((line, i) => {
    // Apply math formatting first
    let processedLine = formatMathExpression(line);
    
    // Bold text: **text**
    let formattedLine: React.ReactNode = processedLine;
    
    // Handle headers/bold markers like **Problem**: or 📝 **Problem**:
    if (processedLine.includes('**')) {
      const parts = processedLine.split(/(\*\*[^*]+\*\*)/g);
      formattedLine = parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} className="font-semibold text-primary">{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    }
    
    // Check if this is a math equation line (contains = or math operators)
    const isMathLine = /[=×÷√²³⁴⁵⁶⁷⁸⁹⁰¹±∞π]/.test(processedLine) || 
                       /^\s*[\d\s+\-×÷=()]+\s*$/.test(processedLine);
    
    return (
      <span key={i} className={isMathLine ? 'font-mono tracking-wide' : ''}>
        {formattedLine}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
};

const defaultReactions: Reactions = { heart: 0, star: 0, thumbsUp: 0 };

const ChatMessage = ({ content, isUser, timestamp, imageUrl, reactions = defaultReactions, userReactions = [], onReact }: ChatMessageProps) => {
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
      className={`flex ${isUser ? "justify-end" : "justify-start"} animate-slide-in group`}
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
        <div className="flex items-center justify-between gap-2">
          {timestamp && (
            <p className="text-[10px] sm:text-xs text-muted-foreground opacity-60">
              {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
        {onReact && (
          <MessageReactions
            reactions={reactions}
            userReactions={userReactions}
            onReact={onReact}
            isUser={isUser}
          />
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
