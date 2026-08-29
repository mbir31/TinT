/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Player, Language } from '../types';
import { PLAYER_THEMES, AVATAR_OPTIONS } from '../constants/themes';
import { TRANSLATIONS } from '../i18n/translations';
import { AvatarIcon } from './AvatarIcon';
import { soundEngine } from '../engine/soundEngine';
import { hapticsEngine } from '../engine/hapticsEngine';
import { X, Check, User, Sparkles } from 'lucide-react';

interface PlayerCustomizerProps {
  player1: Player;
  player2: Player;
  aiPlayer: Player;
  onSave: (p1: Player, p2: Player, ai: Player) => void;
  onClose: () => void;
  language: Language;
}

export const PlayerCustomizer: React.FC<PlayerCustomizerProps> = ({
  player1,
  player2,
  aiPlayer,
  onSave,
  onClose,
  language
}) => {
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<'p1' | 'p2' | 'ai'>('p1');

  const [p1State, setP1State] = useState<Player>({ ...player1 });
  const [p2State, setP2State] = useState<Player>({ ...player2 });
  const [aiState, setAiState] = useState<Player>({ ...aiPlayer });

  const currentEdited =
    activeTab === 'p1' ? p1State : activeTab === 'p2' ? p2State : aiState;

  const setCurrentEdited = (updater: (prev: Player) => Player) => {
    if (activeTab === 'p1') setP1State(updater);
    else if (activeTab === 'p2') setP2State(updater);
    else setAiState(updater);
  };

  const handleSaveAll = () => {
    soundEngine.playTap();
    hapticsEngine.trigger('tap');
    onSave(p1State, p2State, aiState);
    onClose();
  };

  const activeTheme = PLAYER_THEMES[currentEdited.colorKey] || PLAYER_THEMES.blue;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#073B4C]/60 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-lg bg-white rounded-[32px] border-4 border-[#073B4C] shadow-[10px_10px_0px_0px_#073B4C] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b-3 border-[#073B4C] bg-[#FFF9F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#EF476F] border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#073B4C] leading-none">
                {t.customizerTitle}
              </h2>
              <span className="text-xs font-bold text-[#4A4E69]">
                {t.customizerDesc}
              </span>
            </div>
          </div>
          <button
            id="btn-close-customizer"
            onClick={() => {
              soundEngine.playTap();
              onClose();
            }}
            className="p-2 rounded-2xl bg-white border-2 border-[#073B4C] text-[#073B4C] shadow-[2px_2px_0px_0px_#EF476F] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Selector Tabs */}
        <div className="flex p-3 bg-amber-50/70 border-b-2 border-[#073B4C]/10 gap-2">
          <button
            onClick={() => {
              soundEngine.playTap();
              setActiveTab('p1');
            }}
            className={`flex-1 py-2 rounded-2xl font-black text-xs border-2 border-[#073B4C] transition-all ${
              activeTab === 'p1'
                ? 'bg-[#118AB2] text-white shadow-[3px_3px_0px_0px_#073B4C]'
                : 'bg-white text-[#073B4C]'
            }`}
          >
            <span>{p1State.name || t.player1}</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playTap();
              setActiveTab('p2');
            }}
            className={`flex-1 py-2 rounded-2xl font-black text-xs border-2 border-[#073B4C] transition-all ${
              activeTab === 'p2'
                ? 'bg-[#EF476F] text-white shadow-[3px_3px_0px_0px_#073B4C]'
                : 'bg-white text-[#073B4C]'
            }`}
          >
            <span>{p2State.name || t.player2}</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playTap();
              setActiveTab('ai');
            }}
            className={`flex-1 py-2 rounded-2xl font-black text-xs border-2 border-[#073B4C] transition-all ${
              activeTab === 'ai'
                ? 'bg-[#7209B7] text-white shadow-[3px_3px_0px_0px_#073B4C]'
                : 'bg-white text-[#073B4C]'
            }`}
          >
            <span>{aiState.name || t.aiBot}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto max-h-[58vh] flex-1 bg-[#FFFDF9] flex flex-col gap-4">
          {/* Live Board Piece Preview Card */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border-2 border-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C]">
            <div
              className={`w-20 h-14 rounded-2xl border-2 border-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C] flex items-center justify-center px-2 flex-shrink-0 ${
                activeTheme.id === 'amber' ? 'text-[#073B4C]' : 'text-white'
              }`}
              style={{ backgroundColor: activeTheme.primary }}
            >
              <span className="font-black text-sm sm:text-base tracking-wide truncate max-w-full text-center">
                {currentEdited.name || 'Player'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-black text-[#4A4E69] uppercase tracking-wider block">
                {language === 'bn' ? 'বোর্ডের চালের গুটি প্রিভিউ' : 'Board Piece Preview'}
              </span>
              <span className="text-sm font-black text-[#073B4C]">
                {language === 'bn' ? 'বোর্ডে এই নাম বসবে' : 'This name marks your cells'}
              </span>
            </div>
          </div>

          {/* Name Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-[#073B4C] uppercase tracking-wide flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {t.nameLabel}
            </label>
            <input
              type="text"
              maxLength={15}
              value={currentEdited.name}
              onChange={(e) =>
                setCurrentEdited((prev) => ({ ...prev, name: e.target.value }))
              }
              className="px-4 py-2.5 rounded-2xl bg-white border-2 border-[#073B4C] text-[#073B4C] font-bold text-sm shadow-[2px_2px_0px_0px_#073B4C] focus:outline-none focus:ring-2 focus:ring-[#118AB2]"
              placeholder="Enter name..."
            />
          </div>

          {/* Color Scheme Picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-[#073B4C] uppercase tracking-wide">
              {t.colorTheme}
            </label>
            <div className="grid grid-cols-6 gap-2">
              {Object.values(PLAYER_THEMES).map((thm) => (
                <button
                  key={thm.id}
                  onClick={() => {
                    soundEngine.playTap();
                    setCurrentEdited((prev) => ({ ...prev, colorKey: thm.id }));
                  }}
                  className={`h-10 rounded-xl border-2 border-[#073B4C] flex items-center justify-center text-white transition-transform ${
                    currentEdited.colorKey === thm.id
                      ? 'scale-110 shadow-[3px_3px_0px_0px_#073B4C] ring-2 ring-[#073B4C]'
                      : 'opacity-85 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: thm.primary }}
                  aria-label={thm.name}
                >
                  {currentEdited.colorKey === thm.id && (
                    <Check className="w-4 h-4 stroke-[3]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Avatar Icon Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-[#073B4C] uppercase tracking-wide">
              {t.avatarSymbol}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {AVATAR_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    soundEngine.playTap();
                    setCurrentEdited((prev) => ({ ...prev, avatar: opt.id }));
                  }}
                  className={`p-3 rounded-2xl border-2 border-[#073B4C] flex flex-col items-center justify-center transition-all ${
                    currentEdited.avatar === opt.id
                      ? 'bg-[#FFD166] shadow-[3px_3px_0px_0px_#073B4C] scale-105'
                      : 'bg-white hover:bg-amber-50 shadow-[1px_1px_0px_0px_#073B4C]'
                  }`}
                >
                  <AvatarIcon name={opt.id} className="w-6 h-6 text-[#073B4C]" />
                  <span className="text-[10px] font-bold text-[#073B4C] mt-1 truncate max-w-full">
                    {language === 'bn' ? opt.nameBn : opt.nameEn}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Save Action */}
        <div className="p-4 border-t-3 border-[#073B4C] bg-[#FFF9F0]">
          <button
            id="btn-save-customizer"
            onClick={handleSaveAll}
            className="w-full py-3.5 rounded-2xl bg-[#06D6A0] border-3 border-[#073B4C] text-[#073B4C] font-black text-sm shadow-[4px_4px_0px_0px_#073B4C] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>{t.saveAndPlay}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
