/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, Settings, Globe, Wifi, WifiOff } from 'lucide-react';
import { GameMode, Language } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { soundEngine } from '../engine/soundEngine';
import { hapticsEngine } from '../engine/hapticsEngine';

interface HeaderProps {
  language: Language;
  onToggleLanguage: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSettings: () => void;
  activeMode: GameMode | null;
  onGoHome: () => void;
  isOnlineConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onToggleLanguage,
  soundEnabled,
  onToggleSound,
  onOpenSettings,
  activeMode,
  onGoHome,
  isOnlineConnected = true
}) => {
  const t = TRANSLATIONS[language];

  return (
    <header className="w-full max-w-4xl mx-auto px-4 py-3 flex items-center justify-between z-30 select-none">
      {/* Brand Logo & Home Button */}
      <button
        id="btn-header-home"
        onClick={() => {
          soundEngine.playTap();
          hapticsEngine.trigger('tap');
          onGoHome();
        }}
        className="group flex items-center gap-3 focus:outline-none"
        aria-label="Home"
      >
        <div className="w-11 h-11 bg-[#EF476F] rounded-2xl border-3 border-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C] flex items-center justify-center rotate-3 group-hover:rotate-6 transition-transform">
          <span className="text-white font-black text-2xl tracking-tighter">T</span>
        </div>
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#073B4C] leading-none">
              TinT
            </h1>
            <span className="bg-[#06D6A0] px-2.5 py-0.5 rounded-full text-white font-black text-[10px] tracking-wider border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C]">
              3D PWA
            </span>
          </div>
          <span className="text-xs text-[#4A4E69] font-bold mt-0.5">
            {t.appSubtitle}
          </span>
        </div>
      </button>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        {/* Network Status indicator */}
        <div
          title={isOnlineConnected ? t.onlineConnected : t.onlineDisconnected}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] transition-all ${
            isOnlineConnected
              ? 'bg-[#06D6A0] text-white'
              : 'bg-[#FFD166] text-[#073B4C]'
          }`}
        >
          {isOnlineConnected ? (
            <Wifi className="w-3.5 h-3.5" />
          ) : (
            <WifiOff className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline text-[11px] font-bold">
            {isOnlineConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>

        {/* Quick Language Toggle */}
        <button
          id="btn-quick-lang"
          onClick={() => {
            soundEngine.playTap();
            hapticsEngine.trigger('tap');
            onToggleLanguage();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white border-2 border-[#073B4C] text-[#073B4C] font-black text-xs shadow-[3px_3px_0px_0px_#FFD166] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#FFD166] transition-all"
          aria-label="Change Language"
        >
          <Globe className="w-3.5 h-3.5 text-[#118AB2]" />
          <span>{language === 'bn' ? 'বাংলা' : 'EN'}</span>
        </button>

        {/* Sound Toggle */}
        <button
          id="btn-quick-sound"
          onClick={() => {
            onToggleSound();
            soundEngine.playTap();
            hapticsEngine.trigger('tap');
          }}
          className={`p-2 rounded-2xl border-2 border-[#073B4C] text-xs font-black shadow-[3px_3px_0px_0px_#073B4C] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all ${
            soundEnabled
              ? 'bg-[#118AB2] text-white'
              : 'bg-white text-slate-400'
          }`}
          aria-label={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>

        {/* Settings Button */}
        <button
          id="btn-header-settings"
          onClick={() => {
            soundEngine.playTap();
            hapticsEngine.trigger('tap');
            onOpenSettings();
          }}
          className="p-2 rounded-2xl bg-white border-2 border-[#073B4C] text-[#073B4C] shadow-[3px_3px_0px_0px_#EF476F] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
