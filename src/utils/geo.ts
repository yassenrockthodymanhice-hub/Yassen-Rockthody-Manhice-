import { GeoCoordinate, HiddenItem, RivalOperative, RarityTier, RARITY_CONFIGS } from '../types/game';

// Earth radius in meters
const EARTH_RADIUS = 6371000;

/**
 * Calculates Haversine distance between two coordinates in meters
 */
export function calculateDistanceMeters(coord1: GeoCoordinate, coord2: GeoCoordinate): number {
  const lat1Rad = (coord1.lat * Math.PI) / 180;
  const lat2Rad = (coord2.lat * Math.PI) / 180;
  const deltaLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const deltaLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS * c * 10) / 10;
}

/**
 * Calculates bearing (angle 0-360) from coord1 to coord2
 */
export function calculateBearing(coord1: GeoCoordinate, coord2: GeoCoordinate): number {
  const lat1Rad = (coord1.lat * Math.PI) / 180;
  const lat2Rad = (coord2.lat * Math.PI) / 180;
  const deltaLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const y = Math.sin(deltaLng) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLng);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360;
  return Math.round(bearing);
}

/**
 * Converts delta in meters (x = East, z = South) to new GPS coordinate
 */
export function metersToGeoCoordinate(origin: GeoCoordinate, deltaX: number, deltaZ: number): GeoCoordinate {
  const deltaLat = -deltaZ / 111139;
  const deltaLng = deltaX / (111139 * Math.cos((origin.lat * Math.PI) / 180));
  return {
    lat: Number((origin.lat + deltaLat).toFixed(7)),
    lng: Number((origin.lng + deltaLng).toFixed(7)),
    accuracy: origin.accuracy || 4.5,
  };
}

/**
 * Converts target GPS coordinate to relative offset in meters from origin [x, z]
 */
export function geoToRelativeMeters(origin: GeoCoordinate, target: GeoCoordinate): { x: number; z: number } {
  const deltaLat = target.lat - origin.lat;
  const deltaLng = target.lng - origin.lng;
  const z = -(deltaLat * 111139);
  const x = deltaLng * (111139 * Math.cos((origin.lat * Math.PI) / 180));
  return { x, z };
}

export interface CityPreset {
  id: string;
  name: string;
  country: string;
  coords: GeoCoordinate;
  description: string;
}

export const FAMOUS_EXPLORATION_ZONES: CityPreset[] = [
  {
    id: 'lisboa',
    name: 'Lisboa (Terreiro do Paço)',
    country: 'Portugal',
    coords: { lat: 38.7077, lng: -9.1365, accuracy: 3.5 },
    description: 'Zona portuária histórica e baía do Tejo com relíquias dos navegadores.',
  },
  {
    id: 'porto',
    name: 'Porto (Ribeira & Ponte D. Luís)',
    country: 'Portugal',
    coords: { lat: 41.1408, lng: -8.6133, accuracy: 4.0 },
    description: 'Setor montanhoso e fluvial repleto de criptas e relíquias graníticas.',
  },
  {
    id: 'rio',
    name: 'Rio de Janeiro (Copacabana)',
    country: 'Brasil',
    coords: { lat: -22.9698, lng: -43.1804, accuracy: 5.0 },
    description: 'Faixa litorânea tropical com vestígios energéticos atlânticos.',
  },
  {
    id: 'sp',
    name: 'São Paulo (Avenida Paulista)',
    country: 'Brasil',
    coords: { lat: -23.5615, lng: -46.6559, accuracy: 4.2 },
    description: 'Megacidade pulsante com canais cibernéticos e nós de dados secretos.',
  },
  {
    id: 'tokyo',
    name: 'Tóquio (Cruzamento de Shibuya)',
    country: 'Japão',
    coords: { lat: 35.6595, lng: 139.7005, accuracy: 3.8 },
    description: 'Cruzamento ultra-tecnológico com frequências quânticas ocultas.',
  },
  {
    id: 'nyc',
    name: 'Nova Iorque (Central Park South)',
    country: 'EUA',
    coords: { lat: 40.7661, lng: -73.9772, accuracy: 4.5 },
    description: 'Oásis metropolitano com antigos marcos e tecnologia esquecida.',
  },
];

/**
 * Procedural generation of items in the vicinity of player coordinates
 */
const ITEM_NAMES_BY_RARITY: Record<RarityTier, Array<{ name: string; lore: string; model: HiddenItem['modelType'] }>> = {
  common: [
    { name: 'Sensor de Frequência Urbano', lore: 'Dispositivo antigo usado por batedores para mapear ondas locais.', model: 'cube' },
    { name: 'Cápsula de Bateria Iônica', lore: 'Pequena fonte de energia descarregada encontrada em canais de serviço.', model: 'crystal' },
    { name: 'Bússola de Densidade Geológica', lore: 'Mede anomalias magnéticas superficiais do asfalto.', model: 'orb' },
    { name: 'Prisma de Reflexão Tática', lore: 'Dispersa pulsos de radar inimigos em pequena escala.', model: 'prism' },
  ],
  rare: [
    { name: 'Matriz Criptográfica de Setor', lore: 'Contém chaves de encriptação de patrulhas territoriais passadas.', model: 'cube' },
    { name: 'Cristal Ressonador Esmeralda', lore: 'Sintoniza frequências geográficas naturais de parques e colinas.', model: 'crystal' },
    { name: 'Emissor de Pulso Cinético', lore: 'Aumenta o impacto de ataques em duelos com caçadores rivais.', model: 'prism' },
    { name: 'Micro-Drone Sentinela Inerte', lore: 'Pode ser reativado para expandir o raio de rastreio em 40 metros.', model: 'sigil' },
  ],
  epic: [
    { name: 'Núcleo de Vórtice Ametista', lore: 'Concentra campos eletromagnéticos gerando escudos defensivos reforçados.', model: 'crystal' },
    { name: 'Cronômetro Gravitacional', lore: 'Distorce micro-variações temporais no setor geográfico.', model: 'orb' },
    { name: 'Placa de Blindagem de Titânio Puro', lore: 'Forjada em instalações subterrâneas de defesa de setor.', model: 'sigil' },
    { name: 'Selo de Reconhecimento Orbital', lore: 'Garante acesso prioritário aos satélites de posicionamento de precisão.', model: 'prism' },
  ],
  legendary: [
    { name: 'Coração Solar de Hélio-3', lore: 'Artefato lendário com energia luminosa capaz de alimentar cidades inteiras.', model: 'orb' },
    { name: 'Lâmina de Plasma Hiper-Frequência', lore: 'Armamento de alta patente outorgado aos mestres da vanguarda.', model: 'prism' },
    { name: 'Codex Geo-Primordial', lore: 'Mapa cartográfico dinâmico contendo rotas ocultas de todos os quadrantes.', model: 'cube' },
  ],
  mythic: [
    { name: 'Chave Astral da Fratura Cósmica', lore: 'Artefato cósmico mítico que ressoa com as próprias linhas Ley da Terra.', model: 'sigil' },
    { name: 'Centelha de Criação Ancestral', lore: 'O ápice da busca de qualquer caçador de mundos. Raridade sem precedentes.', model: 'crystal' },
  ],
};

const PUZZLE_TYPES: HiddenItem['puzzleType'][] = ['frequency_sync', 'quantum_lock', 'radar_calibration'];

export function generateLocalHiddenItems(playerCoord: GeoCoordinate, playerRarity: RarityTier): HiddenItem[] {
  const items: HiddenItem[] = [];
  const tiers: RarityTier[] = ['common', 'common', 'common', 'rare', 'rare', 'epic'];

  // Higher player rarity unlocks access to legendary and mythic
  if (playerRarity === 'rare' || playerRarity === 'epic' || playerRarity === 'legendary' || playerRarity === 'mythic') {
    tiers.push('rare');
    tiers.push('epic');
  }
  if (playerRarity === 'epic' || playerRarity === 'legendary' || playerRarity === 'mythic') {
    tiers.push('legendary');
  }
  if (playerRarity === 'legendary' || playerRarity === 'mythic') {
    tiers.push('legendary');
    tiers.push('mythic');
  }

  // Pre-determined radial positions around player (from 18m to 210m)
  const count = 9;
  for (let i = 0; i < count; i++) {
    const angle = (i * (360 / count) + (i % 2 === 0 ? 15 : -25)) * (Math.PI / 180);
    const distance = 25 + (i * 22) + ((i * 17) % 20); // between 25m and 220m
    const deltaX = Math.cos(angle) * distance;
    const deltaZ = Math.sin(angle) * distance;

    const rarity = tiers[i % tiers.length];
    const pool = ITEM_NAMES_BY_RARITY[rarity];
    const template = pool[i % pool.length];
    const puzzleType = PUZZLE_TYPES[i % PUZZLE_TYPES.length];

    const itemCoords = metersToGeoCoordinate(playerCoord, deltaX, deltaZ);

    const rarityCfg = RARITY_CONFIGS[rarity];
    const powerMult = rarityCfg.xpMultiplier;

    items.push({
      id: `item-${i}-${rarity}-${Date.now().toString().slice(-4)}`,
      name: template.name,
      description: `Relíquia de classe ${rarityCfg.label} detectada nas coordenadas locais.`,
      rarity,
      lore: template.lore,
      modelType: template.model,
      geoCoords: itemCoords,
      relativeMeters: { x: deltaX, z: deltaZ },
      powerStats: {
        attackBonus: Math.round(5 * powerMult),
        defenseBonus: Math.round(4 * powerMult),
        radarBonus: Math.round(10 * powerMult),
      },
      puzzleType,
      isCollected: false,
      revealed: false,
    });
  }

  return items;
}

const RIVAL_NAMES = [
  { name: 'Kaelen Vance', codename: 'Specter-7' },
  { name: 'Lyra Cruz', codename: 'Valkyrie-X' },
  { name: 'Dante Silva', codename: 'Cyber-Wolf' },
  { name: 'Aria Thorne', codename: 'Shadow-Pulse' },
  { name: 'Marcus Vega', codename: 'Iron-Reaper' },
];

export function generateLocalRivalOperatives(playerCoord: GeoCoordinate): RivalOperative[] {
  const rivals: RivalOperative[] = [];
  const offsets = [
    { x: -55, z: 65, tier: 'common' as RarityTier, level: 3 },
    { x: 95, z: -45, tier: 'rare' as RarityTier, level: 8 },
    { x: -120, z: -110, tier: 'epic' as RarityTier, level: 16 },
    { x: 160, z: 140, tier: 'legendary' as RarityTier, level: 24 },
  ];

  offsets.forEach((cfg, idx) => {
    const rivalCoord = metersToGeoCoordinate(playerCoord, cfg.x, cfg.z);
    const meta = RIVAL_NAMES[idx % RIVAL_NAMES.length];
    const cfgTier = RARITY_CONFIGS[cfg.tier];

    const bonus = cfgTier.xpMultiplier;

    const lootItem: HiddenItem = {
      id: `loot-rival-${idx}`,
      name: `Recompensa de Caçador: Núcleo de ${meta.codename}`,
      description: `Espólio obtido ao superar o agente rival em combate de setor.`,
      rarity: cfg.tier,
      lore: `Artefato militar sintonizado às frequências do caçador rival ${meta.name}.`,
      modelType: 'sigil',
      geoCoords: rivalCoord,
      relativeMeters: { x: cfg.x, z: cfg.z },
      powerStats: {
        attackBonus: Math.round(12 * bonus),
        defenseBonus: Math.round(10 * bonus),
        radarBonus: Math.round(25 * bonus),
      },
      puzzleType: 'frequency_sync',
      isCollected: false,
      revealed: true,
    };

    rivals.push({
      id: `rival-${idx}`,
      name: meta.name,
      codename: meta.codename,
      rarityTier: cfg.tier,
      level: cfg.level,
      maxHealth: Math.round(80 * bonus),
      currentHealth: Math.round(80 * bonus),
      attackPower: Math.round(14 * bonus),
      defense: Math.round(8 * bonus),
      geoCoords: rivalCoord,
      relativeMeters: { x: cfg.x, z: cfg.z },
      status: 'wandering',
      lootItem,
    });
  });

  return rivals;
}
