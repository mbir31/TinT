/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { AchievementToastItem, Language } from '../types';
import { Trophy, Flame, Crown, Zap, Sparkles, Target, Star, Medal, X } from 'lucide-react';
import { soundEngine } from '../engine/soundEngine';
import { hapticsEngine } from '../engine/hapticsEngine';

interface AchievementToastProps {
  toasts: AchievementToastItem[];
  onDismiss: (id: string) => void;
  language: Language;
}

const renderAchievementIcon = (iconName: string, className: string = 'w-5 h-5') => {
  switch (iconName) {
    case 'flame':
      return <Flame className={className} />;
    case 'crown':
      return <Crown className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'star':
      return <Star className={className} />;
    case 'target':
      return <Target className={className} />;
    case 'medal':
      return <Medal className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'trophy':
    default:
      return <Trophy className={className} />;
  }
};

export const AchievementToast: React.FC<AchievementToastProps> = ({
  toasts,
  onDismiss,
  language
}) => {
  useEffect(() => {
    if (toasts.length > 0) {
      soundEngine.playAchievement();
      hapticsEngine.trigger('win');
    }
  }, [toasts.length]);

  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Achievements"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2.5 w-full max-w-sm px-3 pointer-events-none select-none"
    >
      {toasts.map((toast) => {
        const { achievement, id } = toast;
        const title = language === 'bn' ? achievement.titleBn : achievement.titleEn;
        const desc = language === 'bn' ? achievement.descriptionBn : achievement.descriptionEn;

        return (
          <div
            key={id}
            id={`achievement-toast-${id}`}
            role="status"
            aria-live="polite"
            className="pointer-events-auto w-full bg-white rounded-2xl border-3 border-[#073B4C] shadow-[5px_5px_0px_0px_#073B4C] p-3.5 flex items-start gap-3 relative overflow-hidden animate-in slide-in-from-top-4 fade-in duration-300 transition-all hover:scale-[1.02]"
          >
            {/* Top glowing accent stripe */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ backgroundColor: achievement.badgeColor || '#FFD166' }}
            />

            {/* Achievement Icon Badge with subtle rotation */}
            <div
              className="w-11 h-11 rounded-2xl border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] flex items-center justify-center text-[#073B4C] flex-shrink-0 mt-0.5"
              style={{ backgroundColor: achievement.badgeColor || '#FFD166' }}
            >
              {renderAchievementIcon(achievement.iconName, 'w-6 h-6')}
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0 pr-5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="px-1.5 py-0.5 rounded-md bg-[#FFF9F0] border border-[#073B4C]/30 text-[9px] font-black text-[#EF476F] uppercase tracking-wider">
                  {language === 'bn' ? '🏆 নতুন অর্জন' : '🏆 Achievement Unlocked'}
                </span>
              </div>
              <h4 className="text-sm font-black text-[#073B4C] leading-tight truncate">
                {title}
              </h4>
              <p className="text-xs font-bold text-[#4A4E69] leading-snug mt-0.5">
                {desc}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => onDismiss(id)}
              className="absolute top-2.5 right-2.5 p-1 rounded-lg text-[#4A4E69] hover:text-[#073B4C] hover:bg-slate-100 transition-colors"
              title={language === 'bn' ? 'বন্ধ করুন' : 'Dismiss'}
              aria-label="Dismiss Achievement Toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </aside>
  );
};
