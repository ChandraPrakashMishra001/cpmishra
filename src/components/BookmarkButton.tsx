import { Bookmark } from "lucide-react";
import { motion } from "framer-motion";

interface BookmarkButtonProps {
  isBookmarked: boolean;
  onToggle: () => void;
}

const BookmarkButton = ({ isBookmarked, onToggle }: BookmarkButtonProps) => {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onToggle}
      className={`p-1 rounded-full transition-colors duration-200 ${
        isBookmarked
          ? "text-primary bg-primary/20"
          : "text-muted-foreground/50 hover:text-primary hover:bg-primary/10"
      }`}
      title={isBookmarked ? "Remove bookmark" : "Bookmark this message"}
    >
      <Bookmark
        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-200 ${
          isBookmarked ? "fill-current" : ""
        }`}
      />
    </motion.button>
  );
};

export default BookmarkButton;
