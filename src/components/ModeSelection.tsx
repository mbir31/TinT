/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameMode, AIDifficulty, Language } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { soundEngine } from '../engine/soundEngine';
import { hapticsEngine } from '../engine/hapticsEngine';
import { Users, Bot, Globe, Sparkles, Zap, Flame, ShieldAlert } from 'lucide-react';

interface ModeSelectionProps {
  language: Language;
  onSelectMode: (mode: GameMode, difficulty?: AIDifficulty) => void;
  currentDifficulty: AIDifficulty;
  onChangeDifficulty: (diff: AIDifficulty) => void;
  onOpenCustomizer: () => void;
  onOpenBoardPicker: () => void;
  boardLabel: string;
}

export const ModeSelection: React.FC<ModeSelectionProps> = ({
  language,
  onSelectMode,
  currentDifficulty,
  onChangeDifficulty,
  onOpenCustomizer,
  onOpenBoardPicker,
  boardLabel
}) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-5 px-4 py-3 select-none">
      {/* Hero Welcome Card */}
      <div className="relative bg-white rounded-[28px] border-4 border-[#073B4C] p-6 text-center shadow-[8px_8px_0px_0px_#073B4C] overflow-hidden">
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-[#FFD166] rounded-full border-3 border-[#073B4C] -z-0 opacity-40" />
        <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-[#06D6A0] rounded-full border-3 border-[#073B4C] -z-0 opacity-40" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFD166] border-2 border-[#073B4C] text-xs font-black text-[#073B4C] mb-3 shadow-[2px_2px_0px_0px_#073B4C]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.appTitle} 3D Experience</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-[#073B4C] tracking-tight">
            {language === 'bn' ? 'খেলার মোড বেছে নিন' : 'Choose Game Mode'}
          </h2>
          <p className="text-xs sm:text-sm text-[#4A4E69] font-bold mt-1 max-w-md mx-auto">
            {language === 'bn'
              ? '৩x৩ থেকে ১৫x১৫ পর্যন্ত যেকোনো গ্রিডে উপভোগ করুন ত্রিমাত্রিক টিক-ট্যাক-টো ও ফোর-ইন-এ-রো'
              : 'Enjoy 3D Tic-Tac-Toe & Connect 4 across 3x3 to 15x15 grids'}
          </p>

          {/* Quick Board & Customizer Action Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-4 pt-4 border-t-2 border-[#073B4C]/10">
            <button
              id="btn-board-preset-picker"
              onClick={() => {
                soundEngine.playTap();
                hapticsEngine.trigger('tap');
                onOpenBoardPicker();
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-[#FFF9F0] border-2 border-[#073B4C] text-xs font-black text-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C] hover:bg-amber-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            >
              <span>{t.boardSize}:</span>
              <span className="bg-[#118AB2] text-white px-2 py-0.5 rounded-md text-[11px] font-black">
                {boardLabel}
              </span>
            </button>

            <button
              id="btn-player-customizer"
              onClick={() => {
                soundEngine.playTap();
                hapticsEngine.trigger('tap');
                onOpenCustomizer();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-[#FFF9F0] border-2 border-[#073B4C] text-xs font-black text-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C] hover:bg-amber-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            >
              <span>🎨 {t.customizerTitle}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode 1: Local 2 Player */}
      <button
        id="btn-mode-local"
        onClick={() => {
          soundEngine.playTap();
          hapticsEngine.trigger('medium');
          onSelectMode('local');
        }}
        className="group relative flex items-center justify-between p-4 sm:p-5 rounded-[24px] bg-[#EF476F] border-4 border-[#073B4C] text-white shadow-[6px_6px_0px_0px_#073B4C] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#073B4C] active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#073B4C] transition-all text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white border-3 border-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C] flex items-center justify-center text-[#EF476F] group-hover:rotate-6 transition-transform">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black tracking-tight leading-none text-white">
              {t.localMode}
            </h3>
            <p className="text-xs sm:text-sm font-bold text-rose-100 mt-1">
              {t.localModeDesc}
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-block px-3 py-1 rounded-xl bg-white text-[#073B4C] font-black text-xs border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C]">
          {t.startMatch} →
        </span>
      </button>

      {/* Mode 2: AI Bot Match */}
      <div className="flex flex-col p-4 sm:p-5 rounded-[24px] bg-[#118AB2] border-4 border-[#073B4C] text-white shadow-[6px_6px_0px_0px_#073B4C]">
        <button
          id="btn-mode-ai"
          onClick={() => {
            soundEngine.playTap();
            hapticsEngine.trigger('medium');
            onSelectMode('ai', currentDifficulty);
          }}
          className="group flex items-center justify-between text-left hover:-translate-y-0.5 transition-transform"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white border-3 border-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C] flex items-center justify-center text-[#118AB2] group-hover:-rotate-6 transition-transform">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight leading-none text-white">
                {t.aiMode}
              </h3>
              <p className="text-xs sm:text-sm font-bold text-sky-100 mt-1">
                {t.aiModeDesc}
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-3 py-1 rounded-xl bg-white text-[#073B4C] font-black text-xs border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C]">
            {t.startMatch} →
          </span>
        </button>

        {/* AI Difficulty Selector Buttons */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t-2 border-white/20">
          <span className="text-xs font-black text-sky-100 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-[#FFD166]" /> {t.difficulty}:
          </span>
          <div className="grid grid-cols-3 gap-1.5 flex-1">
            <button
              id="diff-easy"
              onClick={() => {
                soundEngine.playTap();
                onChangeDifficulty('easy');
              }}
              className={`py-1 rounded-xl text-xs font-black border-2 border-[#073B4C] transition-all ${
                currentDifficulty === 'easy'
                  ? 'bg-[#06D6A0] text-white shadow-[2px_2px_0px_0px_#073B4C]'
                  : 'bg-white/90 text-[#073B4C] opacity-80 hover:opacity-100'
              }`}
            >
              {t.easy}
            </button>
            <button
              id="diff-medium"
              onClick={() => {
                soundEngine.playTap();
                onChangeDifficulty('medium');
              }}
              className={`py-1 rounded-xl text-xs font-black border-2 border-[#073B4C] transition-all ${
                currentDifficulty === 'medium'
                  ? 'bg-[#FFD166] text-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C]'
                  : 'bg-white/90 text-[#073B4C] opacity-80 hover:opacity-100'
              }`}
            >
              <span className="flex items-center justify-center gap-1">
                <Flame className="w-3 h-3 text-[#EF476F]" /> {t.medium}
              </span>
            </button>
            <button
              id="diff-hard"
              onClick={() => {
                soundEngine.playTap();
                onChangeDifficulty('hard');
              }}
              className={`py-1 rounded-xl text-xs font-black border-2 border-[#073B4C] transition-all ${
                currentDifficulty === 'hard'
                  ? 'bg-[#EF476F] text-white shadow-[2px_2px_0px_0px_#073B4C]'
                  : 'bg-white/90 text-[#073B4C] opacity-80 hover:opacity-100'
              }`}
            >
              <span className="flex items-center justify-center gap-1">
                <ShieldAlert className="w-3 h-3 text-yellow-300" /> {t.hard}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode 3: Online Multiplayer */}
      <button
        id="btn-mode-online"
        onClick={() => {
          soundEngine.playTap();
          hapticsEngine.trigger('medium');
          onSelectMode('online');
        }}
        className="group relative flex items-center justify-between p-4 sm:p-5 rounded-[24px] bg-[#06D6A0] border-4 border-[#073B4C] text-[#073B4C] shadow-[6px_6px_0px_0px_#073B4C] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#073B4C] active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#073B4C] transition-all text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white border-3 border-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C] flex items-center justify-center text-[#06D6A0] group-hover:rotate-6 transition-transform">
            <Globe className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black tracking-tight leading-none text-[#073B4C]">
                {t.onlineMode}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#FFD166] text-[#073B4C] border border-[#073B4C] text-[10px] font-black uppercase">
                {t.liveP2P}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-emerald-950/80 mt-1">
              {t.onlineModeDesc}
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-block px-3 py-1 rounded-xl bg-white text-[#073B4C] font-black text-xs border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C]">
          {t.createOrJoinRoom} →
        </span>
      </button>
    </div>
  );
};
