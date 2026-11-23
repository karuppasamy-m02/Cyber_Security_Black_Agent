import React, { useState } from 'react';

interface LogoProps {
  variant?: 'full' | 'icon' | 'sidebar' | 'login';
  className?: string;
  isCollapsed?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  className = '',
  isCollapsed = false,
}) => {
  const [imgError, setImgError] = useState(false);

  // High-visibility fallback vector emblem
  const FallbackEmblem = ({ size = 28 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <path
        d="M16 3L5 7.8V14.2C5 21.4 9.7 27.9 16 29.5C22.3 27.9 27 21.4 27 14.2V7.8L16 3Z"
        stroke="#F5F5F2"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="15.5" r="2.5" fill="#F5F5F2" />
      <path
        d="M16 9.5V13M16 18V21.5M11.5 15.5H13.5M18.5 15.5H20.5"
        stroke="#A8A8A3"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        {imgError ? (
          <FallbackEmblem size={24} />
        ) : (
          <img
            src="/logo.png"
            alt="CYBER BLACK"
            onError={() => setImgError(true)}
            className="w-8 h-8 object-contain mix-blend-screen filter brightness-125 contrast-125 drop-shadow-[0_0_8px_rgba(245,245,242,0.3)]"
          />
        )}
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={`flex items-center gap-3 select-none ${className}`}>
        <div className="w-9 h-9 rounded-lg bg-[#0A0A0A] border border-[#2B2B2B] flex items-center justify-center shrink-0 shadow-subtle p-0.5">
          {imgError ? (
            <FallbackEmblem size={22} />
          ) : (
            <img
              src="/logo.png"
              alt="CYBER BLACK"
              onError={() => setImgError(true)}
              className="w-7 h-7 object-contain mix-blend-screen filter brightness-125 contrast-125 drop-shadow-[0_0_8px_rgba(245,245,242,0.3)]"
            />
          )}
        </div>
        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold tracking-tight text-[#F5F5F2] text-[14px]">
                CYBER
              </span>
              <span className="font-extrabold tracking-tight text-[#A8A8A3] text-[14px]">
                BLACK
              </span>
              <span className="px-1.5 py-0.5 text-[8px] font-mono font-bold rounded bg-[#161616] text-[#F5F5F2] border border-[#2B2B2B] tracking-wider ml-0.5">
                SOC
              </span>
            </div>
            <span className="text-[9px] text-[#A8A8A3] tracking-widest mt-1 font-mono uppercase truncate font-medium">
              Intelligent Defense
            </span>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'login') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        {/* Generous, high-visibility, ultra-clean logo container */}
        <div className="w-20 h-20 rounded-2xl bg-[#0A0A0A] border border-[#2B2B2B] flex items-center justify-center mb-4 shadow-popover p-2">
          {imgError ? (
            <FallbackEmblem size={44} />
          ) : (
            <img
              src="/logo.png"
              alt="CYBER BLACK Logo"
              onError={() => setImgError(true)}
              className="w-16 h-16 object-contain mix-blend-screen filter brightness-125 contrast-125 drop-shadow-[0_0_12px_rgba(245,245,242,0.35)]"
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#F5F5F2]">
            CYBER <span className="text-[#A8A8A3]">BLACK</span>
          </h1>
          <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-[#161616] text-[#F5F5F2] border border-[#2B2B2B] tracking-wider">
            LOCAL AI
          </span>
        </div>
        <p className="text-xs text-[#A8A8A3] mt-1.5 font-mono tracking-tight">
          Intelligent Defense. Explainable Intelligence. Local AI.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="w-8 h-8 rounded-md bg-[#0A0A0A] border border-[#2B2B2B] flex items-center justify-center shrink-0 p-0.5">
        {imgError ? (
          <FallbackEmblem size={20} />
        ) : (
          <img
            src="/logo.png"
            alt="CYBER BLACK"
            onError={() => setImgError(true)}
            className="w-6 h-6 object-contain mix-blend-screen filter brightness-125 contrast-125 drop-shadow-[0_0_8px_rgba(245,245,242,0.3)]"
          />
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-extrabold tracking-tight text-[#F5F5F2] text-sm">
          CYBER
        </span>
        <span className="font-extrabold tracking-tight text-[#A8A8A3] text-sm">
          BLACK
        </span>
        <span className="px-1.5 py-0.5 text-[8.5px] font-mono font-bold rounded bg-[#161616] text-[#A8A8A3] border border-[#2B2B2B]">
          DEFENSE
        </span>
      </div>
    </div>
  );
};
