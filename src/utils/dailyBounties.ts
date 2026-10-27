import { DailyBounty, DailyBountiesState, RarityTier } from '../types/game';

const STORAGE_KEY = 'geohunter_daily_bounties_v2';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

interface BountyTemplate {
  title: string;
  description: (target: number) => string;
  type: DailyBounty['type'];
  baseTarget: number;
  xpReward: number;
  rarityTier: RarityTier;
  iconName: DailyBounty['iconName'];
}

const EXPLORATION_TEMPLATES: BountyTemplate[] = [
  {
    title: 'Patrulha Perimétrica Diária',
    description: (t) => `Explora ${t} metros nas coordenadas físicas ou simuladas do setor.`,
    type: 'exploration_distance',
    baseTarget: 150,
    xpReward: 300,
    rarityTier: 'common',
    iconName: 'Footprints',
  },
  {
    title: 'Mapeamento de Longo Alcance',
    description: (t) => `Realiza um levantamento cartográfico de ${t} metros no terreno.`,
    type: 'exploration_distance',
    baseTarget: 300,
    xpReward: 500,
    rarityTier: 'rare',
    iconName: 'Footprints',
  },
  {
    title: 'Sintonia Satélite Contínua',
    description: (t) => `Emite ${t} pulsos ativos de radar para varrer frequências de relíquias.`,
    type: 'radar_scans',
    baseTarget: 4,
    xpReward: 250,
    rarityTier: 'common',
    iconName: 'Radio',
  },
  {
    title: 'Resgate de Frequências Ocultas',
    description: (t) => `Localiza e desencripta ${t} relíquias geodésicas no setor ativo.`,
    type: 'relic_collect',
    baseTarget: 2,
    xpReward: 450,
    rarityTier: 'rare',
    iconName: 'Sparkles',
  },
];

const RIVAL_TEMPLATES: BountyTemplate[] = [
  {
    title: 'Eliminação de Batedor Rival',
    description: (t) => `Localiza e vence ${t} confronto contra um caçador rival no mapa.`,
    type: 'rival_defeat',
    baseTarget: 1,
    xpReward: 600,
    rarityTier: 'epic',
    iconName: 'Swords',
  },
  {
    title: 'Supremacia Territorial Diária',
    description: (t) => `Neutraliza ${t} agentes rivais para assegurar a supremacia do setor.`,
    type: 'rival_defeat',
    baseTarget: 2,
    xpReward: 850,
    rarityTier: 'legendary',
    iconName: 'Swords',
  },
  {
    title: 'Descarga Eletromagnética EMP',
    description: (t) => `Dispara ${t} pulso EMP durante combate tático para sobrecarregar rivais.`,
    type: 'emp_strike',
    baseTarget: 1,
    xpReward: 400,
    rarityTier: 'rare',
    iconName: 'Zap',
  },
];

export function getNextMidnightTimestamp(): number {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return tomorrow.getTime();
}

export function generateDailyBounties(seedTimestamp: number): DailyBounty[] {
  // Use day of year to deterministically generate today's bounties
  const dayNumber = Math.floor(seedTimestamp / TWENTY_FOUR_HOURS_MS);

  // Pick 2 exploration goals and 1 or 2 rival defeat missions
  const expIndex1 = dayNumber % EXPLORATION_TEMPLATES.length;
  const expIndex2 = (dayNumber + 2) % EXPLORATION_TEMPLATES.length;
  const rivalIndex1 = dayNumber % RIVAL_TEMPLATES.length;

  const t1 = EXPLORATION_TEMPLATES[expIndex1];
  const t2 = EXPLORATION_TEMPLATES[expIndex2 === expIndex1 ? (expIndex2 + 1) % EXPLORATION_TEMPLATES.length : expIndex2];
  const t3 = RIVAL_TEMPLATES[rivalIndex1];

  const bounties: DailyBounty[] = [
    {
      id: `bounty-${dayNumber}-1`,
      title: t1.title,
      description: t1.description(t1.baseTarget),
      type: t1.type,
      progress: 0,
      maxProgress: t1.baseTarget,
      isCompleted: false,
      isClaimed: false,
      xpReward: t1.xpReward,
      rarityTier: t1.rarityTier,
      iconName: t1.iconName,
    },
    {
      id: `bounty-${dayNumber}-2`,
      title: t2.title,
      description: t2.description(t2.baseTarget),
      type: t2.type,
      progress: 0,
      maxProgress: t2.baseTarget,
      isCompleted: false,
      isClaimed: false,
      xpReward: t2.xpReward,
      rarityTier: t2.rarityTier,
      iconName: t2.iconName,
    },
    {
      id: `bounty-${dayNumber}-3`,
      title: t3.title,
      description: t3.description(t3.baseTarget),
      type: t3.type,
      progress: 0,
      maxProgress: t3.baseTarget,
      isCompleted: false,
      isClaimed: false,
      xpReward: t3.xpReward,
      rarityTier: t3.rarityTier,
      iconName: t3.iconName,
    },
  ];

  return bounties;
}

export function loadDailyBountiesState(): DailyBountiesState {
  const now = Date.now();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: DailyBountiesState = JSON.parse(raw);
      // Check if 24-hour cycle has expired
      if (now < parsed.nextResetTimestamp && parsed.bounties && parsed.bounties.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore storage read error
  }

  // Generate new 24-hour cycle state
  const nextReset = getNextMidnightTimestamp();
  const newState: DailyBountiesState = {
    lastResetTimestamp: now,
    nextResetTimestamp: nextReset,
    bounties: generateDailyBounties(now),
    allClaimedBonusAwarded: false,
  };

  saveDailyBountiesState(newState);
  return newState;
}

export function saveDailyBountiesState(state: DailyBountiesState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // ignore
  }
}

export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
