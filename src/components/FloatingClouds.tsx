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

const FloatingClouds = () => {
  const [clouds, setClouds] = useState<Cloud[]>([]);

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

    generateClouds();
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Sun element */}
      <Sun />
      
      {/* Clouds */}
      {clouds.map((cloud) => (
        <div
          key={cloud.id}
          className="absolute animate-cloud"
          style={{
            top: `${cloud.top}%`,
            left: `${cloud.left}%`,
            width: `${cloud.size}px`,
            height: `${cloud.size * 0.6}px`,
            animationDuration: `${cloud.duration}s`,
            animationDelay: `${cloud.delay}s`,
            opacity: cloud.opacity,
          }}
        >
          {/* Cloud shape using multiple circles */}
          <div className="relative w-full h-full">
            <div 
              className="absolute bg-white rounded-full"
              style={{
                width: '50%',
                height: '80%',
                left: '25%',
                top: '20%',
                filter: 'blur(2px)',
              }}
            />
            <div 
              className="absolute bg-white rounded-full"
              style={{
                width: '40%',
                height: '70%',
                left: '5%',
                top: '35%',
                filter: 'blur(2px)',
              }}
            />
            <div 
              className="absolute bg-white rounded-full"
              style={{
                width: '45%',
                height: '75%',
                left: '50%',
                top: '30%',
                filter: 'blur(2px)',
              }}
            />
            <div 
              className="absolute bg-white rounded-full"
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
