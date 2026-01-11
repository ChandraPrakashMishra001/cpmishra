import { useEffect, useState, useMemo } from "react";

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

const FloatingSparkles = () => {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  // Generate sparkles on mount
  const generatedSparkles = useMemo(() => {
    const count = 15; // Subtle amount of sparkles
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2, // 2-6px
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2, // 2-5s
      opacity: Math.random() * 0.5 + 0.3, // 0.3-0.8
    }));
  }, []);

  useEffect(() => {
    setSparkles(generatedSparkles);
  }, [generatedSparkles]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute animate-sparkle-float"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            width: `${sparkle.size}px`,
            height: `${sparkle.size}px`,
            animationDelay: `${sparkle.delay}s`,
            animationDuration: `${sparkle.duration}s`,
          }}
        >
          {/* Sparkle star shape */}
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-full h-full text-lia-pink drop-shadow-sm"
            style={{ opacity: sparkle.opacity }}
          >
            <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
          </svg>
        </div>
      ))}
      
      {/* Additional soft glowing orbs */}
      <div 
        className="absolute w-32 h-32 rounded-full bg-lia-pink/10 blur-3xl animate-pulse"
        style={{ left: '10%', top: '20%', animationDuration: '4s' }}
      />
      <div 
        className="absolute w-24 h-24 rounded-full bg-lia-purple/10 blur-3xl animate-pulse"
        style={{ left: '80%', top: '60%', animationDuration: '5s', animationDelay: '1s' }}
      />
      <div 
        className="absolute w-20 h-20 rounded-full bg-lia-cyan/10 blur-3xl animate-pulse"
        style={{ left: '60%', top: '10%', animationDuration: '6s', animationDelay: '2s' }}
      />
    </div>
  );
};

export default FloatingSparkles;
