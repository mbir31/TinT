/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'bn' | 'en';

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

export interface UserSettings {
  language: Language;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  reducedMotion: boolean;
  tilt3dEnabled: boolean;
  audioVolume: number;
  defaultPlayer1: {
    name: string;
    avatar: string;
    colorKey: string;
  };
  defaultPlayer2: {
    name: string;
    avatar: string;
    colorKey: string;
  };
  defaultAIPlayer: {
    name: string;
    avatar: string;
    colorKey: string;
  };
  defaultDifficulty: AIDifficulty;
  lastBoardConfig: BoardConfig;
}
