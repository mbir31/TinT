/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { io, Socket } from 'socket.io-client';
import { BoardConfig, GameState, Player, RoomState } from '../types';

let socket: Socket | null = null;
let currentSubscribedRoom: string | null = null;

// Unique session ID generator for local browser client
export const getLocalSessionPlayerId = (): string => {
  if (typeof window === 'undefined') return 'p_' + Math.random().toString(36).substring(2, 8);
  const key = 'tint_local_player_session_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    localStorage.setItem(key, id);
  }
  return id;
};

// Initialize or retrieve socket instance
export const getSocket = (): Socket => {
  if (!socket) {
    socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
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

// Check if socket is connected
export const isSocketConnected = (): boolean => {
  return !!socket && socket.connected;
};

// Create a new online game room
export const createOnlineRoom = async (
  hostPlayer: Player,
  boardConfig: BoardConfig
): Promise<{ roomCode: string; roomState: RoomState }> => {
  const s = getSocket();
  const hostId = hostPlayer.id || getLocalSessionPlayerId();
  const host: Player = { ...hostPlayer, id: hostId };

  return new Promise((resolve, reject) => {
    // Timeout safety
    const timeout = setTimeout(() => {
      reject(new Error('Room creation timed out'));
    }, 8000);

    s.emit(
      'create_room',
      { hostPlayer: host, boardConfig },
      (response: { success: boolean; roomCode?: string; roomState?: RoomState; error?: string }) => {
        clearTimeout(timeout);
        if (response.success && response.roomCode && response.roomState) {
          resolve({ roomCode: response.roomCode, roomState: response.roomState });
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
): Promise<{ success: boolean; error?: string; roomState?: RoomState }> => {
  const s = getSocket();
  const code = roomCodeInput.trim().toUpperCase();
  const guestId = guestPlayer.id || getLocalSessionPlayerId();
  const guest: Player = { ...guestPlayer, id: guestId };

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ success: false, error: 'connectionTimeout' });
    }, 8000);

    s.emit(
      'join_room',
      { roomCode: code, guestPlayer: guest },
      (response: { success: boolean; roomState?: RoomState; error?: string }) => {
        clearTimeout(timeout);
        if (response && response.success && response.roomState) {
          resolve({ success: true, roomState: response.roomState });
        } else {
          resolve({ success: false, error: response?.error || 'roomNotFound' });
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

// Subscribe to room updates, reactions, and opponent status
export const subscribeToOnlineRoom = (
  roomCode: string,
  onUpdate: (state: RoomState) => void,
  onReaction?: (reaction: ReactionPayload) => void,
  onOpponentLeft?: () => void
): (() => void) => {
  const s = getSocket();
  const code = roomCode.trim().toUpperCase();
  currentSubscribedRoom = code;

  const roomUpdateListener = (updatedRoom: RoomState) => {
    if (updatedRoom && updatedRoom.roomCode === code) {
      onUpdate(updatedRoom);
    }
  };

  const reactionListener = (payload: ReactionPayload) => {
    if (payload && payload.roomCode === code && onReaction) {
      onReaction(payload);
    }
  };

  const opponentLeftListener = () => {
    if (onOpponentLeft) {
      onOpponentLeft();
    }
  };

  s.on('room_updated', roomUpdateListener);
  s.on('reaction_received', reactionListener);
  s.on('opponent_left', opponentLeftListener);

  return () => {
    s.off('room_updated', roomUpdateListener);
    s.off('reaction_received', reactionListener);
    s.off('opponent_left', opponentLeftListener);
    if (currentSubscribedRoom === code) {
      currentSubscribedRoom = null;
    }
  };
};

// Sync move to server
export const syncOnlineMove = async (
  roomCode: string,
  updatedGameState: GameState
): Promise<void> => {
  const s = getSocket();
  const code = roomCode.trim().toUpperCase();
  s.emit('game_move', { roomCode: code, gameState: updatedGameState });
};

// Request rematch
export const syncOnlineRematch = async (
  roomCode: string,
  playerId: string,
  resetGameState: GameState
): Promise<void> => {
  const s = getSocket();
  const code = roomCode.trim().toUpperCase();
  s.emit('request_rematch', { roomCode: code, playerId, resetGameState });
};

// Send real-time emoji reaction
export const sendOnlineReaction = (
  roomCode: string,
  emoji: string,
  senderName: string,
  senderId: string
): void => {
  const s = getSocket();
  const code = roomCode.trim().toUpperCase();
  s.emit('send_reaction', { roomCode: code, emoji, senderName, senderId });
};

// Leave room
export const syncLeaveRoom = async (
  roomCode: string,
  playerId: string
): Promise<void> => {
  const s = getSocket();
  const code = roomCode.trim().toUpperCase();
  s.emit('leave_room', { roomCode: code, playerId });
};
