/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { GameType, Language } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { soundEngine } from '../engine/soundEngine';
import { hapticsEngine } from '../engine/hapticsEngine';
import {
  Sparkles,
  Play,
  Grid3X3,
  BoxSelect,
  Columns3,
  Users,
  Bot,
  Globe,
  ChevronRight,
  Gamepad2,
  Trophy,
  Flame
} from 'lucide-react';

interface WelcomeHubProps {
  language: Language;
  onSelectGame: (game: GameType) => void;
  onOpenSettings: () => void;
  onOpenCustomizer: () => void;
}

export const WelcomeHub: React.FC<WelcomeHubProps> = ({
  language,
  onSelectGame,
  onOpenSettings,
  onOpenCustomizer
}) => {
  const t = TRANSLATIONS[language];

  const handleGameCardClick = (game: GameType) => {
    soundEngine.playTap();
    hapticsEngine.trigger('medium');
    onSelectGame(game);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-2 sm:py-4 flex flex-col items-center gap-4 sm:gap-6 select-none animate-in fade-in duration-300">
      {/* 1. Hub Header Section */}
      <div className="text-center max-w-2xl mx-auto flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFD166] border-2 border-[#073B4C] text-xs sm:text-sm font-black text-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] mb-2.5"
        >
          <Sparkles className="w-4 h-4 text-[#EF476F]" />
          <span>
            {language === 'bn'
              ? 'বাংলায় আধুনিক ৩ডি মাল্টি-গেম প্ল্যাটফর্ম'
              : 'Bengali-first 3D Tabletop Game Collection'}
          </span>
        </motion.div>

        <motion.h2
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="text-2xl sm:text-3xl md:text-4xl font-black text-[#073B4C] tracking-tight leading-tight"
        >
          {language === 'bn' ? 'কোন খেলাটি খেলতে চান?' : 'Choose Your Game'}
        </motion.h2>

        <motion.p
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="text-xs sm:text-sm md:text-base text-[#4A4E69] font-bold mt-1 max-w-lg"
        >
          {language === 'bn'
            ? 'পছন্দের গেম কার্ডে ট্যাপ করে সরাসরি মোড ও বোর্ড সেটিংসে প্রবেশ করুন'
            : 'Tap a game card to jump directly into mode selection & customize your match'}
        </motion.p>
      </div>

      {/* 2. Three Large Interactive 3D Game Cards */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* CARD 1: 3D Tic-Tac-Toe / Gomoku */}
        <motion.div
          id="card-game-tictactoe"
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          whileHover={{ y: -4, scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleGameCardClick('tictactoe')}
          className="group relative cursor-pointer bg-white rounded-2xl sm:rounded-[28px] border-3 sm:border-4 border-[#073B4C] p-4 sm:p-5 flex flex-col justify-between shadow-[5px_5px_0px_0px_#073B4C] hover:shadow-[7px_7px_0px_0px_#EF476F] active:shadow-[2px_2px_0px_0px_#073B4C] transition-all overflow-hidden"
        >
          {/* Accent Background Blob */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#EF476F]/15 group-hover:scale-125 transition-transform pointer-events-none -z-0" />

          {/* Top Tag & Icon */}
          <div className="relative z-10 flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EF476F] text-white border-2 border-[#073B4C] text-[10px] sm:text-xs font-black shadow-[1.5px_1.5px_0px_0px_#073B4C]">
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? '৩ডি গ্রিড ও গোমোকু' : '3D Grid & Gomoku'}</span>
            </div>
            <span className="text-[10px] font-black text-[#073B4C]/70 px-2 py-0.5 rounded-md bg-[#FFF9F0] border border-[#073B4C]/20">
              {language === 'bn' ? '৩x৩ — ১৫x১৫' : '3x3 — 15x15'}
            </span>
          </div>

          {/* 3D Visual Micro-Animation for Tic-Tac-Toe */}
          <div className="relative z-10 w-full h-32 sm:h-36 my-1 bg-[#FFF9F0] rounded-xl sm:rounded-2xl border-2 border-[#073B4C] flex items-center justify-center overflow-hidden shadow-inner">
            {/* Isometric 3D Grid Stage */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 transform -rotate-6 group-hover:rotate-0 transition-transform duration-300">
              {/* Grid Lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1 p-1 bg-white rounded-xl border-2 border-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C]">
                {/* Cell 1: Animated X */}
                <div className="flex items-center justify-center bg-rose-50 rounded-md border border-[#073B4C]/10">
                  <motion.span
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                    className="text-[#EF476F] font-black text-lg sm:text-xl drop-shadow-[1px_1px_0px_#073B4C]"
                  >
                    ✕
                  </motion.span>
                </div>
                {/* Cell 2: Empty */}
                <div className="bg-white rounded-md" />
                {/* Cell 3: Animated O */}
                <div className="flex items-center justify-center bg-sky-50 rounded-md border border-[#073B4C]/10">
                  <motion.span
                    animate={{ scale: [1, 1.12, 1], rotate: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut', delay: 0.3 }}
                    className="text-[#118AB2] font-black text-lg sm:text-xl drop-shadow-[1px_1px_0px_#073B4C]"
                  >
                    ◯
                  </motion.span>
                </div>
                {/* Cell 4: Empty */}
                <div className="bg-white rounded-md" />
                {/* Cell 5: Animated X in center */}
                <div className="flex items-center justify-center bg-[#EF476F] rounded-md border border-[#073B4C]">
                  <motion.span
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    className="text-white font-black text-lg sm:text-xl"
                  >
                    ✕
                  </motion.span>
                </div>
                {/* Cell 6: Empty */}
                <div className="bg-white rounded-md" />
                {/* Cell 7: Animated O */}
                <div className="flex items-center justify-center bg-emerald-50 rounded-md border border-[#073B4C]/10">
                  <span className="text-[#06D6A0] font-black text-lg sm:text-xl drop-shadow-[1px_1px_0px_#073B4C]">
                    ◯
                  </span>
                </div>
                {/* Cell 8: Empty */}
                <div className="bg-white rounded-md" />
                {/* Cell 9: Animated Winning X */}
                <div className="flex items-center justify-center bg-[#FFD166] rounded-md border border-[#073B4C]">
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                    className="text-[#073B4C] font-black text-lg sm:text-xl"
                  >
                    ✕
                  </motion.span>
                </div>
              </div>
            </div>
          </div>

          {/* Title & Description */}
          <div className="relative z-10 mt-3 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-[#073B4C] group-hover:text-[#EF476F] transition-colors leading-tight">
                {language === 'bn' ? 'টিক-ট্যাক-টো ৩ডি' : '3D Tic-Tac-Toe'}
              </h3>
              <p className="text-xs sm:text-[13px] text-[#4A4E69] font-bold mt-1 line-clamp-2">
                {language === 'bn'
                  ? '৩x৩ থেকে ১৫x১৫ গ্রিডে রোমাঞ্চকর ৩ডি টিক-ট্যাক-টো ও গোমোকু ৫-ইন-এ-রো'
                  : 'Classic 3x3 to 15x15 dynamic 3D tabletop grids with Gomoku rules'}
              </p>
            </div>

            {/* Launch Action Button */}
            <div className="mt-4 pt-3 border-t-2 border-[#073B4C]/10 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#073B4C]/80">
                <Users className="w-3.5 h-3.5 text-[#EF476F]" />
                <span>{language === 'bn' ? '২ খেলোয়াড় • AI • অনলাইন' : '2P • AI • Online'}</span>
              </div>
              <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EF476F] text-white font-black text-xs border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] group-hover:translate-x-0.5 transition-transform">
                <span>{language === 'bn' ? 'খেলুন' : 'Play'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* CARD 2: Dots & Boxes (খাঁচা ও বিন্দু) */}
        <motion.div
          id="card-game-dotsboxes"
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.18 }}
          whileHover={{ y: -4, scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleGameCardClick('dotsboxes')}
          className="group relative cursor-pointer bg-white rounded-2xl sm:rounded-[28px] border-3 sm:border-4 border-[#073B4C] p-4 sm:p-5 flex flex-col justify-between shadow-[5px_5px_0px_0px_#073B4C] hover:shadow-[7px_7px_0px_0px_#118AB2] active:shadow-[2px_2px_0px_0px_#073B4C] transition-all overflow-hidden"
        >
          {/* Accent Background Blob */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#118AB2]/15 group-hover:scale-125 transition-transform pointer-events-none -z-0" />

          {/* Top Tag & Icon */}
          <div className="relative z-10 flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#118AB2] text-white border-2 border-[#073B4C] text-[10px] sm:text-xs font-black shadow-[1.5px_1.5px_0px_0px_#073B4C]">
              <BoxSelect className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'খাঁচা দখল ও পয়েন্ট' : 'Territory & Box Capture'}</span>
            </div>
            <span className="text-[10px] font-black text-[#073B4C]/70 px-2 py-0.5 rounded-md bg-[#FFF9F0] border border-[#073B4C]/20">
              {language === 'bn' ? '২x২ — ৫x৫ বক্স' : '2x2 — 5x5 Boxes'}
            </span>
          </div>

          {/* 3D Visual Micro-Animation for Dots & Boxes */}
          <div className="relative z-10 w-full h-32 sm:h-36 my-1 bg-[#FFF9F0] rounded-xl sm:rounded-2xl border-2 border-[#073B4C] flex items-center justify-center overflow-hidden shadow-inner">
            {/* Animated Mini Pegs & Captured Box */}
            <div className="relative w-28 h-28 flex flex-col justify-between p-3">
              {/* Top Row Dots */}
              <div className="flex justify-between items-center relative z-20">
                <div className="w-4 h-4 rounded-full bg-[#073B4C] border border-white shadow-[1px_1px_0px_#073B4C]" />
                {/* Horizontal Connected Line */}
                <motion.div
                  animate={{ scaleX: [0.6, 1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 2.2 }}
                  className="flex-1 h-2 bg-[#118AB2] mx-1 rounded-full border border-[#073B4C]"
                />
                <div className="w-4 h-4 rounded-full bg-[#073B4C] border border-white shadow-[1px_1px_0px_#073B4C]" />
              </div>

              {/* Middle Row with Vertical Connected Line & Captured Box */}
              <div className="flex-1 flex justify-between items-center my-1 relative">
                <motion.div
                  animate={{ scaleY: [0.7, 1, 0.7] }}
                  transition={{ repeat: Infinity, duration: 2.2, delay: 0.2 }}
                  className="w-2 h-full bg-[#118AB2] rounded-full border border-[#073B4C]"
                />
                {/* Box Captured Badge */}
                <motion.div
                  animate={{ scale: [0.92, 1.05, 0.92], rotate: [-2, 2, -2] }}
                  transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
                  className="mx-2 flex-1 h-full rounded-xl bg-[#FFD166] border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] flex flex-col items-center justify-center"
                >
                  <span className="text-[#073B4C] font-black text-xs sm:text-sm leading-none">
                    ★
                  </span>
                  <span className="text-[9px] font-black text-[#073B4C] mt-0.5">
                    {language === 'bn' ? 'দখল!' : '+১ BOX'}
                  </span>
                </motion.div>
                <div className="w-2 h-full bg-[#06D6A0] rounded-full border border-[#073B4C]" />
              </div>

              {/* Bottom Row Dots */}
              <div className="flex justify-between items-center relative z-20">
                <div className="w-4 h-4 rounded-full bg-[#073B4C] border border-white shadow-[1px_1px_0px_#073B4C]" />
                <div className="flex-1 h-2 bg-[#06D6A0] mx-1 rounded-full border border-[#073B4C]" />
                <div className="w-4 h-4 rounded-full bg-[#073B4C] border border-white shadow-[1px_1px_0px_#073B4C]" />
              </div>
            </div>
          </div>

          {/* Title & Description */}
          <div className="relative z-10 mt-3 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-[#073B4C] group-hover:text-[#118AB2] transition-colors leading-tight">
                {language === 'bn' ? 'খাঁচা ও বিন্দু (Dots & Boxes)' : 'Dots & Boxes'}
              </h3>
              <p className="text-xs sm:text-[13px] text-[#4A4E69] font-bold mt-1 line-clamp-2">
                {language === 'bn'
                  ? 'ডট সংযুক্ত করে লাইন টানুন, ৪টি বাহু দিয়ে খাঁচা দখল করুন ও বোনাস চাল নিন'
                  : 'Connect dots to complete boxes, score points, and earn consecutive bonus turns'}
              </p>
            </div>

            {/* Launch Action Button */}
            <div className="mt-4 pt-3 border-t-2 border-[#073B4C]/10 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#073B4C]/80">
                <Flame className="w-3.5 h-3.5 text-[#118AB2]" />
                <span>{language === 'bn' ? 'বোনাস চাল • কৌশল' : 'Bonus Turns • Strategy'}</span>
              </div>
              <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#118AB2] text-white font-black text-xs border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] group-hover:translate-x-0.5 transition-transform">
                <span>{language === 'bn' ? 'খেলুন' : 'Play'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* CARD 3: Connect Four (চার মিলান) */}
        <motion.div
          id="card-game-connectfour"
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.24 }}
          whileHover={{ y: -4, scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleGameCardClick('connectfour')}
          className="group relative cursor-pointer bg-white rounded-2xl sm:rounded-[28px] border-3 sm:border-4 border-[#073B4C] p-4 sm:p-5 flex flex-col justify-between shadow-[5px_5px_0px_0px_#073B4C] hover:shadow-[7px_7px_0px_0px_#06D6A0] active:shadow-[2px_2px_0px_0px_#073B4C] transition-all overflow-hidden"
        >
          {/* Accent Background Blob */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#06D6A0]/20 group-hover:scale-125 transition-transform pointer-events-none -z-0" />

          {/* Top Tag & Icon */}
          <div className="relative z-10 flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#06D6A0] text-[#073B4C] border-2 border-[#073B4C] text-[10px] sm:text-xs font-black shadow-[1.5px_1.5px_0px_0px_#073B4C]">
              <Columns3 className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'গ্র্যাভিটি ড্রপ ও কৌশল' : 'Gravity Drop Strategy'}</span>
            </div>
            <span className="text-[10px] font-black text-[#073B4C]/70 px-2 py-0.5 rounded-md bg-[#FFF9F0] border border-[#073B4C]/20">
              {language === 'bn' ? '৪-ইন-এ-রো' : '4-in-a-Row'}
            </span>
          </div>

          {/* 3D Visual Micro-Animation for Connect Four */}
          <div className="relative z-10 w-full h-32 sm:h-36 my-1 bg-[#FFF9F0] rounded-xl sm:rounded-2xl border-2 border-[#073B4C] flex items-center justify-center overflow-hidden shadow-inner">
            {/* Drop Rack */}
            <div className="relative w-36 h-28 bg-[#118AB2] rounded-xl border-3 border-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C] p-2 flex flex-col justify-end">
              {/* Rack Grid Holes */}
              <div className="grid grid-cols-4 grid-rows-3 gap-1.5 h-full">
                {/* Row 1: Dropping Disc */}
                <div className="w-5 h-5 rounded-full bg-[#073B4C]/20 border border-[#073B4C]" />
                <motion.div
                  animate={{ y: [-15, 0, -15] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
                  className="w-5 h-5 rounded-full bg-[#EF476F] border-2 border-[#073B4C] shadow-sm flex items-center justify-center"
                >
                  <div className="w-2 h-2 rounded-full bg-white/40" />
                </motion.div>
                <div className="w-5 h-5 rounded-full bg-[#073B4C]/20 border border-[#073B4C]" />
                <div className="w-5 h-5 rounded-full bg-[#073B4C]/20 border border-[#073B4C]" />

                {/* Row 2 */}
                <div className="w-5 h-5 rounded-full bg-[#FFD166] border-2 border-[#073B4C] shadow-sm" />
                <div className="w-5 h-5 rounded-full bg-[#EF476F] border-2 border-[#073B4C] shadow-sm" />
                <div className="w-5 h-5 rounded-full bg-[#FFD166] border-2 border-[#073B4C] shadow-sm" />
                <div className="w-5 h-5 rounded-full bg-[#073B4C]/20 border border-[#073B4C]" />

                {/* Row 3 (Bottom Line - Winning 4 combo) */}
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 1.6 }}
                  className="w-5 h-5 rounded-full bg-[#EF476F] border-2 border-[#073B4C] ring-2 ring-[#FFD166] shadow-sm"
                />
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 1.6, delay: 0.1 }}
                  className="w-5 h-5 rounded-full bg-[#EF476F] border-2 border-[#073B4C] ring-2 ring-[#FFD166] shadow-sm"
                />
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 1.6, delay: 0.2 }}
                  className="w-5 h-5 rounded-full bg-[#EF476F] border-2 border-[#073B4C] ring-2 ring-[#FFD166] shadow-sm"
                />
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 1.6, delay: 0.3 }}
                  className="w-5 h-5 rounded-full bg-[#EF476F] border-2 border-[#073B4C] ring-2 ring-[#FFD166] shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Title & Description */}
          <div className="relative z-10 mt-3 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-[#073B4C] group-hover:text-[#06D6A0] transition-colors leading-tight">
                {language === 'bn' ? 'চার মিলান (Connect 4)' : 'Connect Four'}
              </h3>
              <p className="text-xs sm:text-[13px] text-[#4A4E69] font-bold mt-1 line-clamp-2">
                {language === 'bn'
                  ? 'গ্রিডে ওপর থেকে ঘুঁটি ফেলুন—যেকোনো দিকে ৪টি ঘুঁটি এক লাইনে মেলালেই নিশ্চিত জয়'
                  : 'Drop colored discs into the vertical rack to connect 4 in a line and block your opponent'}
              </p>
            </div>

            {/* Launch Action Button */}
            <div className="mt-4 pt-3 border-t-2 border-[#073B4C]/10 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#073B4C]/80">
                <Trophy className="w-3.5 h-3.5 text-[#06D6A0]" />
                <span>{language === 'bn' ? '৪-ইন-এ-রো • জয়' : '4-in-a-Row • Win'}</span>
              </div>
              <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#06D6A0] text-[#073B4C] font-black text-xs border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] group-hover:translate-x-0.5 transition-transform">
                <span>{language === 'bn' ? 'খেলুন' : 'Play'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 3. Bottom Quick Utility Controls (Visually secondary) */}
      <div className="w-full flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-1 sm:mt-2">
        <button
          id="btn-hub-player-customizer"
          type="button"
          onClick={() => {
            soundEngine.playTap();
            hapticsEngine.trigger('tap');
            onOpenCustomizer();
          }}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl sm:rounded-2xl bg-white border-2 border-[#073B4C] text-xs font-black text-[#073B4C] shadow-[2.5px_2.5px_0px_0px_#073B4C] hover:bg-amber-50 active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          <span>🎨</span>
          <span>{language === 'bn' ? 'খেলোয়াড় কাস্টমাইজার' : 'Player Customizer'}</span>
        </button>

        <button
          id="btn-hub-open-settings"
          type="button"
          onClick={() => {
            soundEngine.playTap();
            hapticsEngine.trigger('tap');
            onOpenSettings();
          }}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl sm:rounded-2xl bg-white border-2 border-[#073B4C] text-xs font-black text-[#073B4C] shadow-[2.5px_2.5px_0px_0px_#073B4C] hover:bg-amber-50 active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          <span>⚙️</span>
          <span>{language === 'bn' ? 'গেম সেটিংস ও থিম' : 'Settings & Themes'}</span>
        </button>
      </div>
    </div>
  );
};
