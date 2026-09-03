/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BoardConfig, Language } from '../types';
import { BOARD_PRESETS, BoardPreset } from '../constants/themes';
import { TRANSLATIONS } from '../i18n/translations';
import { soundEngine } from '../engine/soundEngine';
import { hapticsEngine } from '../engine/hapticsEngine';
import { X, Check, Grid, Sliders } from 'lucide-react';

interface BoardSelectionProps {
  currentConfig: BoardConfig;
  onSelectConfig: (config: BoardConfig) => void;
  onClose: () => void;
  language: Language;
}

export const BoardSelection: React.FC<BoardSelectionProps> = ({
  currentConfig,
  onSelectConfig,
  onClose,
  language
}) => {
  const t = TRANSLATIONS[language];
  const [tab, setTab] = useState<'presets' | 'custom'>(
    currentConfig.presetKey ? 'presets' : 'custom'
  );

  // Custom board state
  const [customRows, setCustomRows] = useState<number>(currentConfig.rows);
  const [customCols, setCustomCols] = useState<number>(currentConfig.cols);
  const [customWin, setCustomWin] = useState<number>(currentConfig.winLength);

  const handleRowsChange = (rawRows: number) => {
    const newRows = Math.max(3, Math.min(15, Math.floor(rawRows) || 3));
    setCustomRows(newRows);
    const maxWin = Math.min(newRows, customCols, 5);
    if (customWin > maxWin) {
      setCustomWin(maxWin);
    }
  };

  const handleColsChange = (rawCols: number) => {
    const newCols = Math.max(3, Math.min(15, Math.floor(rawCols) || 3));
    setCustomCols(newCols);
    const maxWin = Math.min(customRows, newCols, 5);
    if (customWin > maxWin) {
      setCustomWin(maxWin);
    }
  };

  const handleApplyCustom = () => {
    soundEngine.playTap();
    hapticsEngine.trigger('tap');
    const validRows = Math.max(3, Math.min(15, customRows));
    const validCols = Math.max(3, Math.min(15, customCols));
    const maxWin = Math.min(validRows, validCols, 5);
    const validWin = Math.max(3, Math.min(maxWin, customWin));

    onSelectConfig({
      rows: validRows,
      cols: validCols,
      winLength: validWin
    });
    onClose();
  };

  const handleSelectPreset = (preset: BoardPreset) => {
    soundEngine.playTap();
    hapticsEngine.trigger('tap');
    onSelectConfig({
      rows: preset.rows,
      cols: preset.cols,
      winLength: preset.winLength,
      presetKey: preset.id
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#073B4C]/60 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-lg bg-white rounded-[32px] border-4 border-[#073B4C] shadow-[10px_10px_0px_0px_#073B4C] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b-3 border-[#073B4C] bg-[#FFF9F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FFD166] border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] flex items-center justify-center text-[#073B4C]">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#073B4C] leading-none">
                {t.selectBoard}
              </h2>
              <span className="text-xs font-bold text-[#4A4E69]">
                {language === 'bn' ? '৩×৩ থেকে ১৫×১৫ গ্রিড' : '3×3 to 15×15 Grids'}
              </span>
            </div>
          </div>
          <button
            id="btn-close-board-picker"
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

        {/* Tab Toggle (Presets vs Custom) */}
        <div className="flex p-3 bg-amber-50/60 border-b-2 border-[#073B4C]/10 gap-2">
          <button
            onClick={() => {
              soundEngine.playTap();
              setTab('presets');
            }}
            className={`flex-1 py-2 rounded-2xl font-black text-xs border-2 border-[#073B4C] flex items-center justify-center gap-1.5 transition-all ${
              tab === 'presets'
                ? 'bg-[#118AB2] text-white shadow-[3px_3px_0px_0px_#073B4C]'
                : 'bg-white text-[#073B4C]'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>{t.standardPresets}</span>
          </button>
          <button
            onClick={() => {
              soundEngine.playTap();
              setTab('custom');
            }}
            className={`flex-1 py-2 rounded-2xl font-black text-xs border-2 border-[#073B4C] flex items-center justify-center gap-1.5 transition-all ${
              tab === 'custom'
                ? 'bg-[#118AB2] text-white shadow-[3px_3px_0px_0px_#073B4C]'
                : 'bg-white text-[#073B4C]'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>{t.customBoard}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto max-h-[60vh] flex-1 bg-[#FFFDF9]">
          {tab === 'presets' ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
              {BOARD_PRESETS.map((preset) => {
                const isSelected =
                  currentConfig.rows === preset.rows &&
                  currentConfig.cols === preset.cols &&
                  currentConfig.winLength === preset.winLength;

                return (
                  <button
                    key={preset.id}
                    id={`preset-${preset.id}`}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-4 rounded-2xl border-3 border-[#073B4C] text-left transition-all relative ${
                      isSelected
                        ? 'bg-[#FFD166] shadow-[4px_4px_0px_0px_#073B4C] -translate-y-0.5'
                        : 'bg-white hover:bg-amber-50 shadow-[2px_2px_0px_0px_#073B4C]'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#06D6A0] border-2 border-[#073B4C] flex items-center justify-center text-white">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                    <span className="text-xl sm:text-2xl font-black text-[#073B4C] block">
                      {language === 'bn' ? preset.labelBn : preset.labelEn}
                    </span>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-white border border-[#073B4C] text-[11px] font-black text-[#073B4C]">
                      {language === 'bn' ? preset.badgeBn : preset.badgeEn}
                    </span>
                    <span className="block mt-2 text-[10px] font-bold text-[#4A4E69]">
                      {preset.winLength}-in-a-row
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Custom Board Configurator */
            <div className="flex flex-col gap-4">
              {/* Rows slider */}
              <div className="p-4 rounded-2xl bg-white border-2 border-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black text-[#073B4C] uppercase tracking-wide">
                    {language === 'bn' ? 'সারি (Rows)' : 'Rows'}:
                  </span>
                  <span className="px-3 py-0.5 rounded-lg bg-[#EF476F] text-white font-black text-sm border border-[#073B4C]">
                    {customRows}
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="15"
                  value={customRows}
                  onChange={(e) => handleRowsChange(parseInt(e.target.value))}
                  className="w-full accent-[#EF476F] cursor-pointer"
                />
              </div>

              {/* Columns slider */}
              <div className="p-4 rounded-2xl bg-white border-2 border-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black text-[#073B4C] uppercase tracking-wide">
                    {language === 'bn' ? 'কলাম (Columns)' : 'Columns'}:
                  </span>
                  <span className="px-3 py-0.5 rounded-lg bg-[#118AB2] text-white font-black text-sm border border-[#073B4C]">
                    {customCols}
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="15"
                  value={customCols}
                  onChange={(e) => handleColsChange(parseInt(e.target.value))}
                  className="w-full accent-[#118AB2] cursor-pointer"
                />
              </div>

              {/* Win Length slider */}
              <div className="p-4 rounded-2xl bg-white border-2 border-[#073B4C] shadow-[3px_3px_0px_0px_#073B4C]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black text-[#073B4C] uppercase tracking-wide">
                    {language === 'bn' ? 'জয়ের শর্ত (Win Length)' : 'Win Condition'}:
                  </span>
                  <span className="px-3 py-0.5 rounded-lg bg-[#06D6A0] text-white font-black text-sm border border-[#073B4C]">
                    {customWin}
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max={Math.min(customRows, customCols, 5)}
                  value={customWin}
                  onChange={(e) => setCustomWin(parseInt(e.target.value))}
                  className="w-full accent-[#06D6A0] cursor-pointer"
                />
              </div>

              {/* Apply Custom Button */}
              <button
                id="btn-apply-custom-board"
                onClick={handleApplyCustom}
                className="w-full py-3.5 rounded-2xl bg-[#06D6A0] border-3 border-[#073B4C] text-[#073B4C] font-black text-sm shadow-[4px_4px_0px_0px_#073B4C] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 mt-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{t.applyCustomBoard}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
