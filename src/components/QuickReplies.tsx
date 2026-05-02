import { forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface QuickRepliesProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  visible: boolean;
}

const QuickReplies = forwardRef<HTMLDivElement, QuickRepliesProps>(
  ({ suggestions, onSelect, visible }, ref) => {
    if (!visible || suggestions.length === 0) return null;

    return (
      <AnimatePresence>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex flex-wrap gap-1.5 px-2 sm:px-4 py-1.5"
        >
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={suggestion}
              initial={{ opacity: 0, scale: 0.8, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.08, type: "spring", stiffness: 300 }}
              onClick={() => onSelect(suggestion)}
              className="px-3 py-1.5 text-[11px] sm:text-sm rounded-full bg-gradient-to-r from-primary/10 to-lia-pink/10 hover:from-primary/20 hover:to-lia-pink/20 border border-primary/20 text-primary font-medium transition-all duration-200 hover:scale-105 hover:shadow-md hover:shadow-primary/10 active:scale-95"
            >
              {suggestion}
            </motion.button>
          ))}
        </motion.div>
      </AnimatePresence>
    );
  }
);

QuickReplies.displayName = "QuickReplies";

export default QuickReplies;
