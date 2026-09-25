import React from 'react';

interface NnecxyLogoProps {
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  watermark?: boolean;
  glow?: boolean;
  transparent?: boolean;
}

export const NnecxyLogo: React.FC<NnecxyLogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
  watermark = false,
}) => {
  let pixelSize = 48;
  if (typeof size === 'number') {
    pixelSize = size;
  } else {
    switch (size) {
      case 'sm':
        pixelSize = 36;
        break;
      case 'md':
        pixelSize = 48;
        break;
      case 'lg':
        pixelSize = 80;
        break;
      case 'xl':
        pixelSize = 112;
        break;
    }
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className={`relative flex items-center justify-center shrink-0 select-none overflow-hidden rounded-2xl ${
          watermark ? 'opacity-90' : ''
        }`}
        style={{
          width: pixelSize,
          height: pixelSize,
        }}
      >
        <img
          src="/assets/logo.png"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            if (target.src.indexOf('/logo.png') === -1) {
              target.src = '/logo.png';
            }
          }}
          alt="NNECXY"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover pointer-events-none select-none rounded-2xl"
          loading="eager"
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-extrabold tracking-wider text-white text-lg leading-tight">
            NNECXY
          </span>
          <span className="text-[10px] tracking-widest uppercase text-blue-400 font-semibold opacity-90">
            V1 Social Mobile
          </span>
        </div>
      )}
    </div>
  );
};
