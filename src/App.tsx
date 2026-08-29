/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  GameMode,
  AIDifficulty,
  BoardConfig,
  GameState,
  Player,
  RoomState,
  UserSettings,
  CellCoord
} from './types';
import {
  loadUserSettings,
  saveUserSettings,
  saveActiveLocalGame,
  loadActiveLocalGame
} from './engine/storage';
import {
  createInitialGameState,
  isValidMove,
  makeMove,
  checkWin,
  isBoardFull
} from './engine/gameEngine';
import { calculateAIMove } from './engine/aiEngine';
import {
  createOnlineRoom,
  joinOnlineRoom,
  subscribeToOnlineRoom,
  syncOnlineMove,
  syncOnlineRematch,
  syncLeaveRoom,
  sendOnlineReaction,
  ReactionPayload
} from './engine/multiplayerEngine';
import { soundEngine } from './engine/soundEngine';
import { hapticsEngine } from './engine/hapticsEngine';
import { TRANSLATIONS } from './i18n/translations';
import { BOARD_PRESETS } from './constants/themes';

import { Header } from './components/Header';
import { ModeSelection } from './components/ModeSelection';
import { GameBoard } from './components/GameBoard';
import { PlayerBadge } from './components/PlayerBadge';
import { TurnIndicator } from './components/TurnIndicator';
import { BoardSelection } from './components/BoardSelection';
import { PlayerCustomizer } from './components/PlayerCustomizer';
import { SettingsModal } from './components/SettingsModal';
import { GameResultModal } from './components/GameResultModal';
import { OnlineLobby } from './components/OnlineLobby';
import { OnlineReactions, FloatingReaction } from './components/OnlineReactions';
import { CountdownOverlay } from './components/CountdownOverlay';
import { InstallPrompt } from './components/InstallPrompt';
import { FooterCredit } from './components/FooterCredit';
import { LocalSetupModal } from './components/LocalSetupModal';
import { RotateCcw, ArrowLeft, SlidersHorizontal, UserCheck, Sparkles, AlertTriangle } from 'lucide-react';

type ScreenView = 'mode-select' | 'online-lobby' | 'playing';

export default function App() {
  // 1. Settings State
  const [settings, setSettings] = useState<UserSettings>(() => {
    const loaded = loadUserSettings();
    soundEngine.setEnabled(loaded.soundEnabled);
    soundEngine.setVolume(loaded.audioVolume);
    hapticsEngine.setEnabled(loaded.hapticsEnabled);
    return loaded;
  });

  // 2. Navigation State
  const [currentView, setCurrentView] = useState<ScreenView>('mode-select');
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showBoardModal, setShowBoardModal] = useState<boolean>(false);
  const [showCustomizerModal, setShowCustomizerModal] = useState<boolean>(false);
  const [showLocalSetupModal, setShowLocalSetupModal] = useState<boolean>(false);
  const [showCountdown, setShowCountdown] = useState<boolean>(false);

  // 3. Match Config State
  const [boardConfig, setBoardConfig] = useState<BoardConfig>(settings.lastBoardConfig);
  const [difficulty, setDifficulty] = useState<AIDifficulty>(settings.defaultDifficulty);
  const [activeMode, setActiveMode] = useState<GameMode>('local');

  // 4. Players
  const [player1, setPlayer1] = useState<Player>({
    id: 'p1',
    name: settings.defaultPlayer1.name,
    avatar: settings.defaultPlayer1.avatar,
    colorKey: settings.defaultPlayer1.colorKey,
    photoUrl: settings.defaultPlayer1.photoUrl,
    score: 0
  });

  const [player2, setPlayer2] = useState<Player>({
    id: 'p2',
    name: settings.defaultPlayer2.name,
    avatar: settings.defaultPlayer2.avatar,
    colorKey: settings.defaultPlayer2.colorKey,
    photoUrl: settings.defaultPlayer2.photoUrl,
    score: 0
  });

  const [aiPlayer, setAiPlayer] = useState<Player>({
    id: 'ai_bot',
    name: settings.defaultAIPlayer.name,
    avatar: settings.defaultAIPlayer.avatar,
    colorKey: settings.defaultAIPlayer.colorKey,
    photoUrl: settings.defaultAIPlayer.photoUrl,
    isAI: true,
    score: 0
  });

  // 5. Game State
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = loadActiveLocalGame();
    if (saved) return saved;
    return createInitialGameState([player1, player2], boardConfig, 'local');
  });

  const [lastMoveCoord, setLastMoveCoord] = useState<CellCoord | null>(null);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  // 6. Online Multiplayer State
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [isOnlineWaiting, setIsOnlineWaiting] = useState<boolean>(false);
  const [onlineError, setOnlineError] = useState<string | null>(null);
  const [opponentLeftAlert, setOpponentLeftAlert] = useState<boolean>(false);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [localOnlineId, setLocalOnlineId] = useState<string>('p1');
  const unsubscribeRoomRef = useRef<(() => void) | null>(null);

  // Auto-detect invite link room on initial page load (e.g. ?room=XYZ12)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const inviteRoom = params.get('room') || params.get('join');
      if (inviteRoom && inviteRoom.trim().length >= 3) {
        setActiveMode('online');
        setCurrentView('online-lobby');
      }
    }
  }, []);

  const t = TRANSLATIONS[settings.language];

  // Helper for saving settings
  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveUserSettings(newSettings);
  };

  const handleToggleLanguage = () => {
    const nextLang = settings.language === 'bn' ? 'en' : 'bn';
    handleUpdateSettings({ ...settings, language: nextLang });
  };

  const handleToggleSound = () => {
    const next = !settings.soundEnabled;
    soundEngine.setEnabled(next);
    handleUpdateSettings({ ...settings, soundEnabled: next });
    if (next) soundEngine.playTap();
  };

  // Helper for Board Label
  const getBoardPresetLabel = (): string => {
    if (boardConfig.presetKey) {
      const preset = BOARD_PRESETS.find((p) => p.id === boardConfig.presetKey);
      if (preset) return settings.language === 'bn' ? preset.labelBn : preset.labelEn;
    }
    return `${boardConfig.rows}x${boardConfig.cols} (${settings.language === 'bn' ? 'জিততে ' : 'Win '}${boardConfig.winLength})`;
  };

  // ----------------------------------------------------
  // Game Initialization & Start Flow
  // ----------------------------------------------------
  const startNewGameWithPlayers = (
    mode: GameMode,
    p1: Player,
    p2: Player,
    config: BoardConfig,
    diff?: AIDifficulty
  ) => {
    const newGame = createInitialGameState([p1, p2], config, mode, diff);
    setGameState(newGame);
    setLastMoveCoord(null);
    setIsAiThinking(false);
    setShowCountdown(true);
  };

  const handleSelectMode = (mode: GameMode, diff?: AIDifficulty) => {
    soundEngine.playTap();
    hapticsEngine.trigger('tap');
    setActiveMode(mode);
    if (diff) setDifficulty(diff);

    if (mode === 'local') {
      const p1 = { ...player1 };
      const p2 = { ...player2, isAI: false };
      startNewGameWithPlayers('local', p1, p2, boardConfig);
    } else if (mode === 'ai') {
      const p1 = { ...player1 };
      const p2 = { ...aiPlayer, isAI: true };
      startNewGameWithPlayers('ai', p1, p2, boardConfig, diff || difficulty);
    } else if (mode === 'online') {
      setCurrentView('online-lobby');
      setOnlineError(null);
    }
  };

  const handleStartLocalWithNames = (
    name1: string,
    color1: string,
    name2: string,
    color2: string,
    photo1?: string,
    photo2?: string
  ) => {
    const updatedP1: Player = {
      ...player1,
      name: name1,
      colorKey: color1,
      photoUrl: photo1
    };
    const updatedP2: Player = {
      ...player2,
      name: name2,
      colorKey: color2,
      photoUrl: photo2,
      isAI: false
    };

    setPlayer1(updatedP1);
    setPlayer2(updatedP2);

    handleUpdateSettings({
      ...settings,
      defaultPlayer1: {
        name: updatedP1.name,
        avatar: updatedP1.avatar,
        colorKey: updatedP1.colorKey,
        photoUrl: updatedP1.photoUrl
      },
      defaultPlayer2: {
        name: updatedP2.name,
        avatar: updatedP2.avatar,
        colorKey: updatedP2.colorKey,
        photoUrl: updatedP2.photoUrl
      }
    });

    setShowLocalSetupModal(false);
    setActiveMode('local');
    startNewGameWithPlayers('local', updatedP1, updatedP2, boardConfig);
  };

  const handleCountdownComplete = () => {
    setShowCountdown(false);
    setCurrentView('playing');
    setGameState((prev) => ({
      ...prev,
      status: 'playing'
    }));
  };

  // ----------------------------------------------------
  // Move Execution Engine
  // ----------------------------------------------------
  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (gameState.status !== 'playing' || isAiThinking) return;

      // Online check: verify current turn matches local player
      if (gameState.mode === 'online') {
        const currentActivePlayer = gameState.players[gameState.currentPlayerIndex];
        if (currentActivePlayer.id !== localOnlineId) {
          return;
        }
      }

      if (!isValidMove(gameState.board, row, col)) return;

      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      const isP2 = currentPlayer.id === player2.id || currentPlayer.id === aiPlayer.id;

      // Play immediate tactile sound and haptics
      soundEngine.playPlace(isP2);
      hapticsEngine.trigger('move');

      const newBoard = makeMove(gameState.board, row, col, currentPlayer.id);
      setLastMoveCoord({ row, col });

      // Check for win
      const winResult = checkWin(newBoard, row, col, gameState.boardConfig.winLength);

      let nextStatus = gameState.status;
      let winnerId: string | null = null;
      let winningCells: CellCoord[] = [];

      if (winResult.isWin) {
        nextStatus = 'won';
        winnerId = currentPlayer.id;
        winningCells = winResult.winningCells;
        soundEngine.playWin();
        hapticsEngine.trigger('win');

        // Update winner score
        if (currentPlayer.id === player1.id) {
          setPlayer1((prev) => ({ ...prev, score: prev.score + 1 }));
        } else if (currentPlayer.id === player2.id) {
          setPlayer2((prev) => ({ ...prev, score: prev.score + 1 }));
        } else if (currentPlayer.id === aiPlayer.id) {
          setAiPlayer((prev) => ({ ...prev, score: prev.score + 1 }));
        }
      } else if (isBoardFull(newBoard)) {
        nextStatus = 'draw';
        soundEngine.playDraw();
        hapticsEngine.trigger('draw');
      }

      const nextPlayerIndex = nextStatus === 'playing' ? (gameState.currentPlayerIndex === 0 ? 1 : 0) : gameState.currentPlayerIndex;

      const updatedGame: GameState = {
        ...gameState,
        board: newBoard,
        currentPlayerIndex: nextPlayerIndex,
        status: nextStatus,
        winnerPlayerId: winnerId,
        winningCells,
        moveCount: gameState.moveCount + 1,
        movesHistory: [
          ...gameState.movesHistory,
          {
            playerId: currentPlayer.id,
            row,
            col,
            timestamp: Date.now()
          }
        ]
      };

      setGameState(updatedGame);

      if (gameState.mode === 'online' && roomCode) {
        syncOnlineMove(roomCode, updatedGame);
      } else {
        saveActiveLocalGame(updatedGame);
      }
    },
    [gameState, isAiThinking, localOnlineId, roomCode, player1.id, player2.id, aiPlayer.id]
  );

  // ----------------------------------------------------
  // AI Turn Handler
  // ----------------------------------------------------
  useEffect(() => {
    if (
      gameState.mode === 'ai' &&
      gameState.status === 'playing' &&
      gameState.currentPlayerIndex === 1 &&
      !isAiThinking
    ) {
      setIsAiThinking(true);
      const aiBot = gameState.players[1];
      const human = gameState.players[0];

      const timer = setTimeout(async () => {
        try {
          const move = await calculateAIMove(
            gameState.board,
            aiBot.id,
            human.id,
            gameState.aiDifficulty || difficulty,
            gameState.boardConfig.winLength
          );

          if (move) {
            const newBoard = makeMove(gameState.board, move.row, move.col, aiBot.id);
            setLastMoveCoord(move);
            soundEngine.playMove();
            hapticsEngine.trigger('move');

            const winResult = checkWin(newBoard, move.row, move.col, gameState.boardConfig.winLength);
            let nextStatus = gameState.status;
            let winnerId: string | null = null;
            let winningCells: CellCoord[] = [];

            if (winResult.isWin) {
              nextStatus = 'won';
              winnerId = aiBot.id;
              winningCells = winResult.winningCells;
              setAiPlayer((prev) => ({ ...prev, score: prev.score + 1 }));
            } else if (isBoardFull(newBoard)) {
              nextStatus = 'draw';
            }

            const nextGame: GameState = {
              ...gameState,
              board: newBoard,
              currentPlayerIndex: nextStatus === 'playing' ? 0 : 1,
              status: nextStatus,
              winnerPlayerId: winnerId,
              winningCells,
              moveCount: gameState.moveCount + 1,
              movesHistory: [
                ...gameState.movesHistory,
                {
                  playerId: aiBot.id,
                  row: move.row,
                  col: move.col,
                  timestamp: Date.now()
                }
              ]
            };

            setGameState(nextGame);
            saveActiveLocalGame(nextGame);
          }
        } finally {
          setIsAiThinking(false);
        }
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [gameState, isAiThinking, difficulty]);

  // ----------------------------------------------------
  // Online Multiplayer Room Management
  // ----------------------------------------------------
  const handleIncomingReaction = useCallback((reaction: ReactionPayload) => {
    soundEngine.playTap();
    hapticsEngine.trigger('tap');
    const newReaction: FloatingReaction = {
      id: `react_${Date.now()}_${Math.random()}`,
      emoji: reaction.emoji,
      senderName: reaction.senderName,
      xOffset: (Math.random() - 0.5) * 160
    };
    setFloatingReactions((prev) => [...prev, newReaction]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 2200);
  }, []);

  const handleSendReaction = (emoji: string) => {
    if (!roomCode || !roomState) return;
    const sender = roomState.hostPlayer.id === localOnlineId ? roomState.hostPlayer : (roomState.guestPlayer || player1);
    sendOnlineReaction(roomCode, emoji, sender.name, localOnlineId);
  };

  const handleCreateOnlineRoom = async () => {
    soundEngine.playTap();
    hapticsEngine.trigger('tap');
    try {
      setIsOnlineWaiting(true);
      setOpponentLeftAlert(false);
      const hostP: Player = { ...player1, score: 0 };
      const { roomCode: code, roomState: initialRoom } = await createOnlineRoom(hostP, boardConfig);
      setRoomCode(code);
      setRoomState(initialRoom);
      setLocalOnlineId(initialRoom.hostPlayer.id);

      if (unsubscribeRoomRef.current) {
        unsubscribeRoomRef.current();
      }

      unsubscribeRoomRef.current = subscribeToOnlineRoom(
        code,
        (updatedRoom) => {
          setRoomState(updatedRoom);
          if (updatedRoom.guestPlayer && updatedRoom.status === 'active') {
            setIsOnlineWaiting(false);
            setGameState(updatedRoom.gameState);
            setCurrentView('playing');
          } else if (updatedRoom.gameState) {
            setGameState(updatedRoom.gameState);
          }
        },
        handleIncomingReaction,
        () => {
          setOpponentLeftAlert(true);
        }
      );
    } catch (err) {
      console.error(err);
      setIsOnlineWaiting(false);
      setOnlineError('failed');
    }
  };

  const handleJoinOnlineRoom = async (code: string) => {
    soundEngine.playTap();
    hapticsEngine.trigger('tap');
    try {
      setOpponentLeftAlert(false);
      const guestP: Player = { ...player2, score: 0 };
      const result = await joinOnlineRoom(code, guestP);

      if (!result.success || !result.roomState) {
        setOnlineError(result.error || 'roomNotFound');
        return;
      }

      setRoomCode(code.toUpperCase());
      setRoomState(result.roomState);
      setLocalOnlineId(result.roomState.guestPlayer?.id || 'guest');
      setGameState(result.roomState.gameState);
      setCurrentView('playing');

      if (unsubscribeRoomRef.current) {
        unsubscribeRoomRef.current();
      }

      unsubscribeRoomRef.current = subscribeToOnlineRoom(
        code,
        (updatedRoom) => {
          setRoomState(updatedRoom);
          if (updatedRoom.gameState) {
            setGameState(updatedRoom.gameState);
          }
        },
        handleIncomingReaction,
        () => {
          setOpponentLeftAlert(true);
        }
      );
    } catch (err) {
      console.error(err);
      setOnlineError('roomNotFound');
    }
  };

  const handleLeaveOnline = () => {
    if (roomCode) {
      syncLeaveRoom(roomCode, localOnlineId);
    }
    if (unsubscribeRoomRef.current) {
      unsubscribeRoomRef.current();
      unsubscribeRoomRef.current = null;
    }
    setRoomCode(null);
    setRoomState(null);
    setIsOnlineWaiting(false);
    setOpponentLeftAlert(false);
    setCurrentView('mode-select');
  };

  const handleOnlineRematch = () => {
    if (!roomCode || !roomState) return;
    soundEngine.playTap();
    const resetGame = createInitialGameState(
      [roomState.hostPlayer, roomState.guestPlayer || player2],
      roomState.boardConfig,
      'online'
    );
    resetGame.status = 'playing';
    syncOnlineRematch(roomCode, localOnlineId, resetGame);
  };

  // ----------------------------------------------------
  // Rematch / Play Again Controls
  // ----------------------------------------------------
  const handlePlayAgain = () => {
    soundEngine.playTap();
    hapticsEngine.trigger('tap');

    if (gameState.mode === 'online') {
      handleOnlineRematch();
      return;
    }

    const nextGame = createInitialGameState(
      gameState.players,
      boardConfig,
      gameState.mode,
      gameState.aiDifficulty
    );
    setGameState(nextGame);
    setLastMoveCoord(null);
    setIsAiThinking(false);
    setShowCountdown(true);
  };

  const handleGoHome = () => {
    soundEngine.playTap();
    hapticsEngine.trigger('tap');
    if (gameState.mode === 'online') {
      handleLeaveOnline();
    }
    saveActiveLocalGame(null);
    setCurrentView('mode-select');
  };

  // Save customized players
  const handleSavePlayers = (p1: Player, p2: Player, ai: Player) => {
    setPlayer1((prev) => ({ ...p1, score: prev.score }));
    setPlayer2((prev) => ({ ...p2, score: prev.score }));
    setAiPlayer((prev) => ({ ...ai, score: prev.score }));

    handleUpdateSettings({
      ...settings,
      defaultPlayer1: {
        name: p1.name,
        avatar: p1.avatar,
        colorKey: p1.colorKey,
        photoUrl: p1.photoUrl
      },
      defaultPlayer2: {
        name: p2.name,
        avatar: p2.avatar,
        colorKey: p2.colorKey,
        photoUrl: p2.photoUrl
      },
      defaultAIPlayer: {
        name: ai.name,
        avatar: ai.avatar,
        colorKey: ai.colorKey,
        photoUrl: ai.photoUrl
      }
    });

    // Also update players in active gameState if exists
    setGameState((prev) => {
      const updatedPlayers = prev.players.map((p) => {
        if (p.id === p1.id) return { ...p, name: p1.name, avatar: p1.avatar, colorKey: p1.colorKey, photoUrl: p1.photoUrl };
        if (p.id === p2.id) return { ...p, name: p2.name, avatar: p2.avatar, colorKey: p2.colorKey, photoUrl: p2.photoUrl };
        if (p.id === ai.id) return { ...p, name: ai.name, avatar: ai.avatar, colorKey: ai.colorKey, photoUrl: ai.photoUrl };
        return p;
      });
      return {
        ...prev,
        players: updatedPlayers
      };
    });
  };

  // Save board config
  const handleSelectBoardConfig = (config: BoardConfig) => {
    setBoardConfig(config);
    handleUpdateSettings({
      ...settings,
      lastBoardConfig: config
    });
  };

  const currentTurnPlayer = gameState.players[gameState.currentPlayerIndex] || player1;
  const winnerPlayer = gameState.winnerPlayerId
    ? gameState.players.find((p) => p.id === gameState.winnerPlayerId) || null
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F0] text-[#073B4C] font-sans antialiased selection:bg-[#FFD166] selection:text-[#073B4C] relative overflow-x-hidden">
      {/* Background Graphic Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0 opacity-40">
        <div className="absolute top-12 -left-20 w-72 h-72 rounded-full bg-[#FFD166] blur-3xl" />
        <div className="absolute bottom-12 -right-20 w-80 h-80 rounded-full bg-[#06D6A0] blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-[#EF476F] blur-3xl opacity-20" />
      </div>

      {/* Main Top Header */}
      <Header
        language={settings.language}
        onToggleLanguage={handleToggleLanguage}
        soundEnabled={settings.soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenSettings={() => setShowSettingsModal(true)}
        activeMode={currentView === 'playing' ? activeMode : null}
        onGoHome={handleGoHome}
        isOnlineConnected={typeof navigator !== 'undefined' ? navigator.onLine : true}
      />

      {/* View Router */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 w-full pb-8">
        {/* 1. MODE SELECTION SCREEN */}
        {currentView === 'mode-select' && (
          <ModeSelection
            language={settings.language}
            onSelectMode={handleSelectMode}
            currentDifficulty={difficulty}
            onChangeDifficulty={(diff) => {
              setDifficulty(diff);
              handleUpdateSettings({ ...settings, defaultDifficulty: diff });
            }}
            onOpenCustomizer={() => setShowCustomizerModal(true)}
            onOpenBoardPicker={() => setShowBoardModal(true)}
            boardLabel={getBoardPresetLabel()}
            player1={player1}
            player2={player2}
            onOpenLocalSetup={() => setShowLocalSetupModal(true)}
          />
        )}

        {/* 2. ONLINE LOBBY SCREEN */}
        {currentView === 'online-lobby' && (
          <OnlineLobby
            localPlayer={player1}
            boardConfig={boardConfig}
            onCreateRoom={handleCreateOnlineRoom}
            onJoinRoom={handleJoinOnlineRoom}
            onLeaveRoom={handleLeaveOnline}
            currentRoomId={roomCode}
            isWaitingForOpponent={isOnlineWaiting}
            language={settings.language}
            errorMessage={onlineError}
          />
        )}

        {/* 3. ACTIVE GAME PLAYING SCREEN */}
        {currentView === 'playing' && (
          <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 flex flex-col items-center gap-2 sm:gap-3 animate-in fade-in duration-200">
            {/* Top Game Bar: Back, Board Tag, Settings */}
            <div className="w-full max-w-xl flex items-center justify-between gap-1.5 py-1">
              <button
                id="btn-back-to-modes"
                onClick={handleGoHome}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl sm:rounded-2xl bg-white border-2 border-[#073B4C] text-xs font-black text-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] sm:shadow-[3px_3px_0px_0px_#073B4C] active:translate-x-0.5 active:translate-y-0.5 transition-all flex-shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-[11px] sm:text-xs">{t.home}</span>
              </button>

              {/* Board Spec Pill */}
              <div className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full bg-[#118AB2] text-white border-2 border-[#073B4C] shadow-[1.5px_1.5px_0px_0px_#073B4C] text-[10px] sm:text-xs font-black truncate max-w-[130px] sm:max-w-none text-center">
                <span>{getBoardPresetLabel()}</span>
              </div>

              {/* Action Buttons: Edit / Play Again */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <button
                  id="btn-edit-players-in-game"
                  onClick={() => {
                    soundEngine.playTap();
                    if (gameState.mode === 'local') {
                      setShowLocalSetupModal(true);
                    } else {
                      setShowCustomizerModal(true);
                    }
                  }}
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl sm:rounded-2xl bg-white border-2 border-[#073B4C] text-xs font-black text-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] sm:shadow-[3px_3px_0px_0px_#073B4C] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                  title={settings.language === 'bn' ? 'খেলোয়াড়ের নাম পরিবর্তন' : 'Change Player Names'}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline text-[11px] sm:text-xs">{settings.language === 'bn' ? 'নাম' : 'Names'}</span>
                </button>

                <button
                  id="btn-quick-restart"
                  onClick={handlePlayAgain}
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl sm:rounded-2xl bg-[#FFD166] border-2 border-[#073B4C] text-xs font-black text-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] sm:shadow-[3px_3px_0px_0px_#073B4C] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                  title={t.playAgain}
                >
                  <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline text-[11px] sm:text-xs">{t.playAgain}</span>
                </button>
              </div>
            </div>

            {/* Players Status & Score HUD */}
            <div className="w-full grid grid-cols-2 gap-2 sm:gap-4 my-0.5 max-w-xl">
              <PlayerBadge
                player={gameState.players[0]}
                isCurrentTurn={gameState.currentPlayerIndex === 0 && gameState.status === 'playing'}
                score={player1.score}
                language={settings.language}
              />
              <PlayerBadge
                player={gameState.players[1]}
                isCurrentTurn={gameState.currentPlayerIndex === 1 && gameState.status === 'playing'}
                score={gameState.mode === 'ai' ? aiPlayer.score : player2.score}
                language={settings.language}
              />
            </div>

            {/* Turn Indicator */}
            {gameState.status === 'playing' && (
              <TurnIndicator
                player={currentTurnPlayer}
                language={settings.language}
                isAiThinking={isAiThinking}
              />
            )}

            {/* Opponent Left Alert Banner */}
            {opponentLeftAlert && (
              <div className="w-full max-w-xl p-3 rounded-2xl bg-amber-100 border-2 border-[#EF476F] shadow-[3px_3px_0px_0px_#073B4C] flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-black text-[#073B4C]">
                  <AlertTriangle className="w-5 h-5 text-[#EF476F] flex-shrink-0" />
                  <span>
                    {settings.language === 'bn'
                      ? 'প্রতিপক্ষ খেলা ত্যাগ করেছে বা সংযোগ বিচ্ছিন্ন হয়েছে।'
                      : 'Opponent has left or disconnected from the match.'}
                  </span>
                </div>
                <button
                  onClick={handleGoHome}
                  className="px-3 py-1.5 rounded-xl bg-[#EF476F] text-white text-xs font-black border border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] active:translate-x-0.5 active:translate-y-0.5"
                >
                  {t.home}
                </button>
              </div>
            )}

            {/* Interactive 3D Board */}
            <GameBoard
              board={gameState.board}
              onCellClick={handleCellClick}
              player1={gameState.players[0]}
              player2={gameState.players[1]}
              currentPlayer={currentTurnPlayer}
              winningCells={gameState.winningCells}
              lastMove={lastMoveCoord}
              disabled={gameState.status !== 'playing' || isAiThinking}
              tiltEnabled={settings.tilt3dEnabled && !settings.reducedMotion}
              language={settings.language}
            />

            {/* Quick Reactions Bar (Online Mode) */}
            {gameState.mode === 'online' && (
              <OnlineReactions
                onSendReaction={handleSendReaction}
                floatingReactions={floatingReactions}
              />
            )}
          </div>
        )}
      </main>

      {/* Countdown 3-2-1 Overlay */}
      {showCountdown && (
        <CountdownOverlay
          language={settings.language}
          onComplete={handleCountdownComplete}
        />
      )}

      {/* Game Result Modal (Win / Draw) */}
      {(gameState.status === 'won' || gameState.status === 'draw') && (
        <GameResultModal
          status={gameState.status}
          winner={winnerPlayer}
          language={settings.language}
          onPlayAgain={handlePlayAgain}
          onGoHome={handleGoHome}
          onOpenBoardPicker={() => setShowBoardModal(true)}
          moveCount={gameState.moveCount}
          isOnlineMatch={gameState.mode === 'online'}
          onRematch={handleOnlineRematch}
          rematchRequested={Boolean(roomState?.rematchRequestedBy)}
        />
      )}

      {/* Local 2-Player Setup Modal */}
      {showLocalSetupModal && (
        <LocalSetupModal
          player1={player1}
          player2={player2}
          onStartGame={handleStartLocalWithNames}
          onClose={() => setShowLocalSetupModal(false)}
          language={settings.language}
        />
      )}

      {/* Board Preset / Custom Grid Modal */}
      {showBoardModal && (
        <BoardSelection
          currentConfig={boardConfig}
          onSelectConfig={handleSelectBoardConfig}
          onClose={() => setShowBoardModal(false)}
          language={settings.language}
        />
      )}

      {/* Player Customizer Modal */}
      {showCustomizerModal && (
        <PlayerCustomizer
          player1={player1}
          player2={player2}
          aiPlayer={aiPlayer}
          onSave={handleSavePlayers}
          onClose={() => setShowCustomizerModal(false)}
          language={settings.language}
        />
      )}

      {/* App Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setShowSettingsModal(false)}
          language={settings.language}
        />
      )}

      {/* PWA Install Prompt (Offline banner) */}
      <InstallPrompt language={settings.language} />

      {/* Footer Branding Credit */}
      <FooterCredit />
    </div>
  );
}
