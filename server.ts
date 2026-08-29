/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer as createViteServer } from 'vite';

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// Socket.IO Server configuration
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 30000,
  pingInterval: 10000
});

app.use(express.json({ limit: '10mb' }));

// In-Memory Room Store
interface PlayerData {
  id: string;
  name: string;
  avatar: string;
  colorKey: string;
  photoUrl?: string;
  score: number;
  socketId?: string;
}

interface BoardConfigData {
  rows: number;
  cols: number;
  winLength: number;
  presetKey?: string;
}

interface MoveData {
  playerId: string;
  row: number;
  col: number;
  timestamp: number;
}

interface GameStateData {
  id: string;
  mode: 'online';
  boardConfig: BoardConfigData;
  board: (string | null)[][];
  players: [PlayerData, PlayerData];
  currentPlayerIndex: number;
  status: 'idle' | 'countdown' | 'playing' | 'won' | 'draw' | 'paused';
  winnerPlayerId: string | null;
  winningCells: { row: number; col: number }[];
  moveCount: number;
  movesHistory: MoveData[];
  createdAt: number;
}

interface RoomData {
  roomId: string;
  roomCode: string;
  hostPlayer: PlayerData;
  guestPlayer: PlayerData | null;
  boardConfig: BoardConfigData;
  gameState: GameStateData;
  status: 'waiting' | 'active' | 'finished' | 'abandoned';
  hostLastSeen: number;
  guestLastSeen?: number;
  rematchRequestedBy: string | null;
  createdAt: number;
  updatedAt: number;
}

const rooms = new Map<string, RoomData>();
const socketToRoom = new Map<string, { roomCode: string; playerId: string }>();

// Helper to generate 5-character alphanumeric room codes
const ROOM_CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 5; i++) {
    const idx = Math.floor(Math.random() * ROOM_CODE_CHARS.length);
    code += ROOM_CODE_CHARS[idx];
  }
  return code;
}

function createEmptyBoard(rows: number, cols: number): (string | null)[][] {
  const r = Math.max(3, Math.min(15, rows));
  const c = Math.max(3, Math.min(15, cols));
  const board: (string | null)[][] = [];
  for (let i = 0; i < r; i++) {
    const row: (string | null)[] = [];
    for (let j = 0; j < c; j++) {
      row.push(null);
    }
    board.push(row);
  }
  return board;
}

// REST API Health & Room Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    engine: 'TinT Real-time WebSocket Game Engine',
    activeRooms: rooms.size,
    timestamp: Date.now()
  });
});

app.get('/api/rooms/:code', (req, res) => {
  const code = req.params.code.trim().toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({
    roomCode: room.roomCode,
    status: room.status,
    host: room.hostPlayer.name,
    guest: room.guestPlayer ? room.guestPlayer.name : null,
    boardConfig: room.boardConfig
  });
});

// Real-time Socket Event Handlers
io.on('connection', (socket: Socket) => {
  // CREATE ROOM
  socket.on(
    'create_room',
    (
      payload: { hostPlayer: PlayerData; boardConfig: BoardConfigData },
      callback?: (res: { success: boolean; roomCode?: string; roomState?: RoomData; error?: string }) => void
    ) => {
      try {
        let roomCode = generateRoomCode();
        while (rooms.has(roomCode)) {
          roomCode = generateRoomCode();
        }

        const host: PlayerData = {
          ...payload.hostPlayer,
          id: payload.hostPlayer.id || socket.id,
          socketId: socket.id
        };

        const dummyGuest: PlayerData = {
          id: 'pending_guest',
          name: '...',
          avatar: 'flame',
          colorKey: 'coral',
          score: 0
        };

        const rows = payload.boardConfig.rows || 3;
        const cols = payload.boardConfig.cols || 3;
        const winLength = payload.boardConfig.winLength || (rows <= 3 && cols <= 3 ? 3 : 4);

        const initialGameState: GameStateData = {
          id: `game_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          mode: 'online',
          boardConfig: { rows, cols, winLength, presetKey: payload.boardConfig.presetKey },
          board: createEmptyBoard(rows, cols),
          players: [host, dummyGuest],
          currentPlayerIndex: 0,
          status: 'idle',
          winnerPlayerId: null,
          winningCells: [],
          moveCount: 0,
          movesHistory: [],
          createdAt: Date.now()
        };

        const roomState: RoomData = {
          roomId: `room_${roomCode}`,
          roomCode,
          hostPlayer: host,
          guestPlayer: null,
          boardConfig: { rows, cols, winLength, presetKey: payload.boardConfig.presetKey },
          gameState: initialGameState,
          status: 'waiting',
          hostLastSeen: Date.now(),
          rematchRequestedBy: null,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        rooms.set(roomCode, roomState);
        socket.join(`room_${roomCode}`);
        socketToRoom.set(socket.id, { roomCode, playerId: host.id });

        if (callback) {
          callback({ success: true, roomCode, roomState });
        }
      } catch (err: any) {
        console.error('Error creating room:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    }
  );

  // JOIN ROOM
  socket.on(
    'join_room',
    (
      payload: { roomCode: string; guestPlayer: PlayerData },
      callback?: (res: { success: boolean; roomState?: RoomData; error?: string }) => void
    ) => {
      try {
        const code = (payload.roomCode || '').trim().toUpperCase();
        const room = rooms.get(code);

        if (!room) {
          if (callback) callback({ success: false, error: 'roomNotFound' });
          return;
        }

        const guestId = payload.guestPlayer.id || socket.id;

        // If player is already host re-joining
        if (room.hostPlayer.id === guestId) {
          room.hostPlayer.socketId = socket.id;
          room.hostLastSeen = Date.now();
          socket.join(`room_${code}`);
          socketToRoom.set(socket.id, { roomCode: code, playerId: guestId });
          if (callback) callback({ success: true, roomState: room });
          return;
        }

        // If room is full and not the existing guest
        if (room.status === 'active' && room.guestPlayer && room.guestPlayer.id !== guestId) {
          if (callback) callback({ success: false, error: 'roomFull' });
          return;
        }

        const guest: PlayerData = {
          ...payload.guestPlayer,
          id: guestId,
          socketId: socket.id
        };

        const updatedPlayers: [PlayerData, PlayerData] = [room.hostPlayer, guest];
        const updatedGame: GameStateData = {
          ...room.gameState,
          players: updatedPlayers,
          status: 'playing'
        };

        room.guestPlayer = guest;
        room.gameState = updatedGame;
        room.status = 'active';
        room.guestLastSeen = Date.now();
        room.updatedAt = Date.now();

        socket.join(`room_${code}`);
        socketToRoom.set(socket.id, { roomCode: code, playerId: guestId });

        // Notify both sockets in the room
        io.to(`room_${code}`).emit('room_updated', room);

        if (callback) callback({ success: true, roomState: room });
      } catch (err: any) {
        console.error('Error joining room:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    }
  );

  // GAME MOVE
  socket.on(
    'game_move',
    (payload: { roomCode: string; gameState: GameStateData }) => {
      const code = (payload.roomCode || '').trim().toUpperCase();
      const room = rooms.get(code);
      if (!room) return;

      room.gameState = payload.gameState;
      room.status =
        payload.gameState.status === 'won' || payload.gameState.status === 'draw'
          ? 'finished'
          : 'active';
      room.updatedAt = Date.now();

      io.to(`room_${code}`).emit('room_updated', room);
    }
  );

  // REMATCH REQUEST
  socket.on(
    'request_rematch',
    (payload: { roomCode: string; playerId: string; resetGameState: GameStateData }) => {
      const code = (payload.roomCode || '').trim().toUpperCase();
      const room = rooms.get(code);
      if (!room) return;

      if (room.rematchRequestedBy && room.rematchRequestedBy !== payload.playerId) {
        // Both agreed: reset board
        room.gameState = payload.resetGameState;
        room.status = 'active';
        room.rematchRequestedBy = null;
      } else {
        // First player requested
        room.rematchRequestedBy = payload.playerId;
      }
      room.updatedAt = Date.now();

      io.to(`room_${code}`).emit('room_updated', room);
    }
  );

  // QUICK REACTION EMOJIS
  socket.on(
    'send_reaction',
    (payload: { roomCode: string; emoji: string; senderName: string; senderId: string }) => {
      const code = (payload.roomCode || '').trim().toUpperCase();
      io.to(`room_${code}`).emit('reaction_received', payload);
    }
  );

  // LEAVE ROOM
  socket.on('leave_room', (payload: { roomCode: string; playerId: string }) => {
    const code = (payload.roomCode || '').trim().toUpperCase();
    const room = rooms.get(code);
    if (room) {
      room.status = 'abandoned';
      room.updatedAt = Date.now();
      io.to(`room_${code}`).emit('room_updated', room);
      io.to(`room_${code}`).emit('opponent_left', { playerId: payload.playerId });
    }
    socket.leave(`room_${code}`);
    socketToRoom.delete(socket.id);
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    const info = socketToRoom.get(socket.id);
    if (info) {
      const room = rooms.get(info.roomCode);
      if (room) {
        io.to(`room_${info.roomCode}`).emit('player_disconnected', { playerId: info.playerId });
      }
      socketToRoom.delete(socket.id);
    }
  });
});

// Periodic garbage collection for abandoned rooms older than 1 hour
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [code, r] of rooms.entries()) {
    if (r.updatedAt < oneHourAgo) {
      rooms.delete(code);
    }
  }
}, 10 * 60 * 1000);

// Vite middleware & Production static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ TinT Real-time Game Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
