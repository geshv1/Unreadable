// Design tokens — "Reactive vs Steady" series style bible.
export const W = 1080, H = 1920, FPS = 30;
export const C = {
  bg: '#0A0A0C',
  red: '#E5383B',
  redGlow: 'rgba(229,56,59,0.65)',
  white: '#F2F2F2',
  gray: '#6B6B72',
  dark: '#1C1C21',
  ink: '#0a0a0c',
};
// Bold, high-legibility type for every caption.
export const FONT = {
  head: "'HeadBlack', 'Inter Display', Arial, sans-serif", // headlines (900)
  bold: "'HeadBold', 'Inter Display', Arial, sans-serif",  // eyebrows, header bar, tags (700)
};
// TikTok safe zones (no key content below 80% height or right of 88% width).
export const SAFE = { bottom: H * 0.8, right: W * 0.88, header: H * 0.08 };
export const FLOOR = 1420;
// Palettes for the shared rig
export const PAL = {
  reactive: { skin: '#a3a3ab', top: '#3e3e46', bot: '#2c2c33', shoe: '#d9d9de', outfit: 'hoodie', hair: 'cap', hairCol: '#a3182f' },
  steady: { skin: '#f7f7f9', top: '#dfe0e6', bot: '#3a3b42', shoe: '#ffffff', outfit: 'tee', hair: 'short', hairCol: '#24242a' },
  boss: { skin: '#8a8a93', top: '#1b1b20', bot: '#1b1b20', shoe: '#0f0f12', outfit: 'suit', hair: 'short', hairCol: '#060607' },
  sales: { skin: '#8a8a93', top: '#2a2d36', bot: '#1b1b20', shoe: '#0f0f12', outfit: 'suit', hair: 'short', hairCol: '#060607' },
  f1: { skin: '#84848d', top: '#4b3f45', bot: '#26262c', shoe: '#bdbdc4', outfit: 'tee', hair: 'short', hairCol: '#1d1d22' },
  f2: { skin: '#8d8d95', top: '#334048', bot: '#2a2a30', shoe: '#c4c4cb', outfit: 'hoodie', hair: 'short', hairCol: '#5b2a33' },
  f3: { skin: '#73737c', top: '#55505a', bot: '#222227', shoe: '#b5b5bc', outfit: 'tee', hair: 'short', hairCol: '#141418' },
  manip: { skin: '#5a5a62', top: '#0f0f12', bot: '#0f0f12', shoe: '#0b0b0d', outfit: 'suit', hair: 'short', hairCol: '#050506' },
} as const;
