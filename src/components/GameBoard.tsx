/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback, memo } from 'react';
import { BoardState, Player, CellCoord, Language } from '../types';
import { PLAYER_THEMES } from '../constants/themes';
import { TRANSLATIONS } from '../i18n/translations';
import { soundEngine } from '../engine/soundEngine';
import { hapticsEngine } from '../engine/hapticsEngine';
import { ZoomIn, ZoomOut, RotateCcw, RotateCw } from 'lucide-react';

interface GameBoardProps {
  board: BoardState;
  onCellClick: (row: number, col: number) => void;
  player1: Player;
  player2: Player;
  currentPlayer: Player;
  winningCells?: CellCoord[] | null;
  lastMove: { row: number; col: number } | null;
  winningMoveCoord?: { row: number; col: number } | null;
  isReplayingWinningMove?: boolean;
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
    if (len <= 4) return 'text-lg xs:text-xl sm:text-2xl font-black tracking-wide';
    if (len <= 7) return 'text-xs xs:text-sm sm:text-lg font-black tracking-normal';
    if (len <= 10) return 'text-[10px] xs:text-xs sm:text-sm font-black tracking-tight leading-tight';
    return 'text-[9px] xs:text-[11px] sm:text-xs font-black tracking-tighter leading-none';
  }
  
  if (rows <= 4) {
    if (len <= 4) return 'text-xs xs:text-sm sm:text-base font-black tracking-wide';
    if (len <= 7) return 'text-[10px] xs:text-xs sm:text-sm font-black tracking-normal leading-tight';
    return 'text-[9px] xs:text-[10px] sm:text-xs font-black tracking-tighter leading-none';
  }
  
  if (rows <= 5) {
    if (len <= 4) return 'text-[10px] xs:text-xs sm:text-sm font-black';
    return 'text-[8px] xs:text-[9px] sm:text-[10px] font-black tracking-tighter leading-none';
  }

  if (rows <= 6) {
    return 'text-[8px] xs:text-[9px] sm:text-[10px] font-black tracking-tighter leading-none';
  }
  
  // For large grids (7x7+)
  if (rows <= 8) {
    return 'text-[8px] sm:text-[9px] font-black leading-none';
  }
  
  return 'text-[7px] sm:text-[8px] font-black leading-none';
};

/**
 * Formats player name for display inside board cell based on grid size
 */
const formatCellName = (name: string, rows: number): string => {
  if (!name) return '';
  if (rows <= 4) return name;
  if (rows <= 6) return name.length > 5 ? name.slice(0, 5) : name;
  // Compact abbreviation for large grids 7x7 to 15x15
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
  winningMoveCoord,
  isReplayingWinningMove = false,
  disabled = false,
  tiltEnabled = true,
  language
}) => {
  const t = TRANSLATIONS[language];
  const rows = board.length;
  const cols = board[0]?.length || 3;
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const boardRef = useRef<HTMLDivElement>(null);
  const lastTriggerTimeRef = useRef<number>(0);
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Effective winning move coordinate: either explicit prop or lastMove when there's a winning sequence
  const effectiveWinningMove = winningMoveCoord || (winningCells && winningCells.length > 0 ? lastMove : null);

  const isWinningCell = (r: number, c: number): boolean => {
    if (!winningCells || winningCells.length === 0) return false;
    return winningCells.some((cell) => cell.row === r && cell.col === c);
  };

  const isLargeBoard = rows > 6 || cols > 6;

  const [shakingCell, setShakingCell] = useState<{ row: number; col: number } | null>(null);

  // Rotate perspective by 90 degrees clockwise
  const handleRotate90 = () => {
    soundEngine.playTap();
    hapticsEngine.trigger('tap');
    setRotationAngle((prev) => prev + 90);
  };

  // Reset rotation and zoom
  const handleResetPerspective = () => {
    soundEngine.playTap();
    hapticsEngine.trigger('tap');
    setRotationAngle(0);
    setZoomLevel(1);
  };

  // Instant move trigger with debounce protection and invalid feedback
  const triggerMove = useCallback((r: number, c: number) => {
    if (disabled || board[r]?.[c] !== null) {
      if (board[r]?.[c] !== null && !disabled) {
        soundEngine.playError();
        hapticsEngine.trigger('invalid');
        setShakingCell({ row: r, col: c });
        setTimeout(() => setShakingCell(null), 300);
      }
      return;
    }
    const now = Date.now();
    if (now - lastTriggerTimeRef.current < 160) return; // Prevent duplicate rapid firings
    lastTriggerTimeRef.current = now;
    onCellClick(r, c);
  }, [disabled, board, onCellClick]);

  // Pointer down tracking for ultra-responsive tap handling on mobile
  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    };
  };

  // Pointer up handler: triggers immediately on release without waiting for browser click synthetic delays
  const handlePointerUp = (r: number, c: number, e: React.PointerEvent) => {
    if (!pointerStartRef.current) return;
    const dx = Math.abs(e.clientX - pointerStartRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartRef.current.y);
    const dt = Date.now() - pointerStartRef.current.time;
    pointerStartRef.current = null;

    // If movement is tiny (< 12px) and fast (< 600ms), execute move immediately on the 1st tap!
    if (dx < 12 && dy < 12 && dt < 600) {
      triggerMove(r, c);
    }
  };

  // Determine responsive cell sizing based on board dimensions
  const getCellSizeClass = () => {
    if (rows <= 3) return 'w-[min(23vw,80px)] h-[min(23vw,80px)] sm:w-24 sm:h-24';
    if (rows <= 4) return 'w-[min(17.5vw,62px)] h-[min(17.5vw,62px)] sm:w-20 sm:h-20';
    if (rows <= 5) return 'w-[min(14vw,50px)] h-[min(14vw,50px)] sm:w-16 sm:h-16';
    if (rows <= 6) return 'w-[min(11.5vw,42px)] h-[min(11.5vw,42px)] sm:w-14 sm:h-14';
    if (rows <= 8) return 'w-[min(9.5vw,34px)] h-[min(9.5vw,34px)] min-w-[28px] min-h-[28px] sm:w-11 sm:h-11';
    if (rows <= 10) return 'w-[min(8vw,30px)] h-[min(8vw,30px)] min-w-[26px] min-h-[26px] sm:w-9 sm:h-9';
    return 'w-[28px] h-[28px] min-w-[28px] min-h-[28px] sm:w-8 sm:h-8';
  };

  const currentTheme = PLAYER_THEMES[currentPlayer.colorKey] || PLAYER_THEMES.blue;
  const currentAngleNormalized = ((rotationAngle % 360) + 360) % 360;

  return (
    <div className="relative w-full max-w-full flex flex-col items-center justify-center p-1 sm:p-2 select-none overflow-x-hidden">
      {/* 3D Perspective & Zoom Control Bar */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 px-3 py-1.5 rounded-2xl bg-white border-2 border-[#073B4C] shadow-[2.5px_2.5px_0px_0px_#073B4C] z-10 animate-in fade-in flex-wrap justify-center">
        {/* 90-Degree Rotation Button */}
        <button
          id="btn-rotate-board-90"
          type="button"
          onClick={handleRotate90}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#FFF9F0] border border-[#073B4C] text-[#073B4C] hover:bg-amber-100 active:scale-95 active:translate-y-0.5 transition-all text-xs font-black cursor-pointer shadow-sm"
          title={t.rotate3d || 'Rotate 3D Board (90°)'}
          aria-label="Rotate 3D Board by 90 degrees"
        >
          <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#118AB2] transition-transform duration-300" />
          <span className="hidden xs:inline">{t.rotate3dShort || 'Rotate 90°'}</span>
          <span className="px-1.5 py-0.2 rounded-md bg-white border border-[#073B4C]/30 text-[10px] sm:text-[11px] font-mono text-[#073B4C]">
            {currentAngleNormalized}°
          </span>
        </button>

        {/* Large Board Zoom Controls */}
        {isLargeBoard && (
          <div className="flex items-center gap-1 border-l border-[#073B4C]/20 pl-1.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.5, +(z - 0.15).toFixed(2)))}
              className="p-1 rounded-lg text-[#073B4C] hover:bg-amber-100 transition-colors"
              title={t.zoomOut || 'Zoom Out'}
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <span className="text-[11px] sm:text-xs font-black text-[#073B4C] min-w-7 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, +(z + 0.15).toFixed(2)))}
              className="p-1 rounded-lg text-[#073B4C] hover:bg-amber-100 transition-colors"
              title={t.zoomIn || 'Zoom In'}
              aria-label="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        )}

        {/* Reset Perspective & View Button (when rotated or zoomed) */}
        {(rotationAngle !== 0 || zoomLevel !== 1) && (
          <button
            onClick={handleResetPerspective}
            className="p-1 rounded-xl text-[#073B4C] hover:bg-amber-100 transition-colors border-l border-[#073B4C]/20 pl-1.5"
            title={t.resetView || 'Reset View'}
            aria-label="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#EF476F]" />
          </button>
        )}
      </div>

      {/* 3D Board Stage with safe scroll handling */}
      <div
        className={`board-3d-stage w-full max-w-full ${
          isLargeBoard ? 'overflow-auto custom-board-scroll max-h-[62vh]' : 'overflow-visible'
        } p-2 sm:p-4 flex items-center justify-center`}
        style={{ touchAction: isLargeBoard ? 'pan-x pan-y' : 'manipulation' }}
      >
        <div
          ref={boardRef}
          style={{
            transform: `rotateX(${tiltEnabled ? 12 : 0}deg) rotateZ(${rotationAngle}deg) scale(${zoomLevel})`,
            transformOrigin: 'center center'
          }}
          className={`board-3d-surface bg-[#FFFDF9] p-2 sm:p-4 rounded-2xl sm:rounded-[28px] border-3 sm:border-4 border-[#073B4C] shadow-[5px_5px_0px_0px_#073B4C] sm:shadow-[8px_8px_0px_0px_#073B4C]`}
        >
          <div
            className="grid gap-1.5 sm:gap-2.5"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
            }}
          >
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isWinning = isWinningCell(r, c);
                const isLast = lastMove?.row === r && lastMove?.col === c;
                const isWinningMove = isWinning && effectiveWinningMove?.row === r && effectiveWinningMove?.col === c;
                const isShaking = shakingCell?.row === r && shakingCell?.col === c;

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
                    disabled={disabled}
                    onPointerDown={handlePointerDown}
                    onPointerUp={(e) => handlePointerUp(r, c, e)}
                    onClick={() => triggerMove(r, c)}
                    style={{ touchAction: 'manipulation' }}
                    className={`
                      ${getCellSizeClass()}
                      group relative flex items-center justify-center rounded-xl sm:rounded-2xl border-2 sm:border-3 p-0.5 sm:p-1 select-none transition-all
                      ${
                        cell === null
                          ? 'bg-[#FFF9F0] border-[#073B4C] active:scale-95 active:bg-amber-100 shadow-[1.5px_1.5px_0px_0px_#073B4C] sm:shadow-[2px_2px_0px_0px_#073B4C] cursor-pointer'
                          : 'bg-white border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] sm:shadow-[3px_3px_0px_0px_#073B4C] cursor-default'
                      }
                      ${isShaking ? 'cell-shake-invalid !border-[#EF476F] ring-2 ring-[#EF476F]' : ''}
                      ${isWinning ? 'cell-winning-glow !border-[#06D6A0] !bg-emerald-50 scale-105 z-10' : ''}
                      ${isWinningMove ? 'ring-4 ring-[#FFD166] shadow-[0_0_24px_rgba(255,209,102,0.9)] z-20 ' + (isReplayingWinningMove ? 'winning-move-replaying' : '') : ''}
                      ${isLast && !isWinning ? 'ring-2 sm:ring-3 ring-[#FFD166]' : ''}
                    `}
                    aria-label={
                      cellOwner
                        ? `Cell row ${r + 1}, column ${c + 1} marked by ${cellOwner.name}`
                        : `Empty cell row ${r + 1}, column ${c + 1}`
                    }
                  >
                    {/* Render Player Photo OR Name as the Game Piece with counter-rotation for upright visibility */}
                    {cell && cellOwner && ownerTheme && (
                      <div
                        className={`board-cell-content token-3d-drop w-full h-full rounded-lg sm:rounded-xl overflow-hidden flex flex-col items-center justify-center p-0.5 sm:p-1 border border-[#073B4C] sm:border-2 shadow-[1px_1px_0px_0px_#073B4C] sm:shadow-[2px_2px_0px_0px_#073B4C] pointer-events-none ${textColorClass}`}
                        style={{
                          backgroundColor: ownerTheme.primary,
                          transform: `rotateZ(${-rotationAngle}deg)`,
                          transformOrigin: 'center center'
                        }}
                      >
                        {cellOwner.photoUrl ? (
                          <div className="w-full h-full rounded-[6px] sm:rounded-lg overflow-hidden relative flex items-center justify-center bg-white border border-[#073B4C] pointer-events-none">
                            <img
                              src={cellOwner.photoUrl}
                              alt={cellOwner.name}
                              className="w-full h-full object-cover select-none pointer-events-none"
                              referrerPolicy="no-referrer"
                            />
                            {/* Theme border accent inside */}
                            <div
                              className="absolute inset-0 ring-1 sm:ring-2 pointer-events-none rounded-[6px] sm:rounded-lg opacity-80"
                              style={{ borderColor: ownerTheme.primary }}
                            />
                          </div>
                        ) : (
                          <span
                            className={`truncate max-w-full text-center select-none pointer-events-none ${nameStyleClass}`}
                            title={cellOwner.name}
                          >
                            {cellDisplayName}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Winning Move Trophy / Sparkle Badge */}
                    {isWinningMove && (
                      <div
                        className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#FFD166] border-2 border-[#073B4C] shadow-[1px_1px_0px_0px_#073B4C] flex items-center justify-center text-[#073B4C] z-30 animate-bounce"
                        title={language === 'bn' ? 'বিজয়ী চাল' : 'Winning Move'}
                      >
                        <span className="text-[10px] sm:text-xs">👑</span>
                      </div>
                    )}

                    {/* Ghost Hover Token Preview (Only on devices that support actual cursor hover) */}
                    {cell === null && !disabled && (
                      <div
                        className="board-cell-content hidden sm:[@media(hover:hover)]:flex opacity-0 group-hover:opacity-40 w-full h-full rounded-lg sm:rounded-xl overflow-hidden items-center justify-center p-0.5 sm:p-1 border border-dashed border-[#073B4C] pointer-events-none transition-opacity duration-75"
                        style={{
                          backgroundColor: currentTheme.primary,
                          transform: `rotateZ(${-rotationAngle}deg)`,
                          transformOrigin: 'center center'
                        }}
                      >
                        {currentPlayer.photoUrl ? (
                          <div className="w-full h-full rounded-[6px] sm:rounded-lg overflow-hidden flex items-center justify-center bg-white pointer-events-none">
                            <img
                              src={currentPlayer.photoUrl}
                              alt="Preview"
                              className="w-full h-full object-cover pointer-events-none"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <span
                            className={`truncate max-w-full text-center text-[#073B4C] select-none pointer-events-none ${getPlayerNameStyles(
                              formatCellName(currentPlayer.name, rows),
                              rows
                            )}`}
                          >
                            {formatCellName(currentPlayer.name, rows)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Last Move Accent Dot */}
                    {isLast && !isWinning && (
                      <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-[#FFD166] border border-[#073B4C] pointer-events-none z-10" />
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
