/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import { BoardConfig, GameState, Player, RoomState } from '../types';
import { createInitialGameState } from '../engine/gameEngine';
import { ensureAnonymousAuth, getFirebaseInstance, isFirebaseConfigured } from './firebaseConfig';

const ROOM_CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export const generateRoomCode = (): string => {
  let code = '';
  for (let i = 0; i < 5; i++) {
    const idx = Math.floor(Math.random() * ROOM_CODE_CHARS.length);
    code += ROOM_CODE_CHARS[idx];
  }
  return code;
};

// Fallback in-memory / cross-tab broadcast engine when Firebase isn't configured
const localRooms: Map<string, RoomState> = new Map();
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('tint_multiplayer_channel');
  } catch {
    // Ignore
  }
}

export const createOnlineRoom = async (
  hostPlayer: Player,
  boardConfig: BoardConfig
): Promise<{ roomCode: string; roomState: RoomState }> => {
  const roomCode = generateRoomCode();
  const guestUid = await ensureAnonymousAuth();
  const host: Player = { ...hostPlayer, id: guestUid };

  const dummyGuest: Player = {
    id: 'pending_guest',
    name: '...',
    avatar: 'flame',
    colorKey: 'rose',
    score: 0
  };

  const initialGame: GameState = createInitialGameState([host, dummyGuest], boardConfig, 'online');
  initialGame.status = 'idle';

  const roomState: RoomState = {
    roomId: `room_${roomCode}`,
    roomCode,
    hostPlayer: host,
    guestPlayer: null,
    boardConfig,
    gameState: initialGame,
    status: 'waiting',
    hostLastSeen: Date.now(),
    rematchRequestedBy: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const { db } = getFirebaseInstance();
  if (db && isFirebaseConfigured()) {
    try {
      const roomRef = doc(db, 'rooms', roomCode);
      await setDoc(roomRef, {
        ...roomState,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { roomCode, roomState };
    } catch (err) {
      console.error('Failed to create room on Firestore, falling back to local sync:', err);
    }
  }

  // Fallback local memory / broadcast sync
  localRooms.set(roomCode, roomState);
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'ROOM_CREATED', roomState });
  }
  return { roomCode, roomState };
};

export const joinOnlineRoom = async (
  roomCodeInput: string,
  guestPlayer: Player
): Promise<{ success: boolean; error?: string; roomState?: RoomState }> => {
  const roomCode = roomCodeInput.trim().toUpperCase();
  const guestUid = await ensureAnonymousAuth();
  const guest: Player = { ...guestPlayer, id: guestUid };

  const { db } = getFirebaseInstance();
  if (db && isFirebaseConfigured()) {
    try {
      const roomRef = doc(db, 'rooms', roomCode);
      const snapshot = await getDoc(roomRef);

      if (!snapshot.exists()) {
        return { success: false, error: 'roomNotFound' };
      }

      const data = snapshot.data() as RoomState;
      if (data.status === 'active' && data.guestPlayer && data.guestPlayer.id !== guest.id && data.hostPlayer.id !== guest.id) {
        return { success: false, error: 'roomFull' };
      }

      if (data.hostPlayer.id === guest.id) {
        // Rejoining as host
        return { success: true, roomState: data };
      }

      const updatedPlayers: [Player, Player] = [data.hostPlayer, guest];
      const updatedGame: GameState = {
        ...data.gameState,
        players: updatedPlayers,
        status: 'playing'
      };

      const updatedRoom: Partial<RoomState> = {
        guestPlayer: guest,
        gameState: updatedGame,
        status: 'active',
        guestLastSeen: Date.now(),
        updatedAt: Date.now()
      };

      await updateDoc(roomRef, {
        ...updatedRoom,
        updatedAt: serverTimestamp()
      });

      return { success: true, roomState: { ...data, ...updatedRoom } as RoomState };
    } catch (err) {
      console.error('Failed to join Firestore room:', err);
      return { success: false, error: 'roomNotFound' };
    }
  }

  // Fallback local sync
  const existing = localRooms.get(roomCode);
  if (!existing) {
    return { success: false, error: 'roomNotFound' };
  }

  if (existing.status === 'active' && existing.guestPlayer && existing.guestPlayer.id !== guest.id && existing.hostPlayer.id !== guest.id) {
    return { success: false, error: 'roomFull' };
  }

  const updatedPlayers: [Player, Player] = [existing.hostPlayer, guest];
  const updatedGame: GameState = {
    ...existing.gameState,
    players: updatedPlayers,
    status: 'playing'
  };

  existing.guestPlayer = guest;
  existing.gameState = updatedGame;
  existing.status = 'active';
  existing.guestLastSeen = Date.now();
  existing.updatedAt = Date.now();

  localRooms.set(roomCode, existing);
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'ROOM_UPDATED', roomState: existing });
  }

  return { success: true, roomState: existing };
};

export const subscribeToOnlineRoom = (
  roomCode: string,
  onUpdate: (state: RoomState) => void,
  onError?: (err: unknown) => void
): Unsubscribe => {
  const code = roomCode.trim().toUpperCase();
  const { db } = getFirebaseInstance();

  if (db && isFirebaseConfigured()) {
    const roomRef = doc(db, 'rooms', code);
    return onSnapshot(
      roomRef,
      (docSnap) => {
        if (docSnap.exists()) {
          onUpdate(docSnap.data() as RoomState);
        }
      },
      (error) => {
        console.warn('Firestore snapshot listener warning:', error);
        if (onError) onError(error);
      }
    );
  }

  // Fallback local / broadcast listener
  const broadcastHandler = (event: MessageEvent) => {
    if (event.data?.roomState?.roomCode === code) {
      onUpdate(event.data.roomState);
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', broadcastHandler);
  }

  // Polling interval for local state
  const interval = setInterval(() => {
    const r = localRooms.get(code);
    if (r) {
      onUpdate(r);
    }
  }, 1000);

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', broadcastHandler);
    }
    clearInterval(interval);
  };
};

export const syncOnlineMove = async (
  roomCode: string,
  updatedGameState: GameState
): Promise<void> => {
  const code = roomCode.trim().toUpperCase();
  const { db } = getFirebaseInstance();

  if (db && isFirebaseConfigured()) {
    try {
      const roomRef = doc(db, 'rooms', code);
      await updateDoc(roomRef, {
        gameState: updatedGameState,
        status: updatedGameState.status === 'won' || updatedGameState.status === 'draw' ? 'finished' : 'active',
        updatedAt: serverTimestamp()
      });
      return;
    } catch (err) {
      console.error('Failed to sync online move:', err);
    }
  }

  // Local fallback
  const room = localRooms.get(code);
  if (room) {
    room.gameState = updatedGameState;
    room.status = updatedGameState.status === 'won' || updatedGameState.status === 'draw' ? 'finished' : 'active';
    room.updatedAt = Date.now();
    localRooms.set(code, room);
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'ROOM_UPDATED', roomState: room });
    }
  }
};

export const syncOnlineRematch = async (
  roomCode: string,
  requestedByPlayerId: string,
  resetGameState: GameState
): Promise<void> => {
  const code = roomCode.trim().toUpperCase();
  const { db } = getFirebaseInstance();

  if (db && isFirebaseConfigured()) {
    try {
      const roomRef = doc(db, 'rooms', code);
      const snap = await getDoc(roomRef);
      if (snap.exists()) {
        const data = snap.data() as RoomState;
        if (data.rematchRequestedBy && data.rematchRequestedBy !== requestedByPlayerId) {
          // Both accepted rematch -> reset game
          await updateDoc(roomRef, {
            gameState: resetGameState,
            status: 'active',
            rematchRequestedBy: null,
            updatedAt: serverTimestamp()
          });
        } else {
          // Set request flag
          await updateDoc(roomRef, {
            rematchRequestedBy: requestedByPlayerId,
            updatedAt: serverTimestamp()
          });
        }
      }
      return;
    } catch (err) {
      console.error('Failed to sync rematch:', err);
    }
  }

  // Local fallback
  const room = localRooms.get(code);
  if (room) {
    if (room.rematchRequestedBy && room.rematchRequestedBy !== requestedByPlayerId) {
      room.gameState = resetGameState;
      room.status = 'active';
      room.rematchRequestedBy = null;
    } else {
      room.rematchRequestedBy = requestedByPlayerId;
    }
    room.updatedAt = Date.now();
    localRooms.set(code, room);
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'ROOM_UPDATED', roomState: room });
    }
  }
};

export const syncLeaveRoom = async (
  roomCode: string,
  playerId: string
): Promise<void> => {
  const code = roomCode.trim().toUpperCase();
  const { db } = getFirebaseInstance();

  if (db && isFirebaseConfigured()) {
    try {
      const roomRef = doc(db, 'rooms', code);
      await updateDoc(roomRef, {
        status: 'abandoned',
        updatedAt: serverTimestamp()
      });
    } catch {
      // Ignore
    }
  }

  const room = localRooms.get(code);
  if (room) {
    room.status = 'abandoned';
    room.updatedAt = Date.now();
    localRooms.set(code, room);
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'ROOM_UPDATED', roomState: room });
    }
  }
};
