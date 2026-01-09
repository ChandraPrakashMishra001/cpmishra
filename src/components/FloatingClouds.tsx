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
