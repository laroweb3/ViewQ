import React from 'react';
import logoPng from '../logo.png';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 32 }) => {
  return (
    <img
      src={logoPng}
      width={size}
      height={size}
      alt="viewQ"
      loading="eager"
      decoding="async"
      className={className}
    />
  );
};
