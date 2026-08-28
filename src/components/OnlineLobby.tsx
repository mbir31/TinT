/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Player, Language, BoardConfig } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { soundEngine } from '../engine/soundEngine';
import { hapticsEngine } from '../engine/hapticsEngine';
import { Copy, Share2, ArrowLeft, Globe, Users, Loader2 } from 'lucide-react';

interface OnlineLobbyProps {
  localPlayer: Player;
  boardConfig: BoardConfig;
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
  boardConfig,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  currentRoomId,
  isWaitingForOpponent,
  language,
  errorMessage
}) => {
  const t = TRANSLATIONS[language];
  const [inputCode, setInputCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

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

  const handleShare = async () => {
    if (!currentRoomId) return;
    soundEngine.playTap();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TinT - 3D Tic-Tac-Toe',
          text: `${localPlayer.name} invites you to play TinT! Room Code: ${currentRoomId}`,
          url: window.location.href
        });
      } catch {
        // Fallback
      }
    } else {
      handleCopyCode();
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-4 px-4 py-3 select-none">
      {/* Lobby Container Card */}
      <div className="bg-white rounded-[32px] border-4 border-[#073B4C] p-6 shadow-[8px_8px_0px_0px_#073B4C] flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#073B4C]/10 pb-4">
          <button
            onClick={() => {
              soundEngine.playTap();
              onLeaveRoom();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#FFF9F0] border-2 border-[#073B4C] text-xs font-black text-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] hover:bg-amber-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.backToMenu}</span>
          </button>

          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#06D6A0]" />
            <span className="text-sm font-black text-[#073B4C]">
              {t.onlineMode}
            </span>
          </div>
        </div>

        {/* Error Toast */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-100 border-2 border-[#EF476F] text-[#073B4C] text-xs font-bold text-center">
            {errorMessage}
          </div>
        )}

        {/* Waiting in Room Screen */}
        {currentRoomId && isWaitingForOpponent ? (
          <div className="flex flex-col items-center text-center py-4 gap-4">
            <div className="relative w-20 h-20 rounded-3xl bg-[#FFD166] border-3 border-[#073B4C] shadow-[4px_4px_0px_0px_#073B4C] flex items-center justify-center text-[#073B4C]">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>

            <div>
              <h3 className="text-xl font-black text-[#073B4C]">
                {t.waitingForOpponent}
              </h3>
              <p className="text-xs font-bold text-[#4A4E69] mt-1">
                {t.shareCodeWithFriend}
              </p>
            </div>

            {/* Room Code Display Badge */}
            <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-50 border-3 border-[#073B4C] shadow-[4px_4px_0px_0px_#073B4C]">
              <span className="text-2xl font-black tracking-widest text-[#073B4C]">
                {currentRoomId}
              </span>
            </div>

            {/* Share and Copy Buttons */}
            <div className="flex items-center gap-2.5 w-full">
              <button
                onClick={handleCopyCode}
                className="flex-1 py-3 rounded-2xl bg-white border-2 border-[#073B4C] text-xs font-black text-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5"
              >
                <Copy className="w-4 h-4 text-[#118AB2]" />
                <span>{copied ? t.copiedCode : t.copyCode}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex-1 py-3 rounded-2xl bg-[#06D6A0] border-2 border-[#073B4C] text-xs font-black text-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-4 h-4 text-[#073B4C]" />
                <span>{t.shareInvite}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Normal Lobby: Create or Join options */
          <div className="flex flex-col gap-5 py-2">
            {/* Option A: Create Room */}
            <div className="p-5 rounded-2xl bg-[#06D6A0]/15 border-3 border-[#073B4C] flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#06D6A0] text-white font-black text-xs border border-[#073B4C]">
                  ১
                </span>
                <h4 className="text-base font-black text-[#073B4C]">
                  {t.createRoom}
                </h4>
              </div>
              <p className="text-xs font-bold text-[#4A4E69]">
                {language === 'bn'
                  ? `বর্তমান ${boardConfig.rows}x${boardConfig.cols} গ্রিডে একটি নতুন খেলার রুম তৈরি করুন`
                  : `Create a new game room with current ${boardConfig.rows}x${boardConfig.cols} board`}
              </p>
              <button
                id="btn-create-room"
                onClick={() => {
                  soundEngine.playTap();
                  hapticsEngine.trigger('medium');
                  onCreateRoom();
                }}
                className="w-full py-3 rounded-2xl bg-[#06D6A0] border-2 border-[#073B4C] text-[#073B4C] font-black text-sm shadow-[3px_3px_0px_0px_#073B4C] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                <span>{t.createRoomBtn}</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t-2 border-[#073B4C]/20 w-full" />
              <span className="absolute px-3 bg-white text-xs font-black text-[#073B4C]">
                {language === 'bn' ? 'অথবা' : 'OR'}
              </span>
            </div>

            {/* Option B: Join Room */}
            <div className="p-5 rounded-2xl bg-[#FFD166]/20 border-3 border-[#073B4C] flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFD166] text-[#073B4C] font-black text-xs border border-[#073B4C]">
                  ২
                </span>
                <h4 className="text-base font-black text-[#073B4C]">
                  {t.joinRoom}
                </h4>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder={t.enterRoomCode}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-white border-2 border-[#073B4C] text-[#073B4C] font-black text-center uppercase tracking-widest text-base shadow-[2px_2px_0px_0px_#073B4C] focus:outline-none focus:ring-2 focus:ring-[#118AB2]"
                />
                <button
                  id="btn-join-room"
                  disabled={inputCode.trim().length < 3}
                  onClick={() => {
                    soundEngine.playTap();
                    hapticsEngine.trigger('medium');
                    onJoinRoom(inputCode.trim());
                  }}
                  className={`px-5 py-2.5 rounded-2xl border-2 border-[#073B4C] text-[#073B4C] font-black text-sm shadow-[3px_3px_0px_0px_#073B4C] transition-all ${
                    inputCode.trim().length >= 3
                      ? 'bg-[#FFD166] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer'
                      : 'bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                  }`}
                >
                  {t.joinBtn}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
