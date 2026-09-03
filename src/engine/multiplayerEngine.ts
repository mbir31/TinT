/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { io, Socket } from 'socket.io-client';
import {
  GameType,
  Player,
  BoardConfig,
  DotsBoardConfig,
  ConnectFourConfig,
  PublicRoomState,
  OnlineMovePayload
} from '../types';

let socket: Socket | null = null;
let currentSubscribedRoom: string | null = null;

const STORAGE_SESSION_KEY = 'tint_active_online_session';
const STORAGE_PLAYER_KEY = 'tint_local_player_session_id';

export interface StoredOnlineSession {
  roomCode: string;
  playerToken: string;
  playerId: string;
  gameType: GameType;
  timestamp: number;
}

// Unique session ID generator for local browser client
export const getLocalSessionPlayerId = (): string => {
  if (typeof window === 'undefined') return 'p_' + Math.random().toString(36).substring(2, 8);
  let id = localStorage.getItem(STORAGE_PLAYER_KEY);
  if (!id) {
    id = 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    localStorage.setItem(STORAGE_PLAYER_KEY, id);
  }
  return id;
};

export const getStoredOnlineSession = (): StoredOnlineSession | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_SESSION_KEY);
    if (!raw) return null;
    const session: StoredOnlineSession = JSON.parse(raw);
    // Ignore sessions older than 2 hours
    if (Date.now() - session.timestamp > 2 * 60 * 60 * 1000) {
      clearStoredOnlineSession();
      return null;
    }
    return session;
  } catch (e) {
    return null;
  }
};

export const saveStoredOnlineSession = (session: StoredOnlineSession): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('Error saving online session', e);
  }
};

export const clearStoredOnlineSession = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_SESSION_KEY);
  } catch (e) {
    console.error('Error clearing online session', e);
  }
};

/** Remove the persisted local player session id (used by "Reset All Local Data"). */
export const clearLocalPlayerSessionId = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_PLAYER_KEY);
  } catch (e) {
    console.error('Error clearing local player session id', e);
  }
};

// Initialize or retrieve socket instance
export const getSocket = (): Socket => {
  if (!socket) {
    socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      autoConnect: true
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to TinT real-time WebSocket server:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('TinT socket disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('TinT socket connection error:', err.message);
    });
  }
  return socket;
};

export const isSocketConnected = (): boolean => {
  return !!socket && socket.connected;
};

// Create a new online game room
export const createOnlineRoom = async (
  gameType: GameType,
  hostPlayer: Player,
  config: BoardConfig | DotsBoardConfig | ConnectFourConfig
): Promise<{ roomCode: string; playerToken: string; roomState: PublicRoomState }> => {
  const s = getSocket();
  const hostId = hostPlayer.id || getLocalSessionPlayerId();
  const host: Player = { ...hostPlayer, id: hostId };

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Room creation timed out'));
    }, 10000);

    s.emit(
      'create_room',
      { gameType, hostPlayer: host, config },
      (response: {
        success: boolean;
        roomCode?: string;
        playerToken?: string;
        roomState?: PublicRoomState;
        error?: string;
      }) => {
        clearTimeout(timeout);
        if (response.success && response.roomCode && response.playerToken && response.roomState) {
          saveStoredOnlineSession({
            roomCode: response.roomCode,
            playerToken: response.playerToken,
            playerId: hostId,
            gameType,
            timestamp: Date.now()
          });
          resolve({
            roomCode: response.roomCode,
            playerToken: response.playerToken,
            roomState: response.roomState
          });
        } else {
          reject(new Error(response.error || 'Failed to create room'));
        }
      }
    );
  });
};

// Join an existing online game room
export const joinOnlineRoom = async (
  roomCodeInput: string,
  guestPlayer: Player
): Promise<{ success: boolean; error?: string; playerToken?: string; roomState?: PublicRoomState }> => {
  const s = getSocket();
  const code = roomCodeInput.trim().toUpperCase();
  const guestId = guestPlayer.id || getLocalSessionPlayerId();
  const guest: Player = { ...guestPlayer, id: guestId };

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ success: false, error: 'connectionTimeout' });
    }, 10000);

    s.emit(
      'join_room',
      { roomCode: code, guestPlayer: guest },
      (response: {
        success: boolean;
        playerToken?: string;
        roomState?: PublicRoomState;
        error?: string;
      }) => {
        clearTimeout(timeout);
        if (response && response.success && response.roomState && response.playerToken) {
          saveStoredOnlineSession({
            roomCode: code,
            playerToken: response.playerToken,
            playerId: guestId,
            gameType: response.roomState.gameType,
            timestamp: Date.now()
          });
          resolve({
            success: true,
            playerToken: response.playerToken,
            roomState: response.roomState
          });
        } else {
          resolve({ success: false, error: response?.error || 'roomNotFound' });
        }
      }
    );
  });
};

// Reconnect to an existing room session
export const reconnectOnlineRoom = async (
  roomCode: string,
  playerId: string,
  playerToken: string
): Promise<{ success: boolean; roomState?: PublicRoomState; error?: string }> => {
  const s = getSocket();
  const code = roomCode.trim().toUpperCase();

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ success: false, error: 'reconnectTimeout' });
    }, 10000);

    s.emit(
      'reconnect_room',
      { roomCode: code, playerId, playerToken },
      (response: { success: boolean; roomState?: PublicRoomState; error?: string }) => {
        clearTimeout(timeout);
        if (response && response.success && response.roomState) {
          saveStoredOnlineSession({
            roomCode: code,
            playerToken,
            playerId,
            gameType: response.roomState.gameType,
            timestamp: Date.now()
          });
          resolve({ success: true, roomState: response.roomState });
        } else {
          clearStoredOnlineSession();
          resolve({ success: false, error: response?.error || 'roomExpired' });
        }
      }
    );
  });
};

export type ReactionPayload = {
  roomCode: string;
  emoji: string;
  senderName: string;
  senderId: string;
};

export interface OnlineRoomListeners {
  onUpdate: (state: PublicRoomState) => void;
  onReaction?: (reaction: ReactionPayload) => void;
  onOpponentLeft?: (info?: { playerId: string }) => void;
  onConnectionChanged?: (info: { playerId: string; connected: boolean }) => void;
  onSocketConnected?: () => void;
  onSocketDisconnected?: (reason: string) => void;
}

// Subscribe to authoritative room updates, reactions, connection events
export const subscribeToOnlineRoom = (
  roomCode: string,
  listeners: OnlineRoomListeners
): (() => void) => {
  const s = getSocket();
  const code = roomCode.trim().toUpperCase();
  currentSubscribedRoom = code;

  const roomUpdateListener = (updatedRoom: PublicRoomState) => {
    if (updatedRoom && updatedRoom.roomCode === code) {
      listeners.onUpdate(updatedRoom);
    }
  };

  const reactionListener = (payload: ReactionPayload) => {
    if (payload && payload.roomCode === code && listeners.onReaction) {
      listeners.onReaction(payload);
    }
  };

  const opponentLeftListener = (info?: { playerId: string }) => {
    if (listeners.onOpponentLeft) {
      listeners.onOpponentLeft(info);
    }
  };

  const connectionListener = (info: { playerId: string; connected: boolean }) => {
    if (listeners.onConnectionChanged) {
      listeners.onConnectionChanged(info);
    }
  };

  const onConnect = () => {
    if (listeners.onSocketConnected) {
      listeners.onSocketConnected();
    }
    // Attempt auto-reconnect if session exists
    const session = getStoredOnlineSession();
    if (session && session.roomCode === code) {
      reconnectOnlineRoom(session.roomCode, session.playerId, session.playerToken).then((res) => {
        if (res.success && res.roomState) {
          listeners.onUpdate(res.roomState);
        }
      });
    }
  };

  const onDisconnect = (reason: string) => {
    if (listeners.onSocketDisconnected) {
      listeners.onSocketDisconnected(reason);
    }
  };

  s.on('room_updated', roomUpdateListener);
  s.on('reaction_received', reactionListener);
  s.on('opponent_left', opponentLeftListener);
  s.on('player_connection_changed', connectionListener);
  s.on('connect', onConnect);
  s.on('disconnect', onDisconnect);

  return () => {
    s.off('room_updated', roomUpdateListener);
    s.off('reaction_received', reactionListener);
    s.off('opponent_left', opponentLeftListener);
    s.off('player_connection_changed', connectionListener);
    s.off('connect', onConnect);
    s.off('disconnect', onDisconnect);
    if (currentSubscribedRoom === code) {
      currentSubscribedRoom = null;
    }
  };
};

// Send authoritative move action
export const sendOnlineMove = async (
  roomCode: string,
  playerToken: string,
  payload: OnlineMovePayload,
  expectedVersion?: number
): Promise<{ success: boolean; version?: number; error?: string }> => {
  const s = getSocket();
  const code = roomCode.trim().toUpperCase();

  return new Promise((resolve) => {
    s.emit(
      'make_move',
      {
        roomCode: code,
        playerToken,
        payload,
        expectedVersion
      },
      (res: { success: boolean; version?: number; error?: string }) => {
        resolve(res || { success: true });
      }
    );
  });
};

// Request online rematch
export const requestOnlineRematch = async (
  roomCode: string,
  playerToken: string
): Promise<{ success: boolean; error?: string }> => {
  const s = getSocket();
  const code = roomCode.trim().toUpperCase();

  return new Promise((resolve) => {
    s.emit(
      'request_rematch',
      { roomCode: code, playerToken },
      (res: { success: boolean; error?: string }) => {
        resolve(res || { success: true });
      }
    );
  });
};

// Send real-time emoji reaction
export const sendOnlineReaction = (
  roomCode: string,
  playerToken: string,
  emoji: string
): void => {
  const s = getSocket();
  const code = roomCode.trim().toUpperCase();
  s.emit('send_reaction', { roomCode: code, playerToken, emoji });
};

// Leave room and clear local session
export const leaveOnlineRoom = async (
  roomCode: string,
  playerToken: string
): Promise<void> => {
  const s = getSocket();
  const code = roomCode.trim().toUpperCase();
  s.emit('leave_room', { roomCode: code, playerToken });
  clearStoredOnlineSession();
};

