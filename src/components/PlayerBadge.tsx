/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Player, Language } from '../types';
import { PLAYER_THEMES } from '../constants/themes';
import { AvatarIcon } from './AvatarIcon';
import { formatNumberByLang } from '../i18n/translations';

interface PlayerBadgeProps {
  player: Player;
  isCurrentTurn: boolean;
  score: number;
  language: Language;
  showScore?: boolean;
}

export const PlayerBadge: React.FC<PlayerBadgeProps> = ({
  player,
  isCurrentTurn,
  score,
  language,
  showScore = true
}) => {
  const theme = PLAYER_THEMES[player.colorKey] || PLAYER_THEMES.blue;

  return (
    <div
      className={`relative flex items-center gap-3 p-3 rounded-[24px] border-3 border-[#073B4C] transition-all duration-200 ${
        isCurrentTurn
          ? 'bg-white shadow-[6px_6px_0px_0px_#073B4C] -translate-y-1'
          : 'bg-white/80 opacity-75 shadow-[3px_3px_0px_0px_#073B4C]'
      }`}
    >
      {/* 3D Token Avatar */}
      <div
        className={`relative w-11 h-11 rounded-2xl bg-gradient-to-br ${theme.gradient} border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] flex items-center justify-center flex-shrink-0`}
      >
        <div className="w-full h-full rounded-[14px] flex items-center justify-center text-white">
          <AvatarIcon name={player.avatar} className="w-6 h-6 drop-shadow-sm" />
        </div>
        {isCurrentTurn && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#06D6A0] border-2 border-[#073B4C] animate-bounce" />
        )}
      </div>

      {/* Name and Tag */}
      <div className="flex flex-col min-w-0 pr-1">
        <span className="text-sm font-black text-[#073B4C] truncate max-w-[100px] sm:max-w-[130px]">
          {player.name}
        </span>
        {player.isAI && (
          <span className="text-[10px] font-black text-[#7209B7] tracking-wider uppercase">AI BOT</span>
        )}
      </div>

      {/* Score */}
      {showScore && (
        <div className="ml-auto pl-2">
          <div className="px-3 py-1 rounded-full bg-[#FFD166] border-2 border-[#073B4C] text-xs sm:text-sm font-black text-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C]">
            {formatNumberByLang(score, language)}
          </div>
        </div>
      )}
    </div>
  );
};
