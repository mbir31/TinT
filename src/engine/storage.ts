/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BoardConfig,
  DotsBoardConfig,
  ConnectFourConfig,
  GameState,
  DotsGameState,
  ConnectFourGameState,
  UserSettings,
  GameType
} from '../types';
import { idbSet, idbGet, idbDelete, recordMatchHistory, MatchRecord } from './indexedDb';
import { clearPlayerStats } from './achievements';
import { clearStoredOnlineSession, clearLocalPlayerSessionId } from './multiplayerEngine';

const STORAGE_KEY_SETTINGS = 'tint_settings_v1';
const STORAGE_KEY_ACTIVE_TTT = 'tint_active_local_game';
const STORAGE_KEY_ACTIVE_DOTS = 'tint_active_local_dots_game';
const STORAGE_KEY_ACTIVE_C4 = 'tint_active_local_c4_game';

export const DEFAULT_BOARD_CONFIG: BoardConfig = {
  rows: 3,
  cols: 3,
  winLength: 3,
  presetKey: '3x3'
};

export const DEFAULT_DOTS_CONFIG: DotsBoardConfig = {
  dotRows: 4,
  dotCols: 4,
  presetKey: 'classic-3x3'
};

export const DEFAULT_C4_CONFIG: ConnectFourConfig = {
  rows: 6,
  cols: 7,
  winLength: 4,
  presetKey: 'c4-standard'
};

export const DEFAULT_SETTINGS: UserSettings = {
  language: 'bn',
  soundEnabled: true,
  hapticsEnabled: true,
  reducedMotion: false,
  tilt3dEnabled: true,
  audioVolume: 0.65,
  activeGameType: 'tictactoe',
  tokenPaletteId: 'classic-duo',
  defaultPlayer1: {
    name: 'মুনাব্বির',
    avatar: 'crown',
    colorKey: 'coral'
  },
  defaultPlayer2: {
    name: 'মুশরাণ',
    avatar: 'flame',
    colorKey: 'blue'
  },
  defaultAIPlayer: {
    name: 'রোবো',
    avatar: 'robot',
    colorKey: 'purple'
  },
  defaultDifficulty: 'medium',
  lastBoardConfig: DEFAULT_BOARD_CONFIG,
  lastDotsConfig: DEFAULT_DOTS_CONFIG,
  lastConnectFourConfig: DEFAULT_C4_CONFIG,
  dotsGridLineColor: '#073B4C',
  dotsPegColor: '#073B4C'
};

export const loadUserSettings = (): UserSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      defaultPlayer1: { ...DEFAULT_SETTINGS.defaultPlayer1, ...(parsed.defaultPlayer1 || {}) },
      defaultPlayer2: { ...DEFAULT_SETTINGS.defaultPlayer2, ...(parsed.defaultPlayer2 || {}) },
      defaultAIPlayer: { ...DEFAULT_SETTINGS.defaultAIPlayer, ...(parsed.defaultAIPlayer || {}) },
      lastBoardConfig: { ...DEFAULT_SETTINGS.lastBoardConfig, ...(parsed.lastBoardConfig || {}) },
      lastDotsConfig: { ...DEFAULT_SETTINGS.lastDotsConfig, ...(parsed.lastDotsConfig || {}) },
      lastConnectFourConfig: { ...DEFAULT_SETTINGS.lastConnectFourConfig, ...(parsed.lastConnectFourConfig || {}) }
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveUserSettings = (settings: UserSettings): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    // Asynchronously replicate to IndexedDB
    idbSet('settings', { key: 'user_settings', data: settings }).catch(() => {});
  } catch {
    // Ignore storage quota errors
  }
};

// ----------------------------------------------------
// Active Tic-Tac-Toe Game Persistence
// ----------------------------------------------------
export const saveActiveLocalGame = (gameState: GameState | null): void => {
  if (typeof window === 'undefined') return;
  try {
    if (!gameState || gameState.status === 'won' || gameState.status === 'draw') {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_TTT);
      idbDelete('active_games', 'tictactoe').catch(() => {});
    } else {
      localStorage.setItem(STORAGE_KEY_ACTIVE_TTT, JSON.stringify(gameState));
      idbSet('active_games', { gameType: 'tictactoe', data: gameState }).catch(() => {});
    }
  } catch {
    // Ignore
  }
};

export const loadActiveLocalGame = (): GameState | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_TTT);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

// ----------------------------------------------------
// Active Dots & Boxes Game Persistence
// ----------------------------------------------------
export const saveActiveDotsGame = (gameState: DotsGameState | null): void => {
  if (typeof window === 'undefined') return;
  try {
    if (!gameState || gameState.status === 'won' || gameState.status === 'draw') {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_DOTS);
      idbDelete('active_games', 'dotsboxes').catch(() => {});
    } else {
      localStorage.setItem(STORAGE_KEY_ACTIVE_DOTS, JSON.stringify(gameState));
      idbSet('active_games', { gameType: 'dotsboxes', data: gameState }).catch(() => {});
    }
  } catch {
    // Ignore
  }
};

export const loadActiveDotsGame = (): DotsGameState | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_DOTS);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

// ----------------------------------------------------
// Active Connect Four Game Persistence
// ----------------------------------------------------
export const saveActiveConnectFourGame = (gameState: ConnectFourGameState | null): void => {
  if (typeof window === 'undefined') return;
  try {
    if (!gameState || gameState.status === 'won' || gameState.status === 'draw') {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_C4);
      idbDelete('active_games', 'connectfour').catch(() => {});
    } else {
      localStorage.setItem(STORAGE_KEY_ACTIVE_C4, JSON.stringify(gameState));
      idbSet('active_games', { gameType: 'connectfour', data: gameState }).catch(() => {});
    }
  } catch {
    // Ignore
  }
};

export const loadActiveConnectFourGame = (): ConnectFourGameState | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_C4);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

// ----------------------------------------------------
// Match History Logging to IndexedDB
// ----------------------------------------------------
export const logCompletedMatch = (
  gameType: GameType,
  mode: 'local' | 'ai' | 'online',
  boardInfo: string,
  winnerName: string | null,
  winnerColor: string,
  status: 'won' | 'draw',
  moveCount: number,
  durationMs = 0
): void => {
  const record: MatchRecord = {
    id: `match_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    gameType,
    mode,
    boardInfo,
    winnerName,
    winnerColor,
    status,
    moveCount,
    durationMs,
    timestamp: Date.now()
  };

  recordMatchHistory(record).catch(() => {});
};

export const clearAllLocalData = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_SETTINGS);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_TTT);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_DOTS);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_C4);
    idbDelete('settings', 'user_settings').catch(() => {});
    idbDelete('active_games', 'tictactoe').catch(() => {});
    idbDelete('active_games', 'dotsboxes').catch(() => {});
    idbDelete('active_games', 'connectfour').catch(() => {});
    // Player stats, achievements, and online session state are also local data
    clearPlayerStats();
    clearStoredOnlineSession();
    clearLocalPlayerSessionId();
  } catch {
    // Ignore
  }
};
