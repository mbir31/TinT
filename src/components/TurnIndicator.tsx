/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Player, Language } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { PLAYER_THEMES } from '../constants/themes';
import { AvatarIcon } from './AvatarIcon';
import { Bot } from 'lucide-react';

interface TurnIndicatorProps {
  player: Player;
  language: Language;
  isAiThinking?: boolean;
}

export const TurnIndicator: React.FC<TurnIndicatorProps> = ({
  player,
  language,
  isAiThinking = false
}) => {
  const t = TRANSLATIONS[language];
  const theme = PLAYER_THEMES[player.colorKey] || PLAYER_THEMES.blue;

  return (
    <div className="w-full flex items-center justify-center my-2 select-none">
      <div className="relative px-5 py-2 rounded-2xl bg-white border-2 border-[#073B4C] shadow-[4px_4px_0px_0px_#073B4C] flex items-center gap-3">
        {/* Glowing Indicator Dot */}
        <div
          className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${theme.gradient} border border-[#073B4C] animate-bounce`}
        />

        {/* Player Avatar */}
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 border border-[#073B4C] flex items-center justify-center text-[#073B4C]">
          <AvatarIcon name={player.avatar} className="w-4 h-4" />
        </div>

        {/* Turn Text */}
        {isAiThinking ? (
          <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-[#7209B7]">
            <Bot className="w-4 h-4 animate-spin" />
            <span>{t.aiThinking}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-[#073B4C]">
            <span>{t.nowTurn}</span>
            <span
              className="px-2 py-0.5 rounded-md text-white font-black"
              style={{ backgroundColor: theme.primary }}
            >
              {player.name}
            </span>
            <span>{t.turnOf}</span>
          </div>
        )}
      </div>
    </div>
  );
};
