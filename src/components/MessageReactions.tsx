import { useState } from "react";
import { Heart, Star, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type ReactionType = "heart" | "star" | "thumbsUp";

export interface Reactions {
  heart: number;
  star: number;
  thumbsUp: number;
}

interface MessageReactionsProps {
  reactions: Reactions;
  userReactions: ReactionType[];
  onReact: (type: ReactionType) => void;
  isUser: boolean;
}

const reactionConfig = {
  heart: { icon: Heart, emoji: "❤️", color: "text-red-500", bgColor: "bg-red-500/20" },
  star: { icon: Star, emoji: "⭐", color: "text-yellow-500", bgColor: "bg-yellow-500/20" },
  thumbsUp: { icon: ThumbsUp, emoji: "👍", color: "text-blue-500", bgColor: "bg-blue-500/20" },
};

const MessageReactions = ({ reactions, userReactions, onReact, isUser }: MessageReactionsProps) => {
  const [showPicker, setShowPicker] = useState(false);

  const hasAnyReactions = reactions.heart > 0 || reactions.star > 0 || reactions.thumbsUp > 0;

  return (
    <div className={cn("flex items-center gap-1 mt-1", isUser ? "justify-end" : "justify-start")}>
      {/* Display existing reactions */}
      {hasAnyReactions && (
        <div className="flex items-center gap-1 mr-1">
          {(Object.entries(reactions) as [ReactionType, number][]).map(([type, count]) => {
            if (count === 0) return null;
            const config = reactionConfig[type];
            const isUserReaction = userReactions.includes(type);
            return (
              <button
                key={type}
                onClick={() => onReact(type)}
                className={cn(
                  "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-all",
                  "hover:scale-110 active:scale-95",
                  isUserReaction ? config.bgColor : "bg-muted/50",
                  isUserReaction ? config.color : "text-muted-foreground"
                )}
              >
                <span>{config.emoji}</span>
                <span className="font-medium">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Reaction picker trigger */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className={cn(
            "p-1 rounded-full transition-all opacity-0 group-hover:opacity-100",
            "hover:bg-muted/50 text-muted-foreground hover:text-foreground",
            showPicker && "opacity-100 bg-muted/50"
          )}
        >
          <span className="text-xs">😊</span>
        </button>

        {/* Reaction picker dropdown */}
        {showPicker && (
          <div
            className={cn(
              "absolute z-50 flex items-center gap-1 p-1.5 rounded-full",
              "bg-card border border-border shadow-lg animate-scale-in",
              isUser ? "right-0" : "left-0",
              "bottom-full mb-1"
            )}
          >
            {(Object.entries(reactionConfig) as [ReactionType, typeof reactionConfig.heart][]).map(
              ([type, config]) => {
                const isActive = userReactions.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => {
                      onReact(type);
                      setShowPicker(false);
                    }}
                    className={cn(
                      "p-1.5 rounded-full transition-all",
                      "hover:scale-125 active:scale-95",
                      isActive ? config.bgColor : "hover:bg-muted/50"
                    )}
                  >
                    <span className="text-base">{config.emoji}</span>
                  </button>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageReactions;
