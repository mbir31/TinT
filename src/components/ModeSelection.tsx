/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameMode, AIDifficulty, Player, Language } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { PLAYER_THEMES } from '../constants/themes';
import { soundEngine } from '../engine/soundEngine';
import { hapticsEngine } from '../engine/hapticsEngine';
import { Users, Bot, Globe, Sparkles, Zap, Flame, ShieldAlert, Edit3 } from 'lucide-react';

interface ModeSelectionProps {
  language: Language;
  onSelectMode: (mode: GameMode, difficulty?: AIDifficulty) => void;
  currentDifficulty: AIDifficulty;
  onChangeDifficulty: (diff: AIDifficulty) => void;
  onOpenCustomizer: () => void;
  onOpenBoardPicker: () => void;
  boardLabel: string;
  player1: Player;
  player2: Player;
  onOpenLocalSetup?: () => void;
}

export const ModeSelection: React.FC<ModeSelectionProps> = ({
  language,
  onSelectMode,
  currentDifficulty,
  onChangeDifficulty,
  onOpenCustomizer,
  onOpenBoardPicker,
  boardLabel,
  player1,
  player2,
  onOpenLocalSetup
}) => {
  const t = TRANSLATIONS[language];
  const p1Theme = PLAYER_THEMES[player1.colorKey] || PLAYER_THEMES.blue;
  const p2Theme = PLAYER_THEMES[player2.colorKey] || PLAYER_THEMES.coral;

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-3.5 sm:gap-5 px-3 sm:px-4 py-2 sm:py-3 select-none">
      {/* Hero Welcome Card */}
      <div className="relative bg-white rounded-2xl sm:rounded-[28px] border-3 sm:border-4 border-[#073B4C] p-4 sm:p-6 text-center shadow-[5px_5px_0px_0px_#073B4C] sm:shadow-[8px_8px_0px_0px_#073B4C] overflow-hidden">
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-[#FFD166] rounded-full border-3 border-[#073B4C] -z-0 opacity-40" />
        <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-[#06D6A0] rounded-full border-3 border-[#073B4C] -z-0 opacity-40" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#FFD166] border-2 border-[#073B4C] text-[11px] sm:text-xs font-black text-[#073B4C] mb-2 sm:mb-3 shadow-[1.5px_1.5px_0px_0px_#073B4C]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.appTitle} 3D Experience</span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#073B4C] tracking-tight leading-tight">
            {language === 'bn' ? 'খেলার মোড বেছে নিন' : 'Choose Game Mode'}
          </h2>
          <p className="text-xs sm:text-sm text-[#4A4E69] font-bold mt-1 max-w-md mx-auto">
            {language === 'bn'
              ? '৩x৩ থেকে ১৫x১৫ পর্যন্ত যেকোনো গ্রিডে উপভোগ করুন ত্রিমাত্রিক টিক-ট্যাক-টো'
              : 'Enjoy 3D Tic-Tac-Toe & Connect 4 across 3x3 to 15x15 grids'}
          </p>

          {/* Quick Board & Customizer Action Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t-2 border-[#073B4C]/10">
            <button
              id="btn-board-preset-picker"
              onClick={() => {
                soundEngine.playTap();
                hapticsEngine.trigger('tap');
                onOpenBoardPicker();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl sm:rounded-2xl bg-[#FFF9F0] border-2 border-[#073B4C] text-xs font-black text-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] sm:shadow-[3px_3px_0px_0px_#073B4C] hover:bg-amber-100 active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <span>{t.boardSize}:</span>
              <span className="bg-[#118AB2] text-white px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black">
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl sm:rounded-2xl bg-[#FFF9F0] border-2 border-[#073B4C] text-xs font-black text-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] sm:shadow-[3px_3px_0px_0px_#073B4C] hover:bg-amber-100 active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <span>🎨 {t.customizerTitle}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode 1: Local 2 Player (With Direct Player Names Input / Edit Button) */}
      <div className="flex flex-col p-3.5 sm:p-5 rounded-2xl sm:rounded-[24px] bg-[#EF476F] border-3 sm:border-4 border-[#073B4C] text-white shadow-[4px_4px_0px_0px_#073B4C] sm:shadow-[6px_6px_0px_0px_#073B4C]">
        <button
          id="btn-mode-local"
          onClick={() => {
            soundEngine.playTap();
            hapticsEngine.trigger('medium');
            onSelectMode('local');
          }}
          className="group flex items-center justify-between text-left hover:-translate-y-0.5 transition-transform"
        >
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white border-2 sm:border-3 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] sm:shadow-[3px_3px_0px_0px_#073B4C] flex items-center justify-center text-[#EF476F] group-hover:rotate-6 transition-transform flex-shrink-0">
              <Users className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-xl font-black tracking-tight leading-none text-white truncate">
                {t.localMode}
              </h3>
              <p className="text-xs sm:text-sm font-bold text-rose-100 mt-0.5 sm:mt-1 truncate">
                {t.localModeDesc}
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-3 py-1 rounded-xl bg-white text-[#073B4C] font-black text-xs border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] flex-shrink-0">
            {t.startMatch} →
          </span>
        </button>

        {/* Current 2-Player Names Tag & Edit Setup Trigger */}
        <div className="flex items-center justify-between gap-2 mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t-2 border-white/20">
          <div className="flex items-center gap-1.5 overflow-hidden min-w-0">
            <span className="text-[11px] sm:text-xs font-black text-rose-100 flex-shrink-0">
              {language === 'bn' ? 'খেলোয়াড়:' : 'Players:'}
            </span>
            <div className="flex items-center gap-1 sm:gap-1.5 truncate">
              <span
                className="px-2 py-0.5 rounded-lg text-[11px] sm:text-xs font-black border border-[#073B4C] shadow-[1px_1px_0px_0px_#073B4C] truncate max-w-[70px] sm:max-w-[100px]"
                style={{
                  backgroundColor: p1Theme.primary,
                  color: p1Theme.id === 'amber' ? '#073B4C' : '#FFFFFF'
                }}
              >
                {player1.name}
              </span>
              <span className="text-xs font-black text-rose-200">vs</span>
              <span
                className="px-2 py-0.5 rounded-lg text-[11px] sm:text-xs font-black border border-[#073B4C] shadow-[1px_1px_0px_0px_#073B4C] truncate max-w-[70px] sm:max-w-[100px]"
                style={{
                  backgroundColor: p2Theme.primary,
                  color: p2Theme.id === 'amber' ? '#073B4C' : '#FFFFFF'
                }}
              >
                {player2.name}
              </span>
            </div>
          </div>

          <button
            id="btn-edit-local-player-names"
            onClick={(e) => {
              e.stopPropagation();
              soundEngine.playTap();
              hapticsEngine.trigger('tap');
              if (onOpenLocalSetup) {
                onOpenLocalSetup();
              } else {
                onOpenCustomizer();
              }
            }}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl bg-white text-[#073B4C] text-[11px] sm:text-xs font-black border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] hover:bg-amber-50 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex-shrink-0 transition-all"
          >
            <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{language === 'bn' ? 'নাম' : 'Names'}</span>
          </button>
        </div>
      </div>

      {/* Mode 2: AI Bot Match */}
      <div className="flex flex-col p-3.5 sm:p-5 rounded-2xl sm:rounded-[24px] bg-[#118AB2] border-3 sm:border-4 border-[#073B4C] text-white shadow-[4px_4px_0px_0px_#073B4C] sm:shadow-[6px_6px_0px_0px_#073B4C]">
        <button
          id="btn-mode-ai"
          onClick={() => {
            soundEngine.playTap();
            hapticsEngine.trigger('medium');
            onSelectMode('ai', currentDifficulty);
          }}
          className="group flex items-center justify-between text-left hover:-translate-y-0.5 transition-transform"
        >
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white border-2 sm:border-3 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] sm:shadow-[3px_3px_0px_0px_#073B4C] flex items-center justify-center text-[#118AB2] group-hover:-rotate-6 transition-transform flex-shrink-0">
              <Bot className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-xl font-black tracking-tight leading-none text-white truncate">
                {t.aiMode}
              </h3>
              <p className="text-xs sm:text-sm font-bold text-sky-100 mt-0.5 sm:mt-1 truncate">
                {t.aiModeDesc}
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-3 py-1 rounded-xl bg-white text-[#073B4C] font-black text-xs border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] flex-shrink-0">
            {t.startMatch} →
          </span>
        </button>

        {/* AI Difficulty Selector Buttons */}
        <div className="flex items-center gap-2 mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t-2 border-white/20">
          <span className="text-[11px] sm:text-xs font-black text-sky-100 flex items-center gap-1 flex-shrink-0">
            <Zap className="w-3.5 h-3.5 text-[#FFD166]" /> {t.difficulty}:
          </span>
          <div className="grid grid-cols-3 gap-1 sm:gap-1.5 flex-1">
            <button
              id="diff-easy"
              onClick={() => {
                soundEngine.playTap();
                onChangeDifficulty('easy');
              }}
              className={`py-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black border border-[#073B4C] sm:border-2 transition-all ${
                currentDifficulty === 'easy'
                  ? 'bg-[#06D6A0] text-white shadow-[1.5px_1.5px_0px_0px_#073B4C]'
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
              className={`py-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black border border-[#073B4C] sm:border-2 transition-all ${
                currentDifficulty === 'medium'
                  ? 'bg-[#FFD166] text-[#073B4C] shadow-[1.5px_1.5px_0px_0px_#073B4C]'
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
              className={`py-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black border border-[#073B4C] sm:border-2 transition-all ${
                currentDifficulty === 'hard'
                  ? 'bg-[#EF476F] text-white shadow-[1.5px_1.5px_0px_0px_#073B4C]'
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
        className="group relative flex items-center justify-between p-3.5 sm:p-5 rounded-2xl sm:rounded-[24px] bg-[#06D6A0] border-3 sm:border-4 border-[#073B4C] text-[#073B4C] shadow-[4px_4px_0px_0px_#073B4C] sm:shadow-[6px_6px_0px_0px_#073B4C] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#073B4C] active:translate-y-0.5 transition-all text-left"
      >
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white border-2 sm:border-3 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] sm:shadow-[3px_3px_0px_0px_#073B4C] flex items-center justify-center text-[#06D6A0] group-hover:rotate-6 transition-transform flex-shrink-0">
            <Globe className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-base sm:text-xl font-black tracking-tight leading-none text-[#073B4C] truncate">
                {t.onlineMode}
              </h3>
              <span className="px-1.5 py-0.5 rounded-full bg-[#FFD166] text-[#073B4C] border border-[#073B4C] text-[9px] sm:text-[10px] font-black uppercase flex-shrink-0">
                {t.liveP2P}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-emerald-950/80 mt-0.5 sm:mt-1 truncate">
              {t.onlineModeDesc}
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-block px-3 py-1 rounded-xl bg-white text-[#073B4C] font-black text-xs border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] flex-shrink-0">
          {t.createOrJoinRoom} →
        </span>
      </button>
    </div>
  );
};
