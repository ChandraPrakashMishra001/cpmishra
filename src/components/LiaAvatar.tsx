import { useEffect, useState } from "react";
import liaAvatar from "@/assets/amanai-avatar.png";

export type Emotion = 
  | "neutral" 
  | "happy" 
  | "thinking" 
  | "surprised" 
  | "sad" 
  | "excited" 
  | "confused" 
  | "shy" 
  | "loving" 
  | "curious" 
  | "sleepy" 
  | "annoyed"
  | "angry"
  | "stressed"
  | "motivational";

interface LiaAvatarProps {
  emotion: Emotion;
  isTalking: boolean;
  customAvatarUrl?: string | null;
  compact?: boolean;
}

const LiaAvatar = ({ emotion, isTalking, customAvatarUrl, compact = false }: LiaAvatarProps) => {
  const [imgError, setImgError] = useState(false);
  const avatarSrc = (!imgError && customAvatarUrl) ? customAvatarUrl : liaAvatar;
  const [prevEmotion, setPrevEmotion] = useState(emotion);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Trigger transition animation when emotion changes
  useEffect(() => {
    if (emotion !== prevEmotion) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setPrevEmotion(emotion);
        setIsTransitioning(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [emotion, prevEmotion]);

  const getEmotionStyles = () => {
    const baseTransform = isTransitioning ? "scale-95" : "scale-100";
    switch (emotion) {
      case "happy":
        return `brightness-110 saturate-110 ${baseTransform}`;
      case "thinking":
        return `brightness-95 hue-rotate-15 ${baseTransform}`;
      case "surprised":
        return `brightness-115 scale-110 rotate-2`;
      case "sad":
        return `brightness-85 saturate-75 grayscale-[0.2] ${baseTransform} -translate-y-1`;
      case "excited":
        return `brightness-120 saturate-125 scale-110`;
      case "confused":
        return `brightness-95 hue-rotate-30 -rotate-3 ${baseTransform}`;
      case "shy":
        return `brightness-100 saturate-120 hue-rotate-[-10deg] rotate-[-5deg] ${baseTransform}`;
      case "loving":
        return `brightness-105 saturate-130 hue-rotate-[-15deg] scale-105`;
      case "curious":
        return `brightness-105 scale-105 rotate-3 translate-x-1`;
      case "sleepy":
        return `brightness-80 saturate-70 blur-[0.5px] -rotate-2 ${baseTransform}`;
      case "annoyed":
        return `brightness-90 saturate-90 -rotate-2 scale-98`;
      case "angry":
        return `brightness-85 saturate-130 hue-rotate-[10deg] scale-105 -rotate-1`;
      case "stressed":
        return `brightness-90 saturate-80 scale-98 blur-[0.3px]`;
      case "motivational":
        return `brightness-115 saturate-120 scale-108`;
      default:
        return baseTransform;
    }
  };

  const getGlowColor = () => {
    switch (emotion) {
      case "happy":
      case "excited":
        return "bg-lia-pink/50";
      case "sad":
        return "bg-lia-blue/40";
      case "loving":
      case "shy":
        return "bg-pink-400/50";
      case "curious":
      case "thinking":
        return "bg-lia-purple/40";
      case "annoyed":
        return "bg-orange-400/30";
      case "angry":
        return "bg-red-500/40";
      case "stressed":
        return "bg-purple-500/35";
      case "motivational":
        return "bg-amber-400/45";
      case "sleepy":
        return "bg-lia-blue/25";
      case "surprised":
        return "bg-yellow-400/30";
      default:
        return "bg-lia-pink/35";
    }
  };

  const getEmotionParticles = () => {
    switch (emotion) {
      case "loving":
        return ["💕", "💗", "💖", "💝", "❤️", "💘"];
      case "excited":
        return ["✨", "⭐", "🌟", "💫", "🎉", "🎊"];
      case "happy":
        return ["✨", "🌸", "💖", "⭐", "🌺"];
      case "sad":
        return ["💧", "🌧️", "💫", "🥺"];
      case "sleepy":
        return ["💤", "✨", "🌙", "⭐", "😴"];
      case "confused":
        return ["❓", "💭", "🤔", "❔"];
      case "curious":
        return ["👀", "✨", "💡", "🔍"];
      case "shy":
        return ["🌸", "💕", "✨", "🙈"];
      case "surprised":
        return ["⭐", "✨", "😮", "💥"];
      case "annoyed":
        return ["💢", "😤", "💨"];
      case "angry":
        return ["🔥", "💢", "😠", "⚡"];
      case "stressed":
        return ["😰", "💫", "🌀", "💭"];
      case "motivational":
        return ["💪", "🌟", "🔥", "✨", "🚀", "⭐"];
      case "thinking":
        return ["💭", "🤔", "💡", "✨"];
      default:
        return ["✨", "💖", "⭐"];
    }
  };

  const getAnimationClass = () => {
    // User preference: avatar should ONLY float — no vibration, shake, bounce, etc.
    return "animate-float";
  };

  const avatarSize = compact ? "w-20 h-20" : "w-64 h-64";
  const glowSize = compact ? "w-24 h-24" : "w-72 h-72";
  const innerGlowSize = compact ? "w-16 h-16" : "w-56 h-56";

  return (
    <div className={`relative flex items-center justify-center ${compact ? "scale-100" : ""}`}>
      {/* Glow effect behind avatar */}
      <div className={`absolute ${glowSize} rounded-full ${getGlowColor()} animate-pulse-glow transition-colors duration-500`} />
      <div className={`absolute ${innerGlowSize} rounded-full bg-lia-purple/20 animate-pulse-glow`} style={{ animationDelay: "1s" }} />
      
      {/* Emotion-specific particles */}
      {!compact && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {getEmotionParticles().map((particle, i) => (
            <div
              key={`${emotion}-${i}`}
              className="absolute text-xl animate-particle-float"
              style={{
                top: `${10 + Math.random() * 80}%`,
                left: `${10 + Math.random() * 80}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${2 + Math.random() * 1.5}s`,
                opacity: 0.9,
              }}
            >
              {particle}
            </div>
          ))}
        </div>
      )}

      {/* Avatar container */}
      <div className={`relative z-10 ${getAnimationClass()} transition-transform duration-300`}>
        {/* Expression indicator */}
        {!compact && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
            <EmotionBubble emotion={emotion} />
          </div>
        )}

        {/* Main avatar image */}
        <div className="relative">
          <img
            src={avatarSrc}
            alt="AI Companion"
            onError={() => setImgError(true)}
            loading="eager"
            decoding="async"
            className={`${avatarSize} object-cover rounded-full glow-avatar transition-all duration-500 ease-out ${getEmotionStyles()}`}
          />
          
          {/* Talking indicator overlay */}
          {isTalking && !compact && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-lia-pink rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-lia-pink rounded-full animate-bounce" style={{ animationDelay: "100ms" }} />
                <span className="w-2 h-2 bg-lia-pink rounded-full animate-bounce" style={{ animationDelay: "200ms" }} />
              </div>
            </div>
          )}

          {/* Emotion-specific overlays */}
          {emotion === "loving" && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-pink-500/30 to-transparent animate-pulse" />
          )}
          {emotion === "excited" && (
            <div className="absolute inset-0 rounded-full animate-breathe border-4 border-lia-pink/50" />
          )}
          {emotion === "sleepy" && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-transparent to-lia-purple-deep/40" />
          )}
          {emotion === "sad" && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-transparent to-blue-400/20" />
          )}
          {emotion === "surprised" && (
            <div className="absolute inset-0 rounded-full border-4 border-yellow-400/40 animate-ping-slow" />
          )}
          {emotion === "shy" && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-pink-300/30 to-transparent" />
          )}
          {emotion === "thinking" && (
            <div className="absolute -top-2 -right-2 text-2xl animate-float">💭</div>
          )}
          {emotion === "annoyed" && (
            <div className="absolute -top-2 -right-2 text-xl animate-pulse">💢</div>
          )}
          {emotion === "angry" && (
            <div className="absolute inset-0 rounded-full border-4 border-red-500/40 animate-pulse" />
          )}
          {emotion === "stressed" && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-purple-400/20 to-transparent animate-pulse" />
          )}
          {emotion === "motivational" && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-amber-400/30 to-transparent animate-breathe" />
          )}
        </div>

        {/* Status ring */}
        <div className={`absolute inset-0 rounded-full border-2 border-lia-pink/40 animate-breathe transition-all duration-500 ${
          emotion === "excited" ? "border-lia-pink/60" : ""
        }`} />
        <div
          className="absolute inset-0 rounded-full border border-lia-blue/30"
          style={{ animationDelay: "1.5s" }}
        />
      </div>
    </div>
  );
};

const EmotionBubble = ({ emotion }: { emotion: Emotion }) => {
  const getEmoji = () => {
    switch (emotion) {
      case "happy": return "✨";
      case "thinking": return "💭";
      case "surprised": return "⭐";
      case "sad": return "💫";
      case "excited": return "🎉";
      case "confused": return "❓";
      case "shy": return "🌸";
      case "loving": return "💕";
      case "curious": return "👀";
      case "sleepy": return "💤";
      case "annoyed": return "😤";
      case "angry": return "🔥";
      case "stressed": return "😰";
      case "motivational": return "💪";
      default: return "💖";
    }
  };

  const getLabel = () => {
    switch (emotion) {
      case "happy": return "Happy";
      case "thinking": return "Thinking...";
      case "surprised": return "Wow!";
      case "sad": return "Feeling sad";
      case "excited": return "So excited!";
      case "confused": return "Confused";
      case "shy": return "Shy~";
      case "loving": return "Feeling loved";
      case "curious": return "Curious!";
      case "sleepy": return "Sleepy...";
      case "annoyed": return "Hmph!";
      case "angry": return "Really upset!";
      case "stressed": return "Stressed...";
      case "motivational": return "You got this!";
      default: return "";
    }
  };

  return (
    <div className="px-3 py-1 bg-card/80 backdrop-blur-sm rounded-full border border-lia-pink/30 text-sm animate-emotion-pop flex items-center gap-1.5 shadow-lg">
      <span className="animate-emoji-bounce">{getEmoji()}</span>
      <span className="text-xs text-muted-foreground font-medium">{getLabel()}</span>
    </div>
  );
};

export default LiaAvatar;
