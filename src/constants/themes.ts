/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlayerTheme } from '../types';

export const PLAYER_THEMES: Record<string, PlayerTheme> = {
  coral: {
    id: 'coral',
    name: 'গোলাপী কোরাল (Coral Pink)',
    gradient: 'from-[#EF476F] to-[#d6224e]',
    primary: '#EF476F',
    accent: '#ff7092',
    shadow: '#EF476F',
    border: 'border-[#EF476F]',
    text: 'text-[#EF476F]'
  },
  blue: {
    id: 'blue',
    name: 'নীল সমুদ্র (Ocean Blue)',
    gradient: 'from-[#118AB2] to-[#0a6684]',
    primary: '#118AB2',
    accent: '#38bdf8',
    shadow: '#118AB2',
    border: 'border-[#118AB2]',
    text: 'text-[#118AB2]'
  },
  emerald: {
    id: 'emerald',
    name: 'পান্না সবুজ (Emerald Teal)',
    gradient: 'from-[#06D6A0] to-[#04a77d]',
    primary: '#06D6A0',
    accent: '#34d399',
    shadow: '#06D6A0',
    border: 'border-[#06D6A0]',
    text: 'text-[#06D6A0]'
  },
  amber: {
    id: 'amber',
    name: 'সোনালী রোদ (Sunshine Gold)',
    gradient: 'from-[#FFD166] to-[#f4a261]',
    primary: '#FFD166',
    accent: '#ffe299',
    shadow: '#FFD166',
    border: 'border-[#FFD166]',
    text: 'text-[#e29d00]'
  },
  purple: {
    id: 'purple',
    name: 'রাজকীয় বেগুনি (Royal Violet)',
    gradient: 'from-[#7209B7] to-[#480ca8]',
    primary: '#7209B7',
    accent: '#b5179e',
    shadow: '#7209B7',
    border: 'border-[#7209B7]',
    text: 'text-[#7209B7]'
  },
  orange: {
    id: 'orange',
    name: 'উজ্জ্বল কমলা (Tangerine)',
    gradient: 'from-[#FF8C61] to-[#e76f51]',
    primary: '#FF8C61',
    accent: '#ffaa8a',
    shadow: '#FF8C61',
    border: 'border-[#FF8C61]',
    text: 'text-[#FF8C61]'
  }
};

export interface AvatarOption {
  id: string;
  nameBn: string;
  nameEn: string;
  iconName: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'crown', nameBn: 'মুকুট', nameEn: 'Crown', iconName: 'Crown' },
  { id: 'tiger', nameBn: 'রয়েল বাঘ', nameEn: 'Royal Tiger', iconName: 'Cat' },
  { id: 'trophy', nameBn: 'ট্রফি', nameEn: 'Trophy', iconName: 'Trophy' },
  { id: 'flame', nameBn: 'অগ্নিশিখা', nameEn: 'Flame', iconName: 'Flame' },
  { id: 'star', nameBn: 'উজ্জ্বল তারা', nameEn: 'Star', iconName: 'Sparkles' },
  { id: 'sword', nameBn: 'অসিযোদ্ধা', nameEn: 'Swords', iconName: 'Swords' },
  { id: 'shield', nameBn: 'ঢাল', nameEn: 'Shield', iconName: 'Shield' },
  { id: 'zap', nameBn: 'বিদ্যুৎ', nameEn: 'Lightning', iconName: 'Zap' },
  { id: 'robot', nameBn: 'রোবো', nameEn: 'Robo', iconName: 'Bot' },
  { id: 'diamond', nameBn: 'হীরক', nameEn: 'Diamond', iconName: 'Gem' }
];

export interface BoardPreset {
  id: string;
  labelBn: string;
  labelEn: string;
  rows: number;
  cols: number;
  winLength: number;
  badgeBn: string;
  badgeEn: string;
}

export const BOARD_PRESETS: BoardPreset[] = [
  { id: '3x3', labelBn: '৩ × ৩', labelEn: '3 × 3', rows: 3, cols: 3, winLength: 3, badgeBn: 'ক্লাসিক ৩-ইন-এ-রো', badgeEn: 'Classic 3-in-a-Row' },
  { id: '4x4', labelBn: '৪ × ৪', labelEn: '4 × 4', rows: 4, cols: 4, winLength: 4, badgeBn: '৪-ইন-এ-রো', badgeEn: '4-in-a-Row' },
  { id: '5x5', labelBn: '৫ × ৫', labelEn: '5 × 5', rows: 5, cols: 5, winLength: 4, badgeBn: 'কৌশলগত ৫x৫', badgeEn: 'Tactical 5x5' },
  { id: '6x6', labelBn: '৬ × ৬', labelEn: '6 × 6', rows: 6, cols: 6, winLength: 4, badgeBn: 'মাঝারি বোর্ড', badgeEn: 'Medium Board' },
  { id: '8x8', labelBn: '৮ × ৮', labelEn: '8 × 8', rows: 8, cols: 8, winLength: 4, badgeBn: 'দাবা স্টাইল', badgeEn: 'Chess Size' },
  { id: '10x10', labelBn: '১০ × ১০', labelEn: '10 × 10', rows: 10, cols: 10, winLength: 4, badgeBn: 'মাস্টার গ্রিড', badgeEn: 'Master Grid' },
  { id: '12x12', labelBn: '১২ × ১২', labelEn: '12 × 12', rows: 12, cols: 12, winLength: 4, badgeBn: 'গ্র্যান্ডমাস্টার', badgeEn: 'Grandmaster' },
  { id: '15x15', labelBn: '১৫ × ১৫', labelEn: '15 × 15', rows: 15, cols: 15, winLength: 4, badgeBn: 'গোমোকু স্কেল', badgeEn: 'Gomoku Scale' },
];
