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

// Socket.IO Server configuration
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 25000,
  pingInterval: 10000
});

app.use(express.json({ limit: '5mb' }));

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
const rateLimitMap = new Map<string, { lastMove: number; lastReaction: number; reactionCount: number }>();

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
  return 'tok_' + crypto.randomBytes(16).toString('hex');
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

// Sanitize player data sent from client
function sanitizePlayer(raw: any, defaultId: string): Player {
  return {
    id: typeof raw?.id === 'string' && raw.id.trim().length > 0 ? raw.id.trim() : defaultId,
    name: typeof raw?.name === 'string' && raw.name.trim().length > 0 ? raw.name.trim().slice(0, 24) : 'Player',
    avatar: typeof raw?.avatar === 'string' ? raw.avatar : 'flame',
    colorKey: typeof raw?.colorKey === 'string' ? raw.colorKey : 'coral',
    photoUrl: typeof raw?.photoUrl === 'string' && raw.photoUrl.startsWith('data:image') ? raw.photoUrl.slice(0, 500000) : undefined,
    score: 0
  };
}

// REST API Health & Room Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    engine: 'TinT Production Authoritative Real-time Game Engine',
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
        const gameType: GameType = payload.gameType && ['tictactoe', 'dotsboxes', 'connectfour'].includes(payload.gameType)
          ? payload.gameType
          : 'tictactoe';

        let roomCode = generateRoomCode();
        while (rooms.has(roomCode)) {
          roomCode = generateRoomCode();
        }

        const hostId = payload.hostPlayer?.id || 'host_' + socket.id.slice(0, 6);
        const host = sanitizePlayer(payload.hostPlayer, hostId);
        const hostToken = generateSecureToken();

        const dummyGuest: Player = {
          id: 'pending_guest',
          name: '...',
          avatar: 'sparkles',
          colorKey: 'blue',
          score: 0
        };

        const now = Date.now();
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

        // Initialize authoritative game state based on gameType
        if (gameType === 'tictactoe') {
          const rows = Math.max(3, Math.min(15, Number(payload.config?.rows) || 3));
          const cols = Math.max(3, Math.min(15, Number(payload.config?.cols) || 3));
          const maxPossible = Math.min(rows, cols);
          const defaultWin = getWinLengthForBoard(rows, cols);
          const winLength = Math.max(3, Math.min(maxPossible, Number(payload.config?.winLength) || defaultWin));
          const bConfig: BoardConfig = { rows, cols, winLength, presetKey: payload.config?.presetKey };
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
          const dotRows = Math.max(3, Math.min(6, Number(payload.config?.dotRows) || 4));
          const dotCols = Math.max(3, Math.min(6, Number(payload.config?.dotCols) || 4));
          const dConfig: DotsBoardConfig = { dotRows, dotCols, presetKey: payload.config?.presetKey || 'classic-3x3' };
          serverRoom.dotsConfig = dConfig;
          const dotsState = createInitialDotsState([host, dummyGuest], dConfig, 'online');
          dotsState.status = 'idle';
          serverRoom.dotsGameState = dotsState;
        } else if (gameType === 'connectfour') {
          const rows = Math.max(5, Math.min(7, Number(payload.config?.rows) || 6));
          const cols = Math.max(6, Math.min(8, Number(payload.config?.cols) || 7));
          const winLength = 4;
          const cConfig: ConnectFourConfig = { rows, cols, winLength, presetKey: payload.config?.presetKey || '7x6' };
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
        if (callback) callback({ success: false, error: err.message });
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
        const code = (payload.roomCode || '').trim().toUpperCase();
        const room = rooms.get(code);

        if (!room || room.status === 'abandoned') {
          if (callback) callback({ success: false, error: 'roomNotFound' });
          return;
        }

        // Check if existing host is re-connecting via token or ID
        if (payload.playerToken && payload.playerToken === room.hostToken) {
          room.hostSocketId = socket.id;
          room.hostConnected = true;
          room.hostLastSeen = Date.now();
          socket.join(`room_${code}`);
          socketToPlayer.set(socket.id, { roomCode: code, playerId: room.hostPlayer.id, playerToken: room.hostToken });
          if (callback) callback({ success: true, playerToken: room.hostToken, roomState: getPublicRoomState(room) });
          return;
        }

        // Check if existing guest is re-connecting via token
        if (payload.playerToken && room.guestToken && payload.playerToken === room.guestToken) {
          room.guestSocketId = socket.id;
          room.guestConnected = true;
          room.guestLastSeen = Date.now();
          socket.join(`room_${code}`);
          socketToPlayer.set(socket.id, { roomCode: code, playerId: room.guestPlayer!.id, playerToken: room.guestToken });
          if (callback) callback({ success: true, playerToken: room.guestToken, roomState: getPublicRoomState(room) });
          return;
        }

        // Enforce room security: Maximum 2 players
        if (room.status === 'active' && room.guestPlayer) {
          if (callback) callback({ success: false, error: 'roomFull' });
          return;
        }

        if (room.status !== 'waiting') {
          if (callback) callback({ success: false, error: 'roomNotFound' });
          return;
        }

        const guestId = payload.guestPlayer?.id || 'guest_' + socket.id.slice(0, 6);
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

        socket.join(`room_${code}`);
        socketToPlayer.set(socket.id, { roomCode: code, playerId: guest.id, playerToken: guestToken });

        // Broadcast authoritative room state to all sockets in room
        const pubState = getPublicRoomState(room);
        io.to(`room_${code}`).emit('room_updated', pubState);

        if (callback) {
          callback({ success: true, playerToken: guestToken, roomState: pubState });
        }
      } catch (err: any) {
        console.error('Error joining room:', err);
        if (callback) callback({ success: false, error: err.message });
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
        const code = (payload.roomCode || '').trim().toUpperCase();
        const room = rooms.get(code);

        if (!room || room.status === 'abandoned') {
          if (callback) callback({ success: false, error: 'roomExpired' });
          return;
        }

        let isHost = false;
        let isGuest = false;

        if (payload.playerToken === room.hostToken) {
          isHost = true;
        } else if (room.guestToken && payload.playerToken === room.guestToken) {
          isGuest = true;
        }

        if (!isHost && !isGuest) {
          if (callback) callback({ success: false, error: 'unauthorized' });
          return;
        }

        const timerKey = `${code}_${payload.playerId}`;
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

        socket.join(`room_${code}`);
        socketToPlayer.set(socket.id, {
          roomCode: code,
          playerId: isHost ? room.hostPlayer.id : room.guestPlayer!.id,
          playerToken: payload.playerToken
        });

        const pubState = getPublicRoomState(room);
        io.to(`room_${code}`).emit('player_connection_changed', {
          playerId: payload.playerId,
          connected: true
        });
        io.to(`room_${code}`).emit('room_updated', pubState);

        if (callback) {
          callback({ success: true, roomState: pubState });
        }
      } catch (err: any) {
        console.error('Error reconnecting to room:', err);
        if (callback) callback({ success: false, error: err.message });
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
        const code = (payload.roomCode || '').trim().toUpperCase();
        const room = rooms.get(code);

        if (!room) {
          if (callback) callback({ success: false, error: 'roomNotFound' });
          return;
        }

        if (room.status !== 'active') {
          if (callback) callback({ success: false, error: 'gameNotActive' });
          return;
        }

        // Authenticate player token
        let activePlayer: Player | null = null;
        let isHost = false;

        if (payload.playerToken === room.hostToken) {
          activePlayer = room.hostPlayer;
          isHost = true;
        } else if (room.guestToken && payload.playerToken === room.guestToken) {
          activePlayer = room.guestPlayer;
          isHost = false;
        }

        if (!activePlayer) {
          if (callback) callback({ success: false, error: 'unauthorized' });
          return;
        }

        // Rate limiting
        const now = Date.now();
        const rateInfo = rateLimitMap.get(payload.playerToken) || { lastMove: 0, lastReaction: 0, reactionCount: 0 };
        if (now - rateInfo.lastMove < 40) {
          if (callback) callback({ success: false, error: 'rateLimited' });
          return;
        }
        rateInfo.lastMove = now;
        rateLimitMap.set(payload.playerToken, rateInfo);

        // Sequence number check (idempotency / race prevention)
        if (typeof payload.expectedVersion === 'number' && payload.expectedVersion < room.version) {
          // Client might have stale state; send back latest state without failing catastrophically
          if (callback) callback({ success: false, version: room.version, error: 'staleVersion' });
          socket.emit('room_updated', getPublicRoomState(room));
          return;
        }

        // EXECUTE AND VALIDATE MOVE BASED ON GAME TYPE
        const moveData = payload.payload;

        if (room.gameType === 'tictactoe' && moveData.gameType === 'tictactoe' && room.gameState) {
          const gs = room.gameState;
          if (gs.status !== 'playing') {
            if (callback) callback({ success: false, error: 'gameNotPlaying' });
            return;
          }

          const currentTurnPlayer = gs.players[gs.currentPlayerIndex];
          if (currentTurnPlayer.id !== activePlayer.id) {
            if (callback) callback({ success: false, error: 'notYourTurn' });
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
        } else if (room.gameType === 'dotsboxes' && moveData.gameType === 'dotsboxes' && room.dotsGameState) {
          const ds = room.dotsGameState;
          if (ds.status !== 'playing') {
            if (callback) callback({ success: false, error: 'gameNotPlaying' });
            return;
          }

          const currentTurnPlayer = ds.players[ds.currentPlayerIndex];
          if (currentTurnPlayer.id !== activePlayer.id) {
            if (callback) callback({ success: false, error: 'notYourTurn' });
            return;
          }

          const line = moveData.line;
          if (!isLegalDotsLine(line, ds.horizontalLines, ds.verticalLines)) {
            if (callback) callback({ success: false, error: 'invalidLine' });
            return;
          }

          // Apply line
          const { orientation, row, col } = line;
          if (orientation === 'horizontal') {
            ds.horizontalLines[row][col] = activePlayer.id;
          } else {
            ds.verticalLines[row][col] = activePlayer.id;
          }
          line.ownerId = activePlayer.id;
          ds.lastLine = line;

          // Check for completed boxes
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
          let hasBonus = newlyCompleted.length > 0;
          ds.consecutiveTurn = hasBonus;

          if (!hasBonus) {
            ds.currentPlayerIndex = 1 - ds.currentPlayerIndex;
          }

          // Check if all boxes are captured
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
        } else if (room.gameType === 'connectfour' && moveData.gameType === 'connectfour' && room.c4GameState) {
          const c4 = room.c4GameState;
          if (c4.status !== 'playing') {
            if (callback) callback({ success: false, error: 'gameNotPlaying' });
            return;
          }

          const currentTurnPlayer = c4.players[c4.currentPlayerIndex];
          if (currentTurnPlayer.id !== activePlayer.id) {
            if (callback) callback({ success: false, error: 'notYourTurn' });
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

          // Apply drop
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

        // Monotonically increase version sequence number
        room.version += 1;
        room.updatedAt = now;

        // Broadcast authoritative room state to all clients in room
        const pubState = getPublicRoomState(room);
        io.to(`room_${code}`).emit('room_updated', pubState);

        if (callback) {
          callback({ success: true, version: room.version });
        }
      } catch (err: any) {
        console.error('Error executing authoritative move:', err);
        if (callback) callback({ success: false, error: err.message });
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
        const code = (payload.roomCode || '').trim().toUpperCase();
        const room = rooms.get(code);
        if (!room) {
          if (callback) callback({ success: false, error: 'roomNotFound' });
          return;
        }

        let playerId: string | null = null;
        if (payload.playerToken === room.hostToken) {
          playerId = room.hostPlayer.id;
        } else if (room.guestToken && payload.playerToken === room.guestToken) {
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
          // Both agreed: reset board authoritatively with existing players and config
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

        io.to(`room_${code}`).emit('room_updated', getPublicRoomState(room));
        if (callback) callback({ success: true });
      } catch (err: any) {
        console.error('Error requesting rematch:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    }
  );

  // 6. QUICK REACTION EMOJIS (Rate-limited)
  socket.on(
    'send_reaction',
    (payload: { roomCode: string; playerToken: string; emoji: string }) => {
      try {
        const code = (payload.roomCode || '').trim().toUpperCase();
        const room = rooms.get(code);
        if (!room) return;

        let player: Player | null = null;
        if (payload.playerToken === room.hostToken) {
          player = room.hostPlayer;
        } else if (room.guestToken && payload.playerToken === room.guestToken) {
          player = room.guestPlayer;
        }
        if (!player) return;

        // Rate limit: max 4 per 2 seconds
        const now = Date.now();
        const rateInfo = rateLimitMap.get(payload.playerToken) || { lastMove: 0, lastReaction: 0, reactionCount: 0 };
        if (now - rateInfo.lastReaction > 2000) {
          rateInfo.reactionCount = 0;
        }
        if (rateInfo.reactionCount >= 5) {
          return;
        }
        rateInfo.lastReaction = now;
        rateInfo.reactionCount += 1;
        rateLimitMap.set(payload.playerToken, rateInfo);

        const safeEmoji = typeof payload.emoji === 'string' ? payload.emoji.slice(0, 4) : '👍';
        io.to(`room_${code}`).emit('reaction_received', {
          roomCode: code,
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
      const code = (payload.roomCode || '').trim().toUpperCase();
      const room = rooms.get(code);
      if (room) {
        let isHost = payload.playerToken === room.hostToken;
        let isGuest = room.guestToken && payload.playerToken === room.guestToken;

        if (isHost || isGuest) {
          room.status = 'abandoned';
          room.updatedAt = Date.now();
          const leavingId = isHost ? room.hostPlayer.id : (room.guestPlayer?.id || 'guest');
          io.to(`room_${code}`).emit('opponent_left', { playerId: leavingId });
          io.to(`room_${code}`).emit('room_updated', getPublicRoomState(room));
        }
      }
      socket.leave(`room_${code}`);
      socketToPlayer.delete(socket.id);
    } catch (err) {
      console.error('Error leaving room:', err);
    }
  });

  // 8. DISCONNECT HANDLING WITH GRACE PERIOD
  socket.on('disconnect', () => {
    const info = socketToPlayer.get(socket.id);
    if (!info) return;

    const { roomCode, playerId, playerToken } = info;
    socketToPlayer.delete(socket.id);

    const room = rooms.get(roomCode);
    if (!room) return;

    const isHost = playerToken === room.hostToken;
    const isGuest = room.guestToken && playerToken === room.guestToken;

    if (!isHost && !isGuest) return;

    if (isHost) {
      room.hostConnected = false;
      room.hostLastSeen = Date.now();
    } else {
      room.guestConnected = false;
      room.guestLastSeen = Date.now();
    }

    // Inform remaining player of disconnection immediately
    io.to(`room_${roomCode}`).emit('player_connection_changed', {
      playerId,
      connected: false
    });
    io.to(`room_${roomCode}`).emit('room_updated', getPublicRoomState(room));

    // Start 75-second grace timer before marking room abandoned
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

// Periodic garbage collection for expired rooms older than 30 minutes
setInterval(() => {
  const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
  for (const [code, r] of rooms.entries()) {
    if (r.updatedAt < thirtyMinutesAgo) {
      rooms.delete(code);
    }
  }
}, 5 * 60 * 1000);

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

