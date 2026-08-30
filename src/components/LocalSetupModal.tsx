/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Player, Language } from '../types';
import { PLAYER_THEMES } from '../constants/themes';
import { TRANSLATIONS } from '../i18n/translations';
import { ImageCropperModal } from './ImageCropperModal';
import { soundEngine } from '../engine/soundEngine';
import { hapticsEngine } from '../engine/hapticsEngine';
import { Users, Play, X, User, Camera, Trash2, Crop } from 'lucide-react';

interface LocalSetupModalProps {
  player1: Player;
  player2: Player;
  onStartGame: (
    name1: string,
    color1: string,
    name2: string,
    color2: string,
    photo1?: string,
    photo2?: string
  ) => void;
  onClose: () => void;
  language: Language;
}

export const LocalSetupModal: React.FC<LocalSetupModalProps> = ({
  player1,
  player2,
  onStartGame,
  onClose,
  language
}) => {
  const [name1, setName1] = useState(player1.name || 'Player 1');
  const [color1, setColor1] = useState(player1.colorKey || 'blue');
  const [photo1, setPhoto1] = useState<string | undefined>(player1.photoUrl);

  const [name2, setName2] = useState(player2.name || 'Player 2');
  const [color2, setColor2] = useState(player2.colorKey || 'coral');
  const [photo2, setPhoto2] = useState<string | undefined>(player2.photoUrl);

  // Cropper state
  const [croppingTarget, setCroppingTarget] = useState<'p1' | 'p2' | null>(null);
  const [croppingSrc, setCroppingSrc] = useState<string | null>(null);

  const fileInputP1Ref = useRef<HTMLInputElement>(null);
  const fileInputP2Ref = useRef<HTMLInputElement>(null);

  const t = TRANSLATIONS[language];

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playTap();
    hapticsEngine.trigger('tap');

    const cleanName1 = name1.trim().slice(0, 15) || (language === 'bn' ? 'খেলোয়াড় ১' : 'Player 1');
    const cleanName2 = name2.trim().slice(0, 15) || (language === 'bn' ? 'খেলোয়াড় ২' : 'Player 2');

    onStartGame(cleanName1, color1, cleanName2, color2, photo1, photo2);
  };

  const handleFileChange = (target: 'p1' | 'p2', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME type against safe raster formats and limit file size to 5MB
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validMimeTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        soundEngine.playTap();
        setCroppingTarget(target);
        setCroppingSrc(result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    if (croppingTarget === 'p1') {
      setPhoto1(croppedDataUrl);
    } else if (croppingTarget === 'p2') {
      setPhoto2(croppedDataUrl);
    }
    setCroppingTarget(null);
    setCroppingSrc(null);
  };

  const theme1 = PLAYER_THEMES[color1] || PLAYER_THEMES.blue;
  const theme2 = PLAYER_THEMES[color2] || PLAYER_THEMES.coral;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-[#073B4C]/60 backdrop-blur-sm select-none animate-in fade-in duration-200">
        <div className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-[32px] border-3 sm:border-4 border-[#073B4C] shadow-[6px_6px_0px_0px_#073B4C] sm:shadow-[10px_10px_0px_0px_#073B4C] flex flex-col max-h-[92vh] overflow-hidden">
          {/* Modal Top Header */}
          <div className="flex items-center justify-between p-3.5 sm:p-5 border-b-2 sm:border-b-3 border-[#073B4C] bg-[#FFF9F0] flex-shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#EF476F] border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] flex items-center justify-center text-white flex-shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-black text-[#073B4C] leading-none">
                  {language === 'bn' ? '২ জন খেলোয়াড়ের রূপ ও নাম' : '2-Player Setup'}
                </h2>
                <span className="text-[11px] sm:text-xs font-bold text-[#4A4E69]">
                  {language === 'bn'
                    ? 'নামের বদলে নিজের ছবি ক্রপ করে ব্যবহার করতে পারেন'
                    : 'Use names or upload & crop custom photos'}
                </span>
              </div>
            </div>
            <button
              id="btn-close-local-setup"
              type="button"
              onClick={() => {
                soundEngine.playTap();
                onClose();
              }}
              className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-white border-2 border-[#073B4C] text-[#073B4C] shadow-[2px_2px_0px_0px_#EF476F] hover:bg-rose-50 active:translate-x-0.5 active:translate-y-0.5 transition-all"
              aria-label="Close"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Setup Form Body */}
          <form onSubmit={handleStart} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-3.5 sm:p-5 overflow-y-auto max-h-[60vh] flex flex-col gap-3.5 sm:gap-4 bg-[#FFFDF9]">
              {/* Player 1 Card */}
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border-2 sm:border-3 border-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C] flex flex-col gap-2.5 sm:gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-[#073B4C] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#118AB2] inline-block" />
                    {t.player1} ({language === 'bn' ? '১ম চাল' : '1st Move'})
                  </span>
                  <div
                    className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg sm:rounded-xl text-xs font-black border border-[#073B4C] sm:border-2 shadow-[1.5px_1.5px_0px_0px_#073B4C]"
                    style={{
                      backgroundColor: theme1.primary,
                      color: theme1.id === 'amber' ? '#073B4C' : '#FFFFFF'
                    }}
                  >
                    {name1.trim() || 'P1'}
                  </div>
                </div>

                {/* Name and Photo Upload Row */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-[10px] sm:text-[11px] font-black text-[#4A4E69] uppercase flex items-center gap-1">
                      <User className="w-3 h-3" /> {t.playerNamePlaceholder}
                    </label>
                    <input
                      id="input-player1-name"
                      type="text"
                      maxLength={15}
                      value={name1}
                      onChange={(e) => setName1(e.target.value)}
                      placeholder={language === 'bn' ? 'খেলোয়াড় ১ এর নাম...' : 'Player 1 Name...'}
                      className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-[#FFF9F0] border-2 border-[#073B4C] text-[#073B4C] font-bold text-xs sm:text-sm shadow-[2px_2px_0px_0px_#073B4C] focus:outline-none focus:ring-2 focus:ring-[#118AB2]"
                      autoFocus
                    />
                  </div>

                  {/* Player 1 Photo Attachment Box */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-3">
                    {photo1 ? (
                      <div className="relative group w-11 h-11 rounded-xl border-2 border-[#073B4C] overflow-hidden shadow-[2px_2px_0px_0px_#073B4C]">
                        <img src={photo1} alt="P1 Photo" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                          <button
                            type="button"
                            onClick={() => {
                              setCroppingTarget('p1');
                              setCroppingSrc(photo1);
                            }}
                            className="p-1 rounded bg-white text-[#073B4C]"
                            title="Crop"
                          >
                            <Crop className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPhoto1(undefined)}
                            className="p-1 rounded bg-rose-500 text-white"
                            title="Remove"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        id="btn-p1-upload-photo"
                        onClick={() => fileInputP1Ref.current?.click()}
                        className="w-11 h-11 rounded-xl bg-[#FFF9F0] border-2 border-dashed border-[#073B4C] hover:bg-amber-100 flex flex-col items-center justify-center text-[#073B4C] transition-all"
                        title={t.uploadPhoto}
                      >
                        <Camera className="w-4 h-4 text-[#118AB2]" />
                        <span className="text-[8px] font-black">{language === 'bn' ? 'ছবি' : 'Photo'}</span>
                      </button>
                    )}
                    <input
                      ref={fileInputP1Ref}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('p1', e)}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Player 1 Color Picker */}
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#4A4E69]">{t.colorTheme}:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {Object.values(PLAYER_THEMES).map((thm) => (
                      <button
                        key={`p1-color-${thm.id}`}
                        type="button"
                        onClick={() => {
                          soundEngine.playTap();
                          setColor1(thm.id);
                        }}
                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg border-2 border-[#073B4C] transition-transform ${
                          color1 === thm.id ? 'scale-125 ring-2 ring-[#073B4C] shadow-[1px_1px_0px_0px_#073B4C]' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: thm.primary }}
                        title={thm.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Player 2 Card */}
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border-2 sm:border-3 border-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C] flex flex-col gap-2.5 sm:gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-[#073B4C] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EF476F] inline-block" />
                    {t.player2} ({language === 'bn' ? '২য় চাল' : '2nd Move'})
                  </span>
                  <div
                    className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg sm:rounded-xl text-xs font-black border border-[#073B4C] sm:border-2 shadow-[1.5px_1.5px_0px_0px_#073B4C]"
                    style={{
                      backgroundColor: theme2.primary,
                      color: theme2.id === 'amber' ? '#073B4C' : '#FFFFFF'
                    }}
                  >
                    {name2.trim() || 'P2'}
                  </div>
                </div>

                {/* Name and Photo Upload Row */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-[10px] sm:text-[11px] font-black text-[#4A4E69] uppercase flex items-center gap-1">
                      <User className="w-3 h-3" /> {t.playerNamePlaceholder}
                    </label>
                    <input
                      id="input-player2-name"
                      type="text"
                      maxLength={15}
                      value={name2}
                      onChange={(e) => setName2(e.target.value)}
                      placeholder={language === 'bn' ? 'খেলোয়াড় ২ এর নাম...' : 'Player 2 Name...'}
                      className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-[#FFF9F0] border-2 border-[#073B4C] text-[#073B4C] font-bold text-xs sm:text-sm shadow-[2px_2px_0px_0px_#073B4C] focus:outline-none focus:ring-2 focus:ring-[#EF476F]"
                    />
                  </div>

                  {/* Player 2 Photo Attachment Box */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-3">
                    {photo2 ? (
                      <div className="relative group w-11 h-11 rounded-xl border-2 border-[#073B4C] overflow-hidden shadow-[2px_2px_0px_0px_#073B4C]">
                        <img src={photo2} alt="P2 Photo" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                          <button
                            type="button"
                            onClick={() => {
                              setCroppingTarget('p2');
                              setCroppingSrc(photo2);
                            }}
                            className="p-1 rounded bg-white text-[#073B4C]"
                            title="Crop"
                          >
                            <Crop className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPhoto2(undefined)}
                            className="p-1 rounded bg-rose-500 text-white"
                            title="Remove"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        id="btn-p2-upload-photo"
                        onClick={() => fileInputP2Ref.current?.click()}
                        className="w-11 h-11 rounded-xl bg-[#FFF9F0] border-2 border-dashed border-[#073B4C] hover:bg-amber-100 flex flex-col items-center justify-center text-[#073B4C] transition-all"
                        title={t.uploadPhoto}
                      >
                        <Camera className="w-4 h-4 text-[#EF476F]" />
                        <span className="text-[8px] font-black">{language === 'bn' ? 'ছবি' : 'Photo'}</span>
                      </button>
                    )}
                    <input
                      ref={fileInputP2Ref}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('p2', e)}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Player 2 Color Picker */}
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#4A4E69]">{t.colorTheme}:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {Object.values(PLAYER_THEMES).map((thm) => (
                      <button
                        key={`p2-color-${thm.id}`}
                        type="button"
                        onClick={() => {
                          soundEngine.playTap();
                          setColor2(thm.id);
                        }}
                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg border-2 border-[#073B4C] transition-transform ${
                          color2 === thm.id ? 'scale-125 ring-2 ring-[#073B4C] shadow-[1px_1px_0px_0px_#073B4C]' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: thm.primary }}
                        title={thm.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Footer Action Button */}
            <div className="p-3 sm:p-4 bg-white border-t-2 border-[#073B4C]/20 flex-shrink-0">
              <button
                id="btn-confirm-start-local"
                type="submit"
                className="w-full py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-[#06D6A0] border-2 sm:border-3 border-[#073B4C] text-[#073B4C] font-black text-sm sm:text-base shadow-[3px_3px_0px_0px_#073B4C] sm:shadow-[5px_5px_0px_0px_#073B4C] hover:bg-[#05c493] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                <span>{t.startGame}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Image Cropper Modal */}
      {croppingSrc && croppingTarget && (
        <ImageCropperModal
          imageSrc={croppingSrc}
          onCropComplete={handleCropComplete}
          onClose={() => {
            setCroppingTarget(null);
            setCroppingSrc(null);
          }}
          language={language}
          onNewImageSelected={(newSrc) => setCroppingSrc(newSrc)}
        />
      )}
    </>
  );
};
