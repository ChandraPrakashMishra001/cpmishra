import { useState, KeyboardEvent, useRef } from "react";
import { Send, Sparkles, ImagePlus, X } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string, imageUrl?: string) => void;
  disabled?: boolean;
  companionName?: string;
}

const ChatInput = ({ onSend, disabled, companionName = "Lia" }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((message.trim() || imagePreview) && !disabled) {
      onSend(message.trim(), imagePreview || undefined);
      setMessage("");
      setImagePreview(null);
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
      if (file.size > 5 * 1024 * 1024) {
        alert("Image too large! Please use an image under 5MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = () => {
    setImagePreview(null);
  };

  return (
    <div className="relative">
      {imagePreview && (
        <div className="mb-2 relative inline-block">
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="h-20 w-auto rounded-lg border border-lia-pink/30"
          />
          <button
            onClick={removeImage}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      <div className="flex items-end gap-3 p-4 bg-card/40 backdrop-blur-md rounded-2xl border border-lia-pink/20">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-lia-purple/20 hover:bg-lia-purple/40 disabled:opacity-40 transition-all duration-300"
          title="Share an image"
        >
          <ImagePlus className="w-5 h-5 text-lia-purple" />
        </button>
        
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={imagePreview ? `Say something about this image...` : `Say something to ${companionName}...`}
            disabled={disabled}
            rows={1}
            className="w-full bg-transparent resize-none outline-none placeholder:text-muted-foreground text-foreground font-body"
            style={{ minHeight: "24px", maxHeight: "120px" }}
          />
        </div>
        
        <button
          onClick={handleSend}
          disabled={(!message.trim() && !imagePreview) || disabled}
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
