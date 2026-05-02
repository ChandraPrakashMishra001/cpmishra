import { useState, KeyboardEvent, useRef, useEffect, useCallback, forwardRef } from "react";
import { Send, Sparkles, ImagePlus, X, Camera } from "lucide-react";
import { toast } from "sonner";

// Constants for validation
const MAX_MESSAGE_LENGTH = 2000;
const MAX_IMAGE_SIZE_MB = 3;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

interface ChatInputProps {
  onSend: (message: string, imageUrl?: string) => void;
  disabled?: boolean;
  companionName?: string;
}

const ChatInput = forwardRef<HTMLDivElement, ChatInputProps>(({ onSend, disabled, companionName = "Lia" }, _outerRef) => {
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [message, autoResize]);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    
    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      toast.error(`Message too long! Please keep it under ${MAX_MESSAGE_LENGTH} characters~ 💕`);
      return;
    }
    
    if ((trimmedMessage || imagePreview) && !disabled) {
      onSend(trimmedMessage, imagePreview || undefined);
      setMessage("");
      setImagePreview(null);
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        toast.error(`Image too large! Please use an image under ${MAX_IMAGE_SIZE_MB}MB~ 📷`);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64Size = result.length * 0.75;
        if (base64Size > 4 * 1024 * 1024) {
          toast.error("Image too large after processing. Please use a smaller image~ 📷");
          return;
        }
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = () => {
    setImagePreview(null);
  };

  const charCount = message.length;
  const isNearLimit = charCount > MAX_MESSAGE_LENGTH * 0.8;
  const isOverLimit = charCount > MAX_MESSAGE_LENGTH;

  return (
    <div className="relative">
      {imagePreview && (
        <div className="mb-2 space-y-1.5">
          <div className="relative inline-block">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="h-16 sm:h-20 w-auto rounded-lg border border-lia-pink/30"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/80 transition-colors touch-manipulation"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground/70">
            💡 Just ask your question - I'll solve it step by step!
          </p>
        </div>
      )}
      
      <div className="flex items-end gap-1.5 sm:gap-2.5 p-2 sm:p-3 bg-card/50 backdrop-blur-md rounded-2xl border border-border/30 shadow-sm transition-all duration-300 focus-within:border-primary/40 focus-within:shadow-md focus-within:shadow-primary/5">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleImageSelect}
          className="hidden"
        />
        
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled}
          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-lia-cyan/20 hover:bg-lia-cyan/40 active:bg-lia-cyan/50 disabled:opacity-40 transition-all duration-200 touch-manipulation shrink-0"
          title="Take a photo"
        >
          <Camera className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-lia-cyan" />
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-lia-purple/20 hover:bg-lia-purple/40 active:bg-lia-purple/50 disabled:opacity-40 transition-all duration-200 touch-manipulation shrink-0"
          title="Upload an image"
        >
          <ImagePlus className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-lia-purple" />
        </button>
        
        <div className="flex-1 relative min-w-0">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={imagePreview ? `What should I solve?` : `Message ${companionName}...`}
            disabled={disabled}
            rows={1}
            className="w-full bg-transparent resize-none outline-none placeholder:text-muted-foreground text-foreground font-body text-base pr-8 leading-snug"
            style={{ minHeight: "24px", maxHeight: "120px", fontSize: "16px" }}
          />
          {message.length > 0 && (
            <div 
              className={`absolute right-0 bottom-0 text-[10px] sm:text-xs transition-colors duration-200 ${
                isOverLimit 
                  ? 'text-destructive font-medium' 
                  : isNearLimit 
                    ? 'text-amber-500' 
                    : 'text-muted-foreground/50'
              }`}
            >
              {charCount}/{MAX_MESSAGE_LENGTH}
            </div>
          )}
        </div>
        
        <button
          onClick={handleSend}
          disabled={(!message.trim() && !imagePreview) || disabled || isOverLimit}
          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-lia-pink hover:bg-lia-pink-glow active:scale-95 disabled:opacity-40 disabled:hover:bg-lia-pink transition-all duration-200 glow-pink touch-manipulation shrink-0"
        >
          {disabled ? (
            <Sparkles className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-primary-foreground animate-pulse" />
          ) : (
            <Send className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-primary-foreground" />
          )}
        </button>
      </div>
    </div>
  );
});

ChatInput.displayName = "ChatInput";

export default ChatInput;
