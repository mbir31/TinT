/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DotsBoardConfig, DotsGameState, DotsLine, Player, GameMode, AIDifficulty, CellCoord } from '../types';

export const DOTS_PRESETS: { [key: string]: { dotRows: number; dotCols: number; labelBn: string; labelEn: string; descBn: string; descEn: string } } = {
  'quick-2x2': {
    dotRows: 3,
    dotCols: 3,
    labelBn: '২×২ বক্স (৩×৩ ডট)',
    labelEn: '2×2 Boxes (3×3 Dots)',
    descBn: 'দ্রুত ৪টি বক্সের রোমাঞ্চকর খেলা',
    descEn: 'Quick & fast 4-box battle'
  },
  'classic-3x3': {
    dotRows: 4,
    dotCols: 4,
    labelBn: '৩×৩ বক্স (৪×৪ ডট)',
    labelEn: '3×3 Boxes (4×4 Dots)',
    descBn: 'ক্লাসিক ৯টি বক্সের আদর্শ কৌশল',
    descEn: 'Classic 9-box standard battle'
  },
  'medium-4x4': {
    dotRows: 5,
    dotCols: 5,
    labelBn: '৪×৪ বক্স (৫×৫ ডট)',
    labelEn: '4×4 Boxes (5×5 Dots)',
    descBn: '১৬টি বক্সের গভীর চেইন কৌশল',
    descEn: 'Tactical 16-box chain challenge'
  },
  'large-5x5': {
    dotRows: 6,
    dotCols: 6,
    labelBn: '৫×৫ বক্স (৬×৬ ডট)',
    labelEn: '5×5 Boxes (6×6 Dots)',
    descBn: '২৫টি বক্সের মহাযুদ্ধ',
    descEn: 'Grand arena with 25 boxes'
  }
};

/**
 * Creates a fresh Dots and Boxes initial game state
 */
export const createInitialDotsState = (
  players: [Player, Player],
  config: DotsBoardConfig = { dotRows: 4, dotCols: 4, presetKey: 'classic-3x3' },
  mode: GameMode = 'local',
  aiDifficulty: AIDifficulty = 'medium'
): DotsGameState => {
  const { dotRows, dotCols } = config;
  const boxRows = dotRows - 1;
  const boxCols = dotCols - 1;

  // Horizontal lines: dotRows rows x (dotCols - 1) columns
  const horizontalLines: (string | null)[][] = Array.from({ length: dotRows }, () =>
    Array(dotCols - 1).fill(null)
  );

  // Vertical lines: (dotRows - 1) rows x dotCols columns
  const verticalLines: (string | null)[][] = Array.from({ length: boxRows }, () =>
    Array(dotCols).fill(null)
  );

  // Boxes: (dotRows - 1) x (dotCols - 1)
  const boxes: (string | null)[][] = Array.from({ length: boxRows }, () =>
    Array(boxCols).fill(null)
  );

  return {
    id: `dots_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    gameType: 'dotsboxes',
    mode,
    config,
    horizontalLines,
    verticalLines,
    boxes,
    players: [
      { ...players[0], score: 0 },
      { ...players[1], score: 0 }
    ],
    playerScores: {
      [players[0].id]: 0,
      [players[1].id]: 0
    },
    currentPlayerIndex: 0,
    status: 'playing',
    winnerPlayerId: null,
    lastLine: null,
    lastCompletedBoxes: [],
    consecutiveTurn: false,
    moveCount: 0,
    aiDifficulty,
    createdAt: Date.now()
  };
};

/**
 * Checks if a specific box at (r, c) is completed
 */
export const isBoxComplete = (
  r: number,
  c: number,
  hLines: (string | null)[][],
  vLines: (string | null)[][]
): boolean => {
  const top = hLines[r]?.[c] !== null && hLines[r]?.[c] !== undefined;
  const bottom = hLines[r + 1]?.[c] !== null && hLines[r + 1]?.[c] !== undefined;
  const left = vLines[r]?.[c] !== null && vLines[r]?.[c] !== undefined;
  const right = vLines[r]?.[c + 1] !== null && vLines[r]?.[c + 1] !== undefined;

  return top && bottom && left && right;
};

/**
 * Counts how many sides of a box are currently drawn (0 to 4)
 */
export const countBoxSides = (
  r: number,
  c: number,
  hLines: (string | null)[][],
  vLines: (string | null)[][]
): number => {
  let count = 0;
  if (hLines[r]?.[c]) count++;
  if (hLines[r + 1]?.[c]) count++;
  if (vLines[r]?.[c]) count++;
  if (vLines[r]?.[c + 1]) count++;
  return count;
};

/**
 * Validates whether a line move is legal and unplaced
 */
export const isLegalLine = (
  line: DotsLine,
  hLines: (string | null)[][],
  vLines: (string | null)[][]
): boolean => {
  const { orientation, row, col } = line;
  if (orientation === 'horizontal') {
    if (row < 0 || row >= hLines.length) return false;
    if (col < 0 || col >= (hLines[0]?.length || 0)) return false;
    return hLines[row][col] === null;
  } else {
    if (row < 0 || row >= vLines.length) return false;
    if (col < 0 || col >= (vLines[0]?.length || 0)) return false;
    return vLines[row][col] === null;
  }
};

export interface DotsMoveResult {
  nextState: DotsGameState;
  completedBoxes: CellCoord[];
  hasBonusTurn: boolean;
  isGameOver: boolean;
}

/**
 * Executes a line move in Dots & Boxes
 */
export const makeDotsMove = (
  state: DotsGameState,
  line: DotsLine
): DotsMoveResult => {
  const { orientation, row, col } = line;
  const currentPlayer = state.players[state.currentPlayerIndex];
  const playerId = currentPlayer.id;

  // Clone lines and boxes
  const newHLines = state.horizontalLines.map((r) => [...r]);
  const newVLines = state.verticalLines.map((r) => [...r]);
  const newBoxes = state.boxes.map((r) => [...r]);
  const newScores = { ...state.playerScores };

  // Place the line
  if (orientation === 'horizontal') {
    newHLines[row][col] = playerId;
  } else {
    newVLines[row][col] = playerId;
  }

  const completedBoxes: CellCoord[] = [];
  const boxRows = state.config.dotRows - 1;
  const boxCols = state.config.dotCols - 1;

  // Check which adjacent boxes might be completed
  if (orientation === 'horizontal') {
    // Box above (row - 1, col)
    if (row > 0 && !newBoxes[row - 1][col] && isBoxComplete(row - 1, col, newHLines, newVLines)) {
      newBoxes[row - 1][col] = playerId;
      completedBoxes.push({ row: row - 1, col });
    }
    // Box below (row, col)
    if (row < boxRows && !newBoxes[row][col] && isBoxComplete(row, col, newHLines, newVLines)) {
      newBoxes[row][col] = playerId;
      completedBoxes.push({ row, col });
    }
  } else {
    // Vertical line
    // Box to the left (row, col - 1)
    if (col > 0 && !newBoxes[row][col - 1] && isBoxComplete(row, col - 1, newHLines, newVLines)) {
      newBoxes[row][col - 1] = playerId;
      completedBoxes.push({ row, col: col - 1 });
    }
    // Box to the right (row, col)
    if (col < boxCols && !newBoxes[row][col] && isBoxComplete(row, col, newHLines, newVLines)) {
      newBoxes[row][col] = playerId;
      completedBoxes.push({ row, col });
    }
  }

  const boxCount = completedBoxes.length;
  const hasBonusTurn = boxCount > 0;

  if (hasBonusTurn) {
    newScores[playerId] = (newScores[playerId] || 0) + boxCount;
  }

  // Check if all boxes are now completed
  const totalBoxes = boxRows * boxCols;
  let filledBoxes = 0;
  for (let r = 0; r < boxRows; r++) {
    for (let c = 0; c < boxCols; c++) {
      if (newBoxes[r][c] !== null) filledBoxes++;
    }
  }

  const isGameOver = filledBoxes === totalBoxes;
  let nextStatus = state.status;
  let winnerPlayerId: string | null = null;

  if (isGameOver) {
    const p1Score = newScores[state.players[0].id] || 0;
    const p2Score = newScores[state.players[1].id] || 0;
    if (p1Score > p2Score) {
      winnerPlayerId = state.players[0].id;
      nextStatus = 'won';
    } else if (p2Score > p1Score) {
      winnerPlayerId = state.players[1].id;
      nextStatus = 'won';
    } else {
      winnerPlayerId = null;
      nextStatus = 'draw';
    }
  }

  // Next player: keeps turn if bonus turn and not game over, else switches
  const nextPlayerIndex = (hasBonusTurn || isGameOver)
    ? state.currentPlayerIndex
    : (state.currentPlayerIndex === 0 ? 1 : 0);

  const nextState: DotsGameState = {
    ...state,
    horizontalLines: newHLines,
    verticalLines: newVLines,
    boxes: newBoxes,
    playerScores: newScores,
    currentPlayerIndex: nextPlayerIndex,
    status: nextStatus,
    winnerPlayerId,
    lastLine: { ...line, ownerId: playerId },
    lastCompletedBoxes: completedBoxes,
    consecutiveTurn: hasBonusTurn && !isGameOver,
    moveCount: state.moveCount + 1,
    players: [
      { ...state.players[0], score: newScores[state.players[0].id] || 0 },
      { ...state.players[1], score: newScores[state.players[1].id] || 0 }
    ]
  };

  return {
    nextState,
    completedBoxes,
    hasBonusTurn,
    isGameOver
  };
};

/**
 * Gets all remaining unplaced lines on the board
 */
export const getAllAvailableLines = (
  hLines: (string | null)[][],
  vLines: (string | null)[][]
): DotsLine[] => {
  const available: DotsLine[] = [];

  for (let r = 0; r < hLines.length; r++) {
    for (let c = 0; c < hLines[r].length; c++) {
      if (hLines[r][c] === null) {
        available.push({ orientation: 'horizontal', row: r, col: c });
      }
    }
  }

  for (let r = 0; r < vLines.length; r++) {
    for (let c = 0; c < vLines[r].length; c++) {
      if (vLines[r][c] === null) {
        available.push({ orientation: 'vertical', row: r, col: c });
      }
    }
  }

  return available;
};
