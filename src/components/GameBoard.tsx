/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, memo } from 'react';
import { BoardState, Player, CellCoord, Language } from '../types';
import { PLAYER_THEMES } from '../constants/themes';
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

/**
 * Returns optimal font size and styling for player name inside a cell
 */
const getPlayerNameStyles = (name: string, rows: number) => {
  const len = name ? name.length : 0;
  
  if (rows <= 3) {
    if (len <= 4) return 'text-xl sm:text-2xl font-black tracking-wide';
    if (len <= 7) return 'text-base sm:text-lg font-black tracking-normal';
    if (len <= 10) return 'text-xs sm:text-sm font-black tracking-tight leading-tight';
    return 'text-[11px] sm:text-xs font-black tracking-tighter leading-none';
  }
  
  if (rows <= 4) {
    if (len <= 4) return 'text-sm sm:text-base font-black tracking-wide';
    if (len <= 7) return 'text-xs sm:text-sm font-black tracking-normal leading-tight';
    return 'text-[10px] sm:text-xs font-black tracking-tighter leading-none';
  }
  
  if (rows <= 6) {
    if (len <= 4) return 'text-xs sm:text-sm font-black';
    return 'text-[9px] sm:text-[10px] font-black tracking-tighter leading-none';
  }
  
  // For large grids (7x7+)
  if (rows <= 8) {
    return 'text-[9px] sm:text-[10px] font-black';
  }
  
  return 'text-[8px] font-black';
};

/**
 * Formats player name for display inside board cell based on grid size
 */
const formatCellName = (name: string, rows: number): string => {
  if (!name) return '';
  if (rows <= 5) return name;
  if (rows <= 7) return name.length > 5 ? name.slice(0, 5) : name;
  // Compact abbreviation for large grids 8x8 to 15x15
  return name.length > 3 ? name.slice(0, 3).toUpperCase() : name.toUpperCase();
};

export const GameBoard: React.FC<GameBoardProps> = memo(({
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
  const boardRef = useRef<HTMLDivElement>(null);

  const isWinningCell = (r: number, c: number): boolean => {
    if (!winningCells || winningCells.length === 0) return false;
    return winningCells.some((cell) => cell.row === r && cell.col === c);
  };

  const isLargeBoard = rows > 6 || cols > 6;

  // Determine cell sizing based on board dimensions
  const getCellSizeClass = () => {
    if (rows <= 3) return 'w-20 h-20 sm:w-26 sm:h-26';
    if (rows <= 4) return 'w-16 h-16 sm:w-20 sm:h-20';
    if (rows <= 6) return 'w-12 h-12 sm:w-14 sm:h-14';
    if (rows <= 8) return 'w-10 h-10 sm:w-12 sm:h-12';
    if (rows <= 10) return 'w-8 h-8 sm:w-10 sm:h-10';
    return 'w-7 h-7 sm:w-8 sm:h-8';
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
        className="board-3d-stage max-w-full overflow-auto p-3 sm:p-4 flex items-center justify-center"
        style={{ touchAction: isLargeBoard ? 'pan-x pan-y' : 'manipulation' }}
      >
        <div
          ref={boardRef}
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center center'
          }}
          className={`board-3d-surface bg-[#FFFDF9] p-3 sm:p-5 rounded-[28px] border-4 border-[#073B4C] shadow-[8px_8px_0px_0px_#073B4C] ${
            tiltEnabled && !isLargeBoard ? 'hover:rotate-x-2' : ''
          }`}
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

                let cellOwner: Player | null = null;
                if (cell === player1.id || cell === 'X' || cell === 'player1') {
                  cellOwner = player1;
                } else if (cell === player2.id || cell === 'O' || cell === 'player2') {
                  cellOwner = player2;
                }

                const ownerTheme = cellOwner ? PLAYER_THEMES[cellOwner.colorKey] || PLAYER_THEMES.blue : null;
                const isAmberTheme = ownerTheme?.id === 'amber';
                const textColorClass = isAmberTheme ? 'text-[#073B4C]' : 'text-white';
                const cellDisplayName = cellOwner ? formatCellName(cellOwner.name, rows) : '';
                const nameStyleClass = cellOwner ? getPlayerNameStyles(cellDisplayName, rows) : '';

                return (
                  <button
                    key={`cell-${r}-${c}`}
                    id={`cell-${r}-${c}`}
                    type="button"
                    disabled={disabled || cell !== null}
                    onClick={() => {
                      if (disabled || cell !== null) return;
                      onCellClick(r, c);
                    }}
                    className={`
                      ${getCellSizeClass()}
                      group relative flex items-center justify-center rounded-2xl border-2 sm:border-3 p-1
                      ${
                        cell === null
                          ? 'bg-[#FFF9F0] border-[#073B4C] hover:bg-amber-50 active:translate-y-0.5 shadow-[2px_2px_0px_0px_#073B4C] cursor-pointer'
                          : 'bg-white border-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C] cursor-default'
                      }
                      ${isWinning ? 'cell-winning-glow !border-[#06D6A0] !bg-emerald-50 scale-105 z-10' : ''}
                      ${isLast && !isWinning ? 'ring-2 sm:ring-3 ring-[#FFD166]' : ''}
                    `}
                    aria-label={
                      cellOwner
                        ? `Cell row ${r + 1}, column ${c + 1} marked by ${cellOwner.name}`
                        : `Empty cell row ${r + 1}, column ${c + 1}`
                    }
                  >
                    {/* Render Player Name as the Game Piece */}
                    {cell && cellOwner && ownerTheme && (
                      <div
                        className={`token-3d-drop w-full h-full rounded-xl sm:rounded-2xl flex flex-col items-center justify-center p-1 border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] ${textColorClass}`}
                        style={{
                          backgroundColor: ownerTheme.primary
                        }}
                      >
                        <span
                          className={`truncate max-w-full text-center select-none ${nameStyleClass}`}
                          title={cellOwner.name}
                        >
                          {cellDisplayName}
                        </span>
                      </div>
                    )}

                    {/* Pure CSS Ghost Hover Token Preview (Zero JS re-render overhead) */}
                    {cell === null && !disabled && (
                      <div
                        className="opacity-0 group-hover:opacity-40 w-full h-full rounded-xl sm:rounded-2xl flex items-center justify-center p-1 border-2 border-dashed border-[#073B4C] pointer-events-none transition-opacity duration-75"
                        style={{
                          backgroundColor: currentTheme.primary
                        }}
                      >
                        <span
                          className={`truncate max-w-full text-center text-[#073B4C] select-none ${getPlayerNameStyles(
                            formatCellName(currentPlayer.name, rows),
                            rows
                          )}`}
                        >
                          {formatCellName(currentPlayer.name, rows)}
                        </span>
                      </div>
                    )}

                    {/* Last Move Accent Dot */}
                    {isLast && !isWinning && (
                      <span className="absolute top-1 right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#FFD166] border border-[#073B4C] pointer-events-none z-10" />
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
});

GameBoard.displayName = 'GameBoard';
