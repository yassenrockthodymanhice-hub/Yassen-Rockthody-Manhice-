export type RarityTier = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface RarityConfig {
  tier: RarityTier;
  label: string;
  namePt: string;
  minLevel: number;
  maxLevel: number;
  color: string;
  glowColor: string;
  bgBadge: string;
  borderBadge: string;
  textBadge: string;
  hexNumber: number;
  xpMultiplier: number;
  sonarRadiusMeters: number;
}

export const RARITY_CONFIGS: Record<RarityTier, RarityConfig> = {
  common: {
    tier: 'common',
    label: 'COMUM',
    namePt: 'Recruta Urbano',
    minLevel: 1,
    maxLevel: 5,
    color: '#38bdf8', // light blue / cyan
    glowColor: 'rgba(56, 189, 248, 0.6)',
    bgBadge: 'bg-sky-500/20',
    borderBadge: 'border-sky-400',
    textBadge: 'text-sky-300',
    hexNumber: 0x38bdf8,
    xpMultiplier: 1.0,
    sonarRadiusMeters: 80,
  },
  rare: {
    tier: 'rare',
    label: 'RARO',
    namePt: 'Rastreador de Setor',
    minLevel: 6,
    maxLevel: 12,
    color: '#10b981', // emerald
    glowColor: 'rgba(16, 185, 129, 0.7)',
    bgBadge: 'bg-emerald-500/20',
    borderBadge: 'border-emerald-400',
    textBadge: 'text-emerald-300',
    hexNumber: 0x10b981,
    xpMultiplier: 1.5,
    sonarRadiusMeters: 120,
  },
  epic: {
    tier: 'epic',
    label: 'ÉPICO',
    namePt: 'Guardião Tático',
    minLevel: 13,
    maxLevel: 20,
    color: '#a855f7', // purple
    glowColor: 'rgba(168, 85, 247, 0.75)',
    bgBadge: 'bg-purple-500/20',
    borderBadge: 'border-purple-400',
    textBadge: 'text-purple-300',
    hexNumber: 0xa855f7,
    xpMultiplier: 2.2,
    sonarRadiusMeters: 180,
  },
  legendary: {
    tier: 'legendary',
    label: 'LENDÁRIO',
    namePt: 'Mestre Caçador',
    minLevel: 21,
    maxLevel: 30,
    color: '#f59e0b', // amber gold
    glowColor: 'rgba(245, 158, 11, 0.85)',
    bgBadge: 'bg-amber-500/20',
    borderBadge: 'border-amber-400',
    textBadge: 'text-amber-300',
    hexNumber: 0xf59e0b,
    xpMultiplier: 3.5,
    sonarRadiusMeters: 250,
  },
  mythic: {
    tier: 'mythic',
    label: 'MÍTICO',
    namePt: 'Soberano Astral',
    minLevel: 31,
    maxLevel: 99,
    color: '#ef4444', // crimson
    glowColor: 'rgba(239, 68, 68, 0.9)',
    bgBadge: 'bg-rose-500/20',
    borderBadge: 'border-rose-500',
    textBadge: 'text-rose-300',
    hexNumber: 0xef4444,
    xpMultiplier: 5.0,
    sonarRadiusMeters: 350,
  },
};

export interface GeoCoordinate {
  lat: number;
  lng: number;
  altitude?: number;
  accuracy?: number;
}

export interface HiddenItem {
  id: string;
  name: string;
  description: string;
  rarity: RarityTier;
  lore: string;
  modelType: 'crystal' | 'cube' | 'orb' | 'prism' | 'sigil';
  geoCoords: GeoCoordinate;
  relativeMeters: { x: number; z: number };
  powerStats: {
    attackBonus: number;
    defenseBonus: number;
    radarBonus: number;
  };
  puzzleType: 'frequency_sync' | 'quantum_lock' | 'radar_calibration';
  isCollected: boolean;
  collectedAt?: string;
  revealed: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: 'exploration' | 'collection' | 'duel' | 'geo_mastery';
  progress: number;
  maxProgress: number;
  isCompleted: boolean;
  xpReward: number;
  rarityReward: RarityTier;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'distance' | 'rarity' | 'duel' | 'geo_poi';
  unlocked: boolean;
  unlockedAt?: string;
  targetMeters?: number;
  targetCount?: number;
  iconName: string;
}

export interface RivalOperative {
  id: string;
  name: string;
  codename: string;
  rarityTier: RarityTier;
  level: number;
  maxHealth: number;
  currentHealth: number;
  attackPower: number;
  defense: number;
  geoCoords: GeoCoordinate;
  relativeMeters: { x: number; z: number };
  status: 'wandering' | 'hostile' | 'defeated';
  lootItem: HiddenItem;
}

export interface PlayerProfile {
  name: string;
  level: number;
  currentXp: number;
  nextLevelXp: number;
  rarityTier: RarityTier;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  inventory: HiddenItem[];
  duelsWon: number;
  duelsLost: number;
  totalMetersExplored: number;
  visitedSectorsCount: number;
  currentCoords: GeoCoordinate;
  heading: number;
  isRealGps: boolean;
}

export interface DailyBounty {
  id: string;
  title: string;
  description: string;
  type: 'exploration_distance' | 'radar_scans' | 'rival_defeat' | 'relic_collect' | 'emp_strike';
  progress: number;
  maxProgress: number;
  isCompleted: boolean;
  isClaimed: boolean;
  xpReward: number;
  rarityTier: RarityTier;
  iconName: 'Footprints' | 'Radio' | 'Swords' | 'Sparkles' | 'Zap';
}

export interface DailyBountiesState {
  lastResetTimestamp: number;
  nextResetTimestamp: number;
  bounties: DailyBounty[];
  allClaimedBonusAwarded: boolean;
}
