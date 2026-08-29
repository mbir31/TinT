/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BoardConfig, GameState, UserSettings } from '../types';

const STORAGE_KEY_SETTINGS = 'tint_settings_v1';
const STORAGE_KEY_ACTIVE_GAME = 'tint_active_local_game';

export const DEFAULT_BOARD_CONFIG: BoardConfig = {
  rows: 3,
  cols: 3,
  winLength: 3,
  presetKey: '3x3'
};

export const DEFAULT_SETTINGS: UserSettings = {
  language: 'bn',
  soundEnabled: true,
  hapticsEnabled: true,
  reducedMotion: false,
  tilt3dEnabled: true,
  audioVolume: 0.65,
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
      lastBoardConfig: { ...DEFAULT_SETTINGS.lastBoardConfig, ...(parsed.lastBoardConfig || {}) }
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveUserSettings = (settings: UserSettings): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors
  }
};

export const saveActiveLocalGame = (gameState: GameState | null): void => {
  if (typeof window === 'undefined') return;
  try {
    if (!gameState || gameState.status === 'won' || gameState.status === 'draw') {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_GAME);
    } else {
      localStorage.setItem(STORAGE_KEY_ACTIVE_GAME, JSON.stringify(gameState));
    }
  } catch {
    // Ignore
  }
};

export const loadActiveLocalGame = (): GameState | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_GAME);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearAllLocalData = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_SETTINGS);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_GAME);
  } catch {
    // Ignore
  }
};
