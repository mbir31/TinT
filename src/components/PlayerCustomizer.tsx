/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Player, Language } from '../types';
import { PLAYER_THEMES, AVATAR_OPTIONS } from '../constants/themes';
import { TRANSLATIONS } from '../i18n/translations';
import { AvatarIcon } from './AvatarIcon';
import { ImageCropperModal } from './ImageCropperModal';
import { soundEngine } from '../engine/soundEngine';
import { hapticsEngine } from '../engine/hapticsEngine';
import { X, Check, User, Sparkles, Camera, Trash2, Crop, Upload } from 'lucide-react';

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

  // Photo cropper modal state
  const [croppingImageSrc, setCroppingImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const cleanP1: Player = {
      ...p1State,
      name: p1State.name.trim().slice(0, 15) || (language === 'bn' ? 'খেলোয়াড় ১' : 'Player 1')
    };

    const cleanP2: Player = {
      ...p2State,
      name: p2State.name.trim().slice(0, 15) || (language === 'bn' ? 'খেলোয়াড় ২' : 'Player 2')
    };

    const cleanAi: Player = {
      ...aiState,
      name: aiState.name.trim().slice(0, 15) || (language === 'bn' ? 'রোবো' : 'AI Bot')
    };

    onSave(cleanP1, cleanP2, cleanAi);
    onClose();
  };

  // Image Selection Handlers with safe MIME & file size validation
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME type against safe raster image formats (reject SVG, HTML, scripts)
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validMimeTypes.includes(file.type)) {
      e.target.value = '';
      return;
    }

    // Limit maximum raw file size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        soundEngine.playTap();
        setCroppingImageSrc(result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (file && validMimeTypes.includes(file.type) && file.size <= 5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          soundEngine.playTap();
          setCroppingImageSrc(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    setCurrentEdited((prev) => ({
      ...prev,
      photoUrl: croppedDataUrl
    }));
    setCroppingImageSrc(null);
  };

  const handleRemovePhoto = () => {
    soundEngine.playTap();
    hapticsEngine.trigger('tap');
    setCurrentEdited((prev) => {
      const next = { ...prev };
      delete next.photoUrl;
      return next;
    });
  };

  const activeTheme = PLAYER_THEMES[currentEdited.colorKey] || PLAYER_THEMES.blue;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-[#073B4C]/60 backdrop-blur-sm select-none">
        <div className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-[32px] border-3 sm:border-4 border-[#073B4C] shadow-[6px_6px_0px_0px_#073B4C] sm:shadow-[10px_10px_0px_0px_#073B4C] flex flex-col max-h-[92vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 sm:p-5 border-b-2 sm:border-b-3 border-[#073B4C] bg-[#FFF9F0] flex-shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#EF476F] border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] flex items-center justify-center text-white flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-black text-[#073B4C] leading-none">
                  {t.customizerTitle}
                </h2>
                <span className="text-[11px] sm:text-xs font-bold text-[#4A4E69]">
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
              className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-white border-2 border-[#073B4C] text-[#073B4C] shadow-[2px_2px_0px_0px_#EF476F] active:translate-x-0.5 active:translate-y-0.5 transition-all"
              aria-label="Close"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Player Selector Tabs */}
          <div className="flex p-2 sm:p-3 bg-amber-50/70 border-b-2 border-[#073B4C]/10 gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              id="tab-edit-p1"
              onClick={() => {
                soundEngine.playTap();
                setActiveTab('p1');
              }}
              className={`flex-1 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl font-black text-xs border-2 border-[#073B4C] transition-all flex items-center justify-center gap-1 ${
                activeTab === 'p1'
                  ? 'bg-[#118AB2] text-white shadow-[2px_2px_0px_0px_#073B4C] sm:shadow-[3px_3px_0px_0px_#073B4C]'
                  : 'bg-white text-[#073B4C]'
              }`}
            >
              {p1State.photoUrl && <span className="w-2 h-2 rounded-full bg-[#06D6A0] inline-block" />}
              {t.player1}
            </button>

            <button
              id="tab-edit-p2"
              onClick={() => {
                soundEngine.playTap();
                setActiveTab('p2');
              }}
              className={`flex-1 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl font-black text-xs border-2 border-[#073B4C] transition-all flex items-center justify-center gap-1 ${
                activeTab === 'p2'
                  ? 'bg-[#EF476F] text-white shadow-[2px_2px_0px_0px_#073B4C] sm:shadow-[3px_3px_0px_0px_#073B4C]'
                  : 'bg-white text-[#073B4C]'
              }`}
            >
              {p2State.photoUrl && <span className="w-2 h-2 rounded-full bg-[#06D6A0] inline-block" />}
              {t.player2}
            </button>

            <button
              id="tab-edit-ai"
              onClick={() => {
                soundEngine.playTap();
                setActiveTab('ai');
              }}
              className={`flex-1 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl font-black text-xs border-2 border-[#073B4C] transition-all flex items-center justify-center gap-1 ${
                activeTab === 'ai'
                  ? 'bg-[#7209B7] text-white shadow-[2px_2px_0px_0px_#073B4C] sm:shadow-[3px_3px_0px_0px_#073B4C]'
                  : 'bg-white text-[#073B4C]'
              }`}
            >
              {aiState.photoUrl && <span className="w-2 h-2 rounded-full bg-[#06D6A0] inline-block" />}
              {t.aiPlayer}
            </button>
          </div>

          {/* Form Body */}
          <div className="p-3.5 sm:p-5 overflow-y-auto max-h-[60vh] flex flex-col gap-4 bg-[#FFFDF9] flex-1">
            {/* Live Preview Card */}
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border-2 sm:border-3 border-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C] flex items-center gap-3">
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${activeTheme.gradient} border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] flex items-center justify-center text-white flex-shrink-0 overflow-hidden`}
              >
                {currentEdited.photoUrl ? (
                  <img
                    src={currentEdited.photoUrl}
                    alt={currentEdited.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <AvatarIcon name={currentEdited.avatar} className="w-6 h-6 sm:w-8 sm:h-8 drop-shadow-md" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black text-[#4A4E69] uppercase flex items-center gap-1">
                  {language === 'bn' ? 'টোকেন প্রিভিউ' : 'Live Token Preview'}
                  {currentEdited.photoUrl && (
                    <span className="px-1.5 py-0.2 rounded bg-[#06D6A0] text-[#073B4C] text-[9px] font-black uppercase">
                      Photo Piece
                    </span>
                  )}
                </span>
                <span className="text-base sm:text-lg font-black text-[#073B4C] truncate">
                  {currentEdited.name || 'Player'}
                </span>
                <span className="text-[11px] font-bold text-[#118AB2]">
                  {activeTheme.name} Theme
                </span>
              </div>
            </div>

            {/* Custom Photo Upload & Cropping Section */}
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FFF9F0] border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] sm:text-xs font-black text-[#073B4C] uppercase tracking-wide flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#EF476F]" />
                  <span>{t.customPhoto}</span>
                </label>
                {currentEdited.photoUrl && (
                  <span className="text-[10px] sm:text-[11px] font-black text-[#06D6A0]">
                    ✓ {language === 'bn' ? 'ছবি সক্রিয়' : 'Photo Active'}
                  </span>
                )}
              </div>

              {currentEdited.photoUrl ? (
                /* When photo is active: show thumbnail + crop / change / remove buttons */
                <div className="flex items-center justify-between gap-3 p-2.5 bg-white rounded-xl border-2 border-[#073B4C]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={currentEdited.photoUrl}
                      alt="Player avatar"
                      className="w-11 h-11 rounded-lg border-2 border-[#073B4C] object-cover shadow-[1px_1px_0px_0px_#073B4C] flex-shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-black text-[#073B4C] truncate">
                        {t.photoActive}
                      </span>
                      <span className="text-[10px] font-bold text-[#4A4E69]">
                        {language === 'bn' ? 'বোর্ডের ঘুঁটিতে ছবিটি দেখাবে' : 'Displayed on 3D board pieces'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      id="btn-recrop-photo"
                      onClick={() => {
                        soundEngine.playTap();
                        setCroppingImageSrc(currentEdited.photoUrl || null);
                      }}
                      className="p-2 rounded-lg bg-amber-100 border border-[#073B4C] text-[#073B4C] hover:bg-amber-200 active:translate-x-0.5 active:translate-y-0.5 transition-all"
                      title={t.cropPhotoTitle}
                    >
                      <Crop className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      id="btn-change-photo"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 rounded-lg bg-sky-100 border border-[#073B4C] text-[#073B4C] hover:bg-sky-200 active:translate-x-0.5 active:translate-y-0.5 transition-all"
                      title={t.changePhoto}
                    >
                      <Upload className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      id="btn-delete-photo"
                      onClick={handleRemovePhoto}
                      className="p-2 rounded-lg bg-rose-100 border border-[#073B4C] text-[#EF476F] hover:bg-rose-200 active:translate-x-0.5 active:translate-y-0.5 transition-all"
                      title={t.removePhoto}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                /* When no photo: show clean dropzone button */
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 sm:p-4 rounded-xl bg-white border-2 border-dashed border-[#073B4C]/60 hover:border-[#073B4C] hover:bg-amber-50/50 cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 transition-all group"
                >
                  <div className="w-9 h-9 rounded-full bg-amber-100 border border-[#073B4C] flex items-center justify-center text-[#073B4C] group-hover:scale-110 transition-transform">
                    <Camera className="w-4 h-4 text-[#118AB2]" />
                  </div>
                  <span className="text-xs font-black text-[#073B4C]">
                    {t.uploadPhoto}
                  </span>
                  <span className="text-[10px] font-bold text-[#4A4E69]">
                    {t.dropPhotoHere}
                  </span>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelected}
                className="hidden"
              />
            </div>

            {/* Name Input */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] sm:text-xs font-black text-[#073B4C] uppercase tracking-wide flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> {t.playerNamePlaceholder}
              </label>
              <input
                id="input-customize-name"
                type="text"
                maxLength={15}
                value={currentEdited.name}
                onChange={(e) =>
                  setCurrentEdited((prev) => ({ ...prev, name: e.target.value }))
                }
                className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-white border-2 border-[#073B4C] text-[#073B4C] font-bold text-xs sm:text-sm shadow-[2px_2px_0px_0px_#073B4C] focus:outline-none focus:ring-2 focus:ring-[#118AB2]"
                placeholder={t.playerNamePlaceholder}
              />
            </div>

            {/* Color Theme Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] sm:text-xs font-black text-[#073B4C] uppercase tracking-wide">
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
                    className={`h-9 sm:h-11 rounded-xl sm:rounded-2xl border-2 border-[#073B4C] flex items-center justify-center transition-all ${
                      currentEdited.colorKey === thm.id
                        ? 'scale-110 ring-2 ring-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C]'
                        : 'hover:opacity-90 shadow-[1px_1px_0px_0px_#073B4C]'
                    }`}
                    style={{ backgroundColor: thm.primary }}
                    title={thm.name}
                  >
                    {currentEdited.colorKey === thm.id && (
                      <Check className="w-4 h-4 text-white drop-shadow-sm stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Avatar Icon Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] sm:text-xs font-black text-[#073B4C] uppercase tracking-wide">
                {t.avatarSymbol}
              </label>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {AVATAR_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      soundEngine.playTap();
                      setCurrentEdited((prev) => ({ ...prev, avatar: opt.id }));
                    }}
                    className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border-2 border-[#073B4C] flex flex-col items-center justify-center transition-all ${
                      currentEdited.avatar === opt.id
                        ? 'bg-[#FFD166] shadow-[2px_2px_0px_0px_#073B4C] sm:shadow-[3px_3px_0px_0px_#073B4C] scale-105'
                        : 'bg-white hover:bg-amber-50 shadow-[1px_1px_0px_0px_#073B4C]'
                    }`}
                  >
                    <AvatarIcon name={opt.id} className="w-5 h-5 sm:w-6 sm:h-6 text-[#073B4C]" />
                    <span className="text-[9px] sm:text-[10px] font-bold text-[#073B4C] mt-0.5 sm:mt-1 truncate max-w-full">
                      {language === 'bn' ? opt.nameBn : opt.nameEn}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Save Action */}
          <div className="p-3 sm:p-4 border-t-2 sm:border-t-3 border-[#073B4C] bg-[#FFF9F0] flex-shrink-0">
            <button
              id="btn-save-customizer"
              onClick={handleSaveAll}
              className="w-full py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-[#06D6A0] border-2 sm:border-3 border-[#073B4C] text-[#073B4C] font-black text-xs sm:text-sm shadow-[3px_3px_0px_0px_#073B4C] sm:shadow-[4px_4px_0px_0px_#073B4C] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
              <span>{t.saveAndPlay}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Image Cropper Modal */}
      {croppingImageSrc && (
        <ImageCropperModal
          imageSrc={croppingImageSrc}
          onCropComplete={handleCropComplete}
          onClose={() => setCroppingImageSrc(null)}
          language={language}
          onNewImageSelected={(newSrc) => setCroppingImageSrc(newSrc)}
        />
      )}
    </>
  );
};
