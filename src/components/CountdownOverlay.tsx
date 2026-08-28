/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Language } from '../types';
import { soundEngine } from '../engine/soundEngine';
import { hapticsEngine } from '../engine/hapticsEngine';

interface CountdownOverlayProps {
  language: Language;
  onComplete: () => void;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({
  language,
  onComplete
}) => {
  const [count, setCount] = useState<number>(3);

  useEffect(() => {
    soundEngine.playCountdown();
    hapticsEngine.trigger('tap');

    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          soundEngine.playGameStart();
          hapticsEngine.trigger('medium');
          setTimeout(onComplete, 500);
          return 0;
        }
        soundEngine.playCountdown();
        hapticsEngine.trigger('tap');
        return prev - 1;
      });
    }, 800);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#073B4C]/75 backdrop-blur-md select-none">
      <div className="flex flex-col items-center gap-4">
        <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-[#FFD166] border-4 border-[#073B4C] shadow-[8px_8px_0px_0px_#073B4C] flex items-center justify-center animate-bounce">
          <span className="text-5xl sm:text-7xl font-black text-[#073B4C]">
            {count > 0 ? (language === 'bn' ? ['০', '১', '২', '৩'][count] : count) : 'GO!'}
          </span>
        </div>

        <span className="text-xl sm:text-2xl font-black text-white px-4 py-1.5 rounded-2xl bg-[#EF476F] border-2 border-[#073B4C] shadow-[4px_4px_0px_0px_#073B4C]">
          {count > 0
            ? language === 'bn'
              ? 'প্রস্তুত হন...'
              : 'Get Ready...'
            : language === 'bn'
              ? 'খেলা শুরু!'
              : 'Game Start!'}
        </span>
      </div>
    </div>
  );
};
