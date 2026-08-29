/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AIDifficulty, DotsGameState, DotsLine } from '../types';
import { getAllAvailableLines, countBoxSides } from './dotsEngine';

/**
 * Evaluates how many boxes this line would complete (0, 1, or 2)
 */
const getBoxesCompletedByLine = (
  line: DotsLine,
  hLines: (string | null)[][],
  vLines: (string | null)[][]
): number => {
  const { orientation, row, col } = line;
  let count = 0;
  const boxRows = hLines.length - 1;
  const boxCols = vLines[0].length - 1;

  if (orientation === 'horizontal') {
    // Box above (row - 1, col)
    if (row > 0) {
      if (countBoxSides(row - 1, col, hLines, vLines) === 3) count++;
    }
    // Box below (row, col)
    if (row < boxRows) {
      if (countBoxSides(row, col, hLines, vLines) === 3) count++;
    }
  } else {
    // Vertical line
    // Box to the left (row, col - 1)
    if (col > 0) {
      if (countBoxSides(row, col - 1, hLines, vLines) === 3) count++;
    }
    // Box to the right (row, col)
    if (col < boxCols) {
      if (countBoxSides(row, col, hLines, vLines) === 3) count++;
    }
  }

  return count;
};

/**
 * Checks if placing this line would create a 3-sided box (which the opponent can immediately take)
 */
const createsThreeSidedBox = (
  line: DotsLine,
  hLines: (string | null)[][],
  vLines: (string | null)[][]
): boolean => {
  const { orientation, row, col } = line;
  const boxRows = hLines.length - 1;
  const boxCols = vLines[0].length - 1;

  if (orientation === 'horizontal') {
    if (row > 0 && countBoxSides(row - 1, col, hLines, vLines) === 2) return true;
    if (row < boxRows && countBoxSides(row, col, hLines, vLines) === 2) return true;
  } else {
    if (col > 0 && countBoxSides(row, col - 1, hLines, vLines) === 2) return true;
    if (col < boxCols && countBoxSides(row, col, hLines, vLines) === 2) return true;
  }

  return false;
};

/**
 * Clones the 2D line grids for simulation
 */
const cloneLineGrids = (
  hLines: (string | null)[][],
  vLines: (string | null)[][]
): { h: (string | null)[][]; v: (string | null)[][] } => {
  return {
    h: hLines.map((row) => [...row]),
    v: vLines.map((row) => [...row])
  };
};

/**
 * Simulates greedy capture chain length conceded to opponent if a sacrifice move is played
 */
const simulateSacrificeChain = (
  line: DotsLine,
  originalHLines: (string | null)[][],
  originalVLines: (string | null)[][]
): number => {
  const { h, v } = cloneLineGrids(originalHLines, originalVLines);
  const boxRows = h.length - 1;
  const boxCols = v[0].length - 1;

  // Apply the sacrifice move
  if (line.orientation === 'horizontal') {
    h[line.row][line.col] = 'ai';
  } else {
    v[line.row][line.col] = 'ai';
  }

  // Count how many boxes the opponent can recursively take in chain
  let totalCaptured = 0;
  let changed = true;

  while (changed) {
    changed = false;
    // Find any box with 3 sides completed
    for (let r = 0; r < boxRows; r++) {
      for (let c = 0; c < boxCols; c++) {
        if (countBoxSides(r, c, h, v) === 3) {
          totalCaptured++;
          changed = true;
          // Fill the missing 4th side in simulation
          if (h[r][c] === null) h[r][c] = 'opp';
          else if (h[r + 1][c] === null) h[r + 1][c] = 'opp';
          else if (v[r][c] === null) v[r][c] = 'opp';
          else if (v[r][c + 1] === null) v[r][c + 1] = 'opp';
        }
      }
    }
  }

  return totalCaptured;
};

/**
 * Calculates optimal AI move for Dots and Boxes
 */
export const calculateDotsAIMove = (
  state: DotsGameState,
  difficulty: AIDifficulty = 'medium'
): DotsLine | null => {
  const available = getAllAvailableLines(state.horizontalLines, state.verticalLines);
  if (available.length === 0) return null;

  // 1. Check for immediate box captures (moves that complete 1 or 2 boxes)
  const capturingMoves: { line: DotsLine; count: number }[] = [];
  for (const line of available) {
    const completed = getBoxesCompletedByLine(line, state.horizontalLines, state.verticalLines);
    if (completed > 0) {
      capturingMoves.push({ line, count: completed });
    }
  }

  // ----------------------------------------------------
  // EASY DIFFICULTY: 45% casual / random moves, 55% captures
  // ----------------------------------------------------
  if (difficulty === 'easy') {
    if (capturingMoves.length > 0 && Math.random() < 0.55) {
      capturingMoves.sort((a, b) => b.count - a.count);
      return capturingMoves[0].line;
    }
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
  }

  // ----------------------------------------------------
  // MEDIUM & HARD: Always take all free box completions (+2 prioritized over +1)
  // ----------------------------------------------------
  if (capturingMoves.length > 0) {
    capturingMoves.sort((a, b) => b.count - a.count);
    return capturingMoves[0].line;
  }

  // 2. Find safe moves (moves that do NOT create a 3rd side on any box)
  const safeMoves: DotsLine[] = [];
  for (const line of available) {
    if (!createsThreeSidedBox(line, state.horizontalLines, state.verticalLines)) {
      safeMoves.push(line);
    }
  }

  // ----------------------------------------------------
  // MEDIUM DIFFICULTY: Safe move selection or random fallback
  // ----------------------------------------------------
  if (difficulty === 'medium') {
    if (safeMoves.length > 0) {
      const randomIndex = Math.floor(Math.random() * safeMoves.length);
      return safeMoves[randomIndex];
    }
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
  }

  // ----------------------------------------------------
  // HARD DIFFICULTY:
  // ----------------------------------------------------
  if (safeMoves.length > 0) {
    // Rate safe moves: prefer moves that open 0-sided boxes rather than creating 2-sided boxes
    const ratedMoves = safeMoves.map((line) => {
      let score = 0;
      const { orientation, row, col } = line;
      const boxRows = state.config.dotRows - 1;
      const boxCols = state.config.dotCols - 1;

      if (orientation === 'horizontal') {
        if (row > 0) score += (2 - countBoxSides(row - 1, col, state.horizontalLines, state.verticalLines));
        if (row < boxRows) score += (2 - countBoxSides(row, col, state.horizontalLines, state.verticalLines));
      } else {
        if (col > 0) score += (2 - countBoxSides(row, col - 1, state.horizontalLines, state.verticalLines));
        if (col < boxCols) score += (2 - countBoxSides(row, col, state.horizontalLines, state.verticalLines));
      }
      return { line, score };
    });

    ratedMoves.sort((a, b) => b.score - a.score);
    return ratedMoves[0].line;
  }

  // 3. Forced sacrifice phase: simulate chain reaction to give away minimum boxes
  const sacrifices = available.map((line) => {
    const chainConceded = simulateSacrificeChain(line, state.horizontalLines, state.verticalLines);
    return { line, chainConceded };
  });

  sacrifices.sort((a, b) => a.chainConceded - b.chainConceded);
  return sacrifices[0].line;
};

