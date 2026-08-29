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

  // Easy mode: 40% chance of making a random move even if a box is open
  if (difficulty === 'easy') {
    if (capturingMoves.length > 0 && Math.random() < 0.6) {
      // Pick best capturing move
      capturingMoves.sort((a, b) => b.count - a.count);
      return capturingMoves[0].line;
    }
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
  }

  // Medium and Hard: ALWAYS take free box completions!
  if (capturingMoves.length > 0) {
    // Prefer double captures (+2 boxes) over single
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

  if (safeMoves.length > 0) {
    if (difficulty === 'medium') {
      const randomIndex = Math.floor(Math.random() * safeMoves.length);
      return safeMoves[randomIndex];
    }

    // Hard: Pick strategically among safe moves
    // Prefer moves that build on 0-sided boxes rather than 1-sided boxes
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

  // 3. When NO safe moves exist: sacrifice the minimum number of boxes
  // Hard mode: evaluate which sacrifice gives away the smallest chain
  if (difficulty === 'hard') {
    // Pick the line that creates the fewest 3-sided boxes
    const sacrifices = available.map((line) => {
      let count = 0;
      const { orientation, row, col } = line;
      const boxRows = state.config.dotRows - 1;
      const boxCols = state.config.dotCols - 1;

      if (orientation === 'horizontal') {
        if (row > 0 && countBoxSides(row - 1, col, state.horizontalLines, state.verticalLines) === 2) count++;
        if (row < boxRows && countBoxSides(row, col, state.horizontalLines, state.verticalLines) === 2) count++;
      } else {
        if (col > 0 && countBoxSides(row, col - 1, state.horizontalLines, state.verticalLines) === 2) count++;
        if (col < boxCols && countBoxSides(row, col, state.horizontalLines, state.verticalLines) === 2) count++;
      }
      return { line, count };
    });

    sacrifices.sort((a, b) => a.count - b.count);
    return sacrifices[0].line;
  }

  // Default fallback
  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex];
};
