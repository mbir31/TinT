/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Player, Language } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { PLAYER_THEMES } from '../constants/themes';
import { AvatarIcon } from './AvatarIcon';
import { hapticsEngine } from '../engine/hapticsEngine';
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
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!isAiThinking) {
      hapticsEngine.trigger('turnChange');
    }
  }, [player.id, isAiThinking]);

  return (
    <div className="w-full flex items-center justify-center my-2 select-none overflow-hidden py-1">
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="relative px-4 sm:px-5 py-2 rounded-2xl bg-white border-2 border-[#073B4C] shadow-[4px_4px_0px_0px_#073B4C] flex items-center gap-2.5 sm:gap-3"
      >
        {/* Glowing Indicator Dot with color change animation */}
        <motion.div
          key={`dot-${player.id}-${player.colorKey}`}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${theme.gradient} border border-[#073B4C] animate-bounce shrink-0`}
        />

        {/* Player Avatar or Custom Photo with slide & scale transition */}
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 border border-[#073B4C] flex items-center justify-center text-[#073B4C] overflow-hidden shrink-0 shadow-inner">
          <AnimatePresence mode="wait">
            <motion.div
              key={`avatar-${player.id}-${player.photoUrl || player.avatar}`}
              initial={{ y: 12, opacity: 0, scale: 0.7 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -12, opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="w-full h-full flex items-center justify-center"
            >
              {player.photoUrl ? (
                <img
                  src={player.photoUrl}
                  alt={player.name}
                  className="w-full h-full object-cover select-none"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <AvatarIcon name={player.avatar} className="w-4 h-4" />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Turn Text with smooth animated swap */}
        <AnimatePresence mode="wait">
          {isAiThinking ? (
            <motion.div
              key="ai-thinking"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-2 text-xs sm:text-sm font-black text-[#7209B7]"
            >
              <Bot className="w-4 h-4 animate-spin" />
              <span>{t.aiThinking}</span>
            </motion.div>
          ) : (
            <motion.div
              key={`turn-${player.id}-${language}`}
              initial={{ opacity: 0, y: 6, filter: 'blur(2px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -6, filter: 'blur(2px)' }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-[#073B4C]"
            >
              <span>{t.nowTurn}</span>
              <motion.span
                layout
                initial={{ scale: 0.85 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                className="px-2 py-0.5 rounded-md text-white font-black shadow-sm transition-colors duration-300"
                style={{ backgroundColor: theme.primary }}
              >
                {player.name}
              </motion.span>
              <span>{t.turnOf}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
