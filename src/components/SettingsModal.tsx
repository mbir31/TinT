/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserSettings, Language, TokenColorPalette } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { TOKEN_COLOR_PALETTES, PLAYER_THEMES } from '../constants/themes';
import { soundEngine } from '../engine/soundEngine';
import { hapticsEngine } from '../engine/hapticsEngine';
import { clearAllLocalData } from '../engine/storage';
import { X, Volume2, VolumeX, Smartphone, Eye, Sparkles, Trash2, Globe, Compass, Palette, RotateCcw, Check, Layers, User, Bot } from 'lucide-react';

interface SettingsModalProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onClose: () => void;
  language: Language;
}

const GRID_COLOR_PRESETS = [
  { id: 'classic', nameBn: 'ক্লাসিক নেভি', nameEn: 'Classic Navy', lineColor: '#073B4C', dotColor: '#073B4C' },
  { id: 'charcoal', nameBn: 'ডার্ক স্লেট', nameEn: 'Dark Slate', lineColor: '#334155', dotColor: '#1E293B' },
  { id: 'ocean', nameBn: 'সাগর নীল', nameEn: 'Ocean Blue', lineColor: '#118AB2', dotColor: '#0A6684' },
  { id: 'emerald', nameBn: 'পান্না সবুজ', nameEn: 'Emerald Teal', lineColor: '#06D6A0', dotColor: '#04A77D' },
  { id: 'purple', nameBn: 'রয়েল ভায়োলেট', nameEn: 'Royal Violet', lineColor: '#7209B7', dotColor: '#560BAD' },
  { id: 'amber', nameBn: 'সোনালী অ্যাম্বার', nameEn: 'Warm Amber', lineColor: '#D97706', dotColor: '#B45309' },
  { id: 'coral', nameBn: 'গোলাপী কোরাল', nameEn: 'Coral Pink', lineColor: '#EF476F', dotColor: '#D6224E' },
  { id: 'rose', nameBn: 'রুবি রোজ', nameEn: 'Ruby Rose', lineColor: '#BE185D', dotColor: '#9D174D' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
  language
}) => {
  const t = TRANSLATIONS[language];
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const toggleSound = () => {
    const next = !settings.soundEnabled;
    soundEngine.setEnabled(next);
    onUpdateSettings({ ...settings, soundEnabled: next });
    if (next) soundEngine.playTap();
  };

  const setVolume = (val: number) => {
    soundEngine.setVolume(val);
    onUpdateSettings({ ...settings, audioVolume: val });
  };

  const toggleHaptics = () => {
    const next = !settings.hapticsEnabled;
    hapticsEngine.setEnabled(next);
    if (next) hapticsEngine.trigger('tap');
    onUpdateSettings({ ...settings, hapticsEnabled: next });
  };

  const toggleTilt = () => {
    soundEngine.playTap();
    onUpdateSettings({ ...settings, tilt3dEnabled: !settings.tilt3dEnabled });
  };

  const toggleMotion = () => {
    soundEngine.playTap();
    onUpdateSettings({ ...settings, reducedMotion: !settings.reducedMotion });
  };

  const handleResetData = () => {
    clearAllLocalData();
    soundEngine.playTap();
    setShowResetConfirm(false);
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#073B4C]/60 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-md bg-white rounded-[32px] border-4 border-[#073B4C] shadow-[10px_10px_0px_0px_#073B4C] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b-3 border-[#073B4C] bg-[#FFF9F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#118AB2] border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#073B4C] leading-none">
                {t.settings}
              </h2>
              <span className="text-xs font-bold text-[#4A4E69]">
                {t.customizerDesc}
              </span>
            </div>
          </div>
          <button
            id="btn-close-settings"
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

        {/* Settings Body */}
        <div className="p-5 overflow-y-auto max-h-[65vh] flex-1 bg-[#FFFDF9] flex flex-col gap-4">
          {/* Language Preference */}
          <div className="p-4 rounded-2xl bg-white border-2 border-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-[#118AB2]" />
              <div>
                <span className="text-sm font-black text-[#073B4C] block">
                  {t.language}
                </span>
                <span className="text-xs font-bold text-[#4A4E69]">
                  {language === 'bn' ? 'বাংলা ভাষা' : 'English'}
                </span>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => {
                  soundEngine.playTap();
                  onUpdateSettings({ ...settings, language: 'bn' });
                }}
                className={`px-3 py-1 rounded-xl text-xs font-black border-2 border-[#073B4C] transition-all ${
                  language === 'bn'
                    ? 'bg-[#FFD166] text-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C]'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                বাংলা
              </button>
              <button
                onClick={() => {
                  soundEngine.playTap();
                  onUpdateSettings({ ...settings, language: 'en' });
                }}
                className={`px-3 py-1 rounded-xl text-xs font-black border-2 border-[#073B4C] transition-all ${
                  language === 'en'
                    ? 'bg-[#FFD166] text-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C]'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                EN
              </button>
            </div>
          </div>

          {/* Sound Toggle & Volume */}
          <div className="p-4 rounded-2xl bg-white border-2 border-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-[#06D6A0]" />
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-400" />
                )}
                <div>
                  <span className="text-sm font-black text-[#073B4C] block">
                    {t.soundEffects}
                  </span>
                  <span className="text-xs font-bold text-[#4A4E69]">
                    Web Audio API
                  </span>
                </div>
              </div>
              <button
                onClick={toggleSound}
                className={`px-4 py-1.5 rounded-xl text-xs font-black border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] transition-all ${
                  settings.soundEnabled
                    ? 'bg-[#06D6A0] text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {settings.soundEnabled ? t.on : t.off}
              </button>
            </div>

            {settings.soundEnabled && (
              <div className="pt-2 border-t border-[#073B4C]/10 flex items-center gap-3">
                <span className="text-xs font-bold text-[#4A4E69]">
                  {t.volume}:
                </span>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={settings.audioVolume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-[#06D6A0] cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Haptics Toggle */}
          <div className="p-4 rounded-2xl bg-white border-2 border-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-[#EF476F]" />
              <div>
                <span className="text-sm font-black text-[#073B4C] block">
                  {t.hapticFeedback}
                </span>
                <span className="text-xs font-bold text-[#4A4E69]">
                  Haptic Feedback
                </span>
              </div>
            </div>
            <button
              onClick={toggleHaptics}
              className={`px-4 py-1.5 rounded-xl text-xs font-black border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] transition-all ${
                settings.hapticsEnabled
                  ? 'bg-[#EF476F] text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {settings.hapticsEnabled ? t.on : t.off}
            </button>
          </div>

          {/* 3D Board Tilt Toggle */}
          <div className="p-4 rounded-2xl bg-white border-2 border-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Compass className="w-5 h-5 text-[#FFD166]" />
              <div>
                <span className="text-sm font-black text-[#073B4C] block">
                  {t.tilt3d}
                </span>
                <span className="text-xs font-bold text-[#4A4E69]">
                  Perspective Tilt
                </span>
              </div>
            </div>
            <button
              onClick={toggleTilt}
              className={`px-4 py-1.5 rounded-xl text-xs font-black border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] transition-all ${
                settings.tilt3dEnabled
                  ? 'bg-[#FFD166] text-[#073B4C]'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {settings.tilt3dEnabled ? t.on : t.off}
            </button>
          </div>

          {/* Reduced Motion Toggle */}
          <div className="p-4 rounded-2xl bg-white border-2 border-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-[#7209B7]" />
              <div>
                <span className="text-sm font-black text-[#073B4C] block">
                  {t.reducedMotion}
                </span>
                <span className="text-xs font-bold text-[#4A4E69]">
                  Accessibility
                </span>
              </div>
            </div>
            <button
              onClick={toggleMotion}
              className={`px-4 py-1.5 rounded-xl text-xs font-black border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] transition-all ${
                settings.reducedMotion
                  ? 'bg-[#7209B7] text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {settings.reducedMotion ? t.on : t.off}
            </button>
          </div>

          {/* Game Token Color Palettes Customizer */}
          <div className="p-4 rounded-2xl bg-white border-2 border-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C] flex flex-col gap-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#EF476F] border border-[#073B4C] flex items-center justify-center text-white flex-shrink-0 shadow-[1px_1px_0px_0px_#073B4C]">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-black text-[#073B4C] block">
                    {t.tokenPalettesTitle}
                  </span>
                  <span className="text-xs font-bold text-[#4A4E69]">
                    {t.tokenPalettesDesc}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Token Color Preview */}
            <div className="p-2.5 rounded-xl bg-[#FFF9F0] border border-[#073B4C]/20 flex items-center justify-around gap-2">
              {/* Player 1 token pill */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-10 h-10 rounded-xl border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] flex items-center justify-center text-white font-black text-sm transition-transform hover:scale-105"
                  style={{
                    backgroundColor: PLAYER_THEMES[settings.defaultPlayer1.colorKey]?.primary || '#EF476F'
                  }}
                >
                  <User className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-[#073B4C]">
                  {t.p1TokenLabel}
                </span>
              </div>

              {/* VS indicator */}
              <div className="text-xs font-black text-[#4A4E69] px-2 py-0.5 rounded-md bg-white/80 border border-[#073B4C]/10">
                VS
              </div>

              {/* Player 2 token pill */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-10 h-10 rounded-xl border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] flex items-center justify-center text-white font-black text-sm transition-transform hover:scale-105"
                  style={{
                    backgroundColor: PLAYER_THEMES[settings.defaultPlayer2.colorKey]?.primary || '#118AB2'
                  }}
                >
                  <User className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-[#073B4C]">
                  {t.p2TokenLabel}
                </span>
              </div>

              {/* Divider */}
              <div className="h-8 w-px bg-[#073B4C]/20" />

              {/* AI token pill */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-10 h-10 rounded-xl border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] flex items-center justify-center text-white font-black text-sm transition-transform hover:scale-105"
                  style={{
                    backgroundColor: PLAYER_THEMES[settings.defaultAIPlayer.colorKey]?.primary || '#7209B7'
                  }}
                >
                  <Bot className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-[#073B4C]">
                  {t.aiTokenLabel}
                </span>
              </div>
            </div>

            {/* Selectable Palettes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TOKEN_COLOR_PALETTES.map((palette) => {
                const isSelected =
                  settings.defaultPlayer1.colorKey === palette.p1Theme &&
                  settings.defaultPlayer2.colorKey === palette.p2Theme &&
                  settings.defaultAIPlayer.colorKey === palette.aiTheme;

                const p1Theme = PLAYER_THEMES[palette.p1Theme] || PLAYER_THEMES.coral;
                const p2Theme = PLAYER_THEMES[palette.p2Theme] || PLAYER_THEMES.blue;
                const aiTheme = PLAYER_THEMES[palette.aiTheme] || PLAYER_THEMES.purple;

                return (
                  <button
                    key={palette.id}
                    onClick={() => {
                      soundEngine.playTap();
                      if (settings.hapticsEnabled) hapticsEngine.trigger('tap');
                      onUpdateSettings({
                        ...settings,
                        tokenPaletteId: palette.id,
                        defaultPlayer1: {
                          ...settings.defaultPlayer1,
                          colorKey: palette.p1Theme
                        },
                        defaultPlayer2: {
                          ...settings.defaultPlayer2,
                          colorKey: palette.p2Theme
                        },
                        defaultAIPlayer: {
                          ...settings.defaultAIPlayer,
                          colorKey: palette.aiTheme
                        }
                      });
                    }}
                    className={`p-2.5 rounded-xl border-2 transition-all text-left flex flex-col gap-2 ${
                      isSelected
                        ? 'border-[#073B4C] bg-white shadow-[3px_3px_0px_0px_#073B4C] ring-2 ring-[#073B4C]/20'
                        : 'border-[#073B4C]/20 bg-white/70 hover:bg-white hover:border-[#073B4C]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-black text-[#073B4C] truncate">
                        {language === 'bn' ? palette.nameBn : palette.nameEn}
                      </span>
                      {isSelected && (
                        <span className="px-1.5 py-0.5 rounded-md bg-[#06D6A0] text-white text-[9px] font-black flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" />
                          <span>{t.activePaletteTag}</span>
                        </span>
                      )}
                    </div>

                    {/* Color Dots Strip */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#073B4C]/10">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-5 h-5 rounded-full border-2 border-[#073B4C] shadow-[1px_1px_0px_0px_#073B4C]"
                          style={{ backgroundColor: p1Theme.primary }}
                          title={`Player 1: ${p1Theme.name}`}
                        />
                        <div
                          className="w-5 h-5 rounded-full border-2 border-[#073B4C] shadow-[1px_1px_0px_0px_#073B4C]"
                          style={{ backgroundColor: p2Theme.primary }}
                          title={`Player 2: ${p2Theme.name}`}
                        />
                        <div
                          className="w-5 h-5 rounded-full border-2 border-[#073B4C] shadow-[1px_1px_0px_0px_#073B4C]"
                          style={{ backgroundColor: aiTheme.primary }}
                          title={`AI Bot: ${aiTheme.name}`}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-[#4A4E69] truncate">
                        {language === 'bn' ? palette.descBn : palette.descEn}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dots & Boxes Grid & Line Colors Customizer */}
          <div className="p-4 rounded-2xl bg-white border-2 border-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C] flex flex-col gap-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#FFD166] border border-[#073B4C] flex items-center justify-center text-[#073B4C] flex-shrink-0">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-black text-[#073B4C] block">
                    {t.dotsGridCustomizerTitle}
                  </span>
                  <span className="text-xs font-bold text-[#4A4E69]">
                    {t.dotsGridCustomizerDesc}
                  </span>
                </div>
              </div>

              {/* Reset to default color button */}
              {(settings.dotsGridLineColor !== '#073B4C' || settings.dotsPegColor !== '#073B4C') && (
                <button
                  onClick={() => {
                    soundEngine.playTap();
                    onUpdateSettings({
                      ...settings,
                      dotsGridLineColor: '#073B4C',
                      dotsPegColor: '#073B4C'
                    });
                  }}
                  title={t.resetDefaultColor}
                  className="p-1.5 rounded-lg bg-slate-100 border border-[#073B4C]/40 text-[#073B4C] hover:bg-slate-200 text-xs font-black flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">{t.resetDefaultColor}</span>
                </button>
              )}
            </div>

            {/* Live Board Preview & Interactive Pickers */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FFF9F0] border border-[#073B4C]/20">
              {/* Mini Interactive SVG preview */}
              <svg viewBox="0 0 76 76" className="w-14 h-14 bg-white rounded-xl border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] flex-shrink-0">
                {/* Guide lines */}
                <line x1="16" y1="16" x2="60" y2="16" stroke={settings.dotsGridLineColor || '#073B4C'} strokeWidth="4" strokeLinecap="round" strokeOpacity="0.4" strokeDasharray="3 2" />
                <line x1="16" y1="60" x2="60" y2="60" stroke={settings.dotsGridLineColor || '#073B4C'} strokeWidth="4" strokeLinecap="round" strokeOpacity="0.4" strokeDasharray="3 2" />
                <line x1="16" y1="16" x2="16" y2="60" stroke={settings.dotsGridLineColor || '#073B4C'} strokeWidth="4" strokeLinecap="round" strokeOpacity="0.4" strokeDasharray="3 2" />
                <line x1="60" y1="16" x2="60" y2="60" stroke={settings.dotsGridLineColor || '#073B4C'} strokeWidth="4" strokeLinecap="round" strokeOpacity="0.4" strokeDasharray="3 2" />
                {/* Captured sample box in bottom-left/top-left */}
                <rect x="22" y="22" width="32" height="32" rx="4" fill="#FFD166" fillOpacity="0.35" />
                {/* 4 dots */}
                <circle cx="16" cy="16" r="5" fill={settings.dotsPegColor || settings.dotsGridLineColor || '#073B4C'} stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="60" cy="16" r="5" fill={settings.dotsPegColor || settings.dotsGridLineColor || '#073B4C'} stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="16" cy="60" r="5" fill={settings.dotsPegColor || settings.dotsGridLineColor || '#073B4C'} stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="60" cy="60" r="5" fill={settings.dotsPegColor || settings.dotsGridLineColor || '#073B4C'} stroke="#FFFFFF" strokeWidth="1.5" />
              </svg>

              {/* Custom Color Input Pickers */}
              <div className="flex-1 flex flex-col sm:flex-row gap-2">
                {/* Line Color Picker */}
                <div className="flex-1 flex items-center justify-between gap-1.5 p-1.5 rounded-lg bg-white border border-[#073B4C]/30">
                  <span className="text-[11px] font-bold text-[#073B4C] truncate">
                    {t.dotsLineColor}:
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={settings.dotsGridLineColor || '#073B4C'}
                      onChange={(e) => {
                        onUpdateSettings({ ...settings, dotsGridLineColor: e.target.value });
                      }}
                      className="w-6 h-6 rounded-md cursor-pointer border border-[#073B4C] p-0 bg-transparent"
                    />
                    <span className="text-[10px] font-mono text-[#4A4E69] uppercase font-bold">
                      {settings.dotsGridLineColor || '#073B4C'}
                    </span>
                  </div>
                </div>

                {/* Dot/Peg Color Picker */}
                <div className="flex-1 flex items-center justify-between gap-1.5 p-1.5 rounded-lg bg-white border border-[#073B4C]/30">
                  <span className="text-[11px] font-bold text-[#073B4C] truncate">
                    {t.dotsDotColor}:
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={settings.dotsPegColor || '#073B4C'}
                      onChange={(e) => {
                        onUpdateSettings({ ...settings, dotsPegColor: e.target.value });
                      }}
                      className="w-6 h-6 rounded-md cursor-pointer border border-[#073B4C] p-0 bg-transparent"
                    />
                    <span className="text-[10px] font-mono text-[#4A4E69] uppercase font-bold">
                      {settings.dotsPegColor || '#073B4C'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Color Theme Presets */}
            <div>
              <span className="text-[11px] font-bold text-[#4A4E69] mb-1.5 block">
                {t.presetPalette}:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {GRID_COLOR_PRESETS.map((preset) => {
                  const isSelected =
                    (settings.dotsGridLineColor || '#073B4C').toLowerCase() === preset.lineColor.toLowerCase() &&
                    (settings.dotsPegColor || '#073B4C').toLowerCase() === preset.dotColor.toLowerCase();

                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        soundEngine.playTap();
                        if (settings.hapticsEnabled) hapticsEngine.trigger('tap');
                        onUpdateSettings({
                          ...settings,
                          dotsGridLineColor: preset.lineColor,
                          dotsPegColor: preset.dotColor
                        });
                      }}
                      className={`p-1.5 rounded-xl border-2 flex items-center gap-1.5 transition-all text-left ${
                        isSelected
                          ? 'border-[#073B4C] bg-white shadow-[2px_2px_0px_0px_#073B4C]'
                          : 'border-transparent bg-white/70 hover:bg-white hover:border-[#073B4C]/30'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full border border-[#073B4C] flex-shrink-0 flex items-center justify-center text-white"
                        style={{ backgroundColor: preset.lineColor }}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                      </div>
                      <span className="text-[10px] font-bold text-[#073B4C] truncate leading-tight">
                        {language === 'bn' ? preset.nameBn : preset.nameEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Reset Local Data with Dialog */}
          <div className="p-4 rounded-2xl bg-rose-50 border-2 border-[#EF476F] shadow-[3px_3px_0px_0px_#EF476F] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-black text-[#073B4C] block">
                  {t.resetData}
                </span>
                <span className="text-xs font-bold text-[#4A4E69]">
                  Clear preferences & storage
                </span>
              </div>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-3 py-1.5 rounded-xl bg-[#EF476F] text-white text-xs font-black border border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.resetBtn}</span>
              </button>
            </div>

            {showResetConfirm && (
              <div className="p-3 bg-white rounded-xl border border-[#EF476F] flex flex-col gap-2 mt-2">
                <span className="text-xs font-black text-[#073B4C]">
                  {t.resetConfirmDesc}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleResetData}
                    className="flex-1 py-1.5 bg-[#EF476F] text-white rounded-lg text-xs font-black border border-[#073B4C]"
                  >
                    {t.confirm}
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-black border border-slate-300"
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
