/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'bn' | 'en';

export type GameType = 'tictactoe' | 'dotsboxes' | 'connectfour';

export type GameMode = 'local' | 'ai' | 'online';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export interface PlayerTheme {
  id: string;
  name: string;
  gradient: string;
  primary: string;
  accent: string;
  shadow: string;
  border: string;
  text: string;
}

export interface Player {
  id: string;
  name: string;
  avatar: string; // icon key or symbol
  colorKey: string; // theme color key
  photoUrl?: string; // custom cropped photo data URL
  isAI?: boolean;
  score: number;
}

export interface BoardConfig {
  rows: number;
  cols: number;
  winLength: number;
  presetKey?: string;
}

export interface CellCoord {
  row: number;
  col: number;
}

export type BoardState = (string | null)[][]; // string is playerId, null is empty

export type GameStatus = 'idle' | 'countdown' | 'playing' | 'won' | 'draw' | 'paused';

export interface MoveRecord {
  playerId: string;
  row: number;
  col: number;
  timestamp: number;
}

export interface GameState {
  id: string;
  mode: GameMode;
  boardConfig: BoardConfig;
  board: BoardState;
  players: [Player, Player];
  currentPlayerIndex: number;
  status: GameStatus;
  winnerPlayerId: string | null;
  winningCells: CellCoord[];
  moveCount: number;
  movesHistory: MoveRecord[];
  createdAt: number;
  aiDifficulty?: AIDifficulty;
}

export interface RoomState {
  roomId: string;
  roomCode: string;
  hostPlayer: Player;
  guestPlayer: Player | null;
  boardConfig: BoardConfig;
  gameState: GameState;
  status: 'waiting' | 'active' | 'finished' | 'abandoned';
  hostLastSeen: number;
  guestLastSeen?: number;
  rematchRequestedBy: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface DotsBoardConfig {
  dotRows: number; // e.g. 3, 4, 5, 6
  dotCols: number; // e.g. 3, 4, 5, 6
  presetKey?: string;
}

export type LineOrientation = 'horizontal' | 'vertical';

export interface DotsLine {
  orientation: LineOrientation;
  row: number;
  col: number;
  ownerId?: string;
}

export interface DotsGameState {
  id: string;
  gameType: 'dotsboxes';
  mode: GameMode;
  config: DotsBoardConfig;
  // horizontalLines: dotRows x (dotCols - 1) matrix containing playerId or null
  horizontalLines: (string | null)[][];
  // verticalLines: (dotRows - 1) x dotCols matrix containing playerId or null
  verticalLines: (string | null)[][];
  // boxes: (dotRows - 1) x (dotCols - 1) matrix containing owner playerId or null
  boxes: (string | null)[][];
  players: [Player, Player];
  playerScores: { [playerId: string]: number };
  currentPlayerIndex: number;
  status: GameStatus;
  winnerPlayerId: string | null;
  lastLine: DotsLine | null;
  lastCompletedBoxes: CellCoord[];
  consecutiveTurn: boolean;
  moveCount: number;
  aiDifficulty?: AIDifficulty;
  createdAt: number;
}

export interface ConnectFourConfig {
  rows: number; // default 6
  cols: number; // default 7
  winLength: number; // 4
  presetKey?: string;
}

export interface ConnectFourGameState {
  id: string;
  gameType: 'connectfour';
  mode: GameMode;
  config: ConnectFourConfig;
  board: (string | null)[][]; // rows x cols grid containing playerId or null
  players: [Player, Player];
  currentPlayerIndex: number;
  status: GameStatus;
  winnerPlayerId: string | null;
  winningCells: CellCoord[];
  lastDrop: { row: number; col: number } | null;
  moveCount: number;
  aiDifficulty?: AIDifficulty;
  createdAt: number;
}

export interface TokenColorPalette {
  id: string;
  nameBn: string;
  nameEn: string;
  descBn: string;
  descEn: string;
  p1Theme: string;
  p2Theme: string;
  aiTheme: string;
}

export interface UserSettings {
  language: Language;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  reducedMotion: boolean;
  tilt3dEnabled: boolean;
  audioVolume: number;
  activeGameType?: GameType;
  tokenPaletteId?: string;
  defaultPlayer1: {
    name: string;
    avatar: string;
    colorKey: string;
    photoUrl?: string;
  };
  defaultPlayer2: {
    name: string;
    avatar: string;
    colorKey: string;
    photoUrl?: string;
  };
  defaultAIPlayer: {
    name: string;
    avatar: string;
    colorKey: string;
    photoUrl?: string;
  };
  defaultDifficulty: AIDifficulty;
  lastBoardConfig: BoardConfig;
  lastDotsConfig?: DotsBoardConfig;
  lastConnectFourConfig?: ConnectFourConfig;
  dotsGridLineColor?: string;
  dotsPegColor?: string;
}

export interface Achievement {
  id: string;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  iconName: 'trophy' | 'flame' | 'crown' | 'zap' | 'sparkles' | 'target' | 'star' | 'medal';
  badgeColor: string;
}

export interface AchievementToastItem {
  id: string;
  achievement: Achievement;
  unlockedAt: number;
}

export interface PlayerStats {
  totalWins: number;
  currentWinStreak: number;
  maxWinStreak: number;
  tictactoeWins: number;
  dotsBoxesWins: number;
  connectFourWins: number;
  hardAiWins: number;
  unlockedAchievementIds: string[];
}
