/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AIDifficulty, BoardState, CellCoord } from '../types';
import { checkWin, cloneBoard, getAvailableMoves, isBoardFull } from './gameEngine';

interface ScoredMove {
  row: number;
  col: number;
  score: number;
}

/**
 * Filter candidate moves to cells within distance of existing pieces.
 * This drastically optimizes performance on large boards (e.g. 10x10, 15x15).
 */
const getCandidateMoves = (board: BoardState, maxDistance: number = 2): CellCoord[] => {
  const rows = board.length;
  const cols = board[0].length;
  const allMoves = getAvailableMoves(board);

  // If board is empty, pick center or near center
  if (allMoves.length === rows * cols) {
    return [{ row: Math.floor(rows / 2), col: Math.floor(cols / 2) }];
  }

  const candidateSet = new Set<string>();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] !== null) {
        // Expand neighborhood around this mark
        for (let dr = -maxDistance; dr <= maxDistance; dr++) {
          for (let dc = -maxDistance; dc <= maxDistance; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc] === null) {
              candidateSet.add(`${nr},${nc}`);
            }
          }
        }
      }
    }
  }

  if (candidateSet.size === 0) {
    return allMoves;
  }

  const result: CellCoord[] = [];
  candidateSet.forEach((key) => {
    const [r, c] = key.split(',').map(Number);
    result.push({ row: r, col: c });
  });

  return result;
};

/**
 * Heuristic line evaluation for Gomoku / Connect-4 style boards
 */
const evaluateLineWindow = (
  window: (string | null)[],
  aiId: string,
  humanId: string,
  winLength: number
): number => {
  let aiCount = 0;
  let humanCount = 0;
  let emptyCount = 0;

  for (const cell of window) {
    if (cell === aiId) aiCount++;
    else if (cell === humanId) humanCount++;
    else emptyCount++;
  }

  // If both players are in this window, neither can complete a line here
  if (aiCount > 0 && humanCount > 0) return 0;

  if (aiCount === winLength) return 1000000;
  if (humanCount === winLength) return -1000000;

  if (aiCount === winLength - 1 && emptyCount === 1) return 50000;
  if (humanCount === winLength - 1 && emptyCount === 1) return -70000; // prioritize blocking opponent immediate win

  if (aiCount === winLength - 2 && emptyCount === 2) return 1200;
  if (humanCount === winLength - 2 && emptyCount === 2) return -1800;

  if (aiCount === 1 && emptyCount === winLength - 1) return 50;
  if (humanCount === 1 && emptyCount === winLength - 1) return -60;

  return 0;
};

/**
 * Static board heuristic evaluator
 */
const evaluateBoard = (
  board: BoardState,
  aiId: string,
  humanId: string,
  winLength: number
): number => {
  const rows = board.length;
  const cols = board[0].length;
  let totalScore = 0;

  // Center proximity bonus
  const midR = (rows - 1) / 2;
  const midC = (cols - 1) / 2;

  // Horizontal windows
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c <= cols - winLength; c++) {
      const window: (string | null)[] = [];
      for (let k = 0; k < winLength; k++) {
        window.push(board[r][c + k]);
      }
      totalScore += evaluateLineWindow(window, aiId, humanId, winLength);
    }
  }

  // Vertical windows
  for (let r = 0; r <= rows - winLength; r++) {
    for (let c = 0; c < cols; c++) {
      const window: (string | null)[] = [];
      for (let k = 0; k < winLength; k++) {
        window.push(board[r + k][c]);
      }
      totalScore += evaluateLineWindow(window, aiId, humanId, winLength);
    }
  }

  // Diagonal Down-Right windows
  for (let r = 0; r <= rows - winLength; r++) {
    for (let c = 0; c <= cols - winLength; c++) {
      const window: (string | null)[] = [];
      for (let k = 0; k < winLength; k++) {
        window.push(board[r + k][c + k]);
      }
      totalScore += evaluateLineWindow(window, aiId, humanId, winLength);
    }
  }

  // Diagonal Up-Right windows
  for (let r = winLength - 1; r < rows; r++) {
    for (let c = 0; c <= cols - winLength; c++) {
      const window: (string | null)[] = [];
      for (let k = 0; k < winLength; k++) {
        window.push(board[r - k][c + k]);
      }
      totalScore += evaluateLineWindow(window, aiId, humanId, winLength);
    }
  }

  // Slight bonus for controlling center
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] === aiId) {
        const dist = Math.abs(r - midR) + Math.abs(c - midC);
        totalScore += (10 - dist);
      } else if (board[r][c] === humanId) {
        const dist = Math.abs(r - midR) + Math.abs(c - midC);
        totalScore -= (10 - dist);
      }
    }
  }

  return totalScore;
};

/**
 * 3x3 Classic Minimax with Alpha-Beta
 */
const minimax3x3 = (
  board: BoardState,
  depth: number,
  isMaximizing: boolean,
  aiId: string,
  humanId: string,
  alpha: number,
  beta: number
): number => {
  const availableMoves = getAvailableMoves(board);

  // Check terminal state
  if (isBoardFull(board) || availableMoves.length === 0) {
    return 0;
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of availableMoves) {
      board[move.row][move.col] = aiId;
      const win = checkWin(board, move.row, move.col, 3);
      let score: number;
      if (win.isWin) {
        score = 100 - depth;
      } else {
        score = minimax3x3(board, depth + 1, false, aiId, humanId, alpha, beta);
      }
      board[move.row][move.col] = null;

      maxEval = Math.max(maxEval, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of availableMoves) {
      board[move.row][move.col] = humanId;
      const win = checkWin(board, move.row, move.col, 3);
      let score: number;
      if (win.isWin) {
        score = -100 + depth;
      } else {
        score = minimax3x3(board, depth + 1, true, aiId, humanId, alpha, beta);
      }
      board[move.row][move.col] = null;

      minEval = Math.min(minEval, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

/**
 * Alpha-Beta search for larger boards with depth limit and time safety
 */
const alphaBetaSearch = (
  board: BoardState,
  depth: number,
  isMaximizing: boolean,
  aiId: string,
  humanId: string,
  winLength: number,
  alpha: number,
  beta: number,
  startTime: number,
  timeLimitMs: number
): number => {
  if (Date.now() - startTime > timeLimitMs) {
    return evaluateBoard(board, aiId, humanId, winLength);
  }

  if (depth === 0 || isBoardFull(board)) {
    return evaluateBoard(board, aiId, humanId, winLength);
  }

  const candidates = getCandidateMoves(board, 1);
  if (candidates.length === 0) {
    return evaluateBoard(board, aiId, humanId, winLength);
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of candidates) {
      board[move.row][move.col] = aiId;
      const win = checkWin(board, move.row, move.col, winLength);
      let evalScore: number;
      if (win.isWin) {
        evalScore = 500000 + depth * 1000;
      } else {
        evalScore = alphaBetaSearch(
          board,
          depth - 1,
          false,
          aiId,
          humanId,
          winLength,
          alpha,
          beta,
          startTime,
          timeLimitMs
        );
      }
      board[move.row][move.col] = null;

      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of candidates) {
      board[move.row][move.col] = humanId;
      const win = checkWin(board, move.row, move.col, winLength);
      let evalScore: number;
      if (win.isWin) {
        evalScore = -500000 - depth * 1000;
      } else {
        evalScore = alphaBetaSearch(
          board,
          depth - 1,
          true,
          aiId,
          humanId,
          winLength,
          alpha,
          beta,
          startTime,
          timeLimitMs
        );
      }
      board[move.row][move.col] = null;

      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

/**
 * Main AI move calculator
 */
export const calculateAIMove = async (
  board: BoardState,
  aiId: string,
  humanId: string,
  difficulty: AIDifficulty,
  winLength: number
): Promise<CellCoord | null> => {
  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) return null;

  const rows = board.length;
  const cols = board[0].length;
  const isSmallBoard = rows === 3 && cols === 3;

  // 1. EASY DIFFICULTY: 70% random, 30% tactical
  if (difficulty === 'easy') {
    if (Math.random() < 0.65) {
      const randIdx = Math.floor(Math.random() * availableMoves.length);
      return availableMoves[randIdx];
    }
    // Check if immediate win is available
    for (const move of availableMoves) {
      const testBoard = cloneBoard(board);
      testBoard[move.row][move.col] = aiId;
      if (checkWin(testBoard, move.row, move.col, winLength).isWin) {
        return move;
      }
    }
    const randIdx = Math.floor(Math.random() * availableMoves.length);
    return availableMoves[randIdx];
  }

  // 2. MEDIUM DIFFICULTY: Always grab immediate win; always block immediate threat; then score
  // Check immediate AI win
  for (const move of availableMoves) {
    const testBoard = cloneBoard(board);
    testBoard[move.row][move.col] = aiId;
    if (checkWin(testBoard, move.row, move.col, winLength).isWin) {
      return move;
    }
  }

  // Check immediate opponent win to block
  for (const move of availableMoves) {
    const testBoard = cloneBoard(board);
    testBoard[move.row][move.col] = humanId;
    if (checkWin(testBoard, move.row, move.col, winLength).isWin) {
      return move;
    }
  }

  if (difficulty === 'medium') {
    const candidates = getCandidateMoves(board, 2);
    const scoredCandidates: ScoredMove[] = [];

    for (const move of candidates) {
      const testBoard = cloneBoard(board);
      testBoard[move.row][move.col] = aiId;
      const score = evaluateBoard(testBoard, aiId, humanId, winLength);
      // add slight randomness
      scoredCandidates.push({
        row: move.row,
        col: move.col,
        score: score + (Math.random() * 80 - 40)
      });
    }

    scoredCandidates.sort((a, b) => b.score - a.score);
    return scoredCandidates[0] || availableMoves[0];
  }

  // 3. HARD DIFFICULTY:
  // For 3x3: Exact Minimax
  if (isSmallBoard) {
    let bestScore = -Infinity;
    let bestMove: CellCoord = availableMoves[0];

    for (const move of availableMoves) {
      const testBoard = cloneBoard(board);
      testBoard[move.row][move.col] = aiId;

      const win = checkWin(testBoard, move.row, move.col, 3);
      let score: number;
      if (win.isWin) {
        score = 100;
      } else {
        score = minimax3x3(testBoard, 0, false, aiId, humanId, -Infinity, Infinity);
      }

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove;
  }

  // For >= 4x4 boards on HARD:
  const candidates = getCandidateMoves(board, 1);
  const searchDepth = candidates.length > 30 ? 2 : (candidates.length > 15 ? 3 : 4);
  const startTime = Date.now();
  const timeLimitMs = 120; // safe 120ms compute window

  let bestScore = -Infinity;
  let bestMove: CellCoord = candidates[0] || availableMoves[0];

  for (const move of candidates) {
    const testBoard = cloneBoard(board);
    testBoard[move.row][move.col] = aiId;

    const win = checkWin(testBoard, move.row, move.col, winLength);
    let evalScore: number;

    if (win.isWin) {
      return move; // Instant game winning move
    } else {
      evalScore = alphaBetaSearch(
        testBoard,
        searchDepth - 1,
        false,
        aiId,
        humanId,
        winLength,
        -Infinity,
        Infinity,
        startTime,
        timeLimitMs
      );
    }

    if (evalScore > bestScore) {
      bestScore = evalScore;
      bestMove = move;
    }
  }

  return bestMove;
};
