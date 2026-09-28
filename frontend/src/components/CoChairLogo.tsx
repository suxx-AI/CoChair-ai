import React from 'react';

interface CoChairLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

export const CoChairLogo: React.FC<CoChairLogoProps> = ({
  className = '',
  size = 'md',
  showWordmark = true,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Monogram emblem */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]} rounded-md overflow-hidden border border-dark-750 bg-dark-900`}>
        {/* We use the logo image from the brand asset */}
        <img
          src="/cochair-logo.png"
          alt="CoChair.ai Logo"
          className="w-full h-full object-cover scale-125"
          onError={(e) => {
            // Fallback vector SVG if image fails
            e.currentTarget.style.display = 'none';
          }}
        />
        {/* Vector SVG monogram backdrop as instant crisp render */}
        <svg
          viewBox="0 0 100 60"
          className="absolute inset-0 w-full h-full pointer-events-none -z-10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Blue Loop (Left) */}
          <path
            d="M48 18C44 14 38 12 32 12C20.95 12 12 20.95 12 32C12 43.05 20.95 52 32 52C39 52 45 49 49 44L41 38C39 41 36 43 32 43C25.9 43 21 38.1 21 32C21 25.9 25.9 21 32 21C35.5 21 38.5 22.5 40.5 25L48 18Z"
            fill="#2b66ff"
          />
          {/* White Loop (Right) */}
          <path
            d="M52 46C56 50 62 52 68 52C79.05 52 88 43.05 88 32C88 20.95 79.05 12 68 12C61 12 55 15 51 20L59 26C61 23 64 21 68 21C74.1 21 79 25.9 79 32C79 38.1 74.1 43 68 43C64.5 43 61.5 41.5 59.5 39L52 46Z"
            fill="#FFFFFF"
          />
        </svg>
      </div>

      {/* Typography Wordmark */}
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center">
            <span className={`font-bold tracking-tight text-white font-sans ${textSizes[size]}`}>
              CoChair
            </span>
            <span className={`font-bold tracking-tight text-cochair-blue-bright font-sans ${textSizes[size]}`}>
              .ai
            </span>
          </div>
          <span className="text-xs text-slate-400 mt-0.5">
            Executive Intelligence HUD
          </span>
        </div>
      )}
    </div>
  );
};
