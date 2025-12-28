import { useState, KeyboardEvent } from "react";
import { Send, Sparkles } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative">
      <div className="flex items-end gap-3 p-4 bg-card/40 backdrop-blur-md rounded-2xl border border-lia-pink/20">
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Say something to Lia..."
            disabled={disabled}
            rows={1}
            className="w-full bg-transparent resize-none outline-none placeholder:text-muted-foreground text-foreground font-body"
            style={{ minHeight: "24px", maxHeight: "120px" }}
          />
        </div>
        
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-lia-pink hover:bg-lia-pink-glow disabled:opacity-40 disabled:hover:bg-lia-pink transition-all duration-300 glow-pink"
        >
          {disabled ? (
            <Sparkles className="w-5 h-5 text-primary-foreground animate-pulse" />
          ) : (
            <Send className="w-5 h-5 text-primary-foreground" />
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
