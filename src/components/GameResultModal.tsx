/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Player, GameStatus, Language } from '../types';
import { PLAYER_THEMES } from '../constants/themes';
import { TRANSLATIONS } from '../i18n/translations';
import { AvatarIcon } from './AvatarIcon';
import { soundEngine } from '../engine/soundEngine';
import { hapticsEngine } from '../engine/hapticsEngine';
import { RotateCcw, Home, Grid, Trophy, Frown, Sparkles, Play } from 'lucide-react';

interface GameResultModalProps {
  status: GameStatus;
  winner: Player | null;
  language: Language;
  onPlayAgain: () => void;
  onGoHome: () => void;
  onOpenBoardPicker: () => void;
  onReplayWinningMove?: () => void;
  moveCount: number;
  customScoreText?: string;
  isOnlineMatch?: boolean;
  onRematch?: () => void;
  rematchRequested?: boolean;
}

export const GameResultModal: React.FC<GameResultModalProps> = ({
  status,
  winner,
  language,
  onPlayAgain,
  onGoHome,
  onOpenBoardPicker,
  onReplayWinningMove,
  moveCount,
  customScoreText,
  isOnlineMatch = false,
  onRematch,
  rematchRequested = false
}) => {
  const t = TRANSLATIONS[language];

  useEffect(() => {
    if (status === 'won') {
      soundEngine.playWin();
      hapticsEngine.trigger('win');
    } else if (status === 'draw') {
      soundEngine.playDraw();
      hapticsEngine.trigger('draw');
    }
  }, [status]);

  if (status !== 'won' && status !== 'draw') return null;

  const winnerTheme = winner ? PLAYER_THEMES[winner.colorKey] || PLAYER_THEMES.blue : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#073B4C]/70 backdrop-blur-sm select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-3xl sm:rounded-[32px] border-3 sm:border-4 border-[#073B4C] shadow-[8px_8px_0px_0px_#073B4C] sm:shadow-[12px_12px_0px_0px_#073B4C] p-4 sm:p-6 text-center flex flex-col items-center gap-3 sm:gap-4 max-h-[92vh] overflow-y-auto overscroll-contain custom-board-scroll">
        {/* Decorative corner circles */}
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-[#FFD166] rounded-full border-3 border-[#073B4C] -z-0 opacity-40" />
        <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-[#06D6A0] rounded-full border-3 border-[#073B4C] -z-0 opacity-40" />

        {status === 'won' && winner && winnerTheme ? (
          <>
            {/* Winner Trophy Icon with Avatar or Photo */}
            <div className="relative z-10">
              <div
                className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${winnerTheme.gradient} border-4 border-[#073B4C] shadow-[6px_6px_0px_0px_#073B4C] flex items-center justify-center text-white rotate-3 overflow-hidden`}
              >
                {winner.photoUrl ? (
                  <img
                    src={winner.photoUrl}
                    alt={winner.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <AvatarIcon name={winner.avatar} className="w-10 h-10 drop-shadow-md" />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#FFD166] border-2 border-[#073B4C] flex items-center justify-center text-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C]">
                <Trophy className="w-4 h-4" />
              </div>
            </div>

            {/* Victory Text */}
            <div className="z-10">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FFD166] border-2 border-[#073B4C] text-[11px] font-black text-[#073B4C] mb-2 shadow-[2px_2px_0px_0px_#073B4C]">
                <Sparkles className="w-3 h-3 text-[#EF476F]" />
                <span>{t.congratulations}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#073B4C] tracking-tight">
                {winner.name} {t.victory}
              </h2>
              <p className="text-xs font-bold text-[#4A4E69] mt-1">
                {customScoreText || (language === 'bn'
                  ? `${moveCount} চালে চমৎকার বিজয় অর্জিত হয়েছে!`
                  : `Secured glorious victory in ${moveCount} moves!`)}
              </p>
            </div>
          </>
        ) : (
          /* Match Drawn */
          <>
            <div className="relative z-10">
              <div className="w-20 h-20 rounded-3xl bg-[#FFD166] border-4 border-[#073B4C] shadow-[6px_6px_0px_0px_#073B4C] flex items-center justify-center text-[#073B4C] -rotate-3">
                <Frown className="w-10 h-10" />
              </div>
            </div>

            <div className="z-10">
              <h2 className="text-2xl sm:text-3xl font-black text-[#073B4C] tracking-tight">
                {t.draw}
              </h2>
              <p className="text-xs font-bold text-[#4A4E69] mt-1">
                {customScoreText || (language === 'bn'
                  ? 'উভয় খেলোয়াড়ই সমান লড়াই করেছেন!'
                  : 'Well matched battle! Both played skillfully.')}
              </p>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full z-10 mt-2">
          {/* Replay Winning Move (when won) */}
          {status === 'won' && onReplayWinningMove && (
            <button
              id="btn-replay-winning-move-modal"
              onClick={() => {
                soundEngine.playWinningMoveReplay();
                hapticsEngine.trigger('heavy');
                onReplayWinningMove();
              }}
              className="w-full py-3 rounded-2xl bg-[#FFD166] hover:bg-amber-300 border-3 border-[#073B4C] text-[#073B4C] font-black text-sm shadow-[4px_4px_0px_0px_#073B4C] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-[#073B4C]" />
              <span>{language === 'bn' ? 'বিজয়ী চাল আবার দেখুন' : 'Replay Winning Move'}</span>
            </button>
          )}

          {/* Primary: Play Again / Rematch */}
          {isOnlineMatch && onRematch ? (
            <button
              id="btn-online-rematch"
              onClick={() => {
                soundEngine.playTap();
                hapticsEngine.trigger('tap');
                onRematch();
              }}
              className="w-full py-3.5 rounded-2xl bg-[#06D6A0] border-3 border-[#073B4C] text-[#073B4C] font-black text-sm shadow-[4px_4px_0px_0px_#073B4C] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{rematchRequested ? t.rematchWaiting : t.rematch}</span>
            </button>
          ) : (
            <button
              id="btn-play-again"
              onClick={() => {
                soundEngine.playTap();
                hapticsEngine.trigger('tap');
                onPlayAgain();
              }}
              className="w-full py-3.5 rounded-2xl bg-[#06D6A0] border-3 border-[#073B4C] text-[#073B4C] font-black text-sm shadow-[4px_4px_0px_0px_#073B4C] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.playAgain}</span>
            </button>
          )}

          {/* Secondary: Change Board */}
          {!isOnlineMatch && (
            <button
              id="btn-result-change-board"
              onClick={() => {
                soundEngine.playTap();
                hapticsEngine.trigger('tap');
                onOpenBoardPicker();
              }}
              className="w-full py-2.5 rounded-2xl bg-[#FFF9F0] border-2 border-[#073B4C] text-[#073B4C] font-black text-xs shadow-[3px_3px_0px_0px_#073B4C] hover:bg-amber-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <Grid className="w-4 h-4" />
              <span>{t.changeBoard}</span>
            </button>
          )}

          {/* Tertiary: Home */}
          <button
            id="btn-result-home"
            onClick={() => {
              soundEngine.playTap();
              hapticsEngine.trigger('tap');
              onGoHome();
            }}
            className="w-full py-2.5 rounded-2xl bg-white border-2 border-[#073B4C] text-[#4A4E69] font-black text-xs shadow-[2px_2px_0px_0px_#073B4C] hover:bg-slate-50 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>{t.homeMenu}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
