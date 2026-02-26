// js/data.js — Theme and world definitions for Charlie-Bug

const WORLD_W = 1440;
const WORLD_H = 1440;

// ── Themes ────────────────────────────────────────────────────────────────────

const THEMES = [
  {
    id: 'royal',
    name: 'Royal Day',
    emoji: '👑',
    bgTint: '#EDE7F6',
    palette: ['#9B59B6', '#F1C40F'],
    items: [
      { category: 'hat',      name: 'Royal Crown',      type: 'crown',         color1: '#F1C40F', color2: '#9B59B6' },
      { category: 'wings',    name: 'Cape Wings',        type: 'cape',          color1: '#9B59B6', color2: '#F1C40F' },
      { category: 'antennae', name: 'Diamond Tips',      type: 'diamond',       color1: '#F1C40F', color2: '#9B59B6' },
      { category: 'body',     name: 'Royal Dots',        type: 'royaldots',     color1: '#9B59B6', color2: '#F1C40F' },
    ]
  },
  {
    id: 'garden',
    name: 'Garden Party',
    emoji: '🌸',
    bgTint: '#FCE4EC',
    palette: ['#E91E8C', '#4CAF50'],
    items: [
      { category: 'hat',      name: 'Flower Crown',      type: 'flowercrown',   color1: '#E91E8C', color2: '#4CAF50' },
      { category: 'wings',    name: 'Butterfly Wings',   type: 'butterfly',     color1: '#E91E8C', color2: '#FF9800' },
      { category: 'antennae', name: 'Heart Tips',        type: 'heart',         color1: '#E91E8C', color2: '#FF9800' },
      { category: 'body',     name: 'Floral Pattern',    type: 'floral',        color1: '#E91E8C', color2: '#4CAF50' },
    ]
  },
  {
    id: 'beach',
    name: 'Beach Day',
    emoji: '🏖️',
    bgTint: '#E1F5FE',
    palette: ['#29B6F6', '#FFEB3B'],
    items: [
      { category: 'hat',      name: 'Sun Hat',           type: 'sunhat',        color1: '#FFEB3B', color2: '#FF9800' },
      { category: 'wings',    name: 'Seagull Wings',     type: 'seagull',       color1: '#FFFFFF', color2: '#90CAF9' },
      { category: 'antennae', name: 'Starfish Tips',     type: 'starfish',      color1: '#FF7043', color2: '#FFEB3B' },
      { category: 'body',     name: 'Wave Pattern',      type: 'waves',         color1: '#29B6F6', color2: '#FFFFFF' },
    ]
  },
  {
    id: 'forest',
    name: 'Forest Day',
    emoji: '🍄',
    bgTint: '#E8F5E9',
    palette: ['#795548', '#388E3C'],
    items: [
      { category: 'hat',      name: 'Mushroom Cap',      type: 'mushroom',      color1: '#E53935', color2: '#FFFFFF' },
      { category: 'wings',    name: 'Leaf Wings',        type: 'leaf',          color1: '#388E3C', color2: '#66BB6A' },
      { category: 'antennae', name: 'Acorn Tips',        type: 'acorn',         color1: '#795548', color2: '#FFCC80' },
      { category: 'body',     name: 'Mossy Spots',       type: 'mossyspots',    color1: '#388E3C', color2: '#795548' },
    ]
  },
  {
    id: 'space',
    name: 'Space Day',
    emoji: '🚀',
    bgTint: '#E8EAF6',
    palette: ['#3F51B5', '#CFD8DC'],
    items: [
      { category: 'hat',      name: 'Astronaut Helmet',  type: 'astronaut',     color1: '#FFFFFF', color2: '#90CAF9' },
      { category: 'wings',    name: 'Rocket Wings',      type: 'rocket',        color1: '#EF5350', color2: '#CFD8DC' },
      { category: 'antennae', name: 'Star Tips',         type: 'star',          color1: '#FFEB3B', color2: '#FFF9C4' },
      { category: 'body',     name: 'Galaxy Swirl',      type: 'galaxy',        color1: '#3F51B5', color2: '#7C4DFF' },
    ]
  },
  {
    id: 'rainbow',
    name: 'Rainbow Day',
    emoji: '🌈',
    bgTint: '#FFFDE7',
    palette: ['#FF5252', '#2196F3'],
    items: [
      { category: 'hat',      name: 'Rainbow Hat',       type: 'rainbowhat',    color1: '#FF5252', color2: '#2196F3' },
      { category: 'wings',    name: 'Rainbow Wings',     type: 'rainbowwings',  color1: '#FF5252', color2: '#9C27B0' },
      { category: 'antennae', name: 'Rainbow Tips',      type: 'rainbowtips',   color1: '#FF5252', color2: '#9C27B0' },
      { category: 'body',     name: 'Rainbow Stripes',   type: 'rainbowstripes',color1: '#FF5252', color2: '#2196F3' },
    ]
  },
];

const RAINBOW_COLORS = ['#FF5252','#FF9800','#FFEB3B','#4CAF50','#2196F3','#9C27B0'];

// ── Item scatter zones (one per quadrant) ─────────────────────────────────────

const SCATTER_ZONES = [
  { minX: 130, maxX: 550, minY: 130, maxY: 550 }, // top-left
  { minX: 890, maxX: 1310, minY: 130, maxY: 550 }, // top-right
  { minX: 130, maxX: 550, minY: 890, maxY: 1310 }, // bottom-left
  { minX: 890, maxX: 1310, minY: 890, maxY: 1310 }, // bottom-right
];

// ── World decorations ─────────────────────────────────────────────────────────

const DECORATIONS = [
  // ── Flowers ──────────────────────────────────────────────────────────────────
  { type: 'flower', x:  135, y:  135, color: '#FF6B9D', size: 1.0 },
  { type: 'flower', x:  315, y:   97, color: '#FFD700', size: 0.8 },
  { type: 'flower', x:  510, y:  195, color: '#FF6B9D', size: 1.1 },
  { type: 'flower', x:  195, y:  405, color: '#FF9800', size: 0.9 },
  { type: 'flower', x: 1050, y:  120, color: '#FF6B9D', size: 1.0 },
  { type: 'flower', x: 1245, y:  285, color: '#FFD700', size: 0.8 },
  { type: 'flower', x: 1335, y:  510, color: '#E040FB', size: 1.0 },
  { type: 'flower', x: 1140, y:  645, color: '#FF6B9D', size: 0.9 },
  { type: 'flower', x: 1365, y:  915, color: '#FFD700', size: 1.1 },
  { type: 'flower', x: 1230, y: 1185, color: '#FF9800', size: 0.8 },
  { type: 'flower', x: 1005, y: 1335, color: '#FF6B9D', size: 1.0 },
  { type: 'flower', x:  165, y: 1065, color: '#FFD700', size: 0.9 },
  { type: 'flower', x:  105, y: 1305, color: '#E040FB', size: 1.0 },
  { type: 'flower', x:  345, y: 1260, color: '#FF6B9D', size: 0.8 },
  { type: 'flower', x:  615, y: 1365, color: '#FFD700', size: 1.0 },
  { type: 'flower', x:  840, y:   90, color: '#FF9800', size: 0.9 },
  { type: 'flower', x:  720, y:  210, color: '#FF6B9D', size: 0.8 },
  { type: 'flower', x:   90, y:  720, color: '#FFD700', size: 1.0 },
  { type: 'flower', x: 1350, y:  720, color: '#E040FB', size: 0.9 },
  // Mid-field flowers filling the larger world
  { type: 'flower', x:  480, y:  720, color: '#FF6B9D', size: 0.9 },
  { type: 'flower', x:  720, y:  480, color: '#FFD700', size: 1.0 },
  { type: 'flower', x:  960, y:  720, color: '#FF9800', size: 0.8 },
  { type: 'flower', x:  720, y:  960, color: '#E040FB', size: 1.0 },
  { type: 'flower', x:  360, y:  580, color: '#FF6B9D', size: 0.9 },
  { type: 'flower', x: 1080, y:  840, color: '#FFD700', size: 0.8 },
  { type: 'flower', x:  640, y: 1180, color: '#FF9800', size: 1.0 },
  { type: 'flower', x:  880, y: 1380, color: '#FF6B9D', size: 0.9 },
  { type: 'flower', x:  200, y:  900, color: '#FFD700', size: 0.8 },
  { type: 'flower', x: 1200, y: 1060, color: '#E040FB', size: 0.9 },

  // ── Trees ───────────────────────────────────────────────────────────────────
  { type: 'tree', x:  200, y:  200 },
  { type: 'tree', x: 1240, y:  200 },
  { type: 'tree', x:  200, y: 1240 },
  { type: 'tree', x: 1240, y: 1240 },
  { type: 'tree', x:  720, y:  150 },
  { type: 'tree', x:  150, y:  720 },
  { type: 'tree', x: 1290, y:  720 },
  { type: 'tree', x:  720, y: 1290 },
  { type: 'tree', x:  460, y:  460 },
  { type: 'tree', x:  980, y:  460 },
  { type: 'tree', x:  460, y:  980 },
  { type: 'tree', x:  980, y:  980 },

  // ── Ponds ───────────────────────────────────────────────────────────────────
  { type: 'pond', x:  380, y:  820, size: 1.0 },
  { type: 'pond', x: 1060, y:  420, size: 0.85 },
  { type: 'pond', x:  580, y: 1180, size: 0.9 },
  { type: 'pond', x: 1140, y: 1100, size: 1.0 },

  // ── Clovers ─────────────────────────────────────────────────────────────────
  { type: 'clover', x:  300, y:  160 },
  { type: 'clover', x:  480, y:  260 },
  { type: 'clover', x:  620, y:  340 },
  { type: 'clover', x:  860, y:  200 },
  { type: 'clover', x: 1000, y:  300 },
  { type: 'clover', x: 1180, y:  460 },
  { type: 'clover', x:  260, y:  540 },
  { type: 'clover', x:  420, y:  640 },
  { type: 'clover', x:  680, y:  720 },
  { type: 'clover', x:  960, y:  680 },
  { type: 'clover', x: 1120, y:  820 },
  { type: 'clover', x:  340, y:  900 },
  { type: 'clover', x:  580, y: 1040 },
  { type: 'clover', x:  800, y: 1120 },
  { type: 'clover', x: 1020, y: 1000 },
  { type: 'clover', x:  240, y: 1100 },
  { type: 'clover', x:  760, y:  560 },
  { type: 'clover', x:  560, y:  820 },

  // ── Mushrooms ───────────────────────────────────────────────────────────────
  { type: 'mushroom', x:  255, y:  255, color: '#E53935' },
  { type: 'mushroom', x: 1185, y:  405, color: '#FF9800' },
  { type: 'mushroom', x:  225, y:  900, color: '#9C27B0' },
  { type: 'mushroom', x: 1290, y: 1095, color: '#E53935' },
  { type: 'mushroom', x:  765, y: 1305, color: '#FF9800' },
  { type: 'mushroom', x:  645, y:  105, color: '#9C27B0' },
  { type: 'mushroom', x:  820, y:  820, color: '#E53935' },
  { type: 'mushroom', x:  340, y: 1200, color: '#FF9800' },
  { type: 'mushroom', x: 1100, y:  700, color: '#9C27B0' },

  // ── Rocks ───────────────────────────────────────────────────────────────────
  { type: 'rock', x:  465, y:  315, color: '#9E9E9E' },
  { type: 'rock', x:  990, y:  495, color: '#78909C' },
  { type: 'rock', x:  315, y: 1035, color: '#9E9E9E' },
  { type: 'rock', x: 1140, y:  915, color: '#78909C' },
  { type: 'rock', x:  600, y: 1185, color: '#9E9E9E' },
  { type: 'rock', x:  825, y:  300, color: '#78909C' },
  { type: 'rock', x: 1250, y:  640, color: '#9E9E9E' },
  { type: 'rock', x:  200, y:  680, color: '#78909C' },
  { type: 'rock', x:  700, y: 1360, color: '#9E9E9E' },

  // ── Tall grass tufts ────────────────────────────────────────────────────────
  { type: 'grass', x:  675, y:  165, color: '#5a9e56' },
  { type: 'grass', x:  165, y:  675, color: '#5a9e56' },
  { type: 'grass', x: 1305, y:  735, color: '#5a9e56' },
  { type: 'grass', x:  735, y: 1305, color: '#5a9e56' },
  { type: 'grass', x:  420, y:  735, color: '#5a9e56' },
  { type: 'grass', x: 1020, y:  765, color: '#5a9e56' },
  { type: 'grass', x:  540, y:  380, color: '#5a9e56' },
  { type: 'grass', x:  900, y: 1200, color: '#5a9e56' },
  { type: 'grass', x: 1180, y:  980, color: '#5a9e56' },
  { type: 'grass', x:  280, y: 1000, color: '#5a9e56' },
];

// ── Winding path control points ───────────────────────────────────────────────
// Defines a path through the garden that Charlie can walk along (decoration only)
const PATH_SEGMENTS = [
  { x:  720, y:   30 },
  { x:  280, y:  320 },
  { x:  520, y:  600 },
  { x:  920, y:  560 },
  { x: 1200, y:  320 },
  { x: 1300, y:  760 },
  { x:  900, y: 1100 },
  { x:  720, y: 1410 },
];
