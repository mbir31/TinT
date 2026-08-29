/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  createOnlineRoom,
  joinOnlineRoom,
  reconnectOnlineRoom,
  subscribeToOnlineRoom,
  sendOnlineMove,
  requestOnlineRematch,
  leaveOnlineRoom,
  sendOnlineReaction,
  getStoredOnlineSession,
  clearStoredOnlineSession,
  getLocalSessionPlayerId,
  ReactionPayload
} from './engine/multiplayerEngine';
import {
  GameType,
  GameMode,
  AIDifficulty,
  BoardConfig,
  DotsBoardConfig,
  ConnectFourConfig,
  GameState,
  DotsGameState,
  ConnectFourGameState,
  DotsLine,
  Player,
  PublicRoomState,
  UserSettings,
  CellCoord,
  AchievementToastItem
} from './types';
import {
  loadUserSettings,
  saveUserSettings,
  saveActiveLocalGame,
  loadActiveLocalGame
} from './engine/storage';
import {
  recordGameWinAndCheckAchievements,
  recordGameLossOrDraw
} from './engine/achievements';
import {
  createInitialGameState,
  isValidMove,
  makeMove,
  checkWin,
  isBoardFull
} from './engine/gameEngine';
import {
  createInitialDotsState,
  makeDotsMove,
  DOTS_PRESETS
} from './engine/dotsEngine';
import {
  createInitialConnectFourState,
  makeConnectFourDrop,
  getConnectFourAIMove,
  CONNECT_FOUR_PRESETS,
  DEFAULT_CONNECT_FOUR_CONFIG
} from './engine/connectFourEngine';
import { calculateAIMove } from './engine/aiEngine';
import { calculateDotsAIMove } from './engine/dotsAiEngine';
import { soundEngine } from './engine/soundEngine';
import { hapticsEngine } from './engine/hapticsEngine';
import { TRANSLATIONS } from './i18n/translations';
import { BOARD_PRESETS } from './constants/themes';

import { Header } from './components/Header';
import { ModeSelection } from './components/ModeSelection';
import { GameBoard } from './components/GameBoard';
import { DotsGameBoard } from './components/DotsGameBoard';
import { ConnectFourBoard } from './components/ConnectFourBoard';
import { PlayerBadge } from './components/PlayerBadge';
import { TurnIndicator } from './components/TurnIndicator';
import { BoardSelection } from './components/BoardSelection';
import { DotsBoardSelection } from './components/DotsBoardSelection';
import { ConnectFourBoardSelection } from './components/ConnectFourBoardSelection';
import { PlayerCustomizer } from './components/PlayerCustomizer';
import { SettingsModal } from './components/SettingsModal';
import { GameResultModal } from './components/GameResultModal';
import { WinningMoveBanner } from './components/WinningMoveBanner';
import { AchievementToast } from './components/AchievementToast';
import { OnlineLobby } from './components/OnlineLobby';
import { OnlineReactions, FloatingReaction } from './components/OnlineReactions';
import { CountdownOverlay } from './components/CountdownOverlay';
import { InstallPrompt } from './components/InstallPrompt';
import { FooterCredit } from './components/FooterCredit';
import { LocalSetupModal } from './components/LocalSetupModal';
import { RotateCcw, ArrowLeft, SlidersHorizontal, AlertTriangle } from 'lucide-react';

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

  // 2. Active Game Selector ('tictactoe' | 'dotsboxes' | 'connectfour')
  const [activeGame, setActiveGame] = useState<GameType>(settings.activeGameType || 'tictactoe');

  // 3. Navigation State
  const [currentView, setCurrentView] = useState<ScreenView>('mode-select');
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showBoardModal, setShowBoardModal] = useState<boolean>(false);
  const [showDotsBoardModal, setShowDotsBoardModal] = useState<boolean>(false);
  const [showC4BoardModal, setShowC4BoardModal] = useState<boolean>(false);
  const [showCustomizerModal, setShowCustomizerModal] = useState<boolean>(false);
  const [showLocalSetupModal, setShowLocalSetupModal] = useState<boolean>(false);
  const [showCountdown, setShowCountdown] = useState<boolean>(false);

  // 4. Match Config State
  const [boardConfig, setBoardConfig] = useState<BoardConfig>(settings.lastBoardConfig);
  const [dotsConfig, setDotsConfig] = useState<DotsBoardConfig>(
    settings.lastDotsConfig || { dotRows: 4, dotCols: 4, presetKey: 'classic-3x3' }
  );
  const [c4Config, setC4Config] = useState<ConnectFourConfig>(
    settings.lastConnectFourConfig || DEFAULT_CONNECT_FOUR_CONFIG
  );
  const [difficulty, setDifficulty] = useState<AIDifficulty>(settings.defaultDifficulty);
  const [activeMode, setActiveMode] = useState<GameMode>('local');

  // 5. Players
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

  // 6. Game State (Tic Tac Toe)
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = loadActiveLocalGame();
    if (saved) return saved;
    return createInitialGameState([player1, player2], boardConfig, 'local');
  });

  // 7. Game State (Dots & Boxes)
  const [dotsGameState, setDotsGameState] = useState<DotsGameState>(() => {
    return createInitialDotsState([player1, player2], dotsConfig, 'local');
  });

  // 8. Game State (Connect Four)
  const [c4GameState, setC4GameState] = useState<ConnectFourGameState>(() => {
    return createInitialConnectFourState(c4Config, player1, player2, 'local');
  });

  const [lastMoveCoord, setLastMoveCoord] = useState<CellCoord | null>(null);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [isDotsAiThinking, setIsDotsAiThinking] = useState<boolean>(false);
  const [isC4AiThinking, setIsC4AiThinking] = useState<boolean>(false);

  // 9. Achievements & Winning Move Replay State
  const [achievementToasts, setAchievementToasts] = useState<AchievementToastItem[]>([]);
  const [isReplayingWinningMove, setIsReplayingWinningMove] = useState<boolean>(false);
  const [isResultModalDismissedForReplay, setIsResultModalDismissedForReplay] = useState<boolean>(false);
  const [winningMoveCoord, setWinningMoveCoord] = useState<CellCoord | null>(null);
  const [winningDotsLine, setWinningDotsLine] = useState<DotsLine | null>(null);

  // 10. Online Multiplayer State
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<PublicRoomState | null>(null);
  const [localPlayerToken, setLocalPlayerToken] = useState<string | null>(null);
  const [isOnlineWaiting, setIsOnlineWaiting] = useState<boolean>(false);
  const [onlineError, setOnlineError] = useState<string | null>(null);
  const [opponentLeftAlert, setOpponentLeftAlert] = useState<boolean>(false);
  const [opponentDisconnected, setOpponentDisconnected] = useState<boolean>(false);
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

  // Helper for saving settings & dynamically updating token colors
  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveUserSettings(newSettings);

    // If token color palette / player colors changed, dynamically synchronize active players and games
    const p1Color = newSettings.defaultPlayer1.colorKey;
    const p2Color = newSettings.defaultPlayer2.colorKey;
    const aiColor = newSettings.defaultAIPlayer.colorKey;

    setPlayer1((prev) => ({ ...prev, colorKey: p1Color }));
    setPlayer2((prev) => ({ ...prev, colorKey: p2Color }));
    setAiPlayer((prev) => ({ ...prev, colorKey: aiColor }));

    setGameState((prev) => ({
      ...prev,
      players: prev.players.map((p) => {
        if (p.id === 'p1' || p.id === player1.id) return { ...p, colorKey: p1Color };
        if (p.id === 'ai' || p.isAI) return { ...p, colorKey: aiColor };
        if (p.id === 'p2' || p.id === player2.id) return { ...p, colorKey: p2Color };
        return p;
      }) as [Player, Player]
    }));

    setDotsGameState((prev) => ({
      ...prev,
      players: prev.players.map((p) => {
        if (p.id === 'p1' || p.id === player1.id) return { ...p, colorKey: p1Color };
        if (p.id === 'ai' || p.isAI) return { ...p, colorKey: aiColor };
        if (p.id === 'p2' || p.id === player2.id) return { ...p, colorKey: p2Color };
        return p;
      }) as [Player, Player]
    }));

    setC4GameState((prev) => ({
      ...prev,
      players: prev.players.map((p) => {
        if (p.id === 'p1' || p.id === player1.id) return { ...p, colorKey: p1Color };
        if (p.id === 'ai' || p.isAI) return { ...p, colorKey: aiColor };
        if (p.id === 'p2' || p.id === player2.id) return { ...p, colorKey: p2Color };
        return p;
      }) as [Player, Player]
    }));
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
    if (activeGame === 'connectfour') {
      if (c4Config.presetKey) {
        const preset = CONNECT_FOUR_PRESETS.find((p) => p.key === c4Config.presetKey);
        if (preset) return settings.language === 'bn' ? preset.nameBn : preset.nameEn;
      }
      return `${c4Config.cols}×${c4Config.rows} (${settings.language === 'bn' ? '৪-মিলান' : '4-in-a-Row'})`;
    }

    if (activeGame === 'dotsboxes') {
      if (dotsConfig.presetKey && DOTS_PRESETS[dotsConfig.presetKey]) {
        const preset = DOTS_PRESETS[dotsConfig.presetKey];
        return settings.language === 'bn' ? preset.labelBn : preset.labelEn;
      }
      const bRows = dotsConfig.dotRows - 1;
      const bCols = dotsConfig.dotCols - 1;
      return `${bRows}×${bCols} ${settings.language === 'bn' ? 'বক্স' : 'Boxes'}`;
    }

    if (boardConfig.presetKey) {
      const preset = BOARD_PRESETS.find((p) => p.id === boardConfig.presetKey);
      if (preset) return settings.language === 'bn' ? preset.labelBn : preset.labelEn;
    }
    return `${boardConfig.rows}x${boardConfig.cols} (${settings.language === 'bn' ? 'জিততে ' : 'Win '}${boardConfig.winLength})`;
  };

  // Helper for Achievement Toasts
  const triggerAchievementCheck = useCallback(
    (
      winner: Player,
      gameType: GameType,
      mode: GameMode,
      diff?: AIDifficulty,
      boxesCaptured?: number
    ) => {
      const { newAchievements } = recordGameWinAndCheckAchievements(
        winner,
        gameType,
        mode,
        diff,
        boxesCaptured
      );

      if (newAchievements.length > 0) {
        soundEngine.playAchievement();
        const newItems: AchievementToastItem[] = newAchievements.map((ach) => ({
          id: `${ach.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          achievement: ach,
          unlockedAt: Date.now()
        }));

        setAchievementToasts((prev) => [...prev, ...newItems]);

        newItems.forEach((item) => {
          setTimeout(() => {
            setAchievementToasts((current) => current.filter((t) => t.id !== item.id));
          }, 5500);
        });
      }
    },
    []
  );

  const handleDismissToast = (id: string) => {
    setAchievementToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Replay Winning Move Actions
  const handleReplayWinningMove = () => {
    setIsResultModalDismissedForReplay(true);
    setIsReplayingWinningMove(true);
    soundEngine.playWinningMoveReplay();
    setTimeout(() => {
      setIsReplayingWinningMove(false);
    }, 2400);
  };

  const handleReplayWinningMoveAgain = () => {
    setIsReplayingWinningMove(true);
    soundEngine.playWinningMoveReplay();
    setTimeout(() => {
      setIsReplayingWinningMove(false);
    }, 2400);
  };

  const handleOpenResultsModal = () => {
    setIsResultModalDismissedForReplay(false);
  };

  // Handle Game Type Switch
  const handleSelectGame = (game: GameType) => {
    setActiveGame(game);
    handleUpdateSettings({
      ...settings,
      activeGameType: game
    });
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
      if (activeGame === 'connectfour') {
        const newC4 = createInitialConnectFourState(c4Config, p1, p2, 'local');
        setC4GameState(newC4);
        setIsC4AiThinking(false);
        setShowCountdown(true);
      } else if (activeGame === 'dotsboxes') {
        const newDots = createInitialDotsState([p1, p2], dotsConfig, 'local');
        setDotsGameState(newDots);
        setIsDotsAiThinking(false);
        setShowCountdown(true);
      } else {
        startNewGameWithPlayers('local', p1, p2, boardConfig);
      }
    } else if (mode === 'ai') {
      const p1 = { ...player1 };
      const p2 = { ...aiPlayer, isAI: true };
      if (activeGame === 'connectfour') {
        const newC4 = createInitialConnectFourState(c4Config, p1, p2, 'ai', diff || difficulty);
        setC4GameState(newC4);
        setIsC4AiThinking(false);
        setShowCountdown(true);
      } else if (activeGame === 'dotsboxes') {
        const newDots = createInitialDotsState([p1, p2], dotsConfig, 'ai', diff || difficulty);
        setDotsGameState(newDots);
        setIsDotsAiThinking(false);
        setShowCountdown(true);
      } else {
        startNewGameWithPlayers('ai', p1, p2, boardConfig, diff || difficulty);
      }
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

    if (activeGame === 'connectfour') {
      const newC4 = createInitialConnectFourState(c4Config, updatedP1, updatedP2, 'local');
      setC4GameState(newC4);
      setIsC4AiThinking(false);
      setShowCountdown(true);
    } else if (activeGame === 'dotsboxes') {
      const newDots = createInitialDotsState([updatedP1, updatedP2], dotsConfig, 'local');
      setDotsGameState(newDots);
      setIsDotsAiThinking(false);
      setShowCountdown(true);
    } else {
      startNewGameWithPlayers('local', updatedP1, updatedP2, boardConfig);
    }
  };

  const handleCountdownComplete = () => {
    setShowCountdown(false);
    setCurrentView('playing');
    if (activeGame === 'connectfour') {
      setC4GameState((prev) => ({
        ...prev,
        status: 'playing'
      }));
    } else if (activeGame === 'dotsboxes') {
      setDotsGameState((prev) => ({
        ...prev,
        status: 'playing'
      }));
    } else {
      setGameState((prev) => ({
        ...prev,
        status: 'playing'
      }));
    }
  };

  // ----------------------------------------------------
  // Connect Four Move Execution Engine
  // ----------------------------------------------------
  const handleConnectFourDrop = useCallback(
    (col: number) => {
      if (c4GameState.status !== 'playing' || isC4AiThinking) return;

      // Online authoritative move flow
      if (activeMode === 'online' || c4GameState.mode === 'online') {
        if (!roomCode || !localPlayerToken || !roomState || roomState.status !== 'active') return;
        const currentActivePlayer = c4GameState.players[c4GameState.currentPlayerIndex];
        if (currentActivePlayer.id !== localOnlineId) return;

        const isP2 = currentActivePlayer.id === player2.id || currentActivePlayer.id === aiPlayer.id;
        soundEngine.playDiscDrop(col, c4GameState.config.cols, isP2);
        hapticsEngine.trigger('move');
        sendOnlineMove(roomCode, localPlayerToken, { gameType: 'connectfour', col }, roomState.version);
        return;
      }

      const result = makeConnectFourDrop(c4GameState, col);
      if (!result) return;

      const currentPlayer = c4GameState.players[c4GameState.currentPlayerIndex];
      const isP2 = currentPlayer.id === player2.id || currentPlayer.id === aiPlayer.id;

      // Play rich disc drop sound
      soundEngine.playDiscDrop(col, c4GameState.config.cols, isP2);
      hapticsEngine.trigger('move');

      if (result.isGameOver) {
        setIsResultModalDismissedForReplay(false);
        if (result.nextState.status === 'won') {
          soundEngine.playWin();
          hapticsEngine.trigger('win');
          const winner = result.nextState.players.find(
            (p) => p.id === result.nextState.winnerPlayerId
          );
          if (winner) {
            triggerAchievementCheck(
              winner,
              'connectfour',
              c4GameState.mode,
              c4GameState.aiDifficulty
            );

            // Update scores
            if (winner.id === player1.id) {
              setPlayer1((prev) => ({ ...prev, score: prev.score + 1 }));
            } else if (winner.id === player2.id) {
              setPlayer2((prev) => ({ ...prev, score: prev.score + 1 }));
            } else if (winner.id === aiPlayer.id) {
              setAiPlayer((prev) => ({ ...prev, score: prev.score + 1 }));
            }
          }
        } else {
          soundEngine.playDraw();
          hapticsEngine.trigger('draw');
          recordGameLossOrDraw();
        }
      }

      setC4GameState(result.nextState);
    },
    [c4GameState, isC4AiThinking, activeMode, roomCode, localPlayerToken, roomState, localOnlineId, player1.id, player2.id, aiPlayer.id, triggerAchievementCheck]
  );

  // Connect Four AI Turn Effect
  useEffect(() => {
    if (
      activeGame === 'connectfour' &&
      c4GameState.mode === 'ai' &&
      c4GameState.status === 'playing' &&
      c4GameState.currentPlayerIndex === 1 &&
      !isC4AiThinking
    ) {
      setIsC4AiThinking(true);
      const timer = setTimeout(() => {
        try {
          const aiCol = getConnectFourAIMove(
            c4GameState.board,
            c4GameState.config,
            c4GameState.aiDifficulty || difficulty,
            aiPlayer.id,
            player1.id
          );

          const result = makeConnectFourDrop(c4GameState, aiCol);
          if (result) {
            soundEngine.playDiscDrop(aiCol, c4GameState.config.cols, true);
            hapticsEngine.trigger('move');

            if (result.isGameOver) {
              setIsResultModalDismissedForReplay(false);
              if (result.nextState.status === 'won') {
                soundEngine.playWin();
                hapticsEngine.trigger('win');
                const winner = result.nextState.players.find(
                  (p) => p.id === result.nextState.winnerPlayerId
                );
                if (winner && !winner.isAI) {
                  triggerAchievementCheck(
                    winner,
                    'connectfour',
                    'ai',
                    c4GameState.aiDifficulty || difficulty
                  );
                } else if (winner && winner.isAI) {
                  setAiPlayer((prev) => ({ ...prev, score: prev.score + 1 }));
                  recordGameLossOrDraw();
                }
              } else {
                soundEngine.playDraw();
                hapticsEngine.trigger('draw');
                recordGameLossOrDraw();
              }
            }

            setC4GameState(result.nextState);
          }
        } finally {
          setIsC4AiThinking(false);
        }
      }, 450);

      return () => clearTimeout(timer);
    }
  }, [activeGame, c4GameState, isC4AiThinking, difficulty, player1.id, aiPlayer.id, triggerAchievementCheck]);

  // ----------------------------------------------------
  // Dots & Boxes Move Execution Engine
  // ----------------------------------------------------
  const handleDotsLineClick = useCallback(
    (line: DotsLine) => {
      if (dotsGameState.status !== 'playing' || isDotsAiThinking) return;

      // Online authoritative move flow
      if (activeMode === 'online' || dotsGameState.mode === 'online') {
        if (!roomCode || !localPlayerToken || !roomState || roomState.status !== 'active') return;
        const currentActivePlayer = dotsGameState.players[dotsGameState.currentPlayerIndex];
        if (currentActivePlayer.id !== localOnlineId) return;

        const isP2 = currentActivePlayer.id === player2.id || currentActivePlayer.id === aiPlayer.id;
        soundEngine.playPlace(isP2);
        hapticsEngine.trigger('move');
        sendOnlineMove(roomCode, localPlayerToken, { gameType: 'dotsboxes', line }, roomState.version);
        return;
      }

      const result = makeDotsMove(dotsGameState, line);
      const currentPlayer = dotsGameState.players[dotsGameState.currentPlayerIndex];
      const isP2 = currentPlayer.id === player2.id || currentPlayer.id === aiPlayer.id;

      if (result.completedBoxes.length > 0) {
        soundEngine.playBoxCapture();
        hapticsEngine.trigger('heavy');
      } else {
        soundEngine.playPlace(isP2);
        hapticsEngine.trigger('move');
      }

      if (result.isGameOver) {
        setWinningDotsLine(line);
        setIsResultModalDismissedForReplay(false);
        if (result.nextState.status === 'won') {
          soundEngine.playWin();
          hapticsEngine.trigger('win');
          const winner = result.nextState.players.find(
            (p) => p.id === result.nextState.winnerPlayerId
          );
          if (winner) {
            const winnerScore = result.nextState.playerScores[winner.id] || 0;
            triggerAchievementCheck(
              winner,
              'dotsboxes',
              dotsGameState.mode,
              dotsGameState.aiDifficulty,
              winnerScore
            );
          }
        } else {
          soundEngine.playDraw();
          hapticsEngine.trigger('draw');
          recordGameLossOrDraw();
        }
      }

      setDotsGameState(result.nextState);
    },
    [dotsGameState, isDotsAiThinking, activeMode, roomCode, localPlayerToken, roomState, localOnlineId, player2.id, aiPlayer.id, triggerAchievementCheck]
  );

  // Dots AI Turn Effect
  useEffect(() => {
    if (
      activeGame === 'dotsboxes' &&
      dotsGameState.mode === 'ai' &&
      dotsGameState.status === 'playing' &&
      dotsGameState.currentPlayerIndex === 1 &&
      !isDotsAiThinking
    ) {
      setIsDotsAiThinking(true);
      const timer = setTimeout(() => {
        try {
          const move = calculateDotsAIMove(dotsGameState, dotsGameState.aiDifficulty || difficulty);
          if (move) {
            const result = makeDotsMove(dotsGameState, move);
            if (result.completedBoxes.length > 0) {
              soundEngine.playBoxCapture();
              hapticsEngine.trigger('heavy');
            } else {
              soundEngine.playMove(true);
              hapticsEngine.trigger('move');
            }

            if (result.isGameOver) {
              setWinningDotsLine(move);
              setIsResultModalDismissedForReplay(false);
              if (result.nextState.status === 'won') {
                soundEngine.playWin();
                hapticsEngine.trigger('win');
                const winner = result.nextState.players.find(
                  (p) => p.id === result.nextState.winnerPlayerId
                );
                if (winner && !winner.isAI) {
                  const winnerScore = result.nextState.playerScores[winner.id] || 0;
                  triggerAchievementCheck(
                    winner,
                    'dotsboxes',
                    'ai',
                    dotsGameState.aiDifficulty || difficulty,
                    winnerScore
                  );
                } else if (winner && winner.isAI) {
                  recordGameLossOrDraw();
                }
              } else {
                soundEngine.playDraw();
                hapticsEngine.trigger('draw');
                recordGameLossOrDraw();
              }
            }

            setDotsGameState(result.nextState);
          }
        } finally {
          setIsDotsAiThinking(false);
        }
      }, 450);

      return () => clearTimeout(timer);
    }
  }, [activeGame, dotsGameState, isDotsAiThinking, difficulty, triggerAchievementCheck]);

  // ----------------------------------------------------
  // Tic Tac Toe Move Execution Engine
  // ----------------------------------------------------
  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (gameState.status !== 'playing' || isAiThinking) return;

      // Online authoritative move flow
      if (activeMode === 'online' || gameState.mode === 'online') {
        if (!roomCode || !localPlayerToken || !roomState || roomState.status !== 'active') return;
        const currentActivePlayer = gameState.players[gameState.currentPlayerIndex];
        if (currentActivePlayer.id !== localOnlineId) return;
        if (!isValidMove(gameState.board, row, col)) return;

        const isP2 = currentActivePlayer.id === player2.id || currentActivePlayer.id === aiPlayer.id;
        soundEngine.playPlace(isP2);
        hapticsEngine.trigger('move');
        sendOnlineMove(roomCode, localPlayerToken, { gameType: 'tictactoe', move: { row, col } }, roomState.version);
        return;
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
        setWinningMoveCoord({ row, col });
        setIsResultModalDismissedForReplay(false);
        soundEngine.playWin();
        hapticsEngine.trigger('win');

        triggerAchievementCheck(
          currentPlayer,
          'tictactoe',
          gameState.mode,
          gameState.aiDifficulty
        );

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
        setIsResultModalDismissedForReplay(false);
        soundEngine.playDraw();
        hapticsEngine.trigger('draw');
        recordGameLossOrDraw();
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
      saveActiveLocalGame(updatedGame);
    },
    [gameState, isAiThinking, activeMode, roomCode, localPlayerToken, roomState, localOnlineId, player1.id, player2.id, aiPlayer.id, triggerAchievementCheck]
  );

  // Tic Tac Toe AI Turn Handler
  useEffect(() => {
    if (
      activeGame === 'tictactoe' &&
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
              setWinningMoveCoord({ row: move.row, col: move.col });
              setIsResultModalDismissedForReplay(false);
              setAiPlayer((prev) => ({ ...prev, score: prev.score + 1 }));
              recordGameLossOrDraw();
            } else if (isBoardFull(newBoard)) {
              nextStatus = 'draw';
              setIsResultModalDismissedForReplay(false);
              recordGameLossOrDraw();
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
  }, [activeGame, gameState, isAiThinking, difficulty]);

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
    if (!roomCode || !localPlayerToken) return;
    sendOnlineReaction(roomCode, localPlayerToken, emoji);
  };

  const handleRoomUpdate = useCallback((updatedRoom: PublicRoomState) => {
    setRoomState(updatedRoom);
    if (updatedRoom.gameType && activeGame !== updatedRoom.gameType) {
      setActiveGame(updatedRoom.gameType);
    }

    if (updatedRoom.status === 'active') {
      setIsOnlineWaiting(false);
      setShowCountdown(false);
      setCurrentView('playing');
    }

    if (updatedRoom.gameType === 'tictactoe' && updatedRoom.gameState) {
      const nextGame = updatedRoom.gameState;
      setGameState((prev) => {
        if (prev.status === 'playing' && nextGame.status === 'won') {
          soundEngine.playWin();
          hapticsEngine.trigger('win');
          const winner = nextGame.players.find((p) => p.id === nextGame.winnerPlayerId);
          if (winner) {
            triggerAchievementCheck(winner, 'tictactoe', 'online');
            if (winner.id === player1.id) setPlayer1((p) => ({ ...p, score: p.score + 1 }));
            else if (winner.id === player2.id) setPlayer2((p) => ({ ...p, score: p.score + 1 }));
          }
          if (nextGame.winningCells && nextGame.winningCells.length > 0) {
            setWinningMoveCoord(nextGame.winningCells[0]);
          }
        } else if (prev.status === 'playing' && nextGame.status === 'draw') {
          soundEngine.playDraw();
          hapticsEngine.trigger('draw');
        }
        return nextGame;
      });
    } else if (updatedRoom.gameType === 'dotsboxes' && updatedRoom.dotsGameState) {
      const nextDots = updatedRoom.dotsGameState;
      setDotsGameState((prev) => {
        if (prev.status === 'playing' && nextDots.status === 'won') {
          soundEngine.playWin();
          hapticsEngine.trigger('win');
          const winner = nextDots.players.find((p) => p.id === nextDots.winnerPlayerId);
          if (winner) {
            const wScore = nextDots.playerScores[winner.id] || 0;
            triggerAchievementCheck(winner, 'dotsboxes', 'online', undefined, wScore);
            if (winner.id === player1.id) setPlayer1((p) => ({ ...p, score: p.score + 1 }));
            else if (winner.id === player2.id) setPlayer2((p) => ({ ...p, score: p.score + 1 }));
          }
        } else if (prev.status === 'playing' && nextDots.status === 'draw') {
          soundEngine.playDraw();
          hapticsEngine.trigger('draw');
        }
        return nextDots;
      });
    } else if (updatedRoom.gameType === 'connectfour' && updatedRoom.c4GameState) {
      const nextC4 = updatedRoom.c4GameState;
      setC4GameState((prev) => {
        if (prev.status === 'playing' && nextC4.status === 'won') {
          soundEngine.playWin();
          hapticsEngine.trigger('win');
          const winner = nextC4.players.find((p) => p.id === nextC4.winnerPlayerId);
          if (winner) {
            triggerAchievementCheck(winner, 'connectfour', 'online');
            if (winner.id === player1.id) setPlayer1((p) => ({ ...p, score: p.score + 1 }));
            else if (winner.id === player2.id) setPlayer2((p) => ({ ...p, score: p.score + 1 }));
          }
        } else if (prev.status === 'playing' && nextC4.status === 'draw') {
          soundEngine.playDraw();
          hapticsEngine.trigger('draw');
        }
        return nextC4;
      });
    }
  }, [activeGame, player1.id, player2.id, triggerAchievementCheck]);

  const setupRoomSubscription = useCallback((code: string) => {
    if (unsubscribeRoomRef.current) {
      unsubscribeRoomRef.current();
    }

    unsubscribeRoomRef.current = subscribeToOnlineRoom(code, {
      onUpdate: (updatedRoom) => {
        handleRoomUpdate(updatedRoom);
      },
      onReaction: handleIncomingReaction,
      onOpponentLeft: () => {
        setOpponentLeftAlert(true);
        setOpponentDisconnected(false);
      },
      onConnectionChanged: ({ connected }) => {
        setOpponentDisconnected(!connected);
      }
    });
  }, [handleRoomUpdate, handleIncomingReaction]);

  const handleCreateOnlineRoom = async () => {
    soundEngine.playTap();
    hapticsEngine.trigger('tap');
    try {
      setIsOnlineWaiting(true);
      setOpponentLeftAlert(false);
      setOpponentDisconnected(false);
      const hostP: Player = { ...player1, score: 0 };
      const config =
        activeGame === 'connectfour'
          ? c4Config
          : activeGame === 'dotsboxes'
          ? dotsConfig
          : boardConfig;

      const { roomCode: code, playerToken, roomState: initialRoom } = await createOnlineRoom(
        activeGame,
        hostP,
        config
      );
      setRoomCode(code);
      setLocalPlayerToken(playerToken);
      setRoomState(initialRoom);
      setLocalOnlineId(initialRoom.hostPlayer.id);

      setupRoomSubscription(code);
    } catch (err: any) {
      console.error(err);
      setIsOnlineWaiting(false);
      setOnlineError(err.message || 'failed');
    }
  };

  const handleJoinOnlineRoom = async (code: string) => {
    soundEngine.playTap();
    hapticsEngine.trigger('tap');
    try {
      setOpponentLeftAlert(false);
      setOpponentDisconnected(false);
      const guestP: Player = { ...player2, score: 0 };
      const result = await joinOnlineRoom(code, guestP);

      if (!result.success || !result.roomState || !result.playerToken) {
        setOnlineError(result.error || 'roomNotFound');
        return;
      }

      setRoomCode(code.toUpperCase());
      setLocalPlayerToken(result.playerToken);
      setRoomState(result.roomState);
      setLocalOnlineId(result.roomState.guestPlayer?.id || 'guest');
      setActiveGame(result.roomState.gameType);
      setActiveMode('online');
      setIsOnlineWaiting(false);
      setCurrentView('playing');

      if (result.roomState.gameType === 'tictactoe' && result.roomState.gameState) {
        setGameState(result.roomState.gameState);
      } else if (result.roomState.gameType === 'dotsboxes' && result.roomState.dotsGameState) {
        setDotsGameState(result.roomState.dotsGameState);
      } else if (result.roomState.gameType === 'connectfour' && result.roomState.c4GameState) {
        setC4GameState(result.roomState.c4GameState);
      }

      setupRoomSubscription(code);
    } catch (err: any) {
      console.error(err);
      setOnlineError('roomNotFound');
    }
  };

  const handleLeaveOnline = () => {
    if (roomCode && localPlayerToken) {
      leaveOnlineRoom(roomCode, localPlayerToken);
    }
    if (unsubscribeRoomRef.current) {
      unsubscribeRoomRef.current();
      unsubscribeRoomRef.current = null;
    }
    clearStoredOnlineSession();
    setRoomCode(null);
    setLocalPlayerToken(null);
    setRoomState(null);
    setIsOnlineWaiting(false);
    setOpponentLeftAlert(false);
    setOpponentDisconnected(false);
    setCurrentView('mode-select');
  };

  const handleOnlineRematch = () => {
    if (!roomCode || !localPlayerToken) return;
    soundEngine.playTap();
    hapticsEngine.trigger('tap');
    requestOnlineRematch(roomCode, localPlayerToken);
  };

  // Attempt auto-reconnect on mount if previous session exists
  useEffect(() => {
    const session = getStoredOnlineSession();
    if (session && session.roomCode && session.playerToken) {
      reconnectOnlineRoom(session.roomCode, session.playerId, session.playerToken).then((res) => {
        if (res.success && res.roomState) {
          setRoomCode(res.roomState.roomCode);
          setLocalPlayerToken(session.playerToken);
          setLocalOnlineId(session.playerId);
          setRoomState(res.roomState);
          setActiveGame(res.roomState.gameType);
          setActiveMode('online');
          if (res.roomState.status === 'active') {
            setCurrentView('playing');
          } else if (res.roomState.status === 'waiting') {
            setIsOnlineWaiting(true);
            setCurrentView('online-lobby');
          }
          setupRoomSubscription(res.roomState.roomCode);
        }
      });
    }
  }, [setupRoomSubscription]);

  // ----------------------------------------------------
  // Rematch / Play Again Controls
  // ----------------------------------------------------
  const handlePlayAgain = () => {
    soundEngine.playTap();
    hapticsEngine.trigger('tap');

    setIsReplayingWinningMove(false);
    setIsResultModalDismissedForReplay(false);
    setWinningMoveCoord(null);
    setWinningDotsLine(null);

    if (activeGame === 'connectfour') {
      const p2 = c4GameState.mode === 'ai' ? { ...aiPlayer, isAI: true } : { ...player2, isAI: false };
      const newC4 = createInitialConnectFourState(
        c4Config,
        player1,
        p2,
        c4GameState.mode,
        c4GameState.aiDifficulty
      );
      setC4GameState(newC4);
      setIsC4AiThinking(false);
      setShowCountdown(true);
      return;
    }

    if (activeGame === 'dotsboxes') {
      const p2 = dotsGameState.mode === 'ai' ? { ...aiPlayer, isAI: true } : { ...player2, isAI: false };
      const newDots = createInitialDotsState(
        [player1, p2],
        dotsConfig,
        dotsGameState.mode,
        dotsGameState.aiDifficulty
      );
      setDotsGameState(newDots);
      setIsDotsAiThinking(false);
      setShowCountdown(true);
      return;
    }

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
    setIsReplayingWinningMove(false);
    setIsResultModalDismissedForReplay(false);
    setWinningMoveCoord(null);
    setWinningDotsLine(null);
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

    // Also update players in active gameState
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

    // Update in dotsGameState
    setDotsGameState((prev) => {
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

    // Update in c4GameState
    setC4GameState((prev) => {
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

  // Save board configs
  const handleSelectBoardConfig = (config: BoardConfig) => {
    setBoardConfig(config);
    handleUpdateSettings({
      ...settings,
      lastBoardConfig: config
    });
    if (currentView === 'playing' && activeGame === 'tictactoe') {
      const p2 = activeMode === 'ai' ? { ...aiPlayer, isAI: true } : { ...player2, isAI: false };
      startNewGameWithPlayers(activeMode, player1, p2, config, activeMode === 'ai' ? difficulty : undefined);
    }
  };

  const handleSelectDotsConfig = (config: DotsBoardConfig) => {
    setDotsConfig(config);
    handleUpdateSettings({
      ...settings,
      lastDotsConfig: config
    });
    if (currentView === 'playing' && activeGame === 'dotsboxes') {
      const p2 = activeMode === 'ai' ? { ...aiPlayer, isAI: true } : { ...player2, isAI: false };
      const newDots = createInitialDotsState([player1, p2], config, activeMode, activeMode === 'ai' ? difficulty : undefined);
      setDotsGameState(newDots);
      setIsDotsAiThinking(false);
      setShowCountdown(true);
    }
  };

  const handleSelectC4Config = (config: ConnectFourConfig) => {
    setC4Config(config);
    handleUpdateSettings({
      ...settings,
      lastConnectFourConfig: config
    });
    if (currentView === 'playing' && activeGame === 'connectfour') {
      const p2 = activeMode === 'ai' ? { ...aiPlayer, isAI: true } : { ...player2, isAI: false };
      const newC4 = createInitialConnectFourState(config, player1, p2, activeMode, activeMode === 'ai' ? difficulty : undefined);
      setC4GameState(newC4);
      setIsC4AiThinking(false);
      setShowCountdown(true);
    }
  };

  const currentTurnPlayer = activeGame === 'connectfour'
    ? c4GameState.players[c4GameState.currentPlayerIndex] || player1
    : activeGame === 'dotsboxes'
    ? dotsGameState.players[dotsGameState.currentPlayerIndex] || player1
    : gameState.players[gameState.currentPlayerIndex] || player1;

  const winnerPlayer = activeGame === 'connectfour'
    ? (c4GameState.winnerPlayerId ? c4GameState.players.find((p) => p.id === c4GameState.winnerPlayerId) || null : null)
    : activeGame === 'dotsboxes'
    ? (dotsGameState.winnerPlayerId ? dotsGameState.players.find((p) => p.id === dotsGameState.winnerPlayerId) || null : null)
    : (gameState.winnerPlayerId ? gameState.players.find((p) => p.id === gameState.winnerPlayerId) || null : null);

  const isC4GameOver = activeGame === 'connectfour' && (c4GameState.status === 'won' || c4GameState.status === 'draw');
  const isDotsGameOver = activeGame === 'dotsboxes' && (dotsGameState.status === 'won' || dotsGameState.status === 'draw');
  const isTicTacToeGameOver = activeGame === 'tictactoe' && (gameState.status === 'won' || gameState.status === 'draw');

  const dotsCustomScoreText = activeGame === 'dotsboxes'
    ? (settings.language === 'bn'
        ? `${dotsGameState.players[0].name}: ${dotsGameState.playerScores[dotsGameState.players[0].id] || 0} বক্স | ${dotsGameState.players[1].name}: ${dotsGameState.playerScores[dotsGameState.players[1].id] || 0} বক্স`
        : `${dotsGameState.players[0].name}: ${dotsGameState.playerScores[dotsGameState.players[0].id] || 0} boxes | ${dotsGameState.players[1].name}: ${dotsGameState.playerScores[dotsGameState.players[1].id] || 0} boxes`)
    : undefined;

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
            activeGame={activeGame}
            onSelectGame={handleSelectGame}
            onSelectMode={handleSelectMode}
            currentDifficulty={difficulty}
            onChangeDifficulty={(diff) => {
              setDifficulty(diff);
              handleUpdateSettings({ ...settings, defaultDifficulty: diff });
            }}
            onOpenCustomizer={() => setShowCustomizerModal(true)}
            onOpenBoardPicker={() => {
              if (activeGame === 'connectfour') {
                setShowC4BoardModal(true);
              } else if (activeGame === 'dotsboxes') {
                setShowDotsBoardModal(true);
              } else {
                setShowBoardModal(true);
              }
            }}
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
            activeGame={activeGame}
            boardConfig={boardConfig}
            dotsConfig={dotsConfig}
            c4Config={c4Config}
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
                    if (activeMode === 'local') {
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
                  onClick={activeMode === 'online' ? handleOnlineRematch : handlePlayAgain}
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl sm:rounded-2xl bg-[#FFD166] border-2 border-[#073B4C] text-xs font-black text-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] sm:shadow-[3px_3px_0px_0px_#073B4C] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                  title={activeMode === 'online' ? (settings.language === 'bn' ? 'পুনরায় খেলুন' : 'Rematch') : t.playAgain}
                >
                  <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline text-[11px] sm:text-xs">{activeMode === 'online' ? (settings.language === 'bn' ? 'রিম্যাচ' : 'Rematch') : t.playAgain}</span>
                </button>
              </div>
            </div>

            {/* Opponent Disconnection Reconnect Status Banner */}
            {activeMode === 'online' && opponentDisconnected && !opponentLeftAlert && (
              <div className="w-full max-w-xl p-2.5 rounded-2xl bg-amber-50 border-2 border-[#FFD166] text-[#073B4C] text-xs font-black flex items-center justify-between gap-2 shadow-[2px_2px_0px_0px_#073B4C] animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <span>
                    {settings.language === 'bn'
                      ? 'প্রতিপক্ষের ইন্টারনেট সংযোগ সাময়িক বিচ্ছিন্ন হয়েছে। পুনরায় যুক্ত হওয়ার অপেক্ষা করা হচ্ছে...'
                      : 'Opponent temporarily disconnected. Waiting for reconnection...'}
                  </span>
                </div>
              </div>
            )}

            {/* Players Status & Score HUD */}
            <div className="w-full grid grid-cols-2 gap-2 sm:gap-4 my-0.5 max-w-xl">
              <PlayerBadge
                player={
                  activeGame === 'connectfour'
                    ? c4GameState.players[0]
                    : activeGame === 'dotsboxes'
                    ? dotsGameState.players[0]
                    : gameState.players[0]
                }
                isCurrentTurn={
                  activeGame === 'connectfour'
                    ? (c4GameState.currentPlayerIndex === 0 && c4GameState.status === 'playing')
                    : activeGame === 'dotsboxes'
                    ? (dotsGameState.currentPlayerIndex === 0 && dotsGameState.status === 'playing')
                    : (gameState.currentPlayerIndex === 0 && gameState.status === 'playing')
                }
                score={
                  activeGame === 'dotsboxes'
                    ? (dotsGameState.playerScores[dotsGameState.players[0].id] || 0)
                    : player1.score
                }
                language={settings.language}
              />
              <PlayerBadge
                player={
                  activeGame === 'connectfour'
                    ? c4GameState.players[1]
                    : activeGame === 'dotsboxes'
                    ? dotsGameState.players[1]
                    : gameState.players[1]
                }
                isCurrentTurn={
                  activeGame === 'connectfour'
                    ? (c4GameState.currentPlayerIndex === 1 && c4GameState.status === 'playing')
                    : activeGame === 'dotsboxes'
                    ? (dotsGameState.currentPlayerIndex === 1 && dotsGameState.status === 'playing')
                    : (gameState.currentPlayerIndex === 1 && gameState.status === 'playing')
                }
                score={
                  activeGame === 'dotsboxes'
                    ? (dotsGameState.playerScores[dotsGameState.players[1].id] || 0)
                    : (activeMode === 'ai' ? aiPlayer.score : player2.score)
                }
                language={settings.language}
              />
            </div>

            {/* Turn Indicator */}
            {((activeGame === 'connectfour' && c4GameState.status === 'playing') ||
              (activeGame === 'dotsboxes' && dotsGameState.status === 'playing') ||
              (activeGame === 'tictactoe' && gameState.status === 'playing')) && (
              <TurnIndicator
                player={currentTurnPlayer}
                language={settings.language}
                isAiThinking={
                  activeGame === 'connectfour'
                    ? isC4AiThinking
                    : activeGame === 'dotsboxes'
                    ? isDotsAiThinking
                    : isAiThinking
                }
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

            {/* Winning Move Replay Floating Banner */}
            {isResultModalDismissedForReplay && winnerPlayer && (
              <WinningMoveBanner
                winner={winnerPlayer}
                language={settings.language}
                onReplayAgain={handleReplayWinningMoveAgain}
                onOpenResultsModal={handleOpenResultsModal}
                isDotsBoxes={activeGame === 'dotsboxes'}
              />
            )}

            {/* Interactive Boards based on activeGame */}
            {activeGame === 'connectfour' ? (
              <ConnectFourBoard
                gameState={c4GameState}
                onDrop={handleConnectFourDrop}
                disabled={c4GameState.status !== 'playing' || isC4AiThinking}
                tiltEnabled={settings.tilt3dEnabled && !settings.reducedMotion}
                language={settings.language}
                winningCells={c4GameState.winningCells}
                lastDrop={c4GameState.lastDrop}
                isReplayingWinningMove={isReplayingWinningMove}
              />
            ) : activeGame === 'dotsboxes' ? (
              <DotsGameBoard
                gameState={dotsGameState}
                onLineClick={handleDotsLineClick}
                player1={dotsGameState.players[0]}
                player2={dotsGameState.players[1]}
                currentPlayer={currentTurnPlayer}
                disabled={dotsGameState.status !== 'playing' || isDotsAiThinking}
                language={settings.language}
                gridLineColor={settings.dotsGridLineColor}
                dotsPegColor={settings.dotsPegColor}
                winningLine={winningDotsLine}
                isReplayingWinningMove={isReplayingWinningMove}
              />
            ) : (
              <GameBoard
                board={gameState.board}
                onCellClick={handleCellClick}
                player1={gameState.players[0]}
                player2={gameState.players[1]}
                currentPlayer={currentTurnPlayer}
                winningCells={gameState.winningCells}
                lastMove={lastMoveCoord}
                winningMoveCoord={winningMoveCoord}
                isReplayingWinningMove={isReplayingWinningMove}
                disabled={gameState.status !== 'playing' || isAiThinking}
                tiltEnabled={settings.tilt3dEnabled && !settings.reducedMotion}
                language={settings.language}
              />
            )}

            {/* Quick Reactions Bar (Online Mode) */}
            {gameState.mode === 'online' && activeGame === 'tictactoe' && (
              <OnlineReactions
                onSendReaction={handleSendReaction}
                floatingReactions={floatingReactions}
              />
            )}
          </div>
        )}
      </main>

      {/* Achievement Toast Notifications */}
      <AchievementToast
        toasts={achievementToasts}
        onDismiss={handleDismissToast}
        language={settings.language}
      />

      {/* Countdown 3-2-1 Overlay */}
      {showCountdown && (
        <CountdownOverlay
          language={settings.language}
          onComplete={handleCountdownComplete}
        />
      )}

      {/* Game Result Modal (Win / Draw) */}
      {(isC4GameOver || isDotsGameOver || isTicTacToeGameOver) && !isResultModalDismissedForReplay && (
        <GameResultModal
          status={
            activeGame === 'connectfour'
              ? c4GameState.status
              : activeGame === 'dotsboxes'
              ? dotsGameState.status
              : gameState.status
          }
          winner={winnerPlayer}
          language={settings.language}
          onPlayAgain={handlePlayAgain}
          onGoHome={handleGoHome}
          onReplayWinningMove={winnerPlayer ? handleReplayWinningMove : undefined}
          onOpenBoardPicker={() => {
            if (activeGame === 'connectfour') {
              setShowC4BoardModal(true);
            } else if (activeGame === 'dotsboxes') {
              setShowDotsBoardModal(true);
            } else {
              setShowBoardModal(true);
            }
          }}
          moveCount={
            activeGame === 'connectfour'
              ? c4GameState.moveCount
              : activeGame === 'dotsboxes'
              ? dotsGameState.moveCount
              : gameState.moveCount
          }
          customScoreText={dotsCustomScoreText}
          isOnlineMatch={activeGame === 'tictactoe' && gameState.mode === 'online'}
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

      {/* Board Preset / Custom Grid Modal (Tic Tac Toe) */}
      {showBoardModal && (
        <BoardSelection
          currentConfig={boardConfig}
          onSelectConfig={handleSelectBoardConfig}
          onClose={() => setShowBoardModal(false)}
          language={settings.language}
        />
      )}

      {/* Board Preset / Custom Grid Modal (Dots & Boxes) */}
      {showDotsBoardModal && (
        <DotsBoardSelection
          currentConfig={dotsConfig}
          onSelectConfig={handleSelectDotsConfig}
          onClose={() => setShowDotsBoardModal(false)}
          language={settings.language}
        />
      )}

      {/* Board Preset / Custom Grid Modal (Connect Four) */}
      {showC4BoardModal && (
        <ConnectFourBoardSelection
          currentConfig={c4Config}
          onSelectConfig={handleSelectC4Config}
          onClose={() => setShowC4BoardModal(false)}
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
