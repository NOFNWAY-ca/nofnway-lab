// js/data.js — Theme and world definitions for Charlie-Bug

const WORLD_W = 960;
const WORLD_H = 960;

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
  { minX: 100, maxX: 380, minY: 100, maxY: 380 }, // top-left
  { minX: 580, maxX: 860, minY: 100, maxY: 380 }, // top-right
  { minX: 100, maxX: 380, minY: 580, maxY: 860 }, // bottom-left
  { minX: 580, maxX: 860, minY: 580, maxY: 860 }, // bottom-right
];

// ── World decorations ─────────────────────────────────────────────────────────

const DECORATIONS = [
  // Flowers (spread around the garden, avoiding center and path)
  { type: 'flower', x:  90, y:  90, color: '#FF6B9D', size: 1.0 },
  { type: 'flower', x: 210, y:  65, color: '#FFD700', size: 0.8 },
  { type: 'flower', x: 340, y: 130, color: '#FF6B9D', size: 1.1 },
  { type: 'flower', x: 130, y: 270, color: '#FF9800', size: 0.9 },
  { type: 'flower', x: 700, y:  80, color: '#FF6B9D', size: 1.0 },
  { type: 'flower', x: 830, y: 190, color: '#FFD700', size: 0.8 },
  { type: 'flower', x: 890, y: 340, color: '#E040FB', size: 1.0 },
  { type: 'flower', x: 760, y: 430, color: '#FF6B9D', size: 0.9 },
  { type: 'flower', x: 910, y: 610, color: '#FFD700', size: 1.1 },
  { type: 'flower', x: 820, y: 790, color: '#FF9800', size: 0.8 },
  { type: 'flower', x: 670, y: 890, color: '#FF6B9D', size: 1.0 },
  { type: 'flower', x: 110, y: 710, color: '#FFD700', size: 0.9 },
  { type: 'flower', x:  70, y: 870, color: '#E040FB', size: 1.0 },
  { type: 'flower', x: 230, y: 840, color: '#FF6B9D', size: 0.8 },
  { type: 'flower', x: 410, y: 910, color: '#FFD700', size: 1.0 },
  { type: 'flower', x: 560, y:  60, color: '#FF9800', size: 0.9 },
  { type: 'flower', x: 480, y: 140, color: '#FF6B9D', size: 0.8 },
  { type: 'flower', x:  60, y: 480, color: '#FFD700', size: 1.0 },
  { type: 'flower', x: 900, y: 480, color: '#E040FB', size: 0.9 },
  // Mushrooms
  { type: 'mushroom', x: 170, y: 170, color: '#E53935' },
  { type: 'mushroom', x: 790, y: 270, color: '#FF9800' },
  { type: 'mushroom', x: 150, y: 600, color: '#9C27B0' },
  { type: 'mushroom', x: 860, y: 730, color: '#E53935' },
  { type: 'mushroom', x: 510, y: 870, color: '#FF9800' },
  { type: 'mushroom', x: 430, y:  70, color: '#9C27B0' },
  // Rocks
  { type: 'rock', x: 310, y: 210, color: '#9E9E9E' },
  { type: 'rock', x: 660, y: 330, color: '#78909C' },
  { type: 'rock', x: 210, y: 690, color: '#9E9E9E' },
  { type: 'rock', x: 760, y: 610, color: '#78909C' },
  { type: 'rock', x: 400, y: 790, color: '#9E9E9E' },
  { type: 'rock', x: 550, y: 200, color: '#78909C' },
  // Tall grass tufts
  { type: 'grass', x: 450, y: 110, color: '#5a9e56' },
  { type: 'grass', x: 110, y: 450, color: '#5a9e56' },
  { type: 'grass', x: 870, y: 490, color: '#5a9e56' },
  { type: 'grass', x: 490, y: 870, color: '#5a9e56' },
  { type: 'grass', x: 280, y: 490, color: '#5a9e56' },
  { type: 'grass', x: 680, y: 510, color: '#5a9e56' },
];

// ── Winding path control points (bezier) ─────────────────────────────────────
// Defines a path through the garden that Charlie can walk along (decoration only)
const PATH_SEGMENTS = [
  { x: 480, y:  20 },
  { x: 200, y: 200 },
  { x: 400, y: 480 },
  { x: 760, y: 480 },
  { x: 800, y: 760 },
  { x: 480, y: 940 },
];
