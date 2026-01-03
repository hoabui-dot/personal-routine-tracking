import React, { useEffect, useState } from 'react';

interface Snowflake {
  id: number;
  left: number;
  animationDuration: number;
  animationDelay: number;
  fontSize: number;
  opacity: number;
}

interface Star {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
}

const Snowflakes: React.FC = () => {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    // Generate 50 snowflakes with random properties
    const flakes: Snowflake[] = [];
    for (let i = 0; i < 50; i++) {
      flakes.push({
        id: i,
        left: Math.random() * 100, // Random horizontal position (0-100%)
        animationDuration: 10 + Math.random() * 20, // Fall duration (10-30s)
        animationDelay: Math.random() * 10, // Start delay (0-10s)
        fontSize: 10 + Math.random() * 20, // Size (10-30px)
        opacity: 0.3 + Math.random() * 0.7, // Opacity (0.3-1)
      });
    }
    setSnowflakes(flakes);

    // Generate 30 twinkling stars
    const twinkleStars: Star[] = [];
    for (let i = 0; i < 30; i++) {
      twinkleStars.push({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 60, // Only in top 60% of screen
        size: 2 + Math.random() * 4, // Size (2-6px)
        delay: Math.random() * 3, // Twinkle delay (0-3s)
      });
    }
    setStars(twinkleStars);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {/* Twinkling Stars */}
      {stars.map((star) => (
        <div
          key={`star-${star.id}`}
          style={{
            position: 'absolute',
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            background: '#D4A55D', // Metallic gold
            borderRadius: '50%',
            boxShadow: '0 0 8px #D4A55D, 0 0 12px #D4A55D',
            animation: `twinkle 2s ease-in-out infinite`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}

      {/* Falling Snowflakes */}
      {snowflakes.map((flake) => (
        <div
          key={`snow-${flake.id}`}
          style={{
            position: 'absolute',
            top: '-50px',
            left: `${flake.left}%`,
            fontSize: `${flake.fontSize}px`,
            color: '#C7D8E0', // Soft silver/ice blue
            opacity: flake.opacity,
            animation: `snowfall ${flake.animationDuration}s linear infinite`,
            animationDelay: `${flake.animationDelay}s`,
            textShadow: '0 0 5px rgba(199, 216, 224, 0.8)',
          }}
        >
          ❄
        </div>
      ))}

      <style jsx>{`
        @keyframes snowfall {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
          }
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.3);
          }
        }
      `}</style>
    </div>
  );
};

export default Snowflakes;
