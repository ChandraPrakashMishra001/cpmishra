import { Emotion } from "./LiaAvatar";

interface MoodIndicatorProps {
  mood: Emotion;
  className?: string;
}

const moodConfig: Record<Emotion, { emoji: string; label: string; color: string }> = {
  neutral: { emoji: "😌", label: "Calm", color: "bg-slate-400/20 text-slate-500" },
  happy: { emoji: "😊", label: "Happy", color: "bg-yellow-500/20 text-yellow-600" },
  excited: { emoji: "🎉", label: "Excited", color: "bg-orange-500/20 text-orange-600" },
  loving: { emoji: "💕", label: "Loving", color: "bg-pink-500/20 text-pink-600" },
  shy: { emoji: "😳", label: "Shy", color: "bg-rose-500/20 text-rose-600" },
  thinking: { emoji: "🤔", label: "Thinking", color: "bg-blue-500/20 text-blue-600" },
  curious: { emoji: "✨", label: "Curious", color: "bg-purple-500/20 text-purple-600" },
  sad: { emoji: "😢", label: "Sad", color: "bg-slate-500/20 text-slate-600" },
  sleepy: { emoji: "😴", label: "Sleepy", color: "bg-indigo-500/20 text-indigo-600" },
  confused: { emoji: "😵", label: "Confused", color: "bg-amber-500/20 text-amber-600" },
  annoyed: { emoji: "😤", label: "Annoyed", color: "bg-red-500/20 text-red-600" },
  surprised: { emoji: "😲", label: "Surprised", color: "bg-cyan-500/20 text-cyan-600" },
  angry: { emoji: "😠", label: "Angry", color: "bg-red-600/20 text-red-700" },
  stressed: { emoji: "😰", label: "Stressed", color: "bg-orange-600/20 text-orange-700" },
  motivational: { emoji: "💪", label: "Motivated", color: "bg-emerald-500/20 text-emerald-600" },
};

const MoodIndicator = ({ mood, className = "" }: MoodIndicatorProps) => {
  const config = moodConfig[mood];

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color} ${className}`}
    >
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </div>
  );
};

export default MoodIndicator;
