/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { soundEngine } from '../engine/soundEngine';

interface PwaUpdateToastProps {
  language: Language;
}

export const PwaUpdateToast: React.FC<PwaUpdateToastProps> = ({ language }) => {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showToast, setShowToast] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let refreshing = false;

    // Reload page when new service worker takes control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;

      // Check if a worker is already waiting
      if (reg.waiting) {
        setWaitingWorker(reg.waiting);
        setShowToast(true);
      }

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setShowToast(true);
          }
        });
      });
    });
  }, []);

  const handleUpdate = () => {
    soundEngine.playTap();
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  };

  if (!showToast) return null;

  return (
    <aside
      aria-label="App Update Notification"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-[#FFD166] text-[#073B4C] rounded-2xl border-3 border-[#073B4C] p-3 sm:p-4 shadow-[5px_5px_0px_0px_#073B4C] flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 select-none"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-white border-2 border-[#073B4C] flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-[#EF476F]" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs sm:text-sm font-black truncate">
            {language === 'bn' ? 'নতুন আপডেট প্রস্তুত!' : 'New update ready!'}
          </span>
          <span className="text-[11px] font-bold text-[#4A4E69] truncate">
            {language === 'bn' ? 'নতুন ফিচার পেতে রিলোড করুন' : 'Reload to get the latest features'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          id="btn-pwa-update-reload"
          onClick={handleUpdate}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border-2 border-[#073B4C] text-xs font-black text-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] hover:bg-[#FFF9F0] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'আপডেট' : 'Update'}</span>
        </button>

        <button
          onClick={() => setShowToast(false)}
          className="p-1 rounded-lg text-[#073B4C]/60 hover:text-[#073B4C] hover:bg-black/5 transition-colors"
          aria-label="Close update toast"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
