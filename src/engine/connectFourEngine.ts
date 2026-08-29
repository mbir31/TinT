/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ConnectFourConfig,
  ConnectFourGameState,
  Player,
  GameMode,
  GameStatus,
  AIDifficulty,
  CellCoord
} from '../types';

export const DEFAULT_CONNECT_FOUR_CONFIG: ConnectFourConfig = {
  rows: 6,
  cols: 7,
  winLength: 4,
  presetKey: '7x6'
};

export interface ConnectFourPreset {
  key: string;
  rows: number;
  cols: number;
  winLength: number;
  nameBn: string;
  nameEn: string;
  descBn: string;
  descEn: string;
  iconTag: string;
}

export const CONNECT_FOUR_PRESETS: ConnectFourPreset[] = [
  {
    key: '7x6',
    rows: 6,
    cols: 7,
    winLength: 4,
    nameBn: 'স্ট্যান্ডার্ড (৭×৬)',
    nameEn: 'Standard (7×6)',
    descBn: 'ক্লাসিক ৪-মিলান গ্রিড (৭ কলাম, ৬ সারি)',
    descEn: 'Classic Connect-4 tournament rack',
    iconTag: '🏆'
  },
  {
    key: '6x5',
    rows: 5,
    cols: 6,
    winLength: 4,
    nameBn: 'কমপ্যাক্ট (৬×৫)',
    nameEn: 'Compact (6×5)',
    descBn: 'দ্রুত এবং রোমাঞ্চকর ম্যাচ (৬ কলাম, ৫ সারি)',
    descEn: 'Fast-paced compact tactical board',
    iconTag: '⚡'
  },
  {
    key: '8x7',
    rows: 7,
    cols: 8,
    winLength: 4,
    nameBn: 'গ্র্যান্ড মাস্টার (৮×৭)',
    nameEn: 'Grand Master (8×7)',
    descBn: 'ব্যাপক পরিসর ও গভীর কৌশল (৮ কলাম, ৭ সারি)',
    descEn: 'Expansive grand board with multi-line strategies',
    iconTag: '👑'
  }
];

export const createEmptyConnectFourBoard = (rows: number, cols: number): (string | null)[][] => {
  return Array.from({ length: rows }, () => Array(cols).fill(null));
};

export const createInitialConnectFourState = (
  config: ConnectFourConfig = DEFAULT_CONNECT_FOUR_CONFIG,
  player1: Player,
  player2: Player,
  mode: GameMode = 'local',
  aiDifficulty: AIDifficulty = 'medium'
): ConnectFourGameState => {
  return {
    id: `c4-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    gameType: 'connectfour',
    mode,
    config,
    board: createEmptyConnectFourBoard(config.rows, config.cols),
    players: [player1, player2],
    currentPlayerIndex: 0,
    status: 'playing',
    winnerPlayerId: null,
    winningCells: [],
    lastDrop: null,
    moveCount: 0,
    aiDifficulty,
    createdAt: Date.now()
  };
};

/**
 * Finds the bottom-most available empty row in the given column
 */
export const getLowestAvailableRow = (
  board: (string | null)[][],
  col: number
): number => {
  const rows = board.length;
  if (col < 0 || col >= board[0].length) return -1;

  for (let r = rows - 1; r >= 0; r--) {
    if (board[r][col] === null) {
      return r;
    }
  }
  return -1; // Column is full
};

export const isValidColumnDrop = (
  board: (string | null)[][],
  col: number
): boolean => {
  if (col < 0 || col >= board[0].length) return false;
  return board[0][col] === null;
};

export const isConnectFourBoardFull = (board: (string | null)[][]): boolean => {
  const cols = board[0].length;
  for (let c = 0; c < cols; c++) {
    if (board[0][c] === null) {
      return false;
    }
  }
  return true;
};

export interface WinResult {
  winnerId: string;
  winningCells: CellCoord[];
}

/**
 * Check whether a player has achieved winLength consecutive marks in any direction
 */
export const checkConnectFourWin = (
  board: (string | null)[][],
  winLength: number = 4
): WinResult | null => {
  const rows = board.length;
  const cols = board[0].length;

  // 1. Horizontal Checks (→)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c <= cols - winLength; c++) {
      const first = board[r][c];
      if (!first) continue;

      let isMatch = true;
      const cells: CellCoord[] = [{ row: r, col: c }];

      for (let k = 1; k < winLength; k++) {
        if (board[r][c + k] !== first) {
          isMatch = false;
          break;
        }
        cells.push({ row: r, col: c + k });
      }

      if (isMatch) {
        return { winnerId: first, winningCells: cells };
      }
    }
  }

  // 2. Vertical Checks (↓)
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r <= rows - winLength; r++) {
      const first = board[r][c];
      if (!first) continue;

      let isMatch = true;
      const cells: CellCoord[] = [{ row: r, col: c }];

      for (let k = 1; k < winLength; k++) {
        if (board[r + k][c] !== first) {
          isMatch = false;
          break;
        }
        cells.push({ row: r + k, col: c });
      }

      if (isMatch) {
        return { winnerId: first, winningCells: cells };
      }
    }
  }

  // 3. Diagonal Down-Right (↘)
  for (let r = 0; r <= rows - winLength; r++) {
    for (let c = 0; c <= cols - winLength; c++) {
      const first = board[r][c];
      if (!first) continue;

      let isMatch = true;
      const cells: CellCoord[] = [{ row: r, col: c }];

      for (let k = 1; k < winLength; k++) {
        if (board[r + k][c + k] !== first) {
          isMatch = false;
          break;
        }
        cells.push({ row: r + k, col: c + k });
      }

      if (isMatch) {
        return { winnerId: first, winningCells: cells };
      }
    }
  }

  // 4. Diagonal Up-Right (↗)
  for (let r = winLength - 1; r < rows; r++) {
    for (let c = 0; c <= cols - winLength; c++) {
      const first = board[r][c];
      if (!first) continue;

      let isMatch = true;
      const cells: CellCoord[] = [{ row: r, col: c }];

      for (let k = 1; k < winLength; k++) {
        if (board[r - k][c + k] !== first) {
          isMatch = false;
          break;
        }
        cells.push({ row: r - k, col: c + k });
      }

      if (isMatch) {
        return { winnerId: first, winningCells: cells };
      }
    }
  }

  return null;
};

/**
 * Executes a column drop and returns the next game state
 */
export const makeConnectFourDrop = (
  state: ConnectFourGameState,
  col: number
): { nextState: ConnectFourGameState; droppedRow: number; isGameOver: boolean } | null => {
  if (state.status !== 'playing') return null;

  const targetRow = getLowestAvailableRow(state.board, col);
  if (targetRow === -1) return null;

  const currentPlayer = state.players[state.currentPlayerIndex];
  
  // Clone board
  const newBoard = state.board.map((r) => [...r]);
  newBoard[targetRow][col] = currentPlayer.id;

  const winResult = checkConnectFourWin(newBoard, state.config.winLength);
  const isFull = isConnectFourBoardFull(newBoard);

  let nextStatus: GameStatus = state.status;
  let winnerId: string | null = null;
  let winningCells: CellCoord[] = [];

  if (winResult) {
    nextStatus = 'won';
    winnerId = winResult.winnerId;
    winningCells = winResult.winningCells;
  } else if (isFull) {
    nextStatus = 'draw';
  }

  const nextPlayerIndex = nextStatus === 'playing'
    ? (state.currentPlayerIndex === 0 ? 1 : 0)
    : state.currentPlayerIndex;

  const nextState: ConnectFourGameState = {
    ...state,
    board: newBoard,
    currentPlayerIndex: nextPlayerIndex,
    status: nextStatus,
    winnerPlayerId: winnerId,
    winningCells,
    lastDrop: { row: targetRow, col },
    moveCount: state.moveCount + 1
  };

  return {
    nextState,
    droppedRow: targetRow,
    isGameOver: nextStatus === 'won' || nextStatus === 'draw'
  };
};

/**
 * Heuristic AI Engine for Connect Four (Easy, Medium, Hard with Minimax)
 */
export const getConnectFourAIMove = (
  board: (string | null)[][],
  config: ConnectFourConfig,
  difficulty: AIDifficulty,
  aiPlayerId: string,
  humanPlayerId: string
): number => {
  const cols = config.cols;
  const validCols: number[] = [];

  for (let c = 0; c < cols; c++) {
    if (isValidColumnDrop(board, c)) {
      validCols.push(c);
    }
  }

  if (validCols.length === 0) return 0;
  if (validCols.length === 1) return validCols[0];

  // Helper: column center bias order
  const centerCol = Math.floor(cols / 2);
  const sortedByCenter = [...validCols].sort(
    (a, b) => Math.abs(a - centerCol) - Math.abs(b - centerCol)
  );

  // 1. Check if AI can win immediately this turn
  for (const c of sortedByCenter) {
    const r = getLowestAvailableRow(board, c);
    if (r !== -1) {
      board[r][c] = aiPlayerId;
      const win = checkConnectFourWin(board, config.winLength);
      board[r][c] = null;
      if (win && win.winnerId === aiPlayerId) {
        return c;
      }
    }
  }

  // 2. Check if opponent can win on their next turn and block them immediately
  for (const c of sortedByCenter) {
    const r = getLowestAvailableRow(board, c);
    if (r !== -1) {
      board[r][c] = humanPlayerId;
      const win = checkConnectFourWin(board, config.winLength);
      board[r][c] = null;
      if (win && win.winnerId === humanPlayerId) {
        return c; // Must block!
      }
    }
  }

  // Easy Difficulty: occasional center bias or random exploration
  if (difficulty === 'easy') {
    if (Math.random() < 0.4) {
      return sortedByCenter[0];
    }
    return validCols[Math.floor(Math.random() * validCols.length)];
  }

  // Medium Difficulty: safe 2-step lookahead (avoid giving opponent winning setup)
  if (difficulty === 'medium') {
    const safeCols: number[] = [];

    for (const c of sortedByCenter) {
      const r = getLowestAvailableRow(board, c);
      if (r === -1) continue;

      // Simulate AI move
      board[r][c] = aiPlayerId;

      // Check if this move allows opponent to win directly above it
      let givesOpponentWin = false;
      const rowAbove = r - 1;
      if (rowAbove >= 0) {
        board[rowAbove][c] = humanPlayerId;
        const win = checkConnectFourWin(board, config.winLength);
        board[rowAbove][c] = null;
        if (win && win.winnerId === humanPlayerId) {
          givesOpponentWin = true;
        }
      }

      board[r][c] = null;

      if (!givesOpponentWin) {
        safeCols.push(c);
      }
    }

    if (safeCols.length > 0) {
      // Prioritize center column among safe moves
      return safeCols[0];
    }

    return sortedByCenter[0];
  }

  // Hard Difficulty: Minimax with Alpha-Beta Pruning (Depth 4)
  const evaluateWindow = (
    window: (string | null)[],
    aiId: string,
    oppId: string
  ): number => {
    let score = 0;
    let aiCount = 0;
    let oppCount = 0;
    let emptyCount = 0;

    for (const cell of window) {
      if (cell === aiId) aiCount++;
      else if (cell === oppId) oppCount++;
      else emptyCount++;
    }

    if (aiCount === 4) score += 10000;
    else if (aiCount === 3 && emptyCount === 1) score += 50;
    else if (aiCount === 2 && emptyCount === 2) score += 8;

    if (oppCount === 3 && emptyCount === 1) score -= 90;
    else if (oppCount === 2 && emptyCount === 2) score -= 12;

    return score;
  };

  const scorePosition = (
    currentBoard: (string | null)[][],
    aiId: string,
    oppId: string
  ): number => {
    let totalScore = 0;
    const rCount = currentBoard.length;
    const cCount = currentBoard[0].length;
    const cCenter = Math.floor(cCount / 2);

    // Center column preference
    let centerCount = 0;
    for (let r = 0; r < rCount; r++) {
      if (currentBoard[r][cCenter] === aiId) centerCount++;
    }
    totalScore += centerCount * 6;

    // Horizontal
    for (let r = 0; r < rCount; r++) {
      for (let c = 0; c <= cCount - 4; c++) {
        const window = [
          currentBoard[r][c],
          currentBoard[r][c + 1],
          currentBoard[r][c + 2],
          currentBoard[r][c + 3]
        ];
        totalScore += evaluateWindow(window, aiId, oppId);
      }
    }

    // Vertical
    for (let c = 0; c < cCount; c++) {
      for (let r = 0; r <= rCount - 4; r++) {
        const window = [
          currentBoard[r][c],
          currentBoard[r + 1][c],
          currentBoard[r + 2][c],
          currentBoard[r + 3][c]
        ];
        totalScore += evaluateWindow(window, aiId, oppId);
      }
    }

    // Diagonal Positive (↘)
    for (let r = 0; r <= rCount - 4; r++) {
      for (let c = 0; c <= cCount - 4; c++) {
        const window = [
          currentBoard[r][c],
          currentBoard[r + 1][c + 1],
          currentBoard[r + 2][c + 2],
          currentBoard[r + 3][c + 3]
        ];
        totalScore += evaluateWindow(window, aiId, oppId);
      }
    }

    // Diagonal Negative (↗)
    for (let r = 3; r < rCount; r++) {
      for (let c = 0; c <= cCount - 4; c++) {
        const window = [
          currentBoard[r][c],
          currentBoard[r - 1][c + 1],
          currentBoard[r - 2][c + 2],
          currentBoard[r - 3][c + 3]
        ];
        totalScore += evaluateWindow(window, aiId, oppId);
      }
    }

    return totalScore;
  };

  const minimax = (
    currBoard: (string | null)[][],
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean
  ): { score: number; bestCol: number } => {
    const win = checkConnectFourWin(currBoard, config.winLength);
    if (win) {
      if (win.winnerId === aiPlayerId) return { score: 100000 + depth, bestCol: -1 };
      if (win.winnerId === humanPlayerId) return { score: -100000 - depth, bestCol: -1 };
    }
    if (isConnectFourBoardFull(currBoard) || depth === 0) {
      return { score: scorePosition(currBoard, aiPlayerId, humanPlayerId), bestCol: -1 };
    }

    const available: number[] = [];
    for (let c = 0; c < config.cols; c++) {
      if (isValidColumnDrop(currBoard, c)) available.push(c);
    }
    const prioritized = [...available].sort(
      (a, b) => Math.abs(a - centerCol) - Math.abs(b - centerCol)
    );

    if (isMaximizing) {
      let maxEval = -Infinity;
      let chosenCol = prioritized[0];

      for (const col of prioritized) {
        const row = getLowestAvailableRow(currBoard, col);
        currBoard[row][col] = aiPlayerId;
        const evaluation = minimax(currBoard, depth - 1, alpha, beta, false).score;
        currBoard[row][col] = null;

        if (evaluation > maxEval) {
          maxEval = evaluation;
          chosenCol = col;
        }
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
      return { score: maxEval, bestCol: chosenCol };
    } else {
      let minEval = Infinity;
      let chosenCol = prioritized[0];

      for (const col of prioritized) {
        const row = getLowestAvailableRow(currBoard, col);
        currBoard[row][col] = humanPlayerId;
        const evaluation = minimax(currBoard, depth - 1, alpha, beta, true).score;
        currBoard[row][col] = null;

        if (evaluation < minEval) {
          minEval = evaluation;
          chosenCol = col;
        }
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
      return { score: minEval, bestCol: chosenCol };
    }
  };

  const searchDepth = config.cols <= 7 ? 4 : 3;
  const result = minimax(board, searchDepth, -Infinity, Infinity, true);
  return result.bestCol !== -1 && validCols.includes(result.bestCol)
    ? result.bestCol
    : sortedByCenter[0];
};
