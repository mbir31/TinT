/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Language } from '../types';

export const toBengaliDigits = (val: number | string): string => {
  const str = String(val);
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return str.replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)]);
};

export const formatNumberByLang = (val: number | string, lang: Language): string => {
  if (lang === 'bn') {
    return toBengaliDigits(val);
  }
  return String(val);
};

export const TRANSLATIONS = {
  bn: {
    appTitle: 'TinT',
    appSubtitle: 'থ্রিডি টিক-ট্যাক-টো, খাঁচা-বিন্দু ও চার মিলান',
    tagline: 'বাংলায় আধুনিক ৩ডি মাল্টি-গেম বোর্ড প্ল্যাটফর্ম',
    
    // Games
    gameTicTacToe: 'টিক-ট্যাক-টো',
    gameDotsBoxes: 'খাঁচা ও বিন্দু (Dots & Boxes)',
    dotsBoxesDesc: 'ডট যুক্ত করে খাঁচা বা বক্স পূরণ করুন এবং সবচেয়ে বেশি পয়েন্ট নিয়ে জয়ী হন',
    bonusTurn: 'বোনাস চাল!',
    boxCaptured: 'বক্স দখল হয়েছে!',
    completedBoxes: 'দখলকৃত বক্স',
    gameConnectFour: 'চার মিলান (Connect Four)',
    connectFourDesc: 'কলামে ঘুঁটি ফেলে অনুভূমিক, উলম্ব বা কোণাকুণি যেকোনো ৪টি এক সারিতে মিলিয়ে জয়ী হোন',
    columnFull: 'কলামটি পূর্ণ',
    dropDiscPrompt: 'কলাম নির্বাচন করুন',
    
    // Modes
    localMode: 'স্থানীয় ২ খেলোয়াড়',
    localModeDesc: 'একই ডিভাইসে মুখোমুখি খেলুন',
    aiMode: 'রোবোর সাথে খেলুন',
    aiModeDesc: 'কৃত্রিম বুদ্ধিমত্তার সাথে চ্যালেঞ্জ নিন',
    onlineMode: 'অনলাইন মাল্টিপ্লেয়ার',
    onlineModeDesc: 'রুম কোড দিয়ে দূর থেকে বন্ধুদের সাথে খেলুন',
    
    // Difficulty
    difficulty: 'AI এর স্তর',
    difficultyEasy: 'সহজ',
    difficultyEasyDesc: 'নতুন খেলোয়াড়দের জন্য চমৎকার',
    difficultyMedium: 'মাঝারি',
    difficultyMediumDesc: 'কৌশলী এবং প্রতিরোধী চাল',
    difficultyHard: 'কঠিন',
    difficultyHardDesc: 'স্মার্ট মিনিম্যাক্স এবং প্যাটার্ন সার্চ',
    
    // Board Selection
    selectBoard: 'বোর্ড নির্বাচন করুন',
    boardSize: 'বোর্ডের আকার',
    customBoard: 'কাস্টম বোর্ড',
    rows: 'সারি (Rows)',
    cols: 'কলাম (Columns)',
    winRule3: '৩টি চিহ্ন এক লাইনে মিলালে জয়',
    winRule4: 'যেকোনো ৪টি চিহ্ন এক লাইনে মিলালে জয় (আড়াআড়ি, লম্ব বা কোণাকুণি)',
    winRule5: 'যেকোনো ৫টি চিহ্ন এক লাইনে মিলালে জয় (গোমোকু স্কেল বা বড় বোর্ড)',
    ruleBadge: 'জয়ের নিয়ম',
    
    // Players Customization
    customizePlayers: 'খেলোয়াড়দের পরিচয় ও রূপ',
    player1: 'খেলোয়াড় ১',
    player2: 'খেলোয়াড় ২',
    humanPlayer: 'আপনার নাম',
    aiPlayer: 'রোবোর নাম',
    playerNamePlaceholder: 'খেলোয়াড়ের নাম লিখুন',
    avatarSelection: 'চিহ্ন / অবতার',
    colorTheme: 'রঙের থিম',
    customPhoto: 'কাস্টম ছবি (Custom Photo)',
    uploadPhoto: 'ছবি আপলোড করুন',
    changePhoto: 'ছবি পরিবর্তন',
    removePhoto: 'ছবি মুছুন',
    cropPhotoTitle: 'ছবি ক্রপ ও পজিশন করুন',
    cropInstruction: 'ড্র্যাগ করে ছবি সরান ও জুম স্লাইডার দিয়ে নিখুঁত সাইজ করুন',
    applyCrop: 'ক্রপ সম্পন্ন করুন',
    rotatePhoto: 'ঘোরান ( Rotate )',
    dropPhotoHere: 'ছবিটি এখানে টেনে আনুন বা ক্লিক করুন',
    photoActive: 'ছবি বোর্ডের ঘুঁটিতে ব্যবহার হচ্ছে',
    
    // Game Play
    turnOf: 'এর চাল',
    nowTurn: 'এখন',
    startGame: 'খেলা শুরু করুন',
    playAgain: 'আবার খেলুন',
    newGame: 'নতুন ম্যাচ',
    changeBoard: 'বোর্ড পরিবর্তন',
    home: 'হোম পেজ',
    moves: 'মোট চাল',
    score: 'স্কোর',
    draw: 'ম্যাচ ড্র!',
    drawSubtitle: 'কোনো খেলোয়াড়ই নির্ধারিত লাইন মেলাতে পারেনি। অসাধারণ লড়াই!',
    winnerCelebration: 'অভিনন্দন! বিজয়ী হয়েছেন',
    aiThinking: 'রোবো ভাবছে...',
    zoomIn: 'জুম ইন',
    zoomOut: 'জুম আউট',
    resetView: 'ভিউ রিসেট',
    rotate3d: '৩ডি দৃষ্টিকোণ ঘোরান (Rotate 90°)',
    rotate3dShort: '৯০° ঘোরান',
    restartMatch: 'ম্যাচ রিস্টার্ট',
    
    // Countdown
    ready: 'প্রস্তুত হন',
    go: 'শুরু!',
    skipCountdown: 'স্কিপ',
    
    // Online Multiplayer
    createRoom: 'নতুন রুম তৈরি করুন',
    joinRoom: 'রুমে প্রবেশ করুন',
    roomCode: 'রুম কোড',
    enterRoomCode: '৫ অক্ষরের কোড লিখুন',
    copyCode: 'কোড কপি করুন',
    shareLink: 'আমন্ত্রণ লিংক শেয়ার',
    codeCopied: 'রুম কোড ক্লিপবোর্ডে কপি হয়েছে!',
    linkCopied: 'আমন্ত্রণ লিংক কপি হয়েছে!',
    waitingOpponent: 'প্রতিপক্ষের প্রবেশের জন্য অপেক্ষা করা হচ্ছে...',
    sharePrompt: 'আপনার বন্ধুকে এই কোডটি পাঠান',
    opponentJoined: 'প্রতিপক্ষ যোগ দিয়েছে!',
    opponentLeft: 'প্রতিপক্ষ খেলা ত্যাগ করেছে',
    roomFull: 'এই রুমে ইতিমধ্যে দুইজন খেলোয়াড় আছে',
    roomNotFound: 'রুমটি খুঁজে পাওয়া যায়নি বা মেয়াদ শেষ হয়ে গেছে',
    roomExpired: 'রুমের সেশনের মেয়াদ শেষ হয়েছে',
    unauthorized: 'অননুমোদিত রুম সেশন',
    reconnecting: 'সংযোগ বিচ্ছিন্ন হয়েছে। পুনরায় সংযোগের চেষ্টা চলছে...',
    opponentReconnecting: 'প্রতিপক্ষের সংযোগ বিচ্ছিন্ন হয়েছে, পুনরায় সংযোগের জন্য অপেক্ষা করা হচ্ছে...',
    opponentReconnected: 'প্রতিপক্ষ পুনরায় খেলায় সংযুক্ত হয়েছে!',
    resumedMatch: 'অনলাইন ম্যাচে ফিরে এসেছেন!',
    onlineConnected: 'অনলাইনে সংযুক্ত',
    onlineDisconnected: 'অফলাইন মোড সক্রিয়',
    rematchRequested: 'প্রতিপক্ষ রিম্যাচ অনুরোধ পাঠিয়েছে',
    rematchAccepted: 'উভয় খেলোয়াড় রাজি! নতুন ম্যাচ শুরু হচ্ছে...',
    requestRematch: 'রিম্যাচ অনুরোধ',
    acceptRematch: 'রিম্যাচ গ্রহণ করুন',
    leaveRoom: 'রুম থেকে প্রস্থান',
    
    // Settings
    settings: 'সেটিংস',
    language: 'ভাষা (Language)',
    soundEffects: 'শব্দ প্রভাব (Sound Effects)',
    hapticFeedback: 'হ্যাপটিক ভাইব্রেশন (Vibration)',
    reducedMotion: 'গতি হ্রাস (Reduced Motion)',
    tilt3d: '৩ডি বোর্ড টিল্ট ও ছায়া (3D Depth)',
    soundDesc: 'চাল ও জয়ের শব্দ শুনুন',
    hapticDesc: 'চাল দিলে ডিভাইসে কম্পন অনুভব করুন',
    motionDesc: 'অ্যানিমেশন তীব্রতা নিয়ন্ত্রণ করুন',
    tiltDesc: 'কৌশলী ৩ডি বোর্ডের দৃষ্টিকোণ',
    tokenPalettesTitle: 'ঘুঁটি ও টোকেনের কালার প্যালেট',
    tokenPalettesDesc: 'খেলোয়াড় ১, খেলোয়াড় ২ এবং রোবোর ঘুঁটির রঙের কম্বিনেশন বেছে নিন',
    p1TokenLabel: 'খেলোয়াড় ১',
    p2TokenLabel: 'খেলোয়াড় ২',
    aiTokenLabel: 'রোবো (AI)',
    activePaletteTag: 'সক্রিয়',
    dotsGridCustomizerTitle: 'ডটস ও গ্রিড লাইনের রঙ',
    dotsGridCustomizerDesc: 'খাঁচা ও বিন্দু বোর্ডের অপ্রযুক্ত লাইন ও বিন্দুর রঙ কাস্টমাইজ করুন',
    dotsLineColor: 'গ্রিড লাইনের রঙ',
    dotsDotColor: 'বিন্দুর (Peg) রঙ',
    customColorOption: 'কাস্টম রঙ',
    presetPalette: 'থিম প্রিসেট',
    resetDefaultColor: 'ডিফল্ট রঙ',
    resetData: 'সব সেটিংস রিসেট করুন',
    resetConfirmTitle: 'আপনি কি নিশ্চিত?',
    resetConfirmDesc: 'আপনার সংরক্ষিত সব নাম, স্কোর এবং পছন্দের সেটিংস মুছে যাবে।',
    cancel: 'বাতিল',
    confirm: 'হ্যাঁ, মুছুন',
    dataResetDone: 'সকল তথ্য সফলভাবে রিসেট করা হয়েছে।',
    
    // About
    about: 'পরিচিতি ও নিয়মাবলী',
    aboutTitle: 'TinT সম্পর্কে',
    aboutContent: 'TinT হলো আধুনিক প্রোগ্রেসিভ ওয়েব অ্যাপ (PWA) নির্ভর একটি বাংলাদেশি ৩ডি বোর্ড গেম। এতে রয়েছে দ্রুত অফলাইন খেলা, বুদ্ধিমান AI, কাস্টম বোর্ড ও রিয়েল-টাইম অনলাইন রুম ব্যবস্থা।',
    rulesSummary: '৩×৩ বোর্ডে ৩টি চিহ্ন, ৪×৪ থেকে ৬×৬ বোর্ডে ৪টি চিহ্ন এবং ৮×৮ বা তার চেয়ে বড় বোর্ডে ৫টি চিহ্ন (গোমোকু স্কেল) মেলালেই জয়লাভ হবে।',
    offlineStatus: 'আপনি বর্তমানে অফলাইনে আছেন (লোকাল ও এআই খেলা সচল)',
    installApp: 'অ্যাপ ইনস্টল করুন',
    installPrompt: 'হোমস্ক্রিনে যোগ করে অফলাইনে খেলুন',
    
    // Credits
    credit: 'Made with ♥ by ©munabbiRMushran'
  },
  en: {
    appTitle: 'TinT',
    appSubtitle: '3D Tic-Tac-Toe, Dots & Boxes & Connect Four',
    tagline: 'Modern Bengali-first 3D Multi-Game Platform',
    
    // Games
    gameTicTacToe: 'Tic-Tac-Toe',
    gameDotsBoxes: 'Dots & Boxes',
    dotsBoxesDesc: 'Connect grid dots to capture boxes and score the highest points',
    bonusTurn: 'Bonus Turn!',
    boxCaptured: 'Box Captured!',
    completedBoxes: 'Captured Boxes',
    gameConnectFour: 'Connect Four',
    connectFourDesc: 'Drop tokens into columns to align 4 in a row horizontally, vertically, or diagonally',
    columnFull: 'Column is Full',
    dropDiscPrompt: 'Choose Column to Drop',
    
    // Modes
    localMode: 'Local 2 Players',
    localModeDesc: 'Play head-to-head on the same device',
    aiMode: 'Play with AI',
    aiModeDesc: 'Challenge the intelligent computer bot',
    onlineMode: 'Online Multiplayer',
    onlineModeDesc: 'Play remotely with friends via room code',
    
    // Difficulty
    difficulty: 'AI Level',
    difficultyEasy: 'Easy',
    difficultyEasyDesc: 'Great for beginners and casual fun',
    difficultyMedium: 'Medium',
    difficultyMediumDesc: 'Tactical moves and active blocking',
    difficultyHard: 'Hard',
    difficultyHardDesc: 'Smart minimax lookahead and pattern search',
    
    // Board Selection
    selectBoard: 'Select Board Size',
    boardSize: 'Board Size',
    customBoard: 'Custom Board',
    rows: 'Rows',
    cols: 'Columns',
    winRule3: 'Align 3 marks in a line to win',
    winRule4: 'Align any 4 marks in a line to win (Horizontal, Vertical, or Diagonal)',
    winRule5: 'Align any 5 marks in a line to win (Gomoku Scale & Large Grids)',
    ruleBadge: 'Win Rule',
    
    // Players Customization
    customizePlayers: 'Player Identities',
    player1: 'Player 1',
    player2: 'Player 2',
    humanPlayer: 'Your Name',
    aiPlayer: 'AI Name',
    playerNamePlaceholder: 'Enter player name',
    avatarSelection: 'Token / Emblem',
    colorTheme: 'Color Theme',
    customPhoto: 'Player Photo',
    uploadPhoto: 'Upload Photo',
    changePhoto: 'Change Photo',
    removePhoto: 'Remove Photo',
    cropPhotoTitle: 'Crop & Position Photo',
    cropInstruction: 'Drag to reposition, adjust zoom slider, then apply crop',
    applyCrop: 'Apply & Save Crop',
    rotatePhoto: 'Rotate',
    dropPhotoHere: 'Drag & drop image here or click to browse',
    photoActive: 'Photo will be carved onto 3D board pieces',
    
    // Game Play
    turnOf: "'s Turn",
    nowTurn: 'Now',
    startGame: 'Start Match',
    playAgain: 'Play Again',
    newGame: 'New Match',
    changeBoard: 'Change Board',
    home: 'Home Page',
    moves: 'Total Moves',
    score: 'Score',
    draw: 'Match Tied!',
    drawSubtitle: 'Neither player achieved the winning sequence. Outstanding battle!',
    winnerCelebration: 'Congratulations! Winner is',
    aiThinking: 'Bot is calculating...',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    resetView: 'Reset View',
    rotate3d: 'Rotate 3D Board (90°)',
    rotate3dShort: 'Rotate 90°',
    restartMatch: 'Restart Match',
    
    // Countdown
    ready: 'Get Ready',
    go: 'PLAY!',
    skipCountdown: 'Skip',
    
    // Online Multiplayer
    createRoom: 'Create New Room',
    joinRoom: 'Join Room',
    roomCode: 'Room Code',
    enterRoomCode: 'Enter 5-character room code',
    copyCode: 'Copy Code',
    shareLink: 'Share Invite Link',
    codeCopied: 'Room code copied to clipboard!',
    linkCopied: 'Invite link copied!',
    waitingOpponent: 'Waiting for opponent to join...',
    sharePrompt: 'Send this code or link to your friend',
    opponentJoined: 'Opponent connected!',
    opponentLeft: 'Opponent left the match',
    roomFull: 'This room already has 2 active players',
    roomNotFound: 'Room not found or session has expired',
    roomExpired: 'Game room session has expired',
    unauthorized: 'Unauthorized room session',
    reconnecting: 'Connection lost. Reconnecting...',
    opponentReconnecting: 'Opponent disconnected. Waiting for reconnection...',
    opponentReconnected: 'Opponent reconnected to the match!',
    resumedMatch: 'Resumed online match session!',
    onlineConnected: 'Online Connected',
    onlineDisconnected: 'Offline Mode Active',
    rematchRequested: 'Opponent requested a rematch',
    rematchAccepted: 'Both players agreed! Starting rematch...',
    requestRematch: 'Request Rematch',
    acceptRematch: 'Accept Rematch',
    leaveRoom: 'Leave Room',
    
    // Settings
    settings: 'Settings',
    language: 'Language (ভাষা)',
    soundEffects: 'Sound Effects',
    hapticFeedback: 'Haptic Vibration',
    reducedMotion: 'Reduced Motion',
    tilt3d: '3D Depth & Tilt Physics',
    soundDesc: 'Play audio cues on moves and wins',
    hapticDesc: 'Feel device vibrations on interactions',
    motionDesc: 'Control animation speed and particle effects',
    tiltDesc: 'Tactile 3D board perspective angles',
    tokenPalettesTitle: 'Game Token Color Palettes',
    tokenPalettesDesc: 'Select dynamic color combinations for Player 1, Player 2 & AI tokens',
    p1TokenLabel: 'Player 1',
    p2TokenLabel: 'Player 2',
    aiTokenLabel: 'AI Bot',
    activePaletteTag: 'Active',
    dotsGridCustomizerTitle: 'Dots & Grid Lines Color',
    dotsGridCustomizerDesc: 'Personalize grid lines & dots appearance on Dots & Boxes board',
    dotsLineColor: 'Grid Line Color',
    dotsDotColor: 'Dot (Peg) Color',
    customColorOption: 'Custom Color',
    presetPalette: 'Color Presets',
    resetDefaultColor: 'Default Color',
    resetData: 'Reset All Local Data',
    resetConfirmTitle: 'Are you sure?',
    resetConfirmDesc: 'This will erase all saved names, custom scores, and preferences.',
    cancel: 'Cancel',
    confirm: 'Yes, Reset',
    dataResetDone: 'All settings have been successfully reset.',
    
    // About
    about: 'About & Rules',
    aboutTitle: 'About TinT',
    aboutContent: 'TinT is a modern, Bengali-first 3D Progressive Web App board game featuring instant offline play, strategic AI bots, customizable grids, and real-time multiplayer room synchronization.',
    rulesSummary: 'Match 3 consecutive marks on 3×3, 4 marks on 4×4 to 6×6, or 5 marks on 8×8+ boards (Gomoku scale) horizontally, vertically, or diagonally to win.',
    offlineStatus: 'You are currently offline (Local and AI modes fully functional)',
    installApp: 'Install App',
    installPrompt: 'Install to home screen for fast offline play',
    
    // Credits
    credit: 'Made with ♥ by ©munabbiRMushran'
  }
};
