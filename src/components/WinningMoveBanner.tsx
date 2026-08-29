/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Player, Language } from '../types';
import { PLAYER_THEMES } from '../constants/themes';
import { AvatarIcon } from './AvatarIcon';
import { soundEngine } from '../engine/soundEngine';
import { hapticsEngine } from '../engine/hapticsEngine';
import { Play, Trophy, FileText, Sparkles } from 'lucide-react';

interface WinningMoveBannerProps {
  winner: Player | null;
  onReplayAgain: () => void;
  onOpenResultsModal: () => void;
  language: Language;
  isDotsBoxes?: boolean;
}

export const WinningMoveBanner: React.FC<WinningMoveBannerProps> = ({
  winner,
  onReplayAgain,
  onOpenResultsModal,
  language,
  isDotsBoxes = false
}) => {
  const winnerTheme = winner ? PLAYER_THEMES[winner.colorKey] || PLAYER_THEMES.blue : null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-3 animate-in slide-in-from-bottom-6 duration-300 select-none">
      <div className="bg-white rounded-3xl border-3 border-[#073B4C] shadow-[6px_6px_0px_0px_#073B4C] p-3 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        {/* Winner Tag & Title */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {winner && winnerTheme && (
            <div
              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${winnerTheme.gradient} border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] flex items-center justify-center text-white flex-shrink-0 overflow-hidden`}
            >
              {winner.photoUrl ? (
                <img
                  src={winner.photoUrl}
                  alt={winner.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <AvatarIcon name={winner.avatar} className="w-5 h-5 drop-shadow-sm" />
              )}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#FFD166] fill-[#FFD166]" />
              <span className="text-[10px] font-black text-[#EF476F] uppercase tracking-wider">
                {language === 'bn' ? 'বিজয়ী চাল হাইলাইট' : 'Winning Move Replay'}
              </span>
            </div>
            <p className="text-xs font-black text-[#073B4C] truncate">
              {winner ? `${winner.name} - ${language === 'bn' ? (isDotsBoxes ? 'বক্স জয়ী দাগ' : 'জয়ী লাইন চাল') : (isDotsBoxes ? 'Clinching Line' : 'Winning Move')}` : (language === 'bn' ? 'বিজয়ী চাল' : 'Winning Move')}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
          {/* Replay Button */}
          <button
            id="btn-replay-winning-move-again"
            onClick={() => {
              soundEngine.playWinningMoveReplay();
              hapticsEngine.trigger('heavy');
              onReplayAgain();
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFD166] hover:bg-amber-300 border-2 border-[#073B4C] text-[#073B4C] font-black text-xs shadow-[2px_2px_0px_0px_#073B4C] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            title={language === 'bn' ? 'আবার চাল চালান' : 'Replay Move Again'}
          >
            <Play className="w-3.5 h-3.5 fill-[#073B4C]" />
            <span>{language === 'bn' ? 'চাল রিব্লে' : 'Replay'}</span>
          </button>

          {/* View Full Results Modal */}
          <button
            id="btn-open-results-modal"
            onClick={() => {
              soundEngine.playTap();
              hapticsEngine.trigger('tap');
              onOpenResultsModal();
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#06D6A0] hover:bg-emerald-400 border-2 border-[#073B4C] text-[#073B4C] font-black text-xs shadow-[2px_2px_0px_0px_#073B4C] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            title={language === 'bn' ? 'ফলাফল কার্ড দেখুন' : 'View Result Summary'}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'ফলাফল' : 'Results'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
