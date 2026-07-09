import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 32 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 500 500" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Stripe 1: Dark Blue */}
      <path d="M47 110 L162 390" stroke="#0056b3" strokeWidth="15" strokeLinecap="round" />
      {/* Stripe 2: Blue */}
      <path d="M69 110 L184 390" stroke="#1b75bb" strokeWidth="15" strokeLinecap="round" />
      {/* Stripe 3: Cyan */}
      <path d="M91 110 L206 390" stroke="#3dbbc9" strokeWidth="15" strokeLinecap="round" />
      {/* Stripe 4: Green */}
      <path d="M113 110 L228 390" stroke="#4fae3a" strokeWidth="15" strokeLinecap="round" />
      
      {/* Stripe 5: Yellow (The central turning vertex V) */}
      <path d="M135 110 L250 390 L365 110" stroke="#f9d413" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Stripe 6: Orange */}
      <path d="M387 110 L272 390" stroke="#f37024" strokeWidth="15" strokeLinecap="round" />
      {/* Stripe 7: Bright Red */}
      <path d="M409 110 L294 390" stroke="#e1251b" strokeWidth="15" strokeLinecap="round" />
      {/* Stripe 8: Crimson / Burgundy */}
      <path d="M431 110 L316 390" stroke="#a61a52" strokeWidth="15" strokeLinecap="round" />
      {/* Stripe 9: Purple */}
      <path d="M453 110 L338 390" stroke="#712075" strokeWidth="15" strokeLinecap="round" />
    </svg>
  );
};
