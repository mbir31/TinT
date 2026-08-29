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
      className={`relative flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-2xl sm:rounded-[24px] border-2 sm:border-3 border-[#073B4C] transition-all duration-200 min-w-0 ${
        isCurrentTurn
          ? 'bg-white shadow-[4px_4px_0px_0px_#073B4C] sm:shadow-[6px_6px_0px_0px_#073B4C] -translate-y-0.5'
          : 'bg-white/85 opacity-80 shadow-[2px_2px_0px_0px_#073B4C] sm:shadow-[3px_3px_0px_0px_#073B4C]'
      }`}
    >
      {/* 3D Token Avatar or Custom Photo */}
      <div
        className={`relative w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br ${theme.gradient} border-2 border-[#073B4C] shadow-[1px_1px_0px_0px_#073B4C] sm:shadow-[2px_2px_0px_0px_#073B4C] flex items-center justify-center flex-shrink-0 overflow-hidden`}
      >
        {player.photoUrl ? (
          <img
            src={player.photoUrl}
            alt={player.name}
            className="w-full h-full object-cover select-none"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full rounded-[10px] sm:rounded-[14px] flex items-center justify-center text-white">
            <AvatarIcon name={player.avatar} className="w-4 h-4 sm:w-6 sm:h-6 drop-shadow-sm" />
          </div>
        )}
        {isCurrentTurn && (
          <span className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#06D6A0] border-2 border-[#073B4C] animate-bounce" />
        )}
      </div>

      {/* Name and Tag */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-xs sm:text-sm font-black text-[#073B4C] truncate leading-tight">
          {player.name}
        </span>
        {player.isAI && (
          <span className="text-[9px] sm:text-[10px] font-black text-[#7209B7] tracking-wider uppercase leading-none mt-0.5">
            AI BOT
          </span>
        )}
      </div>

      {/* Score */}
      {showScore && (
        <div className="flex-shrink-0 pl-1">
          <div className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[#FFD166] border border-black sm:border-2 border-[#073B4C] text-[11px] sm:text-sm font-black text-[#073B4C] shadow-[1px_1px_0px_0px_#073B4C] sm:shadow-[2px_2px_0px_0px_#073B4C]">
            {formatNumberByLang(score, language)}
          </div>
        </div>
      )}
    </div>
  );
};
