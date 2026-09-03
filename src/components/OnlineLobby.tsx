/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Player, Language, BoardConfig, GameType, DotsBoardConfig, ConnectFourConfig } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { soundEngine } from '../engine/soundEngine';
import { hapticsEngine } from '../engine/hapticsEngine';
import { isSocketConnected, getSocket } from '../engine/multiplayerEngine';
import { useOnlineStatus } from '../engine/networkStatus';
import { Copy, Share2, ArrowLeft, Globe, Users, Loader2, Zap, CheckCircle2, AlertCircle, WifiOff } from 'lucide-react';

interface OnlineLobbyProps {
  localPlayer: Player;
  activeGame: GameType;
  boardConfig: BoardConfig;
  dotsConfig?: DotsBoardConfig;
  c4Config?: ConnectFourConfig;
  onCreateRoom: () => void;
  onJoinRoom: (roomCode: string) => void;
  onLeaveRoom: () => void;
  currentRoomId: string | null;
  isWaitingForOpponent: boolean;
  onStartOnlineMatch?: () => void;
  language: Language;
  errorMessage?: string | null;
}

export const OnlineLobby: React.FC<OnlineLobbyProps> = ({
  localPlayer,
  activeGame,
  boardConfig,
  dotsConfig,
  c4Config,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  currentRoomId,
  isWaitingForOpponent,
  language,
  errorMessage
}) => {
  const t = TRANSLATIONS[language];
  const isOnlineState = useOnlineStatus();
  const [inputCode, setInputCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [isServerReady, setIsServerReady] = useState<boolean>(isSocketConnected());

  // Auto-detect room from URL query params (e.g. ?room=XYZ12 or ?join=XYZ12)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room') || params.get('join');
      if (roomParam && !inputCode) {
        setInputCode(roomParam.trim().toUpperCase().slice(0, 6));
      }
    }
  }, []);

  // Monitor socket connection state
  useEffect(() => {
    const s = getSocket();
    const handleConnect = () => setIsServerReady(true);
    const handleDisconnect = () => setIsServerReady(false);

    s.on('connect', handleConnect);
    s.on('disconnect', handleDisconnect);
    setIsServerReady(s.connected);

    return () => {
      s.off('connect', handleConnect);
      s.off('disconnect', handleDisconnect);
    };
  }, []);

  const getInviteUrl = () => {
    if (!currentRoomId || typeof window === 'undefined') return '';
    return `${window.location.origin}${window.location.pathname}?room=${currentRoomId}`;
  };

  const handleCopyCode = async () => {
    if (!currentRoomId) return;
    try {
      await navigator.clipboard.writeText(currentRoomId);
      soundEngine.playTap();
      hapticsEngine.trigger('tap');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyLink = async () => {
    if (!currentRoomId) return;
    const url = getInviteUrl();
    try {
      await navigator.clipboard.writeText(url);
      soundEngine.playTap();
      hapticsEngine.trigger('tap');
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      handleCopyCode();
    }
  };

  const handleShare = async () => {
    if (!currentRoomId) return;
    soundEngine.playTap();
    const shareUrl = getInviteUrl();
    const gameName =
      activeGame === 'dotsboxes'
        ? (language === 'bn' ? 'ডটস অ্যান্ড বক্সেস (Dots & Boxes)' : 'Dots & Boxes')
        : activeGame === 'connectfour'
        ? (language === 'bn' ? 'কানেক্ট ফোর (Connect Four)' : 'Connect Four')
        : (language === 'bn' ? 'টিক-ট্যাক-টো (Tic-Tac-Toe)' : '3D Tic-Tac-Toe');

    if (navigator.share) {
      try {
        await navigator.share({
          title: `TinT - ${gameName}`,
          text: `${localPlayer.name} has invited you to play ${gameName}! Room Code: ${currentRoomId}`,
          url: shareUrl
        });
      } catch {
        // Fallback
      }
    } else {
      handleCopyLink();
    }
  };

  // Convert error codes to user-friendly messages
  const getErrorDisplayText = (err: string) => {
    if (err === 'roomNotFound') return t.roomNotFound || 'Room not found or expired.';
    if (err === 'roomFull') return t.roomFull || 'This room is already full.';
    if (err === 'connectionTimeout') return language === 'bn' ? 'সার্ভারে সংযোগে দেরি হচ্ছে। পুনরায় চেষ্টা করুন।' : 'Connection timeout. Please try again.';
    return err;
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-4 px-3 sm:px-4 py-2 select-none animate-in fade-in duration-200">
      {/* Lobby Container Card */}
      <div className="bg-white rounded-2xl sm:rounded-[32px] border-3 sm:border-4 border-[#073B4C] p-4 sm:p-6 shadow-[6px_6px_0px_0px_#073B4C] sm:shadow-[8px_8px_0px_0px_#073B4C] flex flex-col gap-4 sm:gap-5">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b-2 border-[#073B4C]/10 pb-3 sm:pb-4">
          <button
            onClick={() => {
              soundEngine.playTap();
              onLeaveRoom();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl sm:rounded-2xl bg-[#FFF9F0] border-2 border-[#073B4C] text-xs font-black text-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] hover:bg-amber-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.home}</span>
          </button>

          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-[#06D6A0]" />
            <span className="text-xs sm:text-sm font-black text-[#073B4C]">
              {t.onlineMode}
            </span>
          </div>
        </div>

        {/* Engine Status Banner */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#FFF9F0] border-2 border-[#073B4C]/20 text-[11px] font-bold text-[#073B4C]">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#FFD166] fill-current" />
            <span>
              {language === 'bn' ? 'রিয়েল-টাইম ইঞ্জিন:' : 'Real-time Engine:'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                !isOnlineState
                  ? 'bg-[#EF476F]'
                  : isServerReady
                  ? 'bg-[#06D6A0] animate-pulse'
                  : 'bg-[#FFD166] animate-pulse'
              }`}
            />
            <span className="font-black text-[10px] sm:text-[11px]">
              {!isOnlineState
                ? language === 'bn'
                  ? 'অফলাইন (ইন্টারনেট বিচ্ছিন্ন)'
                  : 'Offline (No Internet)'
                : isServerReady
                ? language === 'bn'
                  ? 'সক্রিয় (WebSockets Ready)'
                  : 'Active (WebSockets Ready)'
                : language === 'bn'
                ? 'সংযোগ নেওয়া হচ্ছে...'
                : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* Offline Warning Notice if offline */}
        {!isOnlineState && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-[#073B4C] text-[#073B4C] text-xs font-bold flex items-start gap-2.5 shadow-[2px_2px_0px_0px_#073B4C]">
            <WifiOff className="w-5 h-5 text-[#EF476F] flex-shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="font-black">
                {language === 'bn' ? 'আপনি বর্তমানে অফলাইনে আছেন' : 'You are currently offline'}
              </span>
              <span className="text-[11px] text-[#4A4E69]">
                {language === 'bn'
                  ? 'অনলাইন মাল্টিপ্লেয়ার খেলার জন্য ইন্টারনেট সংযোগ প্রয়োজন। আপনার লোকাল খেলা (AI ও ২-প্লেয়ার মোড) ১০০% অফলাইনে কাজ করবে।'
                  : 'Internet connection is required for online multiplayer. Local 2-Player & AI modes work 100% offline.'}
              </span>
            </div>
          </div>
        )}

        {/* Error Notification Toast */}
        {errorMessage && (
          <div className="p-3 rounded-xl sm:rounded-2xl bg-rose-100 border-2 border-[#EF476F] text-[#073B4C] text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-[#EF476F] flex-shrink-0" />
            <span className="flex-1">{getErrorDisplayText(errorMessage)}</span>
          </div>
        )}

        {/* WAITING SCREEN (When room is created and waiting for guest to join) */}
        {currentRoomId && isWaitingForOpponent ? (
          <div className="flex flex-col items-center text-center py-3 sm:py-4 gap-3.5 sm:gap-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-[#FFD166] border-3 border-[#073B4C] shadow-[4px_4px_0px_0px_#073B4C] flex items-center justify-center text-[#073B4C]">
              <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin" />
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-black text-[#073B4C]">
                {t.waitingOpponent || 'Waiting for opponent...'}
              </h3>
              <p className="text-xs font-bold text-[#4A4E69] mt-0.5">
                {language === 'bn'
                  ? 'আপনার বন্ধুকে নিচের ৫ অক্ষরের কোড বা লিংকটি দিন'
                  : 'Share this 5-character code or link with your friend'}
              </p>
            </div>

            {/* Room Code Display Badge */}
            <div className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-amber-50 border-3 border-[#073B4C] shadow-[4px_4px_0px_0px_#073B4C] w-full max-w-xs">
              <span className="text-3xl font-black tracking-widest text-[#073B4C] font-mono">
                {currentRoomId}
              </span>
            </div>

            {/* Share and Copy Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full pt-1">
              <button
                id="btn-copy-room-code"
                onClick={handleCopyCode}
                className="w-full sm:flex-1 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white border-2 border-[#073B4C] text-xs font-black text-[#073B4C] shadow-[2.5px_2.5px_0px_0px_#073B4C] hover:bg-amber-50 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#06D6A0]" />
                    <span>{language === 'bn' ? 'কোড কপি হয়েছে!' : 'Code Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#118AB2]" />
                    <span>{t.copyCode || 'Copy Code'}</span>
                  </>
                )}
              </button>

              <button
                id="btn-share-room-link"
                onClick={handleShare}
                className="w-full sm:flex-1 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[#06D6A0] border-2 border-[#073B4C] text-xs font-black text-[#073B4C] shadow-[2.5px_2.5px_0px_0px_#073B4C] hover:bg-[#05c493] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-4 h-4 text-[#073B4C]" />
                <span>
                  {linkCopied
                    ? language === 'bn'
                      ? 'লিংক কপি হয়েছে!'
                      : 'Link Copied!'
                    : t.shareLink || 'Share Invite'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* Normal Lobby: Create or Join Room options */
          <div className="flex flex-col gap-4 sm:gap-5 py-1">
            {/* Option 1: Create Room */}
            <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-[#06D6A0]/15 border-2 sm:border-3 border-[#073B4C] flex flex-col gap-2.5 sm:gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#06D6A0] text-white font-black text-xs border border-[#073B4C] flex items-center justify-center">
                    {language === 'bn' ? '১' : '1'}
                  </span>
                  <h4 className="text-sm sm:text-base font-black text-[#073B4C]">
                    {t.createRoom}
                  </h4>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white border border-[#073B4C] text-[#118AB2]">
                  {activeGame === 'dotsboxes'
                    ? `${(dotsConfig?.dotRows || 4) - 1}×${(dotsConfig?.dotCols || 4) - 1} ${language === 'bn' ? 'বক্স' : 'Boxes'}`
                    : activeGame === 'connectfour'
                    ? `${c4Config?.cols || 7}×${c4Config?.rows || 6} C4`
                    : `${boardConfig.rows}×${boardConfig.cols} Grid`}
                </span>
              </div>

              <p className="text-xs font-bold text-[#4A4E69]">
                {language === 'bn'
                  ? `বর্তমান ${
                      activeGame === 'dotsboxes'
                        ? 'ডটস অ্যান্ড বক্সেস'
                        : activeGame === 'connectfour'
                        ? 'কানেক্ট ফোর'
                        : 'টিক-ট্যাক-টো'
                    } কনফিগারেশনে একটি নতুন খেলার রুম তৈরি করুন`
                  : `Create an online room for ${
                      activeGame === 'dotsboxes'
                        ? 'Dots & Boxes'
                        : activeGame === 'connectfour'
                        ? 'Connect Four'
                        : 'Tic-Tac-Toe'
                    } and invite your friend`}
              </p>

              <button
                id="btn-create-room"
                disabled={!isOnlineState}
                onClick={() => {
                  soundEngine.playTap();
                  hapticsEngine.trigger('medium');
                  onCreateRoom();
                }}
                className={`w-full py-3 rounded-xl sm:rounded-2xl border-2 border-[#073B4C] text-[#073B4C] font-black text-xs sm:text-sm shadow-[3px_3px_0px_0px_#073B4C] transition-all flex items-center justify-center gap-2 ${
                  isOnlineState
                    ? 'bg-[#06D6A0] hover:bg-[#05c493] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer'
                    : 'bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>
                  {!isOnlineState
                    ? language === 'bn'
                      ? 'অফলাইন (রুম তৈরি নিষ্ক্রিয়)'
                      : 'Offline (Cannot Create)'
                    : language === 'bn'
                    ? 'রুম তৈরি করুন'
                    : 'Create Room'}
                </span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t-2 border-[#073B4C]/20 w-full" />
              <span className="absolute px-3 bg-white text-xs font-black text-[#073B4C]">
                {language === 'bn' ? 'অথবা' : 'OR'}
              </span>
            </div>

            {/* Option 2: Join Room */}
            <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-[#FFD166]/20 border-2 sm:border-3 border-[#073B4C] flex flex-col gap-2.5 sm:gap-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#FFD166] text-[#073B4C] font-black text-xs border border-[#073B4C] flex items-center justify-center">
                  {language === 'bn' ? '২' : '2'}
                </span>
                <h4 className="text-sm sm:text-base font-black text-[#073B4C]">
                  {t.joinRoom}
                </h4>
              </div>

              <div className="flex gap-2">
                <input
                  id="input-join-room-code"
                  type="text"
                  maxLength={6}
                  disabled={!isOnlineState}
                  placeholder={t.enterRoomCode || 'Enter 5-letter code'}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white border-2 border-[#073B4C] text-[#073B4C] font-black text-center uppercase tracking-widest text-sm sm:text-base font-mono shadow-[2px_2px_0px_0px_#073B4C] focus:outline-none focus:ring-2 focus:ring-[#118AB2] disabled:opacity-50 disabled:bg-slate-100"
                />
                <button
                  id="btn-join-room"
                  disabled={!isOnlineState || inputCode.trim().length < 3}
                  onClick={() => {
                    soundEngine.playTap();
                    hapticsEngine.trigger('medium');
                    onJoinRoom(inputCode.trim());
                  }}
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border-2 border-[#073B4C] text-[#073B4C] font-black text-xs sm:text-sm shadow-[3px_3px_0px_0px_#073B4C] transition-all flex items-center gap-1.5 ${
                    isOnlineState && inputCode.trim().length >= 3
                      ? 'bg-[#FFD166] hover:bg-[#ffc947] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer'
                      : 'bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'যুক্ত হন' : 'Join'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
