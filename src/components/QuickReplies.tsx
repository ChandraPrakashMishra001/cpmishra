import { motion, AnimatePresence } from "framer-motion";

interface QuickRepliesProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  visible: boolean;
}

const QuickReplies = ({ suggestions, onSelect, visible }: QuickRepliesProps) => {
  if (!visible || suggestions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex flex-wrap gap-2 px-2 sm:px-4 py-2"
      >
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={suggestion}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelect(suggestion)}
            className="px-3 py-1.5 text-xs sm:text-sm rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary transition-all duration-200 hover:scale-105 active:scale-95"
          >
            {suggestion}
          </motion.button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};

export default QuickReplies;
