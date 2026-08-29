/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ConnectFourGameState, Language, CellCoord, Player } from '../types';
import { PLAYER_THEMES } from '../constants/themes';
import { AvatarIcon } from './AvatarIcon';
import { formatNumberByLang } from '../i18n/translations';
import { ArrowDown, Crown } from 'lucide-react';

interface ConnectFourBoardProps {
  gameState: ConnectFourGameState;
  onDrop: (col: number) => void;
  disabled: boolean;
  tiltEnabled: boolean;
  language: Language;
  winningCells?: CellCoord[];
  lastDrop?: { row: number; col: number } | null;
  isReplayingWinningMove?: boolean;
}

export const ConnectFourBoard: React.FC<ConnectFourBoardProps> = ({
  gameState,
  onDrop,
  disabled,
  tiltEnabled,
  language,
  winningCells = [],
  lastDrop,
  isReplayingWinningMove = false
}) => {
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const { board, config, players, currentPlayerIndex } = gameState;
  const currentPlayer = players[currentPlayerIndex];
  const currentTheme = PLAYER_THEMES[currentPlayer?.colorKey] || PLAYER_THEMES.blue;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tiltEnabled || disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -8;
    setTilt({ x: Math.max(-5, Math.min(5, x)), y: Math.max(-5, Math.min(5, y)) });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setHoveredCol(null);
  };

  const isWinningCell = (r: number, c: number): boolean => {
    return winningCells.some((cell) => cell.row === r && cell.col === c);
  };

  const isLastDrop = (r: number, c: number): boolean => {
    return lastDrop?.row === r && lastDrop?.col === c;
  };

  const getPlayerForId = (id: string | null): Player | undefined => {
    if (!id) return undefined;
    return players.find((p) => p.id === id);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto px-2 select-none">
      {/* Column Hover Indicator & Quick Tap Bar */}
      <div
        className="grid w-full mb-2 gap-1.5 sm:gap-2 px-3"
        style={{ gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: config.cols }).map((_, c) => {
          const isColFull = board[0][c] !== null;
          const isHovered = hoveredCol === c && !disabled && !isColFull;

          return (
            <button
              key={`col-btn-${c}`}
              id={`btn-c4-col-${c}`}
              disabled={disabled || isColFull}
              onClick={() => onDrop(c)}
              onMouseEnter={() => setHoveredCol(c)}
              onMouseLeave={() => setHoveredCol(null)}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl border-2 transition-all duration-150 relative ${
                isColFull
                  ? 'opacity-30 cursor-not-allowed bg-stone-200 border-stone-300 text-stone-400'
                  : isHovered
                  ? 'bg-amber-300 border-[#073B4C] text-[#073B4C] shadow-[0px_3px_0px_0px_#073B4C] -translate-y-1'
                  : 'bg-white/80 hover:bg-white border-[#073B4C]/40 text-[#073B4C] hover:border-[#073B4C]'
              }`}
              title={
                isColFull
                  ? language === 'bn'
                    ? 'কলাম পূর্ণ'
                    : 'Column full'
                  : `${language === 'bn' ? 'কলাম' : 'Col'} ${formatNumberByLang(c + 1, language)}`
              }
            >
              <ArrowDown
                className={`w-3.5 h-3.5 transition-transform ${
                  isHovered ? 'animate-bounce text-[#073B4C]' : 'opacity-60'
                }`}
              />
              <span className="text-[11px] font-black leading-none mt-0.5">
                {formatNumberByLang(c + 1, language)}
              </span>

              {/* Ghost Preview Token Floating Above Selected Column */}
              {isHovered && (
                <div
                  className="absolute -top-7 w-6 h-6 rounded-full border-2 border-[#073B4C] shadow-md flex items-center justify-center pointer-events-none animate-pulse"
                  style={{
                    background: currentTheme.primary,
                    color: currentTheme.text
                  }}
                >
                  <AvatarIcon avatarKey={currentPlayer.avatar} className="w-3.5 h-3.5" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Upright Connect-4 Rack Board */}
      <div
        className="w-full relative transition-transform duration-200 ease-out"
        style={{
          transform: tiltEnabled
            ? `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`
            : 'none'
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="bg-[#1D4ED8] p-3 sm:p-4 rounded-3xl border-4 border-[#073B4C] shadow-[6px_6px_0px_0px_#073B4C] sm:shadow-[8px_8px_0px_0px_#073B4C] relative overflow-hidden">
          {/* Subtle Rack Highlight Shine */}
          <div className="absolute top-0 left-0 right-0 h-3 bg-white/20 rounded-t-2xl pointer-events-none" />

          {/* Grid of Slots */}
          <div
            className="grid gap-1.5 sm:gap-2.5 w-full bg-[#1E40AF] p-2.5 sm:p-3.5 rounded-2xl border-3 border-[#073B4C]/60"
            style={{
              gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${config.rows}, minmax(0, 1fr))`
            }}
          >
            {board.map((rowArr, r) =>
              rowArr.map((occupantId, c) => {
                const isWon = isWinningCell(r, c);
                const isLast = isLastDrop(r, c);
                const occupant = getPlayerForId(occupantId);
                const theme = occupant ? PLAYER_THEMES[occupant.colorKey] || PLAYER_THEMES.blue : null;
                const isColHovered = hoveredCol === c && !disabled && board[0][c] === null;

                return (
                  <div
                    key={`slot-${r}-${c}`}
                    id={`c4-slot-${r}-${c}`}
                    onClick={() => {
                      if (!disabled && board[0][c] === null) {
                        onDrop(c);
                      }
                    }}
                    onMouseEnter={() => setHoveredCol(c)}
                    className={`aspect-square rounded-full flex items-center justify-center relative cursor-pointer transition-all duration-150 ${
                      isColHovered && !occupant ? 'bg-[#0f172a]/90' : 'bg-[#0f172a]'
                    } shadow-[inset_0_3px_6px_rgba(0,0,0,0.7)] border-2 ${
                      isWon
                        ? 'border-[#FFD166] ring-4 ring-[#FFD166]/60 z-10'
                        : isLast
                        ? 'border-white/80'
                        : 'border-[#073B4C]/70'
                    }`}
                  >
                    {/* Occupied Token */}
                    {occupant && theme && (
                      <div
                        className={`w-[88%] h-[88%] rounded-full border-2 border-[#073B4C] shadow-md flex items-center justify-center relative overflow-hidden transition-transform duration-200 ${
                          isWon
                            ? isReplayingWinningMove
                              ? 'scale-110 animate-bounce'
                              : 'scale-105 animate-pulse'
                            : ''
                        }`}
                        style={{
                          background: theme.gradient,
                          color: theme.text
                        }}
                      >
                        {/* Token Bevel Ring */}
                        <div className="absolute inset-1 rounded-full border border-white/40 pointer-events-none" />

                        {/* Player Photo or Icon */}
                        {occupant.photoUrl ? (
                          <img
                            src={occupant.photoUrl}
                            alt={occupant.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <AvatarIcon
                            avatarKey={occupant.avatar}
                            className="w-4 h-4 sm:w-6 sm:h-6 drop-shadow-sm"
                          />
                        )}

                        {/* Winning Crown Marker */}
                        {isWon && (
                          <div className="absolute -top-1 -right-1 bg-[#FFD166] border-2 border-[#073B4C] rounded-full p-0.5 shadow-sm">
                            <Crown className="w-3 h-3 text-[#073B4C] fill-[#073B4C]" />
                          </div>
                        )}

                        {/* Last Drop Indicator */}
                        {isLast && !isWon && (
                          <div className="absolute inset-0 rounded-full border-2 border-white animate-ping opacity-75 pointer-events-none" />
                        )}
                      </div>
                    )}

                    {/* Empty Ghost Hover Drop Preview inside lowest available slot in column */}
                    {!occupant && isColHovered && (
                      <div
                        className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-white/40 opacity-40 animate-pulse pointer-events-none"
                        style={{ background: currentTheme.primary }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Board Legs & Base Stand */}
        <div className="flex justify-between items-start px-6 -mt-1 pointer-events-none">
          <div className="w-6 h-6 bg-[#073B4C] rounded-b-xl border-b-3 border-x-3 border-[#073B4C] shadow-[2px_3px_0px_0px_rgba(0,0,0,0.3)]" />
          <div className="w-6 h-6 bg-[#073B4C] rounded-b-xl border-b-3 border-x-3 border-[#073B4C] shadow-[2px_3px_0px_0px_rgba(0,0,0,0.3)]" />
        </div>
      </div>
    </div>
  );
};
