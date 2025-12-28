import liaAvatar from "@/assets/lia-avatar.png";

export type Emotion = "neutral" | "happy" | "thinking" | "surprised" | "sad";

interface LiaAvatarProps {
  emotion: Emotion;
  isTalking: boolean;
}

const LiaAvatar = ({ emotion, isTalking }: LiaAvatarProps) => {
  const getEmotionStyles = () => {
    switch (emotion) {
      case "happy":
        return "brightness-110 saturate-110";
      case "thinking":
        return "brightness-95 hue-rotate-15";
      case "surprised":
        return "brightness-115 scale-105";
      case "sad":
        return "brightness-90 saturate-90";
      default:
        return "";
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Glow effect behind avatar */}
      <div className="absolute w-72 h-72 rounded-full bg-lia-pink/30 animate-pulse-glow" />
      <div className="absolute w-56 h-56 rounded-full bg-lia-purple/20 animate-pulse-glow" style={{ animationDelay: "1s" }} />
      
      {/* Sparkle particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-lia-pink-glow rounded-full animate-sparkle"
            style={{
              top: `${20 + Math.random() * 60}%`,
              left: `${20 + Math.random() * 60}%`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* Avatar container */}
      <div className={`relative z-10 ${isTalking ? "" : "animate-float"}`}>
        {/* Expression indicator */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
          <EmotionBubble emotion={emotion} />
        </div>

        {/* Main avatar image */}
        <div className="relative">
          <img
            src={liaAvatar}
            alt="Lia - AI Companion"
            className={`w-64 h-64 object-cover rounded-full glow-avatar transition-all duration-500 ${getEmotionStyles()}`}
          />
          
          {/* Talking mouth overlay */}
          {isTalking && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-8 h-3 bg-lia-pink/60 rounded-full animate-talking" />
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
      default: return "💖";
    }
  };

  return (
    <div className="px-3 py-1 bg-card/80 backdrop-blur-sm rounded-full border border-lia-pink/30 text-sm animate-slide-in">
      <span>{getEmoji()}</span>
    </div>
  );
};

export default LiaAvatar;
