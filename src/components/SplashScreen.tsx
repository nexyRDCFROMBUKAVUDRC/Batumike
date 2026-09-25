import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish?: () => void;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  duration = 1800,
}) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, duration - 400);

    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [duration, onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black transition-opacity duration-400 select-none ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center animate-scale-up">
        {/* Logo Original NNECXY sans modification */}
        <div className="w-32 h-32 rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/20 mb-6 border border-white/10">
          <img
            src="/assets/logo.png"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              if (target.src.indexOf('/logo.png') === -1) {
                target.src = '/logo.png';
              }
            }}
            alt="NNECXY"
            className="w-full h-full object-cover select-none pointer-events-none"
          />
        </div>

        <h1 className="text-3xl font-black tracking-widest text-white">
          NNECXY
        </h1>
        <p className="text-xs uppercase tracking-widest font-semibold text-blue-400 mt-1 opacity-90">
          V1 Social Mobile
        </p>
      </div>

      <div className="absolute bottom-8 flex flex-col items-center gap-2">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] text-zinc-500 tracking-wider font-medium">
          Démarrage sécurisé...
        </span>
      </div>
    </div>
  );
};
