import React from 'react';

interface IsroLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'emblem' | 'badge';
}

export const IsroLogo: React.FC<IsroLogoProps> = ({ 
  className = '', 
  size = 'md',
  variant: _variant = 'full'
}) => {
  const heightMap = {
    sm: 'h-7 md:h-8',
    md: 'h-9 md:h-11',
    lg: 'h-12 md:h-14',
    xl: 'h-16 md:h-20'
  };

  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      <img
        src="/isro_logo.svg"
        alt="ISRO (Indian Space Research Organisation) Official Emblem"
        className={`${heightMap[size]} w-auto object-contain transition-transform duration-300 hover:scale-[1.03]`}
        referrerPolicy="no-referrer"
        loading="eager"
      />
    </div>
  );
};
