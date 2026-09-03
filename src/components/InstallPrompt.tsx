/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { soundEngine } from '../engine/soundEngine';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt: React.FC<{ language: Language }> = ({ language }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const t = TRANSLATIONS[language];

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferredPrompt || isDismissed) return null;

  const handleInstall = async () => {
    soundEngine.playTap();
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4 select-none animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between p-3 rounded-2xl bg-white border-3 border-[#073B4C] shadow-[4px_4px_0px_0px_#073B4C] gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#FFD166] border-2 border-[#073B4C] flex items-center justify-center text-[#073B4C] flex-shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black text-[#073B4C] truncate">
              {t.installApp}
            </span>
            <span className="text-[10px] font-bold text-[#4A4E69]">
              {language === 'bn' ? 'অফলাইনে খেলুন সহজেই' : 'Play offline on any device'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 rounded-xl bg-[#06D6A0] border-2 border-[#073B4C] text-[#073B4C] font-black text-xs shadow-[2px_2px_0px_0px_#073B4C] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            {t.installApp}
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
