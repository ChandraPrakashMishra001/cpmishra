import { useEffect, useState } from "react";

interface Petal {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
  type: "🌸" | "🌺" | "💮" | "✿" | "❀";
  opacity: number;
}

const PETAL_TYPES: Petal["type"][] = ["🌸", "🌺", "💮", "✿", "❀"];

const FallingPetals = () => {
  const [petals, setPetals] = useState<Petal[]>([]);

  useEffect(() => {
    // Create initial petals
    const initialPetals: Petal[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 8 + Math.random() * 12,
      size: 12 + Math.random() * 16,
      rotation: Math.random() * 360,
      type: PETAL_TYPES[Math.floor(Math.random() * PETAL_TYPES.length)],
      opacity: 0.3 + Math.random() * 0.4,
    }));
    setPetals(initialPetals);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {petals.map((petal) => (
        <div
          key={petal.id}
          className="absolute animate-fall"
          style={{
            left: `${petal.left}%`,
            top: "-50px",
            fontSize: `${petal.size}px`,
            opacity: petal.opacity,
            animationDelay: `${petal.delay}s`,
            animationDuration: `${petal.duration}s`,
            transform: `rotate(${petal.rotation}deg)`,
          }}
        >
          {petal.type}
        </div>
      ))}
    </div>
  );
};

export default FallingPetals;
