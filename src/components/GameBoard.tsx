/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { BoardState, Player, CellCoord, Language } from '../types';
import { PLAYER_THEMES } from '../constants/themes';
import { AvatarIcon } from './AvatarIcon';
import { soundEngine } from '../engine/soundEngine';
import { hapticsEngine } from '../engine/hapticsEngine';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface GameBoardProps {
  board: BoardState;
  onCellClick: (row: number, col: number) => void;
  player1: Player;
  player2: Player;
  currentPlayer: Player;
  winningCells?: CellCoord[] | null;
  lastMove: { row: number; col: number } | null;
  disabled?: boolean;
  tiltEnabled?: boolean;
  language: Language;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  onCellClick,
  player1,
  player2,
  currentPlayer,
  winningCells,
  lastMove,
  disabled = false,
  tiltEnabled = true
}) => {
  const rows = board.length;
  const cols = board[0]?.length || 3;
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const boardRef = useRef<HTMLDivElement>(null);

  const isWinningCell = (r: number, c: number): boolean => {
    if (!winningCells || winningCells.length === 0) return false;
    return winningCells.some((cell) => cell.row === r && cell.col === c);
  };

  const isLargeBoard = rows > 6 || cols > 6;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tiltEnabled || isLargeBoard) return;
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -14;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setHoveredCell(null);
  };

  // Determine cell sizing based on board dimensions
  const getCellSizeClass = () => {
    if (rows <= 3) return 'w-20 h-20 sm:w-24 sm:h-24 text-3xl sm:text-4xl';
    if (rows <= 4) return 'w-16 h-16 sm:w-20 sm:h-20 text-2xl sm:text-3xl';
    if (rows <= 6) return 'w-12 h-12 sm:w-14 sm:h-14 text-xl sm:text-2xl';
    if (rows <= 8) return 'w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg';
    if (rows <= 10) return 'w-8 h-8 sm:w-10 sm:h-10 text-sm sm:text-base';
    return 'w-7 h-7 sm:w-8 sm:h-8 text-xs';
  };

  const currentTheme = PLAYER_THEMES[currentPlayer.colorKey] || PLAYER_THEMES.blue;

  return (
    <div className="relative w-full flex flex-col items-center justify-center p-2 sm:p-4 select-none">
      {/* Zoom / Reset Controls for large boards */}
      {isLargeBoard && (
        <div className="flex items-center gap-2 mb-3 px-3 py-1.5 rounded-2xl bg-white border-2 border-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C] z-10">
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.15))}
            className="p-1.5 rounded-lg text-[#073B4C] hover:bg-amber-100 transition-colors"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-black text-[#073B4C] min-w-10 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.15))}
            className="p-1.5 rounded-lg text-[#073B4C] hover:bg-amber-100 transition-colors"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="p-1.5 rounded-lg text-[#073B4C] hover:bg-amber-100 transition-colors border-l border-[#073B4C]/20 ml-1"
            title="Reset Zoom"
            aria-label="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3D Board Stage */}
      <div
        className="board-3d-stage max-w-full overflow-auto p-4 flex items-center justify-center"
        style={{ touchAction: isLargeBoard ? 'pan-x pan-y' : 'none' }}
      >
        <div
          ref={boardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: tiltEnabled && !isLargeBoard
              ? `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) scale(${zoomLevel})`
              : `scale(${zoomLevel})`,
            transformOrigin: 'center center'
          }}
          className="board-3d-surface bg-[#FFFDF9] p-3 sm:p-5 rounded-[28px] border-4 border-[#073B4C] shadow-[8px_8px_0px_0px_#073B4C] transition-transform duration-150"
        >
          <div
            className="grid gap-2 sm:gap-2.5"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
            }}
          >
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isWinning = isWinningCell(r, c);
                const isLast = lastMove?.row === r && lastMove?.col === c;
                const isHovered = hoveredCell?.row === r && hoveredCell?.col === c && !cell && !disabled;

                let cellOwner = null;
                if (cell === player1.id || cell === 'X' || cell === 'player1') cellOwner = player1;
                else if (cell === player2.id || cell === 'O' || cell === 'player2') cellOwner = player2;

                const ownerTheme = cellOwner ? PLAYER_THEMES[cellOwner.colorKey] || PLAYER_THEMES.blue : null;

                return (
                  <button
                    key={`cell-${r}-${c}`}
                    id={`cell-${r}-${c}`}
                    disabled={disabled || cell !== null}
                    onClick={() => {
                      if (disabled || cell !== null) return;
                      soundEngine.playMove();
                      hapticsEngine.trigger('move');
                      onCellClick(r, c);
                    }}
                    onMouseEnter={() => setHoveredCell({ row: r, col: c })}
                    className={`
                      ${getCellSizeClass()}
                      relative flex items-center justify-center rounded-2xl border-2 sm:border-3 transition-all duration-150
                      ${
                        cell === null
                          ? 'bg-[#FFF9F0] border-[#073B4C] hover:bg-amber-50 active:translate-y-0.5 shadow-[2px_2px_0px_0px_#073B4C] cursor-pointer'
                          : 'bg-white border-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C] cursor-default'
                      }
                      ${isWinning ? 'cell-winning-glow !border-[#06D6A0] !bg-emerald-50 scale-105 z-10' : ''}
                      ${isLast && !isWinning ? 'ring-3 ring-[#FFD166]' : ''}
                    `}
                    aria-label={`Cell row ${r + 1}, column ${c + 1}`}
                  >
                    {/* Render Player Token */}
                    {cell && cellOwner && ownerTheme && (
                      <div
                        className="token-3d-drop w-[80%] h-[80%] rounded-xl flex items-center justify-center border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] text-white"
                        style={{
                          backgroundColor: ownerTheme.primary
                        }}
                      >
                        <AvatarIcon
                          name={cellOwner.avatar}
                          className="w-[60%] h-[60%] drop-shadow-sm"
                        />
                      </div>
                    )}

                    {/* Hover Ghost Token Preview */}
                    {isHovered && (
                      <div
                        className="w-[70%] h-[70%] rounded-xl flex items-center justify-center opacity-35 border-2 border-dashed border-[#073B4C]"
                        style={{
                          backgroundColor: currentTheme.primary
                        }}
                      >
                        <AvatarIcon
                          name={currentPlayer.avatar}
                          className="w-[50%] h-[50%] text-white"
                        />
                      </div>
                    )}

                    {/* Last Move Indicator Pin */}
                    {isLast && !isWinning && (
                      <span className="absolute top-1 right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#FFD166] border border-[#073B4C]" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
