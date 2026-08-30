/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DotsBoardConfig, Language } from '../types';
import { DOTS_PRESETS } from '../engine/dotsEngine';
import { TRANSLATIONS } from '../i18n/translations';
import { soundEngine } from '../engine/soundEngine';
import { hapticsEngine } from '../engine/hapticsEngine';
import { X, Check, Grid, Sliders } from 'lucide-react';

interface DotsBoardSelectionProps {
  currentConfig: DotsBoardConfig;
  onSelectConfig: (config: DotsBoardConfig) => void;
  onClose: () => void;
  language: Language;
}

export const DotsBoardSelection: React.FC<DotsBoardSelectionProps> = ({
  currentConfig,
  onSelectConfig,
  onClose,
  language
}) => {
  const t = TRANSLATIONS[language];
  const [tab, setTab] = useState<'presets' | 'custom'>(
    currentConfig.presetKey ? 'presets' : 'custom'
  );

  const [customDotRows, setCustomDotRows] = useState<number>(currentConfig.dotRows);
  const [customDotCols, setCustomDotCols] = useState<number>(currentConfig.dotCols);

  const handleApplyCustom = () => {
    soundEngine.playTap();
    hapticsEngine.trigger('tap');
    const validRows = Math.max(3, Math.min(7, Math.floor(customDotRows) || 4));
    const validCols = Math.max(3, Math.min(7, Math.floor(customDotCols) || 4));
    onSelectConfig({
      dotRows: validRows,
      dotCols: validCols
    });
    onClose();
  };

  const handleSelectPreset = (key: string, preset: typeof DOTS_PRESETS[string]) => {
    soundEngine.playTap();
    hapticsEngine.trigger('tap');
    onSelectConfig({
      dotRows: preset.dotRows,
      dotCols: preset.dotCols,
      presetKey: key
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#073B4C]/60 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-[32px] border-3 sm:border-4 border-[#073B4C] shadow-[8px_8px_0px_0px_#073B4C] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b-2 sm:border-b-3 border-[#073B4C] bg-[#FFF9F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#FFD166] border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] flex items-center justify-center text-[#073B4C]">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#073B4C] leading-none">
                {language === 'bn' ? 'বক্সের গ্রিড সাইজ' : 'Dots Grid Size'}
              </h2>
              <span className="text-[11px] sm:text-xs font-bold text-[#4A4E69]">
                {language === 'bn' ? '২×২ থেকে ৫×৫ বক্স' : '2×2 to 5×5 Box Grids'}
              </span>
            </div>
          </div>
          <button
            id="btn-close-dots-board-picker"
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

        {/* Tab Toggle */}
        <div className="flex p-2.5 bg-amber-50/60 border-b-2 border-[#073B4C]/10 gap-2">
          <button
            onClick={() => {
              soundEngine.playTap();
              setTab('presets');
            }}
            className={`flex-1 py-2 rounded-xl sm:rounded-2xl font-black text-xs border-2 border-[#073B4C] flex items-center justify-center gap-1.5 transition-all ${
              tab === 'presets'
                ? 'bg-[#118AB2] text-white shadow-[2px_2px_0px_0px_#073B4C]'
                : 'bg-white text-[#073B4C] hover:bg-amber-100'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'প্রিসেট গ্রিড' : 'Preset Grids'}</span>
          </button>
          <button
            onClick={() => {
              soundEngine.playTap();
              setTab('custom');
            }}
            className={`flex-1 py-2 rounded-xl sm:rounded-2xl font-black text-xs border-2 border-[#073B4C] flex items-center justify-center gap-1.5 transition-all ${
              tab === 'custom'
                ? 'bg-[#118AB2] text-white shadow-[2px_2px_0px_0px_#073B4C]'
                : 'bg-white text-[#073B4C] hover:bg-amber-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'কাস্টম সাইজ' : 'Custom Size'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-3">
          {tab === 'presets' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(DOTS_PRESETS).map(([key, preset]) => {
                const isSelected = currentConfig.dotRows === preset.dotRows && currentConfig.dotCols === preset.dotCols;
                const totalBoxes = (preset.dotRows - 1) * (preset.dotCols - 1);

                return (
                  <button
                    key={key}
                    onClick={() => handleSelectPreset(key, preset)}
                    className={`group relative p-3.5 rounded-2xl border-2 sm:border-3 border-[#073B4C] text-left transition-all flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-[#06D6A0] text-[#073B4C] shadow-[4px_4px_0px_0px_#073B4C] scale-[1.02]'
                        : 'bg-[#FFF9F0] text-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] hover:bg-amber-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm sm:text-base">
                        {language === 'bn' ? preset.labelBn : preset.labelEn}
                      </span>
                      {isSelected ? (
                        <span className="w-5 h-5 rounded-full bg-white border border-[#073B4C] flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-[#06D6A0] stroke-[3]" />
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white border border-[#073B4C]">
                          {totalBoxes} {language === 'bn' ? 'বক্স' : 'Boxes'}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold opacity-85">
                      {language === 'bn' ? preset.descBn : preset.descEn}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-4 bg-[#FFF9F0] p-4 rounded-2xl border-2 border-[#073B4C]">
              {/* Dot Rows Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs sm:text-sm font-black text-[#073B4C]">
                  <span>{language === 'bn' ? 'সারি ডট সংখ্যা (Dot Rows):' : 'Dot Rows:'}</span>
                  <span className="bg-[#118AB2] text-white px-2 py-0.5 rounded-md font-mono">
                    {customDotRows} ({customDotRows - 1} {language === 'bn' ? 'বক্স' : 'boxes'})
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="7"
                  value={customDotRows}
                  onChange={(e) => setCustomDotRows(parseInt(e.target.value, 10))}
                  className="accent-[#118AB2] cursor-pointer"
                />
              </div>

              {/* Dot Cols Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs sm:text-sm font-black text-[#073B4C]">
                  <span>{language === 'bn' ? 'কলাম ডট সংখ্যা (Dot Cols):' : 'Dot Columns:'}</span>
                  <span className="bg-[#118AB2] text-white px-2 py-0.5 rounded-md font-mono">
                    {customDotCols} ({customDotCols - 1} {language === 'bn' ? 'বক্স' : 'boxes'})
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="7"
                  value={customDotCols}
                  onChange={(e) => setCustomDotCols(parseInt(e.target.value, 10))}
                  className="accent-[#118AB2] cursor-pointer"
                />
              </div>

              <div className="text-center text-xs font-bold text-[#4A4E69] pt-1">
                {language === 'bn'
                  ? `মোট বক্স হবে: ${(customDotRows - 1) * (customDotCols - 1)} টি`
                  : `Total Boxes: ${(customDotRows - 1) * (customDotCols - 1)}`}
              </div>

              <button
                id="btn-apply-custom-dots-board"
                onClick={handleApplyCustom}
                className="w-full py-2.5 rounded-xl bg-[#06D6A0] border-2 border-[#073B4C] text-[#073B4C] font-black text-sm shadow-[3px_3px_0px_0px_#073B4C] hover:bg-[#05c493] active:translate-y-0.5 transition-all"
              >
                {t.confirm || 'Apply'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
