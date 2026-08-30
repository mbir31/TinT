/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ConnectFourConfig, Language } from '../types';
import { CONNECT_FOUR_PRESETS } from '../engine/connectFourEngine';
import { TRANSLATIONS, formatNumberByLang } from '../i18n/translations';
import { soundEngine } from '../engine/soundEngine';
import { hapticsEngine } from '../engine/hapticsEngine';
import { X, Check, LayoutGrid, Sliders, ArrowDown } from 'lucide-react';

interface ConnectFourBoardSelectionProps {
  currentConfig: ConnectFourConfig;
  onSelectConfig: (config: ConnectFourConfig) => void;
  onClose: () => void;
  language: Language;
}

export const ConnectFourBoardSelection: React.FC<ConnectFourBoardSelectionProps> = ({
  currentConfig,
  onSelectConfig,
  onClose,
  language
}) => {
  const t = TRANSLATIONS[language];
  const [tab, setTab] = useState<'presets' | 'custom'>(
    currentConfig.presetKey ? 'presets' : 'custom'
  );

  const [customRows, setCustomRows] = useState<number>(currentConfig.rows);
  const [customCols, setCustomCols] = useState<number>(currentConfig.cols);

  const handleApplyCustom = () => {
    soundEngine.playTap();
    hapticsEngine.trigger('tap');
    const validRows = Math.max(4, Math.min(8, Math.floor(customRows) || 6));
    const validCols = Math.max(5, Math.min(9, Math.floor(customCols) || 7));
    onSelectConfig({
      rows: validRows,
      cols: validCols,
      winLength: 4
    });
    onClose();
  };

  const handleSelectPreset = (preset: typeof CONNECT_FOUR_PRESETS[0]) => {
    soundEngine.playTap();
    hapticsEngine.trigger('tap');
    onSelectConfig({
      rows: preset.rows,
      cols: preset.cols,
      winLength: preset.winLength,
      presetKey: preset.key
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#073B4C]/60 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-[32px] border-3 sm:border-4 border-[#073B4C] shadow-[8px_8px_0px_0px_#073B4C] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b-2 sm:border-b-3 border-[#073B4C] bg-[#FFF9F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#06D6A0] border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] flex items-center justify-center text-[#073B4C]">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#073B4C] leading-none">
                {language === 'bn' ? 'চার মিলান গ্রিড সাইজ' : 'Connect Four Rack Size'}
              </h2>
              <span className="text-[11px] sm:text-xs font-bold text-[#4A4E69]">
                {language === 'bn' ? '৪টি ঘুঁটি মেলালে জয়' : 'Align 4 tokens in a row to win'}
              </span>
            </div>
          </div>
          <button
            id="btn-close-c4-board-picker"
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
                ? 'bg-[#06D6A0] text-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C]'
                : 'bg-white text-[#073B4C] hover:bg-amber-100'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'জনপ্রিয় গ্রিড' : 'Preset Racks'}</span>
          </button>
          <button
            onClick={() => {
              soundEngine.playTap();
              setTab('custom');
            }}
            className={`flex-1 py-2 rounded-xl sm:rounded-2xl font-black text-xs border-2 border-[#073B4C] flex items-center justify-center gap-1.5 transition-all ${
              tab === 'custom'
                ? 'bg-[#06D6A0] text-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C]'
                : 'bg-white text-[#073B4C] hover:bg-amber-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{t.customBoard}</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-3.5">
          {tab === 'presets' ? (
            <div className="grid grid-cols-1 gap-2.5">
              {CONNECT_FOUR_PRESETS.map((preset) => {
                const isSelected =
                  currentConfig.presetKey === preset.key ||
                  (currentConfig.rows === preset.rows && currentConfig.cols === preset.cols);

                return (
                  <button
                    key={preset.key}
                    id={`btn-c4-preset-${preset.key}`}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3.5 rounded-2xl border-2 sm:border-3 border-[#073B4C] flex items-center justify-between text-left transition-all ${
                      isSelected
                        ? 'bg-[#06D6A0]/20 border-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C]'
                        : 'bg-white hover:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(7,59,76,0.1)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] flex items-center justify-center text-lg">
                        {preset.iconTag}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-sm sm:text-base text-[#073B4C]">
                            {language === 'bn' ? preset.nameBn : preset.nameEn}
                          </h4>
                          {isSelected && (
                            <span className="text-[10px] bg-[#06D6A0] text-[#073B4C] font-black px-2 py-0.5 rounded-full border border-[#073B4C]">
                              {language === 'bn' ? 'সক্রিয়' : 'Active'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-[#4A4E69] mt-0.5">
                          {language === 'bn' ? preset.descBn : preset.descEn}
                        </p>
                      </div>
                    </div>

                    <div className="w-6 h-6 rounded-full border-2 border-[#073B4C] flex items-center justify-center bg-white">
                      {isSelected && <Check className="w-4 h-4 text-[#073B4C] stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Custom Sliders */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border-2 border-[#073B4C]/20 flex flex-col gap-4">
                {/* Columns */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-black text-[#073B4C]">
                      {language === 'bn' ? 'কলাম সংখ্যা (Columns / প্রস্থ)' : 'Columns (Width)'}
                    </label>
                    <span className="font-black text-sm text-[#06D6A0] bg-[#073B4C] px-2.5 py-0.5 rounded-lg">
                      {formatNumberByLang(customCols, language)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="9"
                    value={customCols}
                    onChange={(e) => setCustomCols(parseInt(e.target.value, 10))}
                    className="w-full accent-[#06D6A0] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-[#4A4E69] mt-1">
                    <span>৫ কলাম</span>
                    <span>৯ কলাম</span>
                  </div>
                </div>

                {/* Rows */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-black text-[#073B4C]">
                      {language === 'bn' ? 'সারি সংখ্যা (Rows / উচ্চতা)' : 'Rows (Height)'}
                    </label>
                    <span className="font-black text-sm text-[#06D6A0] bg-[#073B4C] px-2.5 py-0.5 rounded-lg">
                      {formatNumberByLang(customRows, language)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="8"
                    value={customRows}
                    onChange={(e) => setCustomRows(parseInt(e.target.value, 10))}
                    className="w-full accent-[#06D6A0] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-[#4A4E69] mt-1">
                    <span>৪ সারি</span>
                    <span>৮ সারি</span>
                  </div>
                </div>
              </div>

              {/* Apply Button */}
              <button
                id="btn-apply-c4-custom-board"
                onClick={handleApplyCustom}
                className="w-full py-3 rounded-2xl bg-[#06D6A0] hover:bg-emerald-400 border-3 border-[#073B4C] text-[#073B4C] font-black text-sm shadow-[4px_4px_0px_0px_#073B4C] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>
                  {language === 'bn'
                    ? `কাস্টম ${formatNumberByLang(customCols, language)}×${formatNumberByLang(customRows, language)} গ্রিড চালু করুন`
                    : `Apply ${customCols}×${customRows} Rack`}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
