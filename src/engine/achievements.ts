/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Achievement, PlayerStats, GameType, GameMode, AIDifficulty, Player } from '../types';

export const ACHIEVEMENTS: Record<string, Achievement> = {
  first_win: {
    id: 'first_win',
    titleBn: 'প্রথম বিজয়!',
    titleEn: 'First Victory!',
    descriptionBn: 'অভিনন্দন! আপনি প্রথম ম্যাচে জয় লাভ করেছেন।',
    descriptionEn: 'Congratulations! You won your very first match.',
    iconName: 'trophy',
    badgeColor: '#FFD166'
  },
  streak_3: {
    id: 'streak_3',
    titleBn: 'হ্যাটট্রিক জয়! (৩টি টানা)',
    titleEn: 'Hat-Trick! (3 Wins in a Row)',
    descriptionBn: 'টানা ৩টি খেলায় অপরাজিত থেকে হ্যাটট্রিক অর্জন করলেন!',
    descriptionEn: '3 consecutive victories! A brilliant hat-trick!',
    iconName: 'flame',
    badgeColor: '#EF476F'
  },
  streak_5: {
    id: 'streak_5',
    titleBn: '৫টি টানা জয়! (অপ্রতিরোধ্য)',
    titleEn: '5 Wins in a Row! (Unstoppable)',
    descriptionBn: 'অবিশ্বাস্য নৈপুণ্য! টানা ৫ ম্যাচে বিজয়ী হয়ে ইতিহাস গড়লেন!',
    descriptionEn: 'Phenomenal mastery! 5 consecutive victories in a row!',
    iconName: 'crown',
    badgeColor: '#7209B7'
  },
  streak_10: {
    id: 'streak_10',
    titleBn: 'অপরাজেয় কিংবদন্তি (১০টি টানা জয়)',
    titleEn: 'Legendary Streak! (10 in a Row)',
    descriptionBn: 'টানা ১০টি ম্যাচে জয়! আপনি একজন অপরাজেয় বোর্ড মাস্টার!',
    descriptionEn: '10 consecutive wins! Truly a legendary master!',
    iconName: 'zap',
    badgeColor: '#118AB2'
  },
  total_10: {
    id: 'total_10',
    titleBn: 'দশম বিজয় অর্জন!',
    titleEn: 'Decade of Victories (10 Wins)',
    descriptionBn: 'মোট ১০টি ম্যাচে গৌরবময় জয় অর্জন করেছেন!',
    descriptionEn: 'Reached milestone of 10 total match victories!',
    iconName: 'star',
    badgeColor: '#06D6A0'
  },
  hard_ai: {
    id: 'hard_ai',
    titleBn: 'মাস্টার স্ট্র্যাটেজিস্ট',
    titleEn: 'Master Strategist (Hard AI)',
    descriptionBn: 'চতুর হার্ড (Hard) AI-কে পরাজিত করে বুদ্ধির লড়াইয়ে জিতলেন!',
    descriptionEn: 'Outsmarted and defeated the Hard AI bot!',
    iconName: 'target',
    badgeColor: '#D97706'
  },
  dots_master: {
    id: 'dots_master',
    titleBn: 'খাঁচা সম্রাট (Box Master)',
    titleEn: 'Box Dominator (5+ Boxes)',
    descriptionBn: 'খাঁচা ও বিন্দু খেলায় একক ম্যাচে ৫ বা ততোধিক বক্স দখল করেছেন!',
    descriptionEn: 'Captured 5 or more boxes in a single Dots & Boxes match!',
    iconName: 'medal',
    badgeColor: '#BE185D'
  },
  multi_champion: {
    id: 'multi_champion',
    titleBn: 'সব্যসাচী চ্যাম্পিয়ন (Dual Master)',
    titleEn: 'Multi-Game Champion',
    descriptionBn: 'উভয় খেলাতেই (TinT ও Dots & Boxes) জয় ছিনিয়ে এনেছেন!',
    descriptionEn: 'Mastered and won matches in multiple board games!',
    iconName: 'sparkles',
    badgeColor: '#073B4C'
  },
  c4_master: {
    id: 'c4_master',
    titleBn: '৪-মিলান মাস্টার (Connect-4 Master)',
    titleEn: 'Connect-4 Master',
    descriptionBn: 'চার মিলান (Connect Four) খেলায় চমৎকার ৪টি ঘুঁটি মিলিয়ে জয়লাভ করেছেন!',
    descriptionEn: 'Successfully aligned 4 tokens in a row to win Connect Four!',
    iconName: 'zap',
    badgeColor: '#EF476F'
  },
  triple_master: {
    id: 'triple_master',
    titleBn: 'ত্রি-খেলা সর্বজয়ী (Triple Champion)',
    titleEn: 'Triple Board Legend',
    descriptionBn: 'তিনটি খেলাতেই (TinT, খাঁচা-বিন্দু ও চার মিলান) গৌরবময় জয় ছিনিয়ে এনেছেন!',
    descriptionEn: 'Achieved victory across all 3 board games in TinT!',
    iconName: 'crown',
    badgeColor: '#FFD166'
  }
};

const STATS_STORAGE_KEY = 'tint_player_stats_v1';

export const DEFAULT_PLAYER_STATS: PlayerStats = {
  totalWins: 0,
  currentWinStreak: 0,
  maxWinStreak: 0,
  tictactoeWins: 0,
  dotsBoxesWins: 0,
  connectFourWins: 0,
  hardAiWins: 0,
  unlockedAchievementIds: []
};

export const loadPlayerStats = (): PlayerStats => {
  if (typeof window === 'undefined') return DEFAULT_PLAYER_STATS;
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return DEFAULT_PLAYER_STATS;
    return { ...DEFAULT_PLAYER_STATS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PLAYER_STATS;
  }
};

export const savePlayerStats = (stats: PlayerStats): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage quota errors
  }
};

/** Fully remove persisted player stats/achievements (used by "Reset All Local Data"). */
export const clearPlayerStats = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STATS_STORAGE_KEY);
  } catch {
    // Ignore
  }
};

/**
 * Checks milestones after a win and returns newly unlocked achievements
 */
export const recordGameWinAndCheckAchievements = (
  winner: Player,
  gameType: GameType,
  mode: GameMode,
  difficulty?: AIDifficulty,
  boxesCaptured?: number
): { updatedStats: PlayerStats; newAchievements: Achievement[] } => {
  const currentStats = loadPlayerStats();
  
  // Is this a human winner or bot?
  const isHumanWinner = !winner.isAI;

  let newCurrentStreak = currentStats.currentWinStreak;
  if (isHumanWinner) {
    newCurrentStreak += 1;
  } else {
    newCurrentStreak = 0; // AI won, streak resets
  }

  const newMaxStreak = Math.max(currentStats.maxWinStreak, newCurrentStreak);
  const newTotalWins = isHumanWinner ? currentStats.totalWins + 1 : currentStats.totalWins;
  const newTttWins = isHumanWinner && gameType === 'tictactoe' ? currentStats.tictactoeWins + 1 : currentStats.tictactoeWins;
  const newDotsWins = isHumanWinner && gameType === 'dotsboxes' ? currentStats.dotsBoxesWins + 1 : currentStats.dotsBoxesWins;
  const newC4Wins = isHumanWinner && gameType === 'connectfour' ? (currentStats.connectFourWins || 0) + 1 : (currentStats.connectFourWins || 0);
  const newHardAiWins = isHumanWinner && mode === 'ai' && difficulty === 'hard' ? currentStats.hardAiWins + 1 : currentStats.hardAiWins;

  const unlocked = new Set<string>(currentStats.unlockedAchievementIds || []);
  const newlyUnlockedAchievements: Achievement[] = [];

  const maybeUnlock = (achId: string) => {
    if (!unlocked.has(achId) && ACHIEVEMENTS[achId]) {
      unlocked.add(achId);
      newlyUnlockedAchievements.push(ACHIEVEMENTS[achId]);
    }
  };

  if (isHumanWinner) {
    // 1. First Win
    if (newTotalWins >= 1) {
      maybeUnlock('first_win');
    }

    // 2. Streaks
    if (newCurrentStreak >= 3) {
      maybeUnlock('streak_3');
    }
    if (newCurrentStreak >= 5) {
      maybeUnlock('streak_5');
    }
    if (newCurrentStreak >= 10) {
      maybeUnlock('streak_10');
    }

    // 3. 10 Total Wins
    if (newTotalWins >= 10) {
      maybeUnlock('total_10');
    }

    // 4. Hard AI Win
    if (mode === 'ai' && difficulty === 'hard') {
      maybeUnlock('hard_ai');
    }

    // 5. Dots Box Dominator (5+ boxes in a single game)
    if (gameType === 'dotsboxes' && (boxesCaptured || 0) >= 5) {
      maybeUnlock('dots_master');
    }

    // 6. Connect Four Win
    if (gameType === 'connectfour') {
      maybeUnlock('c4_master');
    }

    // 7. Dual Multi-Game Champion (2+ games won)
    const distinctGamesWon = (newTttWins > 0 ? 1 : 0) + (newDotsWins > 0 ? 1 : 0) + (newC4Wins > 0 ? 1 : 0);
    if (distinctGamesWon >= 2) {
      maybeUnlock('multi_champion');
    }

    // 8. Triple Board Legend (all 3 games won)
    if (newTttWins > 0 && newDotsWins > 0 && newC4Wins > 0) {
      maybeUnlock('triple_master');
    }
  }

  const updatedStats: PlayerStats = {
    totalWins: newTotalWins,
    currentWinStreak: newCurrentStreak,
    maxWinStreak: newMaxStreak,
    tictactoeWins: newTttWins,
    dotsBoxesWins: newDotsWins,
    connectFourWins: newC4Wins,
    hardAiWins: newHardAiWins,
    unlockedAchievementIds: Array.from(unlocked)
  };

  savePlayerStats(updatedStats);

  return {
    updatedStats,
    newAchievements: newlyUnlockedAchievements
  };
};

/**
 * Resets streaks if a game was drawn or lost
 */
export const recordGameLossOrDraw = (): PlayerStats => {
  const currentStats = loadPlayerStats();
  const updatedStats: PlayerStats = {
    ...currentStats,
    currentWinStreak: 0
  };
  savePlayerStats(updatedStats);
  return updatedStats;
};
