import React from 'react';

interface NnecxyLogoProps {
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  glow?: boolean;
}

export const NnecxyLogo: React.FC<NnecxyLogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
  glow = false,
}) => {
  let pixelSize = 44;
  if (typeof size === 'number') {
    pixelSize = size;
  } else {
    switch (size) {
      case 'sm':
        pixelSize = 32;
        break;
      case 'md':
        pixelSize = 48;
        break;
      case 'lg':
        pixelSize = 72;
        break;
      case 'xl':
        pixelSize = 110;
        break;
    }
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className="relative flex items-center justify-center shrink-0 select-none overflow-hidden rounded-full"
        style={{
          width: pixelSize,
          height: pixelSize,
        }}
      >
        <img
          src="/logo.png"
          alt="Logo officiel NNECXY"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain pointer-events-none select-none"
          loading="eager"
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 text-lg leading-tight">
            NNECXY
          </span>
          <span className="text-[10px] tracking-widest uppercase text-cyan-400 font-semibold opacity-90">
            V1 Social Mobile
          </span>
        </div>
      )}
    </div>
  );
};
