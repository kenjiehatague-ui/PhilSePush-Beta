import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showTagline?: boolean;
  className?: string;
}

export const PhilSePushLogo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  showTagline = false,
  className = ''
}) => {
  const iconDimensions = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-24 h-24'
  }[size];

  const textSizes = {
    sm: 'text-base font-bold',
    md: 'text-xl font-bold',
    lg: 'text-2xl font-extrabold',
    xl: 'text-3xl font-extrabold'
  }[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Precision Vector Emblem matching PhilSePush Logo */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconDimensions}`}>
        <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
          {/* Outer Location Pin in Deep Civic Blue (#00346e / #004a98) */}
          <path
            d="M50 0C22.3858 0 0 22.3858 0 50C0 76.5 44 114 47.5 117.5C48.8807 118.881 51.1193 118.881 52.5 117.5C56 114 100 76.5 100 50C100 22.3858 77.6142 0 50 0Z"
            fill="#00346E"
          />
          {/* Inner Light Arc for depth */}
          <path
            d="M50 8C26.804 8 8 26.804 8 50C8 71.2 43 103.5 50 110C57 103.5 92 71.2 92 50C92 26.804 73.196 8 50 8Z"
            fill="#004A98"
          />
          {/* High-Voltage Lightning Bolt cut-out */}
          <path
            d="M55 22L32 54H48L42 84L68 48H52L58 22H55Z"
            fill="#FFFFFF"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <div className={`text-[#00346e] tracking-tight font-headline-md ${textSizes}`}>
            PhilSe<span className="text-[#004a98]">Push</span>
          </div>
          {showTagline && (
            <span className="text-xs text-[#424751] font-medium tracking-normal mt-0.5">
              Power Monitoring Platform
            </span>
          )}
        </div>
      )}
    </div>
  );
};
