import { Download } from "lucide-react";
import MessageReactions, { Reactions, ReactionType } from "./MessageReactions";
import BookmarkButton from "./BookmarkButton";
import { Button } from "./ui/button";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  timestamp?: Date;
  imageUrl?: string;
  reactions?: Reactions;
  userReactions?: ReactionType[];
  isBookmarked?: boolean;
  onReact?: (type: ReactionType) => void;
  onBookmark?: () => void;
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

// Render LaTeX math expressions
const renderMath = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  // Match block math $$...$$ first, then inline math $...$
  const regex = /\$\$([^$]+)\$\$|\$([^$]+)\$/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    }

    const blockMath = match[1];
    const inlineMath = match[2];

    try {
      if (blockMath) {
        parts.push(
          <div key={key++} className="my-2 overflow-x-auto">
            <BlockMath math={blockMath.trim()} />
          </div>
        );
      } else if (inlineMath) {
        parts.push(<InlineMath key={key++} math={inlineMath.trim()} />);
      }
    } catch {
      // If KaTeX fails, show the original text
      parts.push(<span key={key++} className="font-mono text-destructive">{match[0]}</span>);
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : [<span key={0}>{text}</span>];
};

// Simple markdown-like formatting for problem solutions
const formatContent = (text: string): React.ReactNode => {
  // Detect if text actually contains math-like content
  const hasMath = /\$[^$]+\$|\d+\s*[+\-*/^]\s*\d+|sqrt\(|\\frac|\\int|\^[0-9]/.test(text);
  
  // Split by line and process each
  const lines = text.split('\n');
  
  return lines.map((line, i) => {
    // Only apply math formatting if the text actually contains math
    let processedLine = hasMath ? formatMathExpression(line) : line;
    
    // Bold text: **text**
    let formattedLine: React.ReactNode = processedLine;
    
    // Handle headers/bold markers like **Problem**: or 📝 **Problem**:
    if (processedLine.includes('**')) {
      const parts = processedLine.split(/(\*\*[^*]+\*\*)/g);
      formattedLine = parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} className="font-semibold text-primary">{part.slice(2, -2)}</strong>;
        }
        // Check if this part has LaTeX
        if (part.includes('$')) {
          return <span key={j}>{renderMath(part)}</span>;
        }
        return part;
      });
    } else if (processedLine.includes('$')) {
      // Handle LaTeX in lines without bold
      formattedLine = renderMath(processedLine);
    }
    
    // Check if this is a math equation line (only if we detected math)
    const isMathLine = hasMath && (
      /[=×÷√²³⁴⁵⁶⁷⁸⁹⁰¹±∞π]/.test(processedLine) || 
      /^\s*[\d\s+\-×÷=()]+\s*$/.test(processedLine)
    );
    
    return (
      <span key={i} className={isMathLine ? 'font-mono tracking-wide' : ''}>
        {formattedLine}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
};

const defaultReactions: Reactions = { heart: 0, star: 0, thumbsUp: 0 };

const ChatMessage = ({ content, isUser, timestamp, imageUrl, reactions = defaultReactions, userReactions = [], isBookmarked = false, onReact, onBookmark }: ChatMessageProps) => {
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
        className={`max-w-[85%] sm:max-w-[75%] px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl relative transition-all duration-200 ${
          isUser
            ? "bg-gradient-to-br from-lia-pink/25 to-lia-purple/15 border border-lia-pink/25 rounded-br-sm shadow-md shadow-lia-pink/10"
            : isProblemSolution 
              ? "bg-gradient-to-br from-card/90 to-card/70 border border-primary/20 rounded-bl-sm backdrop-blur-sm shadow-lg shadow-primary/5"
              : "bg-gradient-to-br from-card/80 to-card/60 border border-border/40 rounded-bl-sm backdrop-blur-sm shadow-md shadow-black/5"
        } ${isBookmarked ? "ring-2 ring-primary/30 ring-offset-1 ring-offset-background" : ""}`}
      >
        {/* Bookmark button - appears on hover/long-press */}
        {onBookmark && (
          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 sm:transition-opacity sm:duration-200">
            <BookmarkButton isBookmarked={isBookmarked} onToggle={onBookmark} />
          </div>
        )}

        {imageUrl && (
          <div className="mb-2 relative group/image">
            <img 
              src={imageUrl} 
              alt="Generated image" 
              className="rounded-xl max-w-full h-auto shadow-lg border border-border/20"
              loading="lazy"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover/image:opacity-100 transition-opacity duration-200 bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={() => {
                const link = document.createElement('a');
                link.href = imageUrl;
                link.download = `lia-image-${Date.now()}.png`;
                link.target = '_blank';
                fetch(imageUrl)
                  .then(res => res.blob())
                  .then(blob => {
                    const url = URL.createObjectURL(blob);
                    link.href = url;
                    link.click();
                    URL.revokeObjectURL(url);
                  })
                  .catch(() => {
                    window.open(imageUrl, '_blank');
                  });
              }}
            >
              <Download className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        )}
        <div className={`text-foreground leading-relaxed text-[14px] sm:text-base ${isProblemSolution ? 'whitespace-pre-wrap' : ''}`}>
          {formatContent(content)}
        </div>
        <div className="flex items-center justify-between gap-2 mt-1">
          {timestamp && (
            <p className={`text-[10px] sm:text-xs opacity-50 ${isUser ? 'text-lia-pink' : 'text-muted-foreground'}`}>
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
