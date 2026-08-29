/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameType, Language } from '../types';
import { soundEngine } from '../engine/soundEngine';
import { hapticsEngine } from '../engine/hapticsEngine';
import { Grid3X3, BoxSelect, Columns3 } from 'lucide-react';

interface GameSelectorProps {
  activeGame: GameType;
  onSelectGame: (game: GameType) => void;
  language: Language;
}

export const GameSelector: React.FC<GameSelectorProps> = ({
  activeGame,
  onSelectGame,
  language
}) => {
  return (
    <div className="w-full max-w-xl mx-auto px-2 sm:px-4 mb-2 flex items-center justify-center gap-1.5 sm:gap-2 select-none">
      {/* Game 1: Tic Tac Toe 3D */}
      <button
        id="btn-select-game-tictactoe"
        type="button"
        onClick={() => {
          if (activeGame !== 'tictactoe') {
            soundEngine.playTap();
            hapticsEngine.trigger('tap');
            onSelectGame('tictactoe');
          }
        }}
        className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl sm:rounded-2xl border-2 sm:border-3 border-[#073B4C] font-black text-xs sm:text-sm transition-all ${
          activeGame === 'tictactoe'
            ? 'bg-[#EF476F] text-white shadow-[2.5px_2.5px_0px_0px_#073B4C] -translate-y-0.5'
            : 'bg-white text-[#073B4C] hover:bg-rose-50 shadow-[1px_1px_0px_0px_#073B4C]'
        }`}
      >
        <Grid3X3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
        <div className="flex flex-col items-start leading-tight min-w-0">
          <span className="font-black text-[11px] sm:text-xs truncate">
            {language === 'bn' ? 'টিক-ট্যাক-টো' : 'Tic-Tac-Toe'}
          </span>
          <span className="text-[8px] sm:text-[9px] font-bold opacity-85 truncate">
            {language === 'bn' ? '৩ডি গ্রিড' : '3D Grid'}
          </span>
        </div>
      </button>

      {/* Game 2: Dots and Boxes */}
      <button
        id="btn-select-game-dotsboxes"
        type="button"
        onClick={() => {
          if (activeGame !== 'dotsboxes') {
            soundEngine.playTap();
            hapticsEngine.trigger('tap');
            onSelectGame('dotsboxes');
          }
        }}
        className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl sm:rounded-2xl border-2 sm:border-3 border-[#073B4C] font-black text-xs sm:text-sm transition-all ${
          activeGame === 'dotsboxes'
            ? 'bg-[#118AB2] text-white shadow-[2.5px_2.5px_0px_0px_#073B4C] -translate-y-0.5'
            : 'bg-white text-[#073B4C] hover:bg-sky-50 shadow-[1px_1px_0px_0px_#073B4C]'
        }`}
      >
        <BoxSelect className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
        <div className="flex flex-col items-start leading-tight min-w-0">
          <span className="font-black text-[11px] sm:text-xs truncate">
            {language === 'bn' ? 'খাঁচা ও বিন্দু' : 'Dots & Boxes'}
          </span>
          <span className="text-[8px] sm:text-[9px] font-bold opacity-85 truncate">
            {language === 'bn' ? 'বক্স দখল' : 'Box Capture'}
          </span>
        </div>
      </button>

      {/* Game 3: Connect Four */}
      <button
        id="btn-select-game-connectfour"
        type="button"
        onClick={() => {
          if (activeGame !== 'connectfour') {
            soundEngine.playTap();
            hapticsEngine.trigger('tap');
            onSelectGame('connectfour');
          }
        }}
        className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl sm:rounded-2xl border-2 sm:border-3 border-[#073B4C] font-black text-xs sm:text-sm transition-all ${
          activeGame === 'connectfour'
            ? 'bg-[#06D6A0] text-[#073B4C] shadow-[2.5px_2.5px_0px_0px_#073B4C] -translate-y-0.5'
            : 'bg-white text-[#073B4C] hover:bg-emerald-50 shadow-[1px_1px_0px_0px_#073B4C]'
        }`}
      >
        <Columns3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
        <div className="flex flex-col items-start leading-tight min-w-0">
          <span className="font-black text-[11px] sm:text-xs truncate">
            {language === 'bn' ? 'চার মিলান' : 'Connect 4'}
          </span>
          <span className="text-[8px] sm:text-[9px] font-bold opacity-85 truncate">
            {language === 'bn' ? '৪-ইন-এ-রো' : '4-in-a-Row'}
          </span>
        </div>
      </button>
    </div>
  );
};
