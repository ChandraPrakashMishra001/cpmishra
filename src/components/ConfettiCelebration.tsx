import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
  size: number;
}

interface ConfettiCelebrationProps {
  trigger: boolean;
  onComplete?: () => void;
}

const colors = [
  "bg-pink-500",
  "bg-purple-500",
  "bg-yellow-500",
  "bg-cyan-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-rose-500",
];

const ConfettiCelebration = ({ trigger, onComplete }: ConfettiCelebrationProps) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      const newPieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        rotation: Math.random() * 360,
        size: Math.random() * 8 + 4,
      }));
      setPieces(newPieces);
      setIsVisible(true);

      const timeout = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [trigger, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {pieces.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{
                x: `${piece.x}vw`,
                y: -20,
                rotate: 0,
                opacity: 1,
              }}
              animate={{
                y: "110vh",
                rotate: piece.rotation + 720,
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 3,
                delay: piece.delay,
                ease: "easeOut",
              }}
              className={`absolute ${piece.color} rounded-sm`}
              style={{
                width: piece.size,
                height: piece.size * 0.6,
              }}
            />
          ))}
          
          {/* Celebration text */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="text-4xl sm:text-6xl font-display font-bold text-gradient animate-pulse">
              🎉 Yay! 🎉
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfettiCelebration;
