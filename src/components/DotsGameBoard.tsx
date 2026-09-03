/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback, memo } from 'react';
import { DotsGameState, DotsLine, Player, Language } from '../types';
import { PLAYER_THEMES } from '../constants/themes';
import { TRANSLATIONS, formatNumberByLang } from '../i18n/translations';
import { soundEngine } from '../engine/soundEngine';
import { hapticsEngine } from '../engine/hapticsEngine';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface DotsGameBoardProps {
  gameState: DotsGameState;
  onLineClick: (line: DotsLine) => void;
  player1: Player;
  player2: Player;
  currentPlayer: Player;
  disabled?: boolean;
  language: Language;
  gridLineColor?: string;
  dotsPegColor?: string;
  isReplayingWinningMove?: boolean;
  winningLine?: DotsLine | null;
}

export const DotsGameBoard: React.FC<DotsGameBoardProps> = memo(({
  gameState,
  onLineClick,
  player1,
  player2,
  currentPlayer,
  disabled = false,
  language,
  gridLineColor = '#073B4C',
  dotsPegColor = '#073B4C',
  isReplayingWinningMove = false,
  winningLine
}) => {
  const t = TRANSLATIONS[language];
  const { dotRows, dotCols } = gameState.config;
  const boxRows = dotRows - 1;
  const boxCols = dotCols - 1;
  const totalBoxes = boxRows * boxCols;

  // Hover state for interactive preview on desktop
  const [hoveredLine, setHoveredLine] = useState<DotsLine | null>(null);

  // Single-tap responsive tracking
  const lastTriggerTimeRef = useRef<number>(0);
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const currentTheme = PLAYER_THEMES[currentPlayer.colorKey] || PLAYER_THEMES.blue;
  const p1Theme = PLAYER_THEMES[player1.colorKey] || PLAYER_THEMES.blue;
  const p2Theme = PLAYER_THEMES[player2.colorKey] || PLAYER_THEMES.coral;

  const p1Score = gameState.playerScores[player1.id] || 0;
  const p2Score = gameState.playerScores[player2.id] || 0;
  const claimedBoxes = p1Score + p2Score;
  const remainingBoxes = Math.max(0, totalBoxes - claimedBoxes);

  const triggerLine = useCallback((line: DotsLine) => {
    if (disabled) return;
    const now = Date.now();
    if (now - lastTriggerTimeRef.current < 160) return;
    lastTriggerTimeRef.current = now;
    onLineClick(line);
  }, [disabled, onLineClick]);

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    };
  };

  const handlePointerUp = (line: DotsLine, e: React.PointerEvent) => {
    if (!pointerStartRef.current) return;
    const dx = Math.abs(e.clientX - pointerStartRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartRef.current.y);
    const dt = Date.now() - pointerStartRef.current.time;
    pointerStartRef.current = null;

    if (dx < 16 && dy < 16 && dt < 600) {
      triggerLine(line);
    }
  };

  // Mathematical Coordinate System for SVG
  const CELL_SIZE = 92; // Internal grid unit
  const PADDING = 34; // Outer edge padding
  const DOT_RADIUS = 8.5; // Peg radius
  const LINE_WIDTH = 9; // Line thickness
  const HIT_TARGET_SIZE = 40; // Generous touch hit area thickness for mobile ease

  const svgWidth = (dotCols - 1) * CELL_SIZE + 2 * PADDING;
  const svgHeight = (dotRows - 1) * CELL_SIZE + 2 * PADDING;

  return (
    <div className="w-full max-w-lg landscape:max-w-md mx-auto flex flex-col items-center select-none px-2 sm:px-4 py-1">
      {/* Real-time Status & Scores HUD */}
      <div className="w-full flex items-center justify-between gap-2 mb-1.5 px-3 py-1.5 rounded-2xl bg-white border-2 sm:border-3 border-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C]">
        {/* Player 1 Score */}
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className="w-3.5 h-3.5 rounded-full border-2 border-[#073B4C] flex-shrink-0"
            style={{ backgroundColor: p1Theme.primary }}
          />
          <span className="text-xs font-black text-[#073B4C] truncate max-w-[90px] sm:max-w-[120px]">
            {player1.name}
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-[#073B4C]/10 text-xs sm:text-sm font-black text-[#073B4C] font-mono">
            {formatNumberByLang(p1Score, language)}
          </span>
        </div>

        {/* Remaining Boxes / Progress Pill */}
        <div className="flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-xl bg-[#FFF9F0] border border-[#073B4C]/30 text-[11px] font-bold text-[#4A4E69]">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#06D6A0]" />
          <span>
            {language === 'bn'
              ? `বাকি: ${formatNumberByLang(remainingBoxes, language)}`
              : `Left: ${remainingBoxes}`}
          </span>
        </div>

        {/* Player 2 Score */}
        <div className="flex items-center gap-1.5 min-w-0 justify-end">
          <span className="px-2 py-0.5 rounded-lg bg-[#073B4C]/10 text-xs sm:text-sm font-black text-[#073B4C] font-mono">
            {formatNumberByLang(p2Score, language)}
          </span>
          <span className="text-xs font-black text-[#073B4C] truncate max-w-[90px] sm:max-w-[120px]">
            {player2.name}
          </span>
          <div
            className="w-3.5 h-3.5 rounded-full border-2 border-[#073B4C] flex-shrink-0"
            style={{ backgroundColor: p2Theme.primary }}
          />
        </div>
      </div>

      {/* Bonus Turn Notification Banner */}
      {gameState.consecutiveTurn && (
        <div className="flex items-center gap-1.5 px-4 py-1 mb-1.5 rounded-full bg-[#FFD166] border-2 border-[#073B4C] text-[#073B4C] text-xs sm:text-sm font-black shadow-[2px_2px_0px_0px_#073B4C] animate-bounce">
          <Sparkles className="w-4 h-4 text-[#EF476F]" />
          <span>
            {language === 'bn'
              ? 'বক্স সম্পন্ন হয়েছে! আরেকটি ফ্রি চাল নিন!'
              : 'Box captured! Take another turn!'}
          </span>
        </div>
      )}

      {/* Modern 2D Flat Crisp Board Card */}
      <div className="w-full flex items-center justify-center p-2 sm:p-4 rounded-2xl sm:rounded-[28px] bg-[#FFFDF9] border-3 sm:border-4 border-[#073B4C] shadow-[6px_6px_0px_0px_#073B4C] sm:shadow-[8px_8px_0px_0px_#073B4C] relative overflow-hidden">
        {/* Crisp SVG Board */}
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-[440px] max-h-[58vh] h-auto select-none overflow-visible"
          style={{ touchAction: 'manipulation' }}
        >
          <defs>
            {/* Soft grid background filter/patterns if needed */}
            <filter id="boxShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="2" dy="2" stdDeviation="0" floodColor="#073B4C" floodOpacity="1" />
            </filter>
          </defs>

          {/* ---------------------------------------------------- */}
          {/* LAYER 1: Captured Box Rectangles                     */}
          {/* ---------------------------------------------------- */}
          {Array.from({ length: boxRows }).map((_, r) =>
            Array.from({ length: boxCols }).map((_, c) => {
              const boxOwnerId = gameState.boxes[r]?.[c];
              const boxOwner = boxOwnerId ? (boxOwnerId === player1.id ? player1 : player2) : null;
              const boxTheme = boxOwner ? PLAYER_THEMES[boxOwner.colorKey] : null;
              const isLastCompleted = gameState.lastCompletedBoxes.some(
                (cb) => cb.row === r && cb.col === c
              );

              const x = PADDING + c * CELL_SIZE;
              const y = PADDING + r * CELL_SIZE;
              const inset = LINE_WIDTH / 2 + 2;
              const boxW = CELL_SIZE - inset * 2;
              const boxH = CELL_SIZE - inset * 2;
              const centerX = x + CELL_SIZE / 2;
              const centerY = y + CELL_SIZE / 2;

              if (!boxOwner || !boxTheme) {
                // Empty subtle placeholder grid box
                return (
                  <rect
                    key={`empty-box-${r}-${c}`}
                    x={x + inset}
                    y={y + inset}
                    width={boxW}
                    height={boxH}
                    rx={8}
                    fill="#073B4C"
                    fillOpacity="0.02"
                  />
                );
              }

              return (
                <g key={`box-captured-${r}-${c}`}>
                  {/* Background Box */}
                  <rect
                    x={x + inset}
                    y={y + inset}
                    width={boxW}
                    height={boxH}
                    rx={12}
                    fill={boxTheme.primary}
                    stroke="#073B4C"
                    strokeWidth={2.5}
                    filter="url(#boxShadow)"
                    className={isLastCompleted ? 'animate-in zoom-in-75 duration-300' : ''}
                  />

                  {/* Inner Highlight Tint */}
                  <rect
                    x={x + inset + 2}
                    y={y + inset + 2}
                    width={boxW - 4}
                    height={boxH - 4}
                    rx={10}
                    fill="#FFFFFF"
                    fillOpacity={0.18}
                  />

                  {/* Owner Display (Photo or Name Initials) */}
                  {boxOwner.photoUrl ? (
                    <g>
                      <clipPath id={`clip-photo-${r}-${c}`}>
                        <circle cx={centerX} cy={centerY} r={Math.min(boxW, boxH) * 0.32} />
                      </clipPath>
                      <circle
                        cx={centerX}
                        cy={centerY}
                        r={Math.min(boxW, boxH) * 0.32 + 2}
                        fill="#FFFFFF"
                        stroke="#073B4C"
                        strokeWidth={2}
                      />
                      <image
                        href={boxOwner.photoUrl}
                        x={centerX - Math.min(boxW, boxH) * 0.32}
                        y={centerY - Math.min(boxW, boxH) * 0.32}
                        width={Math.min(boxW, boxH) * 0.64}
                        height={Math.min(boxW, boxH) * 0.64}
                        preserveAspectRatio="xMidYMid slice"
                        clipPath={`url(#clip-photo-${r}-${c})`}
                      />
                    </g>
                  ) : (
                    <g>
                      <circle
                        cx={centerX}
                        cy={centerY}
                        r={Math.min(boxW, boxH) * 0.28}
                        fill="#FFFFFF"
                        stroke="#073B4C"
                        strokeWidth={2}
                      />
                      <text
                        x={centerX}
                        y={centerY + 4}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#073B4C"
                        fontSize={Math.min(boxW, boxH) * 0.3}
                        fontWeight="900"
                        fontFamily="system-ui, sans-serif"
                      >
                        {boxOwner.avatar || boxOwner.name.charAt(0).toUpperCase()}
                      </text>
                    </g>
                  )}
                </g>
              );
            })
          )}

          {/* ---------------------------------------------------- */}
          {/* LAYER 2: Horizontal Lines                            */}
          {/* ---------------------------------------------------- */}
          {Array.from({ length: dotRows }).map((_, r) =>
            Array.from({ length: dotCols - 1 }).map((_, c) => {
              const ownerId = gameState.horizontalLines[r]?.[c];
              const isPlaced = ownerId !== null && ownerId !== undefined;
              const lineOwner = isPlaced ? (ownerId === player1.id ? player1 : player2) : null;
              const lineTheme = lineOwner ? PLAYER_THEMES[lineOwner.colorKey] : null;
              const isLast =
                gameState.lastLine?.orientation === 'horizontal' &&
                gameState.lastLine?.row === r &&
                gameState.lastLine?.col === c;

              const isWinning =
                (gameState.status !== 'playing' && isLast) ||
                (winningLine?.orientation === 'horizontal' &&
                  winningLine?.row === r &&
                  winningLine?.col === c);

              const isHovered =
                !isPlaced &&
                hoveredLine?.orientation === 'horizontal' &&
                hoveredLine?.row === r &&
                hoveredLine?.col === c;

              const x1 = PADDING + c * CELL_SIZE;
              const y1 = PADDING + r * CELL_SIZE;
              const x2 = PADDING + (c + 1) * CELL_SIZE;
              const y2 = y1;

              return (
                <g key={`h-group-${r}-${c}`}>
                  {/* Visible Line Rendering */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={
                      isWinning
                        ? '#FFD166'
                        : isPlaced && lineTheme
                        ? lineTheme.primary
                        : isHovered
                        ? currentTheme.primary
                        : gridLineColor
                    }
                    strokeOpacity={isPlaced || isWinning ? 1 : isHovered ? 0.75 : 0.22}
                    strokeWidth={isWinning ? LINE_WIDTH + 4 : isPlaced ? LINE_WIDTH : isHovered ? LINE_WIDTH - 1 : 5}
                    strokeLinecap="round"
                    strokeDasharray={!isPlaced && isHovered ? '6 4' : undefined}
                    className={`transition-all duration-150 ${isWinning && isReplayingWinningMove ? 'dots-winning-line-glow' : ''}`}
                  />

                  {/* Line border / accent when placed */}
                  {isPlaced && (
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isWinning ? '#EF476F' : '#073B4C'}
                      strokeWidth={LINE_WIDTH + 3}
                      strokeLinecap="round"
                      opacity={isWinning ? 0.6 : 0.3}
                      style={{ pointerEvents: 'none' }}
                    />
                  )}

                  {/* Highlight for the Last or Winning Placed Move */}
                  {isWinning ? (
                    <g>
                      <circle
                        cx={(x1 + x2) / 2}
                        cy={y1}
                        r={8}
                        fill="#FFD166"
                        stroke="#073B4C"
                        strokeWidth={2.5}
                        className={isReplayingWinningMove ? 'animate-bounce' : 'animate-pulse'}
                      />
                      <text
                        x={(x1 + x2) / 2}
                        y={y1 + 3}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={9}
                        fontWeight="900"
                        fill="#073B4C"
                      >
                        👑
                      </text>
                    </g>
                  ) : isLast ? (
                    <circle
                      cx={(x1 + x2) / 2}
                      cy={y1}
                      r={6}
                      fill="#FFD166"
                      stroke="#073B4C"
                      strokeWidth={2}
                      className="animate-pulse"
                    />
                  ) : null}

                  {/* Generous Touch / Click Hit Target */}
                  {!isPlaced && !disabled && (
                    <rect
                      id={`hline-${r}-${c}`}
                      x={x1}
                      y={y1 - HIT_TARGET_SIZE / 2}
                      width={CELL_SIZE}
                      height={HIT_TARGET_SIZE}
                      fill="transparent"
                      cursor="pointer"
                      onMouseEnter={() => setHoveredLine({ orientation: 'horizontal', row: r, col: c })}
                      onMouseLeave={() => setHoveredLine(null)}
                      onPointerDown={handlePointerDown}
                      onPointerUp={(e) =>
                        handlePointerUp({ orientation: 'horizontal', row: r, col: c }, e)
                      }
                      onClick={() => triggerLine({ orientation: 'horizontal', row: r, col: c })}
                    />
                  )}
                </g>
              );
            })
          )}

          {/* ---------------------------------------------------- */}
          {/* LAYER 3: Vertical Lines                              */}
          {/* ---------------------------------------------------- */}
          {Array.from({ length: dotRows - 1 }).map((_, r) =>
            Array.from({ length: dotCols }).map((_, c) => {
              const ownerId = gameState.verticalLines[r]?.[c];
              const isPlaced = ownerId !== null && ownerId !== undefined;
              const lineOwner = isPlaced ? (ownerId === player1.id ? player1 : player2) : null;
              const lineTheme = lineOwner ? PLAYER_THEMES[lineOwner.colorKey] : null;
              const isLast =
                gameState.lastLine?.orientation === 'vertical' &&
                gameState.lastLine?.row === r &&
                gameState.lastLine?.col === c;

              const isWinning =
                (gameState.status !== 'playing' && isLast) ||
                (winningLine?.orientation === 'vertical' &&
                  winningLine?.row === r &&
                  winningLine?.col === c);

              const isHovered =
                !isPlaced &&
                hoveredLine?.orientation === 'vertical' &&
                hoveredLine?.row === r &&
                hoveredLine?.col === c;

              const x1 = PADDING + c * CELL_SIZE;
              const y1 = PADDING + r * CELL_SIZE;
              const x2 = x1;
              const y2 = PADDING + (r + 1) * CELL_SIZE;

              return (
                <g key={`v-group-${r}-${c}`}>
                  {/* Visible Line Rendering */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={
                      isWinning
                        ? '#FFD166'
                        : isPlaced && lineTheme
                        ? lineTheme.primary
                        : isHovered
                        ? currentTheme.primary
                        : gridLineColor
                    }
                    strokeOpacity={isPlaced || isWinning ? 1 : isHovered ? 0.75 : 0.22}
                    strokeWidth={isWinning ? LINE_WIDTH + 4 : isPlaced ? LINE_WIDTH : isHovered ? LINE_WIDTH - 1 : 5}
                    strokeLinecap="round"
                    strokeDasharray={!isPlaced && isHovered ? '6 4' : undefined}
                    className={`transition-all duration-150 ${isWinning && isReplayingWinningMove ? 'dots-winning-line-glow' : ''}`}
                  />

                  {/* Line border / accent when placed */}
                  {isPlaced && (
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isWinning ? '#EF476F' : '#073B4C'}
                      strokeWidth={LINE_WIDTH + 3}
                      strokeLinecap="round"
                      opacity={isWinning ? 0.6 : 0.3}
                      style={{ pointerEvents: 'none' }}
                    />
                  )}

                  {/* Highlight for the Last or Winning Placed Move */}
                  {isWinning ? (
                    <g>
                      <circle
                        cx={x1}
                        cy={(y1 + y2) / 2}
                        r={8}
                        fill="#FFD166"
                        stroke="#073B4C"
                        strokeWidth={2.5}
                        className={isReplayingWinningMove ? 'animate-bounce' : 'animate-pulse'}
                      />
                      <text
                        x={x1}
                        y={(y1 + y2) / 2 + 3}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={9}
                        fontWeight="900"
                        fill="#073B4C"
                      >
                        👑
                      </text>
                    </g>
                  ) : isLast ? (
                    <circle
                      cx={x1}
                      cy={(y1 + y2) / 2}
                      r={6}
                      fill="#FFD166"
                      stroke="#073B4C"
                      strokeWidth={2}
                      className="animate-pulse"
                    />
                  ) : null}

                  {/* Generous Touch / Click Hit Target */}
                  {!isPlaced && !disabled && (
                    <rect
                      id={`vline-${r}-${c}`}
                      x={x1 - HIT_TARGET_SIZE / 2}
                      y={y1}
                      width={HIT_TARGET_SIZE}
                      height={CELL_SIZE}
                      fill="transparent"
                      cursor="pointer"
                      onMouseEnter={() => setHoveredLine({ orientation: 'vertical', row: r, col: c })}
                      onMouseLeave={() => setHoveredLine(null)}
                      onPointerDown={handlePointerDown}
                      onPointerUp={(e) =>
                        handlePointerUp({ orientation: 'vertical', row: r, col: c }, e)
                      }
                      onClick={() => triggerLine({ orientation: 'vertical', row: r, col: c })}
                    />
                  )}
                </g>
              );
            })
          )}

          {/* ---------------------------------------------------- */}
          {/* LAYER 4: Dots (Pegs) at all Intersections            */}
          {/* ---------------------------------------------------- */}
          {Array.from({ length: dotRows }).map((_, r) =>
            Array.from({ length: dotCols }).map((_, c) => {
              const cx = PADDING + c * CELL_SIZE;
              const cy = PADDING + r * CELL_SIZE;

              return (
                <g key={`dot-${r}-${c}`} style={{ pointerEvents: 'none' }}>
                  {/* Outer shadow ring */}
                  <circle
                    cx={cx}
                    cy={cy + 1}
                    r={DOT_RADIUS + 0.5}
                    fill={dotsPegColor}
                    opacity={0.4}
                  />
                  {/* Main solid peg */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={DOT_RADIUS}
                    fill={dotsPegColor}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                  {/* Inner golden/white jewel highlight */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={DOT_RADIUS * 0.38}
                    fill="#FFD166"
                  />
                </g>
              );
            })
          )}
        </svg>
      </div>

      {/* Helpful Hint on Gameplay */}
      <p className="text-[11px] sm:text-xs text-[#4A4E69] font-bold text-center mt-2 px-2">
        {language === 'bn'
          ? '💡 যেকোনো ধূসর লাইনে ট্যাপ করে লাইন টানুন। ৪টি বাহু পূর্ণ করলেই বক্স আপনার!'
          : '💡 Tap any line between dots. Enclose all 4 sides to capture the box!'}
      </p>
    </div>
  );
});

DotsGameBoard.displayName = 'DotsGameBoard';
