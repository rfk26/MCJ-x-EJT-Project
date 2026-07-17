import React from "react";

interface LogoProps {
  className?: string;
  size?: number | string;
  variant?: "light" | "dark" | "color";
}

/**
 * High-fidelity vector representation of the CV. Mandiri Cipta Jaya (MCJ) logo
 */
export const LogoMCJ: React.FC<LogoProps> = ({ className = "", size = "100%" }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1000 700"
      width={size}
      height="auto"
      className={`select-none ${className}`}
    >
      <defs>
        <linearGradient id="mcjBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00b4e4" />
          <stop offset="100%" stopColor="#007db8" />
        </linearGradient>
        <linearGradient id="mcjOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f37021" />
          <stop offset="100%" stopColor="#d25100" />
        </linearGradient>
      </defs>

      {/* Frame Top (Blue Bar) */}
      <rect x="75" y="4" width="830" height="92" fill="url(#mcjBlueGrad)" />

      {/* Top Right Orange Dot/Square */}
      <rect x="925" y="4" width="71" height="92" fill="url(#mcjOrangeGrad)" />

      {/* Frame Right & "1" or Arrow Slanted Segment (Blue) */}
      <path
        d="M 915,125 L 835,175 L 895,115 L 895,615 L 990,615 L 990,125 Z"
        fill="url(#mcjBlueGrad)"
      />

      {/* Left Orange Bar (Forms the left-most stem of the M and extends down) */}
      <rect x="10" y="125" width="65" height="860" fill="url(#mcjOrangeGrad)" />

      {/* Center Orange "M" letter */}
      {/* Starting from left leg and drawing the classic geometric M */}
      <path
        d="M 75,125 L 140,125 L 215,505 L 290,125 L 355,125 L 355,865 L 295,865 L 295,305 L 215,705 L 135,305 L 135,865 L 75,865 Z"
        fill="url(#mcjOrangeGrad)"
      />

      {/* Center Orange "C" letter */}
      {/* Clean thick corporate geometric C-shape */}
      <path
        d="M 458,125 L 818,125 L 818,345 L 533,345 L 533,595 L 818,595 L 818,815 L 458,815 Z"
        fill="url(#mcjOrangeGrad)"
      />

      {/* Bottom Frame (Blue Bar) */}
      {/* Connects from right edge of left orange column to the right blue segment */}
      <rect x="75" y="898" width="820" height="92" fill="url(#mcjBlueGrad)" />
    </svg>
  );
};

/**
 * High-fidelity vector representation of the PT. Elqia Jaya Teknik (EJT) logo
 */
export const LogoEJT: React.FC<LogoProps> = ({ className = "", size = "100%" }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 600"
      width={size}
      height="auto"
      className={`select-none ${className}`}
    >
      <defs>
        {/* Silver Metallic Gradient for Gear */}
        <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e6e6e6" />
          <stop offset="30%" stopColor="#b3b3b3" />
          <stop offset="50%" stopColor="#9c9c9c" />
          <stop offset="70%" stopColor="#7a7a7a" />
          <stop offset="100%" stopColor="#4d4d4d" />
        </linearGradient>

        {/* EJT Metallic Blue Gradient */}
        <linearGradient id="ejtBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00c3ff" />
          <stop offset="50%" stopColor="#0072ff" />
          <stop offset="100%" stopColor="#0032aa" />
        </linearGradient>

        {/* EJT Metallic Red/Crimson Gradient */}
        <linearGradient id="ejtRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff4b4b" />
          <stop offset="50%" stopColor="#b40000" />
          <stop offset="100%" stopColor="#640000" />
        </linearGradient>

        {/* Gear shadow */}
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="2" dy="4" stdDeviation="4" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Main Gear Representation */}
      <g filter="url(#shadow)">
        {/* 1. Outer gear body */}
        <circle cx="300" cy="300" r="140" fill="url(#metalGrad)" />
        
        {/* Outer teeth of gear */}
        {/* We generate 12 crisp rectangular teeth rotated around center (300, 300) */}
        <path d="M 285,130 L 315,130 L 320,165 L 280,165 Z" fill="url(#metalGrad)" transform="rotate(0, 300, 300)" />
        <path d="M 285,130 L 315,130 L 320,165 L 280,165 Z" fill="url(#metalGrad)" transform="rotate(30, 300, 300)" />
        <path d="M 285,130 L 315,130 L 320,165 L 280,165 Z" fill="url(#metalGrad)" transform="rotate(60, 300, 300)" />
        <path d="M 285,130 L 315,130 L 320,165 L 280,165 Z" fill="url(#metalGrad)" transform="rotate(90, 300, 300)" />
        <path d="M 285,130 L 315,130 L 320,165 L 280,165 Z" fill="url(#metalGrad)" transform="rotate(120, 300, 300)" />
        <path d="M 285,130 L 315,130 L 320,165 L 280,165 Z" fill="url(#metalGrad)" transform="rotate(150, 300, 300)" />
        <path d="M 285,130 L 315,130 L 320,165 L 280,165 Z" fill="url(#metalGrad)" transform="rotate(180, 300, 300)" />
        <path d="M 285,130 L 315,130 L 320,165 L 280,165 Z" fill="url(#metalGrad)" transform="rotate(210, 300, 300)" />
        <path d="M 285,130 L 315,130 L 320,165 L 280,165 Z" fill="url(#metalGrad)" transform="rotate(240, 300, 300)" />
        <path d="M 285,130 L 315,130 L 320,165 L 280,165 Z" fill="url(#metalGrad)" transform="rotate(270, 300, 300)" />
        <path d="M 285,130 L 315,130 L 320,165 L 280,165 Z" fill="url(#metalGrad)" transform="rotate(300, 300, 300)" />
        <path d="M 285,130 L 315,130 L 320,165 L 280,165 Z" fill="url(#metalGrad)" transform="rotate(330, 300, 300)" />

        {/* 2. Inner Red Toothed Rim */}
        <circle cx="300" cy="300" r="105" fill="#1c1c1c" />
        <circle cx="300" cy="300" r="100" fill="url(#ejtRedGrad)" />
        
        {/* Inner small triangular teeth */}
        {Array.from({ length: 24 }).map((_, i) => (
          <path
            key={i}
            d="M 295,190 L 305,190 L 300,205 Z"
            fill="#330000"
            transform={`rotate(${i * 15}, 300, 300)`}
          />
        ))}

        {/* 3. Center Axle Hole */}
        <circle cx="300" cy="300" r="60" fill="url(#metalGrad)" />
        <circle cx="300" cy="300" r="45" fill="#1c1c1c" />
        <circle cx="300" cy="300" r="35" fill="#e6e6e6" />
      </g>

      {/* Styled Wings / Frame holding the EJT typography */}
      <g filter="url(#shadow)">
        {/* Red wing backing */}
        <path
          d="M 330,250 L 590,250 L 620,280 L 590,350 L 330,350 Z"
          fill="url(#ejtRedGrad)"
          stroke="#4d0000"
          strokeWidth="3"
        />
        {/* Sharp wing details */}
        <path
          d="M 590,250 L 670,280 L 590,310 Z"
          fill="url(#metalGrad)"
        />
      </g>

      {/* STYLIZED EJT TEXT */}
      <g filter="url(#shadow)">
        {/* Letter "E" in Metallic Blue */}
        <path
          d="M 350,265 L 430,265 L 430,285 L 380,285 L 380,295 L 420,295 L 420,315 L 380,315 L 380,325 L 435,325 L 435,345 L 350,345 Z"
          fill="url(#ejtBlueGrad)"
          stroke="#001d4a"
          strokeWidth="2"
        />

        {/* Letter "J" & "T" in Metallic Silver/Red with Lightning connection */}
        {/* "J" */}
        <path
          d="M 440,265 L 500,265 L 500,325 C 500,345 470,350 450,345 L 450,325 C 465,328 475,325 475,315 L 475,285 L 440,285 Z"
          fill="url(#ejtBlueGrad)"
          stroke="#001d4a"
          strokeWidth="2"
        />

        {/* "T" with a lightning bolt middle */}
        <path
          d="M 495,265 L 575,265 L 575,285 L 545,285 L 525,345 L 510,345 L 525,285 L 495,285 Z"
          fill="url(#ejtRedGrad)"
          stroke="#400"
          strokeWidth="2"
        />
      </g>

      {/* Subtext: "PT ELQIA JAYA TEKNIK" */}
      <text
        x="400"
        y="430"
        fontFamily="sans-serif"
        fontSize="34"
        fontWeight="900"
        fill="#333333"
        textAnchor="middle"
        letterSpacing="6"
      >
        PT ELQIA JAYA TEKNIK
      </text>
    </svg>
  );
};

/**
 * Unified double corporate logo layout (MCJ and EJT side by side inside a clean frame)
 */
export const UnifiedLogo: React.FC<LogoProps & { withText?: boolean; textClass?: string }> = ({
  className = "",
  size = 40,
  withText = true,
  textClass = "text-white"
}) => {
  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      {/* Logos Container */}
      <div className="flex items-center -space-x-2 bg-slate-950/60 p-2 rounded-2xl border border-slate-800/80 shadow-inner">
        {/* MCJ logo container */}
        <div 
          className="bg-white p-1 rounded-xl shadow-md flex items-center justify-center transition-transform hover:scale-105"
          style={{ width: `${size}px`, height: `${size}px` }}
        >
          <LogoMCJ size="100%" />
        </div>
        
        {/* EJT logo container */}
        <div 
          className="bg-white p-1 rounded-xl shadow-md flex items-center justify-center transition-transform hover:scale-105 border border-slate-100"
          style={{ width: `${size}px`, height: `${size}px` }}
        >
          <LogoEJT size="100%" />
        </div>
      </div>

      {/* Corporate Label */}
      {withText && (
        <div className="flex flex-col">
          <span className={`text-sm sm:text-base font-black tracking-tight leading-none ${textClass}`}>
            MCJ <span className="text-amber-500 font-bold">&times;</span> EJT
          </span>
          <span className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mt-1 leading-none">
            Mandiri Cipta Jaya <span className="text-slate-500">&amp;</span> Elqia Jaya Teknik
          </span>
        </div>
      )}
    </div>
  );
};
