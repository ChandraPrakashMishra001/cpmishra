import { useEffect, useState } from "react";

interface Cloud {
  id: number;
  size: number;
  top: number;
  left: number;
  duration: number;
  delay: number;
  opacity: number;
}

interface Star {
  id: number;
  size: number;
  top: number;
  left: number;
  delay: number;
  duration: number;
}

const Sun = () => {
  return (
    <div className="absolute top-8 right-12 lg:top-16 lg:right-24 z-0">
      {/* Outer glow layers */}
      <div className="absolute inset-0 w-32 h-32 lg:w-40 lg:h-40 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
        <div className="absolute inset-0 bg-yellow-200/20 rounded-full animate-sun-glow-outer blur-3xl" />
      </div>
      <div className="absolute inset-0 w-24 h-24 lg:w-32 lg:h-32 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
        <div className="absolute inset-0 bg-yellow-300/30 rounded-full animate-sun-glow-middle blur-2xl" />
      </div>
      
      {/* Sun rays */}
      <div className="absolute w-20 h-20 lg:w-24 lg:h-24 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 animate-sun-rays">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 w-1 h-8 lg:h-10 bg-gradient-to-t from-yellow-400/40 to-transparent origin-bottom"
            style={{
              transform: `translateX(-50%) rotate(${i * 45}deg) translateY(-100%)`,
            }}
          />
        ))}
      </div>
      
      {/* Main sun body */}
      <div className="relative w-14 h-14 lg:w-18 lg:h-18">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-200 via-yellow-300 to-orange-300 rounded-full animate-sun-pulse shadow-lg" />
        <div className="absolute inset-1 bg-gradient-to-br from-yellow-100 via-yellow-200 to-yellow-300 rounded-full opacity-80" />
        <div className="absolute inset-2 bg-gradient-to-br from-white/60 to-transparent rounded-full" />
      </div>
    </div>
  );
};

const Moon = () => {
  return (
    <div className="absolute top-8 right-12 lg:top-16 lg:right-24 z-0">
      {/* Outer glow layers */}
      <div className="absolute inset-0 w-36 h-36 lg:w-44 lg:h-44 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
        <div className="absolute inset-0 bg-blue-200/10 rounded-full animate-moon-glow blur-3xl" />
      </div>
      <div className="absolute inset-0 w-28 h-28 lg:w-36 lg:h-36 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
        <div className="absolute inset-0 bg-purple-200/15 rounded-full animate-moon-glow-inner blur-2xl" />
      </div>
      
      {/* Main moon body */}
      <div className="relative w-14 h-14 lg:w-16 lg:h-16">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 rounded-full shadow-lg animate-moon-pulse" />
        {/* Craters */}
        <div className="absolute w-3 h-3 bg-gray-300/50 rounded-full top-2 left-3" />
        <div className="absolute w-2 h-2 bg-gray-300/40 rounded-full top-5 left-7" />
        <div className="absolute w-2.5 h-2.5 bg-gray-300/30 rounded-full bottom-3 left-4" />
        {/* Highlight */}
        <div className="absolute inset-1 bg-gradient-to-br from-white/40 to-transparent rounded-full" />
      </div>
    </div>
  );
};

const Stars = ({ stars }: { stars: Star[] }) => {
  return (
    <>
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute animate-star-twinkle"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        >
          <div className="w-full h-full bg-white rounded-full" />
        </div>
      ))}
    </>
  );
};

interface FloatingCloudsProps {
  isNight?: boolean;
}

const FloatingClouds = ({ isNight = false }: FloatingCloudsProps) => {
  const [clouds, setClouds] = useState<Cloud[]>([]);
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    const generateClouds = () => {
      const newClouds: Cloud[] = [];
      for (let i = 0; i < 8; i++) {
        newClouds.push({
          id: i,
          size: Math.random() * 150 + 80,
          top: Math.random() * 100,
          left: -20,
          duration: Math.random() * 40 + 60,
          delay: Math.random() * 30,
          opacity: Math.random() * 0.4 + 0.3,
        });
      }
      setClouds(newClouds);
    };

    const generateStars = () => {
      const newStars: Star[] = [];
      for (let i = 0; i < 60; i++) {
        newStars.push({
          id: i,
          size: Math.random() * 3 + 1,
          top: Math.random() * 100,
          left: Math.random() * 100,
          delay: Math.random() * 5,
          duration: Math.random() * 3 + 2,
        });
      }
      setStars(newStars);
    };

    generateClouds();
    generateStars();
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 transition-all duration-500">
      {/* Sun or Moon */}
      {isNight ? <Moon /> : <Sun />}
      
      {/* Stars (night only) */}
      {isNight && <Stars stars={stars} />}
      
      {/* Clouds (day only, or sparse at night) */}
      {clouds.map((cloud) => (
        <div
          key={cloud.id}
          className={`absolute animate-cloud transition-opacity duration-500 ${
            isNight ? "opacity-10" : ""
          }`}
          style={{
            top: `${cloud.top}%`,
            left: `${cloud.left}%`,
            width: `${cloud.size}px`,
            height: `${cloud.size * 0.6}px`,
            animationDuration: `${cloud.duration}s`,
            animationDelay: `${cloud.delay}s`,
            opacity: isNight ? cloud.opacity * 0.15 : cloud.opacity,
          }}
        >
          {/* Cloud shape using multiple circles */}
          <div className="relative w-full h-full">
            <div 
              className={`absolute rounded-full ${isNight ? "bg-gray-400" : "bg-white"}`}
              style={{
                width: '50%',
                height: '80%',
                left: '25%',
                top: '20%',
                filter: 'blur(2px)',
              }}
            />
            <div 
              className={`absolute rounded-full ${isNight ? "bg-gray-400" : "bg-white"}`}
              style={{
                width: '40%',
                height: '70%',
                left: '5%',
                top: '35%',
                filter: 'blur(2px)',
              }}
            />
            <div 
              className={`absolute rounded-full ${isNight ? "bg-gray-400" : "bg-white"}`}
              style={{
                width: '45%',
                height: '75%',
                left: '50%',
                top: '30%',
                filter: 'blur(2px)',
              }}
            />
            <div 
              className={`absolute rounded-full ${isNight ? "bg-gray-400" : "bg-white"}`}
              style={{
                width: '35%',
                height: '60%',
                left: '35%',
                top: '5%',
                filter: 'blur(1px)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default FloatingClouds;
