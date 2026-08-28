/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserSettings, Language } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { soundEngine } from '../engine/soundEngine';
import { hapticsEngine } from '../engine/hapticsEngine';
import { clearAllLocalData } from '../engine/storage';
import { X, Volume2, VolumeX, Smartphone, Eye, Sparkles, Trash2, Globe, Compass } from 'lucide-react';

interface SettingsModalProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onClose: () => void;
  language: Language;
}

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
                {t.settingsTitle}
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
                  {t.vibration}
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

          {/* Reset Local Data with Dialog */}
          <div className="p-4 rounded-2xl bg-rose-50 border-2 border-[#EF476F] shadow-[3px_3px_0px_0px_#EF476F] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-black text-[#073B4C] block">
                  {t.resetAllData}
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
                  {t.resetConfirmText}
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
