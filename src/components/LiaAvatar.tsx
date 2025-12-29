import liaAvatar from "@/assets/lia-avatar.png";

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
  | "annoyed";

interface LiaAvatarProps {
  emotion: Emotion;
  isTalking: boolean;
  customAvatarUrl?: string | null;
}

const LiaAvatar = ({ emotion, isTalking, customAvatarUrl }: LiaAvatarProps) => {
  const avatarSrc = customAvatarUrl || liaAvatar;

  const getEmotionStyles = () => {
    switch (emotion) {
      case "happy":
        return "brightness-110 saturate-110";
      case "thinking":
        return "brightness-95 hue-rotate-15";
      case "surprised":
        return "brightness-115 scale-105";
      case "sad":
        return "brightness-85 saturate-75 grayscale-[0.2]";
      case "excited":
        return "brightness-120 saturate-125 scale-105";
      case "confused":
        return "brightness-95 hue-rotate-30 -rotate-2";
      case "shy":
        return "brightness-100 saturate-120 hue-rotate-[-10deg]";
      case "loving":
        return "brightness-105 saturate-130 hue-rotate-[-15deg]";
      case "curious":
        return "brightness-105 scale-102 rotate-1";
      case "sleepy":
        return "brightness-80 saturate-70 blur-[0.5px]";
      case "annoyed":
        return "brightness-90 saturate-90 -rotate-1";
      default:
        return "";
    }
  };

  const getGlowColor = () => {
    switch (emotion) {
      case "happy":
      case "excited":
        return "bg-lia-pink/40";
      case "sad":
        return "bg-lia-blue/30";
      case "loving":
      case "shy":
        return "bg-pink-400/40";
      case "curious":
      case "thinking":
        return "bg-lia-purple/30";
      case "annoyed":
        return "bg-orange-400/20";
      case "sleepy":
        return "bg-lia-blue/20";
      default:
        return "bg-lia-pink/30";
    }
  };

  const getEmotionParticles = () => {
    switch (emotion) {
      case "loving":
        return ["💕", "💗", "💖", "💝"];
      case "excited":
        return ["✨", "⭐", "🌟", "💫"];
      case "happy":
        return ["✨", "🌸", "💖", "⭐"];
      case "sad":
        return ["💧", "🌧️", "💫"];
      case "sleepy":
        return ["💤", "✨", "🌙"];
      case "confused":
        return ["❓", "💭", "🤔"];
      case "curious":
        return ["👀", "✨", "💡"];
      case "shy":
        return ["🌸", "💕", "✨"];
      default:
        return ["✨", "💖", "⭐"];
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Glow effect behind avatar */}
      <div className={`absolute w-72 h-72 rounded-full ${getGlowColor()} animate-pulse-glow`} />
      <div className="absolute w-56 h-56 rounded-full bg-lia-purple/20 animate-pulse-glow" style={{ animationDelay: "1s" }} />
      
      {/* Emotion-specific particles */}
      <div className="absolute inset-0 pointer-events-none">
        {getEmotionParticles().map((particle, i) => (
          <div
            key={i}
            className="absolute text-xl animate-sparkle"
            style={{
              top: `${15 + Math.random() * 70}%`,
              left: `${15 + Math.random() * 70}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${2 + Math.random()}s`,
            }}
          >
            {particle}
          </div>
        ))}
      </div>

      {/* Avatar container */}
      <div className={`relative z-10 ${isTalking ? "animate-talking-bounce" : "animate-float"}`}>
        {/* Expression indicator */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
          <EmotionBubble emotion={emotion} />
        </div>

        {/* Main avatar image */}
        <div className="relative">
          <img
            src={avatarSrc}
            alt="AI Companion"
            className={`w-64 h-64 object-cover rounded-full glow-avatar transition-all duration-500 ${getEmotionStyles()}`}
          />
          
          {/* Talking indicator overlay */}
          {isTalking && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-lia-pink rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-lia-pink rounded-full animate-bounce" style={{ animationDelay: "100ms" }} />
                <span className="w-2 h-2 bg-lia-pink rounded-full animate-bounce" style={{ animationDelay: "200ms" }} />
              </div>
            </div>
          )}

          {/* Emotion-specific effects */}
          {emotion === "loving" && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-pink-500/20 to-transparent animate-pulse" />
          )}
          {emotion === "excited" && (
            <div className="absolute inset-0 rounded-full animate-breathe border-4 border-lia-pink/40" />
          )}
          {emotion === "sleepy" && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-transparent to-lia-purple-deep/30" />
          )}
        </div>

        {/* Status ring */}
        <div className="absolute inset-0 rounded-full border-2 border-lia-pink/40 animate-breathe" />
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
      default: return "";
    }
  };

  return (
    <div className="px-3 py-1 bg-card/80 backdrop-blur-sm rounded-full border border-lia-pink/30 text-sm animate-slide-in flex items-center gap-1.5">
      <span>{getEmoji()}</span>
      <span className="text-xs text-muted-foreground">{getLabel()}</span>
    </div>
  );
};

export default LiaAvatar;
