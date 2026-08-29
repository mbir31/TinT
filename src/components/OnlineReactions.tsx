/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { soundEngine } from '../engine/soundEngine';

export interface FloatingReaction {
  id: string;
  emoji: string;
  senderName: string;
  xOffset: number;
}

interface OnlineReactionsProps {
  onSendReaction: (emoji: string) => void;
  floatingReactions: FloatingReaction[];
}

const REACTION_EMOJIS = ['🔥', '👏', '🎯', '😂', '👑', '😱', '⚡', '🎉'];

export const OnlineReactions: React.FC<OnlineReactionsProps> = ({
  onSendReaction,
  floatingReactions
}) => {
  return (
    <>
      {/* Floating Animated Reaction Emojis */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {floatingReactions.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 100, scale: 0.5, x: item.xOffset }}
              animate={{ opacity: 1, y: -200, scale: 1.3, x: item.xOffset + (Math.random() * 40 - 20) }}
              exit={{ opacity: 0, scale: 1.6, y: -300 }}
              transition={{ duration: 1.8, ease: 'easeOut' }}
              className="absolute bottom-20 left-1/2 flex flex-col items-center gap-1"
            >
              <div className="text-4xl sm:text-5xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)] select-none">
                {item.emoji}
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#073B4C] text-white text-[10px] font-black border border-white shadow-sm whitespace-nowrap">
                {item.senderName}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Quick Reaction Emoji Bar */}
      <div className="w-full max-w-sm mx-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/90 backdrop-blur border-2 border-[#073B4C] shadow-[2.5px_2.5px_0px_0px_#073B4C] mt-1 select-none">
        <span className="text-[10px] font-black text-[#073B4C]/60 uppercase tracking-wider mr-1 hidden xs:inline">
          React:
        </span>
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              soundEngine.playTap();
              onSendReaction(emoji);
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FFF9F0] border border-[#073B4C]/30 text-base sm:text-lg flex items-center justify-center hover:scale-125 hover:bg-amber-100 active:scale-95 active:bg-amber-200 transition-all cursor-pointer"
            title={`Send ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
};
