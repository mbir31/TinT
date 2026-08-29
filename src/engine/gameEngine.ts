/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BoardConfig, BoardState, CellCoord, GameState, Player } from '../types';

export const getWinLengthForBoard = (rows: number, cols: number): number => {
  if (rows <= 3 && cols <= 3) {
    return 3;
  }
  if (rows >= 8 || cols >= 8) {
    return 5;
  }
  return 4;
};

export const createInitialBoard = (rows: number, cols: number): BoardState => {
  const r = Math.max(3, Math.min(15, rows));
  const c = Math.max(3, Math.min(15, cols));
  const board: BoardState = [];
  for (let i = 0; i < r; i++) {
    const row: (string | null)[] = [];
    for (let j = 0; j < c; j++) {
      row.push(null);
    }
    board.push(row);
  }
  return board;
};

export const isValidMove = (board: BoardState, row: number, col: number): boolean => {
  if (!board || row < 0 || row >= board.length || col < 0 || !board[0] || col >= board[0].length) {
    return false;
  }
  return board[row][col] === null;
};

export const cloneBoard = (board: BoardState): BoardState => {
  return board.map((row) => [...row]);
};

export const makeMove = (board: BoardState, row: number, col: number, playerId: string): BoardState => {
  const newBoard = cloneBoard(board);
  newBoard[row][col] = playerId;
  return newBoard;
};

export const isBoardFull = (board: BoardState): boolean => {
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] === null) {
        return false;
      }
    }
  }
  return true;
};

export const getAvailableMoves = (board: BoardState): CellCoord[] => {
  const moves: CellCoord[] = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] === null) {
        moves.push({ row: r, col: c });
      }
    }
  }
  return moves;
};

export interface WinCheckResult {
  isWin: boolean;
  winningCells: CellCoord[];
}

export const checkWin = (
  board: BoardState,
  lastRow: number,
  lastCol: number,
  winLength: number
): WinCheckResult => {
  const rows = board.length;
  const cols = board[0].length;
  const targetPlayer = board[lastRow][lastCol];

  if (!targetPlayer) {
    return { isWin: false, winningCells: [] };
  }

  // Check 4 directions:
  // 1. Horizontal: [0, 1]
  // 2. Vertical: [1, 0]
  // 3. Diagonal Down-Right: [1, 1]
  // 4. Diagonal Up-Right: [-1, 1]
  const directions = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 1, dc: 1 },
    { dr: -1, dc: 1 }
  ];

  for (const { dr, dc } of directions) {
    const matchingCells: CellCoord[] = [{ row: lastRow, col: lastCol }];

    // Scan forward along direction
    let r = lastRow + dr;
    let c = lastCol + dc;
    while (r >= 0 && r < rows && c >= 0 && c < cols && board[r][c] === targetPlayer) {
      matchingCells.push({ row: r, col: c });
      r += dr;
      c += dc;
    }

    // Scan backward along opposite direction
    r = lastRow - dr;
    c = lastCol - dc;
    while (r >= 0 && r < rows && c >= 0 && c < cols && board[r][c] === targetPlayer) {
      matchingCells.unshift({ row: r, col: c });
      r -= dr;
      c -= dc;
    }

    if (matchingCells.length >= winLength) {
      // Find contiguous segment containing lastRow, lastCol
      const lastIndex = matchingCells.findIndex((cell) => cell.row === lastRow && cell.col === lastCol);
      const startIdx = lastIndex >= 0
        ? Math.max(0, Math.min(lastIndex - Math.floor(winLength / 2), matchingCells.length - winLength))
        : 0;
      return {
        isWin: true,
        winningCells: matchingCells.slice(startIdx, startIdx + winLength)
      };
    }
  }

  return { isWin: false, winningCells: [] };
};

/**
 * Scan whole board for existing win (useful when syncing or verifying state)
 */
export const evaluateFullBoardWin = (board: BoardState, winLength: number): WinCheckResult & { winnerId: string | null } => {
  const rows = board.length;
  const cols = board[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] !== null) {
        const result = checkWin(board, r, c, winLength);
        if (result.isWin) {
          return {
            isWin: true,
            winningCells: result.winningCells,
            winnerId: board[r][c]
          };
        }
      }
    }
  }

  return { isWin: false, winningCells: [], winnerId: null };
};

export const createInitialGameState = (
  players: [Player, Player],
  boardConfig: BoardConfig,
  mode: GameState['mode'],
  aiDifficulty?: GameState['aiDifficulty']
): GameState => {
  const rows = Math.max(3, Math.min(15, boardConfig.rows));
  const cols = Math.max(3, Math.min(15, boardConfig.cols));
  const maxPossible = Math.min(rows, cols);
  const defaultWin = getWinLengthForBoard(rows, cols);
  const winLength = Math.max(3, Math.min(maxPossible, boardConfig.winLength || defaultWin));

  return {
    id: `game_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    mode,
    boardConfig: {
      rows,
      cols,
      winLength,
      presetKey: boardConfig.presetKey
    },
    board: createInitialBoard(rows, cols),
    players,
    currentPlayerIndex: 0,
    status: 'idle',
    winnerPlayerId: null,
    winningCells: [],
    moveCount: 0,
    movesHistory: [],
    createdAt: Date.now(),
    aiDifficulty
  };
};
