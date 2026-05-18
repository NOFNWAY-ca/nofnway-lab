// js/data.js — Theme and world definitions for Charlie-Bug

const WORLD_W = 1440;
const WORLD_H = 1440;
const TOWER_X = 720;
const TOWER_Y = 720;

// ── Themes ────────────────────────────────────────────────────────────────────

const THEMES = [
  {
    id: 'princess',
    name: 'Royal Princess',
    emoji: '👑',
    bgTint: '#FCE4EC',
    palette: ['#F48FB1', '#FFD700'],
    items: [
      { category: 'hat',      name: 'Tiara',           type: 'tiara',        color1: '#FFD700', color2: '#F48FB1' },
      { category: 'wings',    name: 'Fairy Wings',     type: 'fairywings',   color1: '#F8BBD9', color2: '#CE93D8' },
      { category: 'antennae', name: 'Wand Tips',       type: 'wand',         color1: '#FFD700', color2: '#F48FB1' },
      { category: 'body',     name: 'Royal Dots',      type: 'royaldots',    color1: '#F48FB1', color2: '#FFD700' },
      { category: 'dress',    name: 'Ball Gown',       type: 'ballgown',     color1: '#F48FB1', color2: '#FFD700' },
    ]
  },
  {
    id: 'firefighter',
    name: 'Firefighter',
    emoji: '🚒',
    bgTint: '#FBE9E7',
    palette: ['#F4511E', '#FFEB3B'],
    items: [
      { category: 'hat',      name: 'Fire Helmet',     type: 'firehelmet',   color1: '#F4511E', color2: '#FFEB3B' },
      { category: 'wings',    name: 'Smoke Wings',     type: 'smokewings',   color1: '#B0BEC5', color2: '#FFFFFF' },
      { category: 'antennae', name: 'Flame Tips',      type: 'flame',        color1: '#FF6F00', color2: '#FFEB3B' },
      { category: 'body',     name: 'Fire Spots',      type: 'firespots',    color1: '#F4511E', color2: '#FFEB3B' },
      { category: 'dress',    name: 'Turnout Coat',    type: 'turnoutcoat',  color1: '#F4511E', color2: '#FFEB3B' },
    ]
  },
  {
    id: 'wizard',
    name: 'Wizard',
    emoji: '🧙',
    bgTint: '#EDE7F6',
    palette: ['#7E57C2', '#FFD700'],
    items: [
      { category: 'hat',      name: 'Wizard Hat',      type: 'wizardhat',    color1: '#7E57C2', color2: '#FFD700' },
      { category: 'wings',    name: 'Spell Wings',     type: 'spellwings',   color1: '#CE93D8', color2: '#7E57C2' },
      { category: 'antennae', name: 'Star Tips',       type: 'star',         color1: '#FFD700', color2: '#FFF9C4' },
      { category: 'body',     name: 'Moon Spots',      type: 'moonspots',    color1: '#7E57C2', color2: '#FFD700' },
      { category: 'dress',    name: 'Starry Robe',     type: 'starryrobe',   color1: '#7E57C2', color2: '#FFD700' },
    ]
  },
  {
    id: 'astronaut',
    name: 'Astronaut',
    emoji: '🚀',
    bgTint: '#E8EAF6',
    palette: ['#3F51B5', '#CFD8DC'],
    items: [
      { category: 'hat',      name: 'Helmet',          type: 'astronaut',    color1: '#FFFFFF', color2: '#90CAF9' },
      { category: 'wings',    name: 'Rocket Wings',    type: 'rocket',       color1: '#EF5350', color2: '#CFD8DC' },
      { category: 'antennae', name: 'Satellite Tips',  type: 'satellite',    color1: '#CFD8DC', color2: '#3F51B5' },
      { category: 'body',     name: 'Galaxy Swirl',    type: 'galaxy',       color1: '#3F51B5', color2: '#7C4DFF' },
      { category: 'dress',    name: 'Flight Suit',     type: 'flightsuit',   color1: '#FFFFFF', color2: '#3F51B5' },
    ]
  },
  {
    id: 'chef',
    name: 'Chef',
    emoji: '👨‍🍳',
    bgTint: '#FFF8E1',
    palette: ['#FFFFFF', '#FF7043'],
    items: [
      { category: 'hat',      name: 'Chef Hat',        type: 'chefhat',      color1: '#FFFFFF', color2: '#FF7043' },
      { category: 'wings',    name: 'Oven Mitts',      type: 'ovenmitts',    color1: '#FF7043', color2: '#FFEB3B' },
      { category: 'antennae', name: 'Spoon Tips',      type: 'spoon',        color1: '#BDBDBD', color2: '#FFFFFF' },
      { category: 'body',     name: 'Apron Pattern',   type: 'apron',        color1: '#FFFFFF', color2: '#FF7043' },
      { category: 'dress',    name: 'Chef Apron',      type: 'chefapron',    color1: '#FFFFFF', color2: '#FF7043' },
    ]
  },
  {
    id: 'artist',
    name: 'Artist',
    emoji: '🎨',
    bgTint: '#FFFDE7',
    palette: ['#FF5252', '#2196F3'],
    items: [
      { category: 'hat',      name: 'Beret',           type: 'beret',        color1: '#E53935', color2: '#FFFFFF' },
      { category: 'wings',    name: 'Palette Wings',   type: 'palettewings', color1: '#FF5252', color2: '#2196F3' },
      { category: 'antennae', name: 'Paintbrush Tips', type: 'paintbrush',   color1: '#795548', color2: '#FF5252' },
      { category: 'body',     name: 'Paint Splats',    type: 'paintsplats',  color1: '#FF5252', color2: '#2196F3' },
      { category: 'dress',    name: 'Paint Smock',     type: 'paintsmock',   color1: '#FFFFFF', color2: '#FF5252' },
    ]
  },
  {
    id: 'nova',
    name: 'Princess Nova',
    emoji: '🌟',
    bgTint: '#1A0533',
    palette: ['#9B30FF', '#39FF14'],
    items: [
      { category: 'hat',      name: 'Copper Crown',   type: 'coppercrown',   color1: '#CC4400', color2: '#FFD700' },
      { category: 'wings',    name: 'Energy Wings',   type: 'energywings',   color1: '#39FF14', color2: '#9B30FF' },
      { category: 'antennae', name: 'Plasma Tips',    type: 'plasma',        color1: '#39FF14', color2: '#FFFFFF' },
      { category: 'body',     name: 'Star Armor',     type: 'stararmor',     color1: '#9B30FF', color2: '#FFD700' },
      { category: 'dress',    name: 'Cosmic Outfit',  type: 'cosmicoutfit',  color1: '#9B30FF', color2: '#FFD700' },
    ]
  },
  {
    id: 'aurora',
    name: 'Princess Aurora',
    emoji: '❄️',
    bgTint: '#E3F2FD',
    palette: ['#4FC3F7', '#FFFFFF'],
    items: [
      { category: 'hat',      name: 'Ice Crown',      type: 'icecrown',      color1: '#B3E5FC', color2: '#FFFFFF' },
      { category: 'wings',    name: 'Frost Wings',    type: 'frostwings',    color1: '#81D4FA', color2: '#E1F5FE' },
      { category: 'antennae', name: 'Snowflake Tips', type: 'snowflake',     color1: '#FFFFFF', color2: '#4FC3F7' },
      { category: 'body',     name: 'Ice Pattern',    type: 'icepattern',    color1: '#0277BD', color2: '#B3E5FC' },
      { category: 'dress',    name: 'Frost Gown',     type: 'frostgown',     color1: '#B3E5FC', color2: '#FFFFFF' },
    ]
  },
  {
    id: 'flora',
    name: 'Princess Flora',
    emoji: '🌸',
    bgTint: '#FCE4EC',
    palette: ['#F48FB1', '#FFD700'],
    items: [
      { category: 'hat',      name: 'Garden Crown',   type: 'gardencrown',   color1: '#F48FB1', color2: '#FFD700' },
      { category: 'wings',    name: 'Petal Wings',    type: 'petalwings',    color1: '#FCE4EC', color2: '#F48FB1' },
      { category: 'antennae', name: 'Star-Petal Tips',type: 'starpetal',     color1: '#F48FB1', color2: '#FFD700' },
      { category: 'body',     name: 'Rose Pattern',   type: 'rosepattern',   color1: '#F48FB1', color2: '#FFD700' },
      { category: 'dress',    name: 'Garden Gown',    type: 'gardengown',    color1: '#F8BBD9', color2: '#FFD700' },
    ]
  },
];

const RAINBOW_COLORS = ['#FF5252','#FF9800','#FFEB3B','#4CAF50','#2196F3','#9C27B0'];

const SEASONS = [
  {
    id: 'spring',
    name: 'Spring',
    emoji: '🌷',
    grass: ['#A8E889', '#7FD06F', '#65BA5D'],
    patches: ['#C5F09A', '#A8E77E', '#8DD46E'],
    path: ['#AF835A', '#E8C48D'],
    overlay: 'rgba(252,228,236,0.10)',
    vignette: 'rgba(65,120,50,0.14)',
    stemColor: '#4a8f46',
    leafColor: '#5BBE5A',
    flowerAlpha: 1,
    flowerTint: null,
    grassTuftColor: '#5a9e56',
    treeColors: ['#388E3C', '#2E7D32', '#66BB6A'],
    pondColor: 'rgba(100,190,230,0.82)',
  },
  {
    id: 'summer',
    name: 'Summer',
    emoji: '☀️',
    grass: ['#9BE283', '#78C96E', '#62B85D'],
    patches: ['#B8EC8A', '#A9E77E', '#9EDB73'],
    path: ['#AF835A', '#E8C48D'],
    overlay: 'rgba(255,245,157,0.08)',
    vignette: 'rgba(48,100,50,0.18)',
    stemColor: '#3d7a39',
    leafColor: '#48a846',
    flowerAlpha: 1,
    flowerTint: null,
    grassTuftColor: '#4a9448',
    treeColors: ['#2E7D32', '#1B5E20', '#43A047'],
    pondColor: 'rgba(80,180,220,0.88)',
  },
  {
    id: 'autumn',
    name: 'Autumn',
    emoji: '🍂',
    grass: ['#C7D36F', '#A9BE5F', '#7FA653'],
    patches: ['#D9C66A', '#C9AA52', '#B88A48'],
    path: ['#9A6A45', '#D8A46C'],
    overlay: 'rgba(255,152,0,0.12)',
    vignette: 'rgba(100,70,34,0.20)',
    stemColor: '#7a5c2a',
    leafColor: '#a06c2a',
    flowerAlpha: 0.82,
    flowerTint: '#CC7722',
    grassTuftColor: '#8a7040',
    treeColors: ['#C0392B', '#E67E22', '#F39C12'],
    pondColor: 'rgba(100,160,190,0.75)',
  },
  {
    id: 'winter',
    name: 'Winter',
    emoji: '❄️',
    grass: ['#D8F0E8', '#B9DED8', '#9BCBC6'],
    patches: ['#E8F7F4', '#D4EEEA', '#B9DDD9'],
    path: ['#8FA3A6', '#D7E5E7'],
    overlay: 'rgba(227,242,253,0.18)',
    vignette: 'rgba(70,105,120,0.16)',
    stemColor: '#6a8a68',
    leafColor: '#7a9e78',
    flowerAlpha: 0.6,
    flowerTint: '#AACCDD',
    grassTuftColor: '#8aaa88',
    treeColors: ['#78909C', '#607D8B', '#B0BEC5'],
    pondColor: 'rgba(180,220,240,0.75)',
  },
  {
    id: 'moon',
    name: 'Moonlight',
    emoji: '🌙',
    grass: ['#466D66', '#365D57', '#274D4A'],
    patches: ['#5B7D74', '#496F68', '#3C615C'],
    path: ['#5D5164', '#9A8FB0'],
    overlay: 'rgba(25,20,55,0.22)',
    vignette: 'rgba(8,10,32,0.36)',
    stemColor: '#3a5c4a',
    leafColor: '#4a7060',
    flowerAlpha: 0.7,
    flowerTint: '#334466',
    grassTuftColor: '#4a6858',
    treeColors: ['#1B3A2A', '#1A3028', '#2E5040'],
    pondColor: 'rgba(60,80,120,0.85)',
  },
];

// ── Item scatter zones (one per quadrant) ─────────────────────────────────────

const SCATTER_ZONES = [
  { minX: 130, maxX: 520,  minY: 130, maxY: 520  }, // top-left
  { minX: 920, maxX: 1310, minY: 130, maxY: 520  }, // top-right
  { minX: 130, maxX: 520,  minY: 920, maxY: 1310 }, // bottom-left
  { minX: 920, maxX: 1310, minY: 920, maxY: 1310 }, // bottom-right
  { minX: 560, maxX: 880,  minY: 560, maxY: 880  }, // center ring (not too close to tower at 720,720)
];

// ── World decorations ─────────────────────────────────────────────────────────

const DECORATIONS = [
  { type: 'castle', x: 720, y: 80 },

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
  { type: 'tower', x: 720, y: 720 },
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
