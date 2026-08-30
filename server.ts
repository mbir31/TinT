/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import http from 'http';
import path from 'path';
import crypto from 'crypto';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import {
  GameType,
  Player,
  BoardConfig,
  DotsBoardConfig,
  ConnectFourConfig,
  GameState,
  DotsGameState,
  ConnectFourGameState,
  DotsLine,
  PublicRoomState,
  OnlineActionRecord,
  OnlineMovePayload
} from './src/types';
import {
  createInitialBoard,
  getWinLengthForBoard,
  isValidMove as isValidTicTacToeMove,
  makeMove as makeTicTacToeMove,
  checkWin as checkTicTacToeWin,
  isBoardFull as isTicTacToeBoardFull
} from './src/engine/gameEngine';
import {
  createInitialDotsState,
  isLegalLine as isLegalDotsLine,
  isBoxComplete
} from './src/engine/dotsEngine';
import {
  createEmptyConnectFourBoard,
  getLowestAvailableRow,
  isValidColumnDrop,
  checkConnectFourWin,
  isConnectFourBoardFull
} from './src/engine/connectFourEngine';

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// Security: Disable express fingerprint
app.disable('x-powered-by');

// Security: Global Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Content Security Policy permitting WebSocket, inline styles, Google Fonts, and Google AI Studio framing
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' ws: wss: https:; frame-ancestors 'self' https://*.google.com https://*.aistudio.google.com https://ai.studio;"
  );
  next();
});

// JSON Body Parser with strict 1MB payload limit to prevent resource exhaustion DoS
app.use(express.json({ limit: '1mb' }));

// Socket.IO Server configuration with sanitized origins & safe ping timeouts
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 20000,
  pingInterval: 10000,
  maxHttpBufferSize: 1e6 // 1MB maximum message buffer per socket packet
});

// ----------------------------------------------------
// Security Constants & Allowlists
// ----------------------------------------------------
const MAX_GLOBAL_ROOMS = 5000;
const MAX_ROOM_CREATIONS_PER_MIN = 8;
const ALLOWED_GAME_TYPES: readonly GameType[] = ['tictactoe', 'dotsboxes', 'connectfour'] as const;
const ALLOWED_AVATARS = new Set([
  'crown', 'tiger', 'trophy', 'flame', 'star', 'sword',
  'shield', 'zap', 'robot', 'diamond', 'circle', 'sparkles',
  'rocket', 'heart', 'gem', 'controller'
]);
const ALLOWED_COLOR_KEYS = new Set([
  'coral', 'blue', 'purple', 'emerald', 'amber', 'rose',
  'orange', 'teal', 'indigo', 'cyan', 'lime'
]);

// Validates base64 data URLs exclusively for safe raster images (JPEG, PNG, WebP, GIF)
const SAFE_IMAGE_DATA_URL_REGEX = /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/;
const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;
const SAFE_ROOM_CODE_REGEX = /^[2-9A-HJ-NP-Z]{4,8}$/;

// ----------------------------------------------------
// Constant-Time String Comparison (Timing-Attack Resistant)
// ----------------------------------------------------
function safeCompareTokens(a: unknown, b: unknown): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length || a.length === 0) return false;
  try {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

// ----------------------------------------------------
// Server-Side Room & Player Storage
// ----------------------------------------------------
interface ServerRoomData {
  roomId: string;
  roomCode: string;
  gameType: GameType;
  hostPlayer: Player;
  guestPlayer: Player | null;
  hostToken: string;
  guestToken: string | null;
  hostSocketId: string | null;
  guestSocketId: string | null;
  hostConnected: boolean;
  guestConnected: boolean;
  boardConfig?: BoardConfig;
  dotsConfig?: DotsBoardConfig;
  c4Config?: ConnectFourConfig;
  gameState?: GameState;
  dotsGameState?: DotsGameState;
  c4GameState?: ConnectFourGameState;
  status: 'waiting' | 'active' | 'finished' | 'abandoned';
  version: number;
  hostLastSeen: number;
  guestLastSeen?: number;
  rematchRequestedBy: string | null;
  rematchVotes: { [playerId: string]: boolean };
  lastAction?: OnlineActionRecord;
  createdAt: number;
  updatedAt: number;
}

const rooms = new Map<string, ServerRoomData>();
const socketToPlayer = new Map<string, { roomCode: string; playerId: string; playerToken: string }>();
const disconnectTimers = new Map<string, NodeJS.Timeout>();
const rateLimitMap = new Map<string, { lastMove: number; lastReaction: number; reactionCount: number; roomCreations: number; lastReset: number }>();
const restRateLimitMap = new Map<string, { count: number; lastReset: number }>();

// Helper to generate 5-character alphanumeric room codes (avoiding confusing letters like 0/O, 1/I)
const ROOM_CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 5; i++) {
    const idx = Math.floor(Math.random() * ROOM_CODE_CHARS.length);
    code += ROOM_CODE_CHARS[idx];
  }
  return code;
}

function generateSecureToken(): string {
  return 'tok_' + crypto.randomBytes(24).toString('hex');
}

// Convert internal ServerRoomData to safe PublicRoomState (stripping secret tokens and sockets)
function getPublicRoomState(room: ServerRoomData): PublicRoomState {
  return {
    roomId: room.roomId,
    roomCode: room.roomCode,
    gameType: room.gameType,
    hostPlayer: { ...room.hostPlayer },
    guestPlayer: room.guestPlayer ? { ...room.guestPlayer } : null,
    hostConnected: room.hostConnected,
    guestConnected: room.guestConnected,
    boardConfig: room.boardConfig,
    dotsConfig: room.dotsConfig,
    c4Config: room.c4Config,
    gameState: room.gameState ? JSON.parse(JSON.stringify(room.gameState)) : undefined,
    dotsGameState: room.dotsGameState ? JSON.parse(JSON.stringify(room.dotsGameState)) : undefined,
    c4GameState: room.c4GameState ? JSON.parse(JSON.stringify(room.c4GameState)) : undefined,
    status: room.status,
    version: room.version,
    hostLastSeen: room.hostLastSeen,
    guestLastSeen: room.guestLastSeen,
    rematchRequestedBy: room.rematchRequestedBy,
    rematchVotes: { ...room.rematchVotes },
    lastAction: room.lastAction,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt
  };
}

// Sanitize and escape raw text strings to prevent HTML/script injection
function sanitizeText(raw: unknown, maxLength: number, fallback: string): string {
  if (typeof raw !== 'string') return fallback;
  const stripped = raw
    .replace(/[<>'"\\&]/g, '') // Strip HTML tags and dangerous characters
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Strip ASCII control characters
    .trim();
  return stripped.length > 0 ? stripped.slice(0, maxLength) : fallback;
}

// Strictly sanitize player profile data from untrusted clients
function sanitizePlayer(raw: any, defaultId: string): Player {
  const cleanId = typeof raw?.id === 'string' && SAFE_ID_REGEX.test(raw.id.trim())
    ? raw.id.trim()
    : (SAFE_ID_REGEX.test(defaultId) ? defaultId : 'p_' + crypto.randomBytes(4).toString('hex'));

  const cleanName = sanitizeText(raw?.name, 20, 'Player');

  const cleanAvatar = typeof raw?.avatar === 'string' && ALLOWED_AVATARS.has(raw.avatar)
    ? raw.avatar
    : 'flame';

  const cleanColorKey = typeof raw?.colorKey === 'string' && ALLOWED_COLOR_KEYS.has(raw.colorKey)
    ? raw.colorKey
    : 'coral';

  let cleanPhotoUrl: string | undefined = undefined;
  if (
    typeof raw?.photoUrl === 'string' &&
    raw.photoUrl.length <= 150000 && // 150KB maximum payload limit
    SAFE_IMAGE_DATA_URL_REGEX.test(raw.photoUrl)
  ) {
    cleanPhotoUrl = raw.photoUrl;
  }

  return {
    id: cleanId,
    name: cleanName,
    avatar: cleanAvatar,
    colorKey: cleanColorKey,
    photoUrl: cleanPhotoUrl,
    score: 0
  };
}

// ----------------------------------------------------
// REST API with Rate Limiting
// ----------------------------------------------------
function checkRestRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = restRateLimitMap.get(ip) || { count: 0, lastReset: now };
  if (now - entry.lastReset > 60000) {
    entry.count = 0;
    entry.lastReset = now;
  }
  entry.count += 1;
  restRateLimitMap.set(ip, entry);
  return entry.count <= 60; // Max 60 requests per minute
}

app.get('/api/health', (req, res) => {
  const clientIp = req.ip || 'unknown';
  if (!checkRestRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  res.json({
    status: 'ok',
    engine: 'TinT Production Authoritative Real-time Game Engine',
    activeRooms: rooms.size,
    timestamp: Date.now()
  });
});

app.get('/api/rooms/:code', (req, res) => {
  const clientIp = req.ip || 'unknown';
  if (!checkRestRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const rawCode = (req.params.code || '').trim().toUpperCase();
  if (!SAFE_ROOM_CODE_REGEX.test(rawCode)) {
    return res.status(400).json({ error: 'Invalid room code format' });
  }

  const room = rooms.get(rawCode);
  if (!room || room.status === 'abandoned') {
    return res.status(404).json({ error: 'Room not found' });
  }

  res.json({
    roomCode: room.roomCode,
    gameType: room.gameType,
    status: room.status,
    host: room.hostPlayer.name,
    guest: room.guestPlayer ? room.guestPlayer.name : null
  });
});

// ----------------------------------------------------
// Real-time Socket Event Handlers
// ----------------------------------------------------
io.on('connection', (socket: Socket) => {
  // 1. CREATE ROOM
  socket.on(
    'create_room',
    (
      payload: {
        gameType?: GameType;
        hostPlayer: Player;
        config?: any;
      },
      callback?: (res: { success: boolean; roomCode?: string; playerToken?: string; roomState?: PublicRoomState; error?: string }) => void
    ) => {
      try {
        if (!payload || typeof payload !== 'object') {
          if (callback) callback({ success: false, error: 'invalidPayload' });
          return;
        }

        // Global Capacity Check (DoS Mitigation)
        if (rooms.size >= MAX_GLOBAL_ROOMS) {
          if (callback) callback({ success: false, error: 'serverCapacityFull' });
          return;
        }

        // Socket Creation Rate Limit Check
        const now = Date.now();
        const socketRate = rateLimitMap.get(socket.id) || { lastMove: 0, lastReaction: 0, reactionCount: 0, roomCreations: 0, lastReset: now };
        if (now - socketRate.lastReset > 60000) {
          socketRate.roomCreations = 0;
          socketRate.lastReset = now;
        }
        if (socketRate.roomCreations >= MAX_ROOM_CREATIONS_PER_MIN) {
          if (callback) callback({ success: false, error: 'rateLimited' });
          return;
        }
        socketRate.roomCreations += 1;
        rateLimitMap.set(socket.id, socketRate);

        const gameType: GameType = payload.gameType && ALLOWED_GAME_TYPES.includes(payload.gameType)
          ? payload.gameType
          : 'tictactoe';

        let roomCode = generateRoomCode();
        let attempts = 0;
        while (rooms.has(roomCode) && attempts < 20) {
          roomCode = generateRoomCode();
          attempts++;
        }

        const hostId = typeof payload.hostPlayer?.id === 'string' && SAFE_ID_REGEX.test(payload.hostPlayer.id)
          ? payload.hostPlayer.id
          : 'host_' + crypto.randomBytes(4).toString('hex');

        const host = sanitizePlayer(payload.hostPlayer, hostId);
        const hostToken = generateSecureToken();

        const dummyGuest: Player = {
          id: 'pending_guest',
          name: '...',
          avatar: 'sparkles',
          colorKey: 'blue',
          score: 0
        };

        const serverRoom: ServerRoomData = {
          roomId: `room_${roomCode}`,
          roomCode,
          gameType,
          hostPlayer: host,
          guestPlayer: null,
          hostToken,
          guestToken: null,
          hostSocketId: socket.id,
          guestSocketId: null,
          hostConnected: true,
          guestConnected: false,
          status: 'waiting',
          version: 1,
          hostLastSeen: now,
          rematchRequestedBy: null,
          rematchVotes: {},
          createdAt: now,
          updatedAt: now
        };

        // Authoritative Game Initialization
        if (gameType === 'tictactoe') {
          const rows = Math.max(3, Math.min(15, Math.floor(Number(payload.config?.rows) || 3)));
          const cols = Math.max(3, Math.min(15, Math.floor(Number(payload.config?.cols) || 3)));
          const maxPossible = Math.min(rows, cols, 5);
          const defaultWin = getWinLengthForBoard(rows, cols);
          const winLength = Math.max(3, Math.min(maxPossible, Math.floor(Number(payload.config?.winLength) || defaultWin)));
          const bConfig: BoardConfig = { rows, cols, winLength, presetKey: sanitizeText(payload.config?.presetKey, 16, '3x3') };
          serverRoom.boardConfig = bConfig;
          serverRoom.gameState = {
            id: `game_${now}`,
            mode: 'online',
            boardConfig: bConfig,
            board: createInitialBoard(rows, cols),
            players: [host, dummyGuest],
            currentPlayerIndex: 0,
            status: 'idle',
            winnerPlayerId: null,
            winningCells: [],
            moveCount: 0,
            movesHistory: [],
            createdAt: now
          };
        } else if (gameType === 'dotsboxes') {
          const dotRows = Math.max(3, Math.min(7, Math.floor(Number(payload.config?.dotRows) || 4)));
          const dotCols = Math.max(3, Math.min(7, Math.floor(Number(payload.config?.dotCols) || 4)));
          const dConfig: DotsBoardConfig = { dotRows, dotCols, presetKey: sanitizeText(payload.config?.presetKey, 16, 'classic-3x3') };
          serverRoom.dotsConfig = dConfig;
          const dotsState = createInitialDotsState([host, dummyGuest], dConfig, 'online');
          dotsState.status = 'idle';
          serverRoom.dotsGameState = dotsState;
        } else if (gameType === 'connectfour') {
          const rows = Math.max(4, Math.min(8, Math.floor(Number(payload.config?.rows) || 6)));
          const cols = Math.max(5, Math.min(9, Math.floor(Number(payload.config?.cols) || 7)));
          const winLength = 4;
          const cConfig: ConnectFourConfig = { rows, cols, winLength, presetKey: sanitizeText(payload.config?.presetKey, 16, '7x6') };
          serverRoom.c4Config = cConfig;
          serverRoom.c4GameState = {
            id: `c4_${now}`,
            gameType: 'connectfour',
            mode: 'online',
            config: cConfig,
            board: createEmptyConnectFourBoard(rows, cols),
            players: [host, dummyGuest],
            currentPlayerIndex: 0,
            status: 'idle',
            winnerPlayerId: null,
            winningCells: [],
            lastDrop: null,
            moveCount: 0,
            createdAt: now
          };
        }

        rooms.set(roomCode, serverRoom);
        socket.join(`room_${roomCode}`);
        socketToPlayer.set(socket.id, { roomCode, playerId: host.id, playerToken: hostToken });

        if (callback) {
          callback({
            success: true,
            roomCode,
            playerToken: hostToken,
            roomState: getPublicRoomState(serverRoom)
          });
        }
      } catch (err: any) {
        console.error('Error creating room:', err);
        if (callback) callback({ success: false, error: 'internalServerError' });
      }
    }
  );

  // 2. JOIN ROOM
  socket.on(
    'join_room',
    (
      payload: { roomCode: string; guestPlayer: Player; playerToken?: string },
      callback?: (res: { success: boolean; playerToken?: string; roomState?: PublicRoomState; error?: string }) => void
    ) => {
      try {
        if (!payload || typeof payload !== 'object') {
          if (callback) callback({ success: false, error: 'invalidPayload' });
          return;
        }

        const rawCode = (payload.roomCode || '').trim().toUpperCase();
        if (!SAFE_ROOM_CODE_REGEX.test(rawCode)) {
          if (callback) callback({ success: false, error: 'invalidRoomCode' });
          return;
        }

        const room = rooms.get(rawCode);
        if (!room || room.status === 'abandoned') {
          if (callback) callback({ success: false, error: 'roomNotFound' });
          return;
        }

        // Timing-Safe Reconnect Token Authentication for Host
        if (safeCompareTokens(payload.playerToken, room.hostToken)) {
          room.hostSocketId = socket.id;
          room.hostConnected = true;
          room.hostLastSeen = Date.now();
          socket.join(`room_${rawCode}`);
          socketToPlayer.set(socket.id, { roomCode: rawCode, playerId: room.hostPlayer.id, playerToken: room.hostToken });
          if (callback) callback({ success: true, playerToken: room.hostToken, roomState: getPublicRoomState(room) });
          return;
        }

        // Timing-Safe Reconnect Token Authentication for Guest
        if (room.guestToken && safeCompareTokens(payload.playerToken, room.guestToken)) {
          room.guestSocketId = socket.id;
          room.guestConnected = true;
          room.guestLastSeen = Date.now();
          socket.join(`room_${rawCode}`);
          socketToPlayer.set(socket.id, { roomCode: rawCode, playerId: room.guestPlayer!.id, playerToken: room.guestToken });
          if (callback) callback({ success: true, playerToken: room.guestToken, roomState: getPublicRoomState(room) });
          return;
        }

        // Enforce 2-Player Room Security
        if (room.status === 'active' && room.guestPlayer) {
          if (callback) callback({ success: false, error: 'roomFull' });
          return;
        }

        if (room.status !== 'waiting') {
          if (callback) callback({ success: false, error: 'roomNotFound' });
          return;
        }

        const guestId = typeof payload.guestPlayer?.id === 'string' && SAFE_ID_REGEX.test(payload.guestPlayer.id)
          ? payload.guestPlayer.id
          : 'guest_' + crypto.randomBytes(4).toString('hex');

        const guest = sanitizePlayer(payload.guestPlayer, guestId);
        const guestToken = generateSecureToken();

        room.guestPlayer = guest;
        room.guestToken = guestToken;
        room.guestSocketId = socket.id;
        room.guestConnected = true;
        room.guestLastSeen = Date.now();
        room.status = 'active';
        room.version += 1;
        room.updatedAt = Date.now();

        // Update active players and start playing state in authoritative game
        const updatedPlayers: [Player, Player] = [room.hostPlayer, guest];
        if (room.gameState) {
          room.gameState.players = updatedPlayers;
          room.gameState.status = 'playing';
        }
        if (room.dotsGameState) {
          room.dotsGameState.players = updatedPlayers;
          room.dotsGameState.playerScores = {
            [room.hostPlayer.id]: 0,
            [guest.id]: 0
          };
          room.dotsGameState.status = 'playing';
        }
        if (room.c4GameState) {
          room.c4GameState.players = updatedPlayers;
          room.c4GameState.status = 'playing';
        }

        socket.join(`room_${rawCode}`);
        socketToPlayer.set(socket.id, { roomCode: rawCode, playerId: guest.id, playerToken: guestToken });

        // Broadcast authoritative room state
        const pubState = getPublicRoomState(room);
        io.to(`room_${rawCode}`).emit('room_updated', pubState);

        if (callback) {
          callback({ success: true, playerToken: guestToken, roomState: pubState });
        }
      } catch (err: any) {
        console.error('Error joining room:', err);
        if (callback) callback({ success: false, error: 'internalServerError' });
      }
    }
  );

  // 3. RECONNECT / RESUME SESSION
  socket.on(
    'reconnect_room',
    (
      payload: { roomCode: string; playerId: string; playerToken: string },
      callback?: (res: { success: boolean; roomState?: PublicRoomState; error?: string }) => void
    ) => {
      try {
        if (!payload || typeof payload !== 'object') {
          if (callback) callback({ success: false, error: 'invalidPayload' });
          return;
        }

        const rawCode = (payload.roomCode || '').trim().toUpperCase();
        if (!SAFE_ROOM_CODE_REGEX.test(rawCode)) {
          if (callback) callback({ success: false, error: 'invalidRoomCode' });
          return;
        }

        const room = rooms.get(rawCode);
        if (!room || room.status === 'abandoned') {
          if (callback) callback({ success: false, error: 'roomExpired' });
          return;
        }

        const isHost = safeCompareTokens(payload.playerToken, room.hostToken);
        const isGuest = room.guestToken ? safeCompareTokens(payload.playerToken, room.guestToken) : false;

        if (!isHost && !isGuest) {
          if (callback) callback({ success: false, error: 'unauthorized' });
          return;
        }

        const cleanPlayerId = sanitizeText(payload.playerId, 64, '');
        const timerKey = `${rawCode}_${cleanPlayerId}`;
        const existingTimer = disconnectTimers.get(timerKey);
        if (existingTimer) {
          clearTimeout(existingTimer);
          disconnectTimers.delete(timerKey);
        }

        if (isHost) {
          room.hostSocketId = socket.id;
          room.hostConnected = true;
          room.hostLastSeen = Date.now();
        } else {
          room.guestSocketId = socket.id;
          room.guestConnected = true;
          room.guestLastSeen = Date.now();
        }

        socket.join(`room_${rawCode}`);
        socketToPlayer.set(socket.id, {
          roomCode: rawCode,
          playerId: isHost ? room.hostPlayer.id : room.guestPlayer!.id,
          playerToken: payload.playerToken
        });

        const pubState = getPublicRoomState(room);
        io.to(`room_${rawCode}`).emit('player_connection_changed', {
          playerId: cleanPlayerId,
          connected: true
        });
        io.to(`room_${rawCode}`).emit('room_updated', pubState);

        if (callback) {
          callback({ success: true, roomState: pubState });
        }
      } catch (err: any) {
        console.error('Error reconnecting to room:', err);
        if (callback) callback({ success: false, error: 'internalServerError' });
      }
    }
  );

  // 4. AUTHORITATIVE GAME MOVE
  socket.on(
    'make_move',
    (
      payload: {
        roomCode: string;
        playerToken: string;
        payload: OnlineMovePayload;
        expectedVersion?: number;
      },
      callback?: (res: { success: boolean; version?: number; error?: string }) => void
    ) => {
      try {
        if (!payload || typeof payload !== 'object' || !payload.payload || typeof payload.payload !== 'object') {
          if (callback) callback({ success: false, error: 'invalidPayload' });
          return;
        }

        const rawCode = (payload.roomCode || '').trim().toUpperCase();
        if (!SAFE_ROOM_CODE_REGEX.test(rawCode)) {
          if (callback) callback({ success: false, error: 'invalidRoomCode' });
          return;
        }

        const room = rooms.get(rawCode);
        if (!room) {
          if (callback) callback({ success: false, error: 'roomNotFound' });
          return;
        }

        if (room.status !== 'active') {
          if (callback) callback({ success: false, error: 'gameNotActive' });
          return;
        }

        // Timing-Safe Authentication
        let activePlayer: Player | null = null;
        let isHost = false;

        if (safeCompareTokens(payload.playerToken, room.hostToken)) {
          activePlayer = room.hostPlayer;
          isHost = true;
        } else if (room.guestToken && safeCompareTokens(payload.playerToken, room.guestToken)) {
          activePlayer = room.guestPlayer;
          isHost = false;
        }

        if (!activePlayer) {
          if (callback) callback({ success: false, error: 'unauthorized' });
          return;
        }

        // Move Rate Limiting per Socket (min 50ms interval between moves)
        const now = Date.now();
        const rateInfo = rateLimitMap.get(socket.id) || { lastMove: 0, lastReaction: 0, reactionCount: 0, roomCreations: 0, lastReset: now };
        if (now - rateInfo.lastMove < 50) {
          if (callback) callback({ success: false, error: 'rateLimited' });
          return;
        }
        rateInfo.lastMove = now;
        rateLimitMap.set(socket.id, rateInfo);

        // Sequence number check
        if (typeof payload.expectedVersion === 'number' && Number.isInteger(payload.expectedVersion) && payload.expectedVersion < room.version) {
          if (callback) callback({ success: false, version: room.version, error: 'staleVersion' });
          socket.emit('room_updated', getPublicRoomState(room));
          return;
        }

        const moveData = payload.payload;

        // 4A. TIC-TAC-TOE MOVE VALIDATION
        if (room.gameType === 'tictactoe' && moveData.gameType === 'tictactoe' && room.gameState) {
          const gs = room.gameState;
          if (gs.status !== 'playing') {
            if (callback) callback({ success: false, error: 'gameNotPlaying' });
            return;
          }

          const currentTurnPlayer = gs.players[gs.currentPlayerIndex];
          if (!currentTurnPlayer || currentTurnPlayer.id !== activePlayer.id) {
            if (callback) callback({ success: false, error: 'notYourTurn' });
            return;
          }

          if (
            !moveData.move ||
            typeof moveData.move !== 'object' ||
            !Number.isInteger(moveData.move.row) ||
            !Number.isInteger(moveData.move.col)
          ) {
            if (callback) callback({ success: false, error: 'invalidMoveCoordinates' });
            return;
          }

          const { row, col } = moveData.move;
          if (!isValidTicTacToeMove(gs.board, row, col)) {
            if (callback) callback({ success: false, error: 'invalidMove' });
            return;
          }

          // Apply move
          const newBoard = makeTicTacToeMove(gs.board, row, col, activePlayer.id);
          const winResult = checkTicTacToeWin(newBoard, row, col, gs.boardConfig.winLength);

          let isWin = false;
          let isDraw = false;

          if (winResult.isWin) {
            isWin = true;
            gs.status = 'won';
            gs.winnerPlayerId = activePlayer.id;
            gs.winningCells = winResult.winningCells;
            room.status = 'finished';
            if (isHost) room.hostPlayer.score += 1;
            else if (room.guestPlayer) room.guestPlayer.score += 1;
          } else if (isTicTacToeBoardFull(newBoard)) {
            isDraw = true;
            gs.status = 'draw';
            room.status = 'finished';
          } else {
            gs.currentPlayerIndex = 1 - gs.currentPlayerIndex;
          }

          gs.board = newBoard;
          gs.moveCount += 1;
          gs.movesHistory.push({
            playerId: activePlayer.id,
            row,
            col,
            timestamp: now
          });

          room.lastAction = {
            type: 'tictactoe_move',
            row,
            col,
            playerId: activePlayer.id,
            isWin,
            isDraw,
            winningCells: winResult.winningCells
          };
        }
        // 4B. DOTS & BOXES MOVE VALIDATION
        else if (room.gameType === 'dotsboxes' && moveData.gameType === 'dotsboxes' && room.dotsGameState) {
          const ds = room.dotsGameState;
          if (ds.status !== 'playing') {
            if (callback) callback({ success: false, error: 'gameNotPlaying' });
            return;
          }

          const currentTurnPlayer = ds.players[ds.currentPlayerIndex];
          if (!currentTurnPlayer || currentTurnPlayer.id !== activePlayer.id) {
            if (callback) callback({ success: false, error: 'notYourTurn' });
            return;
          }

          if (
            !moveData.line ||
            typeof moveData.line !== 'object' ||
            (moveData.line.orientation !== 'horizontal' && moveData.line.orientation !== 'vertical') ||
            !Number.isInteger(moveData.line.row) ||
            !Number.isInteger(moveData.line.col)
          ) {
            if (callback) callback({ success: false, error: 'invalidLineData' });
            return;
          }

          const line = moveData.line;
          if (!isLegalDotsLine(line, ds.horizontalLines, ds.verticalLines)) {
            if (callback) callback({ success: false, error: 'invalidLine' });
            return;
          }

          const { orientation, row, col } = line;
          if (orientation === 'horizontal') {
            ds.horizontalLines[row][col] = activePlayer.id;
          } else {
            ds.verticalLines[row][col] = activePlayer.id;
          }
          line.ownerId = activePlayer.id;
          ds.lastLine = line;

          const boxRows = ds.config.dotRows - 1;
          const boxCols = ds.config.dotCols - 1;
          const newlyCompleted: { row: number; col: number }[] = [];

          const potentialBoxes: { r: number; c: number }[] = [];
          if (orientation === 'horizontal') {
            if (row > 0) potentialBoxes.push({ r: row - 1, c: col });
            if (row < boxRows) potentialBoxes.push({ r: row, c: col });
          } else {
            if (col > 0) potentialBoxes.push({ r: row, c: col - 1 });
            if (col < boxCols) potentialBoxes.push({ r: row, c: col });
          }

          for (const { r, c } of potentialBoxes) {
            if (r >= 0 && r < boxRows && c >= 0 && c < boxCols && ds.boxes[r][c] === null) {
              if (isBoxComplete(r, c, ds.horizontalLines, ds.verticalLines)) {
                ds.boxes[r][c] = activePlayer.id;
                newlyCompleted.push({ row: r, col: c });
                ds.playerScores[activePlayer.id] = (ds.playerScores[activePlayer.id] || 0) + 1;
              }
            }
          }

          ds.lastCompletedBoxes = newlyCompleted;
          const hasBonus = newlyCompleted.length > 0;
          ds.consecutiveTurn = hasBonus;

          if (!hasBonus) {
            ds.currentPlayerIndex = 1 - ds.currentPlayerIndex;
          }

          let totalCaptured = 0;
          for (let r = 0; r < boxRows; r++) {
            for (let c = 0; c < boxCols; c++) {
              if (ds.boxes[r][c] !== null) totalCaptured++;
            }
          }

          let isGameOver = false;
          if (totalCaptured === boxRows * boxCols) {
            isGameOver = true;
            room.status = 'finished';
            const p1Score = ds.playerScores[room.hostPlayer.id] || 0;
            const p2Score = room.guestPlayer ? ds.playerScores[room.guestPlayer.id] || 0 : 0;

            if (p1Score > p2Score) {
              ds.status = 'won';
              ds.winnerPlayerId = room.hostPlayer.id;
              room.hostPlayer.score += 1;
            } else if (p2Score > p1Score && room.guestPlayer) {
              ds.status = 'won';
              ds.winnerPlayerId = room.guestPlayer.id;
              room.guestPlayer.score += 1;
            } else {
              ds.status = 'draw';
              ds.winnerPlayerId = null;
            }
          }

          ds.moveCount += 1;
          room.lastAction = {
            type: 'dots_move',
            line,
            playerId: activePlayer.id,
            completedBoxes: newlyCompleted,
            consecutiveTurn: hasBonus,
            isGameOver
          };
        }
        // 4C. CONNECT FOUR MOVE VALIDATION
        else if (room.gameType === 'connectfour' && moveData.gameType === 'connectfour' && room.c4GameState) {
          const c4 = room.c4GameState;
          if (c4.status !== 'playing') {
            if (callback) callback({ success: false, error: 'gameNotPlaying' });
            return;
          }

          const currentTurnPlayer = c4.players[c4.currentPlayerIndex];
          if (!currentTurnPlayer || currentTurnPlayer.id !== activePlayer.id) {
            if (callback) callback({ success: false, error: 'notYourTurn' });
            return;
          }

          if (!Number.isInteger(moveData.col)) {
            if (callback) callback({ success: false, error: 'invalidColumn' });
            return;
          }

          const col = moveData.col;
          if (!isValidColumnDrop(c4.board, col)) {
            if (callback) callback({ success: false, error: 'columnFull' });
            return;
          }

          const targetRow = getLowestAvailableRow(c4.board, col);
          if (targetRow === -1) {
            if (callback) callback({ success: false, error: 'columnFull' });
            return;
          }

          c4.board[targetRow][col] = activePlayer.id;
          c4.lastDrop = { row: targetRow, col };

          const winResult = checkConnectFourWin(c4.board, c4.config.winLength);
          let isWin = false;
          let isDraw = false;

          if (winResult) {
            isWin = true;
            c4.status = 'won';
            c4.winnerPlayerId = activePlayer.id;
            c4.winningCells = winResult.winningCells;
            room.status = 'finished';
            if (isHost) room.hostPlayer.score += 1;
            else if (room.guestPlayer) room.guestPlayer.score += 1;
          } else if (isConnectFourBoardFull(c4.board)) {
            isDraw = true;
            c4.status = 'draw';
            room.status = 'finished';
          } else {
            c4.currentPlayerIndex = 1 - c4.currentPlayerIndex;
          }

          c4.moveCount += 1;
          room.lastAction = {
            type: 'c4_drop',
            col,
            droppedRow: targetRow,
            playerId: activePlayer.id,
            isWin,
            isDraw,
            winningCells: winResult ? winResult.winningCells : []
          };
        } else {
          if (callback) callback({ success: false, error: 'unsupportedGameAction' });
          return;
        }

        room.version += 1;
        room.updatedAt = now;

        const pubState = getPublicRoomState(room);
        io.to(`room_${rawCode}`).emit('room_updated', pubState);

        if (callback) {
          callback({ success: true, version: room.version });
        }
      } catch (err: any) {
        console.error('Error executing authoritative move:', err);
        if (callback) callback({ success: false, error: 'internalServerError' });
      }
    }
  );

  // 5. REMATCH REQUEST (Consensus-based)
  socket.on(
    'request_rematch',
    (
      payload: { roomCode: string; playerToken: string },
      callback?: (res: { success: boolean; error?: string }) => void
    ) => {
      try {
        if (!payload || typeof payload !== 'object') {
          if (callback) callback({ success: false, error: 'invalidPayload' });
          return;
        }

        const rawCode = (payload.roomCode || '').trim().toUpperCase();
        if (!SAFE_ROOM_CODE_REGEX.test(rawCode)) {
          if (callback) callback({ success: false, error: 'invalidRoomCode' });
          return;
        }

        const room = rooms.get(rawCode);
        if (!room) {
          if (callback) callback({ success: false, error: 'roomNotFound' });
          return;
        }

        let playerId: string | null = null;
        if (safeCompareTokens(payload.playerToken, room.hostToken)) {
          playerId = room.hostPlayer.id;
        } else if (room.guestToken && safeCompareTokens(payload.playerToken, room.guestToken)) {
          playerId = room.guestPlayer?.id || null;
        }

        if (!playerId) {
          if (callback) callback({ success: false, error: 'unauthorized' });
          return;
        }

        room.rematchVotes[playerId] = true;

        const hostVoted = room.rematchVotes[room.hostPlayer.id];
        const guestVoted = room.guestPlayer ? room.rematchVotes[room.guestPlayer.id] : false;

        if (hostVoted && guestVoted && room.guestPlayer) {
          const now = Date.now();
          const players: [Player, Player] = [room.hostPlayer, room.guestPlayer];

          if (room.gameType === 'tictactoe' && room.boardConfig) {
            room.gameState = {
              id: `game_${now}`,
              mode: 'online',
              boardConfig: room.boardConfig,
              board: createInitialBoard(room.boardConfig.rows, room.boardConfig.cols),
              players,
              currentPlayerIndex: 0,
              status: 'playing',
              winnerPlayerId: null,
              winningCells: [],
              moveCount: 0,
              movesHistory: [],
              createdAt: now
            };
          } else if (room.gameType === 'dotsboxes' && room.dotsConfig) {
            const freshDots = createInitialDotsState(players, room.dotsConfig, 'online');
            freshDots.status = 'playing';
            room.dotsGameState = freshDots;
          } else if (room.gameType === 'connectfour' && room.c4Config) {
            room.c4GameState = {
              id: `c4_${now}`,
              gameType: 'connectfour',
              mode: 'online',
              config: room.c4Config,
              board: createEmptyConnectFourBoard(room.c4Config.rows, room.c4Config.cols),
              players,
              currentPlayerIndex: 0,
              status: 'playing',
              winnerPlayerId: null,
              winningCells: [],
              lastDrop: null,
              moveCount: 0,
              createdAt: now
            };
          }

          room.rematchVotes = {};
          room.rematchRequestedBy = null;
          room.status = 'active';
          room.version += 1;
          room.updatedAt = now;
        } else {
          room.rematchRequestedBy = playerId;
          room.updatedAt = Date.now();
        }

        io.to(`room_${rawCode}`).emit('room_updated', getPublicRoomState(room));
        if (callback) callback({ success: true });
      } catch (err: any) {
        console.error('Error requesting rematch:', err);
        if (callback) callback({ success: false, error: 'internalServerError' });
      }
    }
  );

  // 6. QUICK REACTION EMOJIS (Strict Rate-Limiting & Sanitization)
  socket.on(
    'send_reaction',
    (payload: { roomCode: string; playerToken: string; emoji: string }) => {
      try {
        if (!payload || typeof payload !== 'object') return;

        const rawCode = (payload.roomCode || '').trim().toUpperCase();
        if (!SAFE_ROOM_CODE_REGEX.test(rawCode)) return;

        const room = rooms.get(rawCode);
        if (!room) return;

        let player: Player | null = null;
        if (safeCompareTokens(payload.playerToken, room.hostToken)) {
          player = room.hostPlayer;
        } else if (room.guestToken && safeCompareTokens(payload.playerToken, room.guestToken)) {
          player = room.guestPlayer;
        }
        if (!player) return;

        // Rate limit: max 4 reactions per 2 seconds
        const now = Date.now();
        const rateInfo = rateLimitMap.get(socket.id) || { lastMove: 0, lastReaction: 0, reactionCount: 0, roomCreations: 0, lastReset: now };
        if (now - rateInfo.lastReaction > 2000) {
          rateInfo.reactionCount = 0;
        }
        if (rateInfo.reactionCount >= 4) {
          return;
        }
        rateInfo.lastReaction = now;
        rateInfo.reactionCount += 1;
        rateLimitMap.set(socket.id, rateInfo);

        // Sanitize emoji character
        const safeEmoji = sanitizeText(payload.emoji, 4, '👍');
        io.to(`room_${rawCode}`).emit('reaction_received', {
          roomCode: rawCode,
          emoji: safeEmoji,
          senderName: player.name,
          senderId: player.id
        });
      } catch (err) {
        console.error('Error sending reaction:', err);
      }
    }
  );

  // 7. LEAVE ROOM
  socket.on('leave_room', (payload: { roomCode: string; playerToken: string }) => {
    try {
      if (!payload || typeof payload !== 'object') return;

      const rawCode = (payload.roomCode || '').trim().toUpperCase();
      if (!SAFE_ROOM_CODE_REGEX.test(rawCode)) return;

      const room = rooms.get(rawCode);
      if (room) {
        const isHost = safeCompareTokens(payload.playerToken, room.hostToken);
        const isGuest = room.guestToken ? safeCompareTokens(payload.playerToken, room.guestToken) : false;

        if (isHost || isGuest) {
          room.status = 'abandoned';
          room.updatedAt = Date.now();
          const leavingId = isHost ? room.hostPlayer.id : (room.guestPlayer?.id || 'guest');
          io.to(`room_${rawCode}`).emit('opponent_left', { playerId: leavingId });
          io.to(`room_${rawCode}`).emit('room_updated', getPublicRoomState(room));
        }
      }
      socket.leave(`room_${rawCode}`);
      socketToPlayer.delete(socket.id);
    } catch (err) {
      console.error('Error leaving room:', err);
    }
  });

  // 8. DISCONNECT HANDLING WITH GRACE PERIOD & CLEANUP
  socket.on('disconnect', () => {
    rateLimitMap.delete(socket.id);
    const info = socketToPlayer.get(socket.id);
    if (!info) return;

    const { roomCode, playerId, playerToken } = info;
    socketToPlayer.delete(socket.id);

    const room = rooms.get(roomCode);
    if (!room) return;

    const isHost = safeCompareTokens(playerToken, room.hostToken);
    const isGuest = room.guestToken ? safeCompareTokens(playerToken, room.guestToken) : false;

    if (!isHost && !isGuest) return;

    if (isHost) {
      room.hostConnected = false;
      room.hostLastSeen = Date.now();
    } else {
      room.guestConnected = false;
      room.guestLastSeen = Date.now();
    }

    io.to(`room_${roomCode}`).emit('player_connection_changed', {
      playerId,
      connected: false
    });
    io.to(`room_${roomCode}`).emit('room_updated', getPublicRoomState(room));

    // 75-second grace timer
    const timerKey = `${roomCode}_${playerId}`;
    const timer = setTimeout(() => {
      disconnectTimers.delete(timerKey);
      const currentRoom = rooms.get(roomCode);
      if (currentRoom) {
        const stillDisconnected = isHost ? !currentRoom.hostConnected : !currentRoom.guestConnected;
        if (stillDisconnected && currentRoom.status === 'active') {
          currentRoom.status = 'abandoned';
          currentRoom.updatedAt = Date.now();
          io.to(`room_${roomCode}`).emit('opponent_left', { playerId });
          io.to(`room_${roomCode}`).emit('room_updated', getPublicRoomState(currentRoom));
        }
      }
    }, 75000);

    disconnectTimers.set(timerKey, timer);
  });
});

// Periodic garbage collection for expired rooms and rate limit maps
setInterval(() => {
  const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
  for (const [code, r] of rooms.entries()) {
    if (r.updatedAt < thirtyMinutesAgo) {
      rooms.delete(code);
    }
  }

  const oneMinuteAgo = Date.now() - 60 * 1000;
  for (const [ip, entry] of restRateLimitMap.entries()) {
    if (entry.lastReset < oneMinuteAgo) {
      restRateLimitMap.delete(ip);
    }
  }
}, 3 * 60 * 1000);

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
    console.log(`⚡ TinT Production Real-time Game Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();


