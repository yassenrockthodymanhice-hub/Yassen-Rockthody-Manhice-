import React, { useState } from 'react';
import { PlayerProfile, HiddenItem, RivalOperative, RARITY_CONFIGS, DailyBountiesState } from '../types/game';
import { sound } from '../utils/audio';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Compass,
  Radio,
  Swords,
  Package,
  Target,
  Award,
  Calendar,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  Eye,
  Camera,
  Navigation,
  Sparkles,
  Zap,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Save,
} from 'lucide-react';

interface HudOverlayProps {
  player: PlayerProfile;
  items: HiddenItem[];
  rivals: RivalOperative[];
  bountiesState: DailyBountiesState;
  lastSavedAt?: number;
  onManualSave?: () => void;
  onTriggerRadarScan: () => void;
  onOpenInventory: () => void;
  onOpenChallenges: () => void;
  onOpenAchievements: () => void;
  onOpenDailyBounties: () => void;
  onSelectItemToDecrypt: (item: HiddenItem) => void;
  onSelectRivalToConfront: (rival: RivalOperative) => void;
  cameraMode: 'follow' | 'tactical_overhead' | 'first_person';
  onToggleCameraMode: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onMovePlayer: (deltaX: number, deltaZ: number) => void;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  player,
  items,
  rivals,
  bountiesState,
  lastSavedAt,
  onManualSave,
  onTriggerRadarScan,
  onOpenInventory,
  onOpenChallenges,
  onOpenAchievements,
  onOpenDailyBounties,
  onSelectItemToDecrypt,
  onSelectRivalToConfront,
  cameraMode,
  onToggleCameraMode,
  isMuted,
  onToggleMute,
  onMovePlayer,
}) => {
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'radar' | 'items' | 'rivals'>('radar');

  const rarityCfg = RARITY_CONFIGS[player.rarityTier];
  const uncollectedItems = items.filter((it) => !it.isCollected);
  const activeRivals = rivals.filter((r) => r.status !== 'defeated');

  const hasClaimableBounty = bountiesState.bounties.some((b) => b.isCompleted && !b.isClaimed);
  const claimedCount = bountiesState.bounties.filter((b) => b.isClaimed).length;

  // Find nearest item
  const nearestItem = uncollectedItems.reduce<HiddenItem | null>((closest, it) => {
    const dist = Math.hypot(it.relativeMeters.x, it.relativeMeters.z);
    if (!closest) return it;
    const closestDist = Math.hypot(closest.relativeMeters.x, closest.relativeMeters.z);
    return dist < closestDist ? it : closest;
  }, null);

  const nearestDistance = nearestItem
    ? Math.round(Math.hypot(nearestItem.relativeMeters.x, nearestItem.relativeMeters.z))
    : null;

  // XP Progress Percentage
  const xpPct = Math.min(100, Math.round((player.currentXp / player.nextLevelXp) * 100));

  // Compass cardinal text
  const getCompassDir = (deg: number) => {
    const normalized = (deg % 360 + 360) % 360;
    if (normalized >= 337.5 || normalized < 22.5) return 'N';
    if (normalized >= 22.5 && normalized < 67.5) return 'NE';
    if (normalized >= 67.5 && normalized < 112.5) return 'E';
    if (normalized >= 112.5 && normalized < 157.5) return 'SE';
    if (normalized >= 157.5 && normalized < 202.5) return 'S';
    if (normalized >= 202.5 && normalized < 247.5) return 'SO';
    if (normalized >= 247.5 && normalized < 292.5) return 'O';
    return 'NO';
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-3 md:p-6 overflow-hidden select-none">
      {/* Top Perimeter Cluster */}
      <div className="w-full flex items-start justify-between gap-4">
        {/* Top-Left: Player Profile & Geo Status */}
        <div className="pointer-events-auto flex flex-col gap-2 max-w-sm">
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border"
                style={{
                  backgroundColor: `${rarityCfg.color}20`,
                  borderColor: `${rarityCfg.color}60`,
                  color: rarityCfg.color,
                }}
              >
                <Sparkles className="w-5 h-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border"
                    style={{
                      backgroundColor: `${rarityCfg.color}25`,
                      borderColor: `${rarityCfg.color}60`,
                      color: rarityCfg.color,
                    }}
                  >
                    {rarityCfg.label}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-300">
                    NÍVEL {player.level}
                  </span>
                </div>
                <h2 className="text-sm font-bold text-slate-100 truncate mt-0.5">
                  {rarityCfg.namePt}
                </h2>
              </div>
            </div>

            {/* XP Bar */}
            <div className="mt-2.5 space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>XP para próximo nível</span>
                <span className="tabular-nums font-semibold text-cyan-300">
                  {player.currentXp} / {player.nextLevelXp} ({xpPct}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${xpPct}%`,
                    backgroundColor: rarityCfg.color,
                  }}
                />
              </div>
            </div>

            {/* Real GPS Coordinate Badge */}
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-1.5 text-cyan-400 truncate">
                <Navigation className="w-3.5 h-3.5 shrink-0" />
                <span className="tabular-nums">
                  {player.currentCoords.lat.toFixed(5)}°, {player.currentCoords.lng.toFixed(5)}°
                </span>
              </div>
              <span className="text-slate-500 font-semibold shrink-0">
                {getCompassDir(player.heading)} ({Math.round(player.heading)}°)
              </span>
            </div>

            {/* Persistence & Auto-Save 30s Status */}
            <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Auto-salvo (30s)
              </span>
              {onManualSave && (
                <button
                  onClick={() => {
                    onManualSave();
                    sound.playClick();
                  }}
                  className="hover:text-cyan-300 text-slate-400 flex items-center gap-1 transition-colors px-1 py-0.5 rounded hover:bg-slate-800"
                  title="Salvar agora no localStorage"
                >
                  <Save className="w-3 h-3 text-cyan-400" />
                  <span>Salvar Agora</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Top-Right: Radar Status & Quick Controls */}
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          {/* Nearest item radar pill */}
          {nearestItem && nearestDistance !== null && (
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase">SINAL MAIS PRÓXIMO</div>
                <div className="text-xs font-bold font-mono text-cyan-300 flex items-center gap-1.5">
                  <span className="tabular-nums">{nearestDistance}m</span>
                  <span className="text-slate-500">·</span>
                  <span className="truncate max-w-[130px]">{nearestItem.name}</span>
                </div>
              </div>
              {nearestDistance <= 35 && (
                <button
                  onClick={() => onSelectItemToDecrypt(nearestItem)}
                  className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-mono font-bold tracking-wider uppercase transition-colors"
                >
                  DESENCRIPTAR
                </button>
              )}
            </div>
          )}

          {/* Quick Icon Tools */}
          <div className="flex items-center gap-2">
            <PWAInstallButton variant="compact" />

            <button
              onClick={() => {
                onToggleCameraMode();
                sound.playClick();
              }}
              className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1.5 text-xs font-mono"
              title="Alternar Modo de Câmara (Seguir / Tático Superior)"
            >
              <Camera className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">
                {cameraMode === 'follow' ? 'Câmara: Seguir' : 'Câmara: Superior'}
              </span>
            </button>

            <button
              onClick={() => {
                onToggleMute();
                sound.playClick();
              }}
              className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-cyan-300 transition-colors"
              title="Áudio Procedural"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              onClick={() => {
                sound.playSonarPing();
                onTriggerRadarScan();
              }}
              className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 transition-colors flex items-center gap-1.5 text-xs font-mono font-bold"
              title="Pulso de Radar (Espaço)"
            >
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>SCAN</span>
              <span className="text-[10px] text-cyan-400/70 hidden sm:inline">[ESPAÇO]</span>
            </button>
          </div>
        </div>
      </div>

      {/* Center 85% is completely unobstructed for 3D exploration! */}

      {/* Bottom Dock Control Unit (Pinned center, collapsible) */}
      <div className="pointer-events-auto w-full max-w-4xl mx-auto flex flex-col items-center">
        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={() => {
            setIsDockCollapsed(!isDockCollapsed);
            sound.playClick();
          }}
          className="mb-1.5 px-3 py-1 rounded-t-lg bg-slate-900/90 border-t border-x border-slate-800 text-[11px] font-mono text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5"
        >
          {isDockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{isDockCollapsed ? 'Mostrar Painel Tático (H)' : 'Recolher Interface (H)'}</span>
        </button>

        {!isDockCollapsed && (
          <div className="w-full rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl p-3 md:p-4 text-slate-100 flex flex-col gap-3">
            {/* Navigation Tabs and Menu Launchers */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setActiveTab('radar');
                    sound.playClick();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'radar'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Exploração</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('items');
                    sound.playClick();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'items'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Relíquias ({uncollectedItems.length})</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('rivals');
                    sound.playClick();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'rivals'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Swords className="w-3.5 h-3.5" />
                  <span>Rivais ({activeRivals.length})</span>
                </button>
              </div>

              {/* Modals trigger buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenInventory();
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-purple-300 transition-colors flex items-center gap-1.5 text-xs font-mono"
                >
                  <Package className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">Inventário ({player.inventory.length})</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenDailyBounties();
                  }}
                  className={`px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-mono relative ${
                    hasClaimableBounty
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.35)] animate-pulse'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-amber-300'
                  }`}
                  title="Caçadas Diárias (Ciclo 24h)"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Caçadas 24h</span>
                  <span className="text-[10px] bg-slate-900 px-1 rounded text-amber-300 font-bold">
                    {claimedCount}/3
                  </span>
                  {hasClaimableBounty && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 absolute -top-1 -right-1 ring-2 ring-slate-950" />
                  )}
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenChallenges();
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1.5 text-xs font-mono"
                >
                  <Target className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Desafios</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenAchievements();
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-amber-300 transition-colors flex items-center gap-1.5 text-xs font-mono"
                >
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Conquistas</span>
                </button>
              </div>
            </div>

            {/* Tab Body: Radar / Movement */}
            {activeTab === 'radar' && (
              <div className="flex items-center justify-between gap-4">
                {/* Tactical stats readout */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">DISTÂNCIA TOTAL</span>
                    <span className="font-bold text-cyan-400 tabular-nums">
                      {Math.round(player.totalMetersExplored)}m
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">RAIO DO RADAR</span>
                    <span className="font-bold text-emerald-400 tabular-nums">
                      {rarityCfg.sonarRadiusMeters}m
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">DUELOS VENCIDOS</span>
                    <span className="font-bold text-amber-400 tabular-nums">
                      {player.duelsWon}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">SETOR ATUAL</span>
                    <span className="font-bold text-purple-400 truncate block">
                      {player.isRealGps ? 'GPS Ativo' : 'Simulação'}
                    </span>
                  </div>
                </div>

                {/* Touch/Virtual Compass D-Pad */}
                <div className="grid grid-cols-3 gap-1 shrink-0">
                  <div />
                  <button
                    onClick={() => {
                      onMovePlayer(0, -6);
                      sound.playClick();
                    }}
                    className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs active:scale-95"
                    title="Norte (W / Cima)"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <div />

                  <button
                    onClick={() => {
                      onMovePlayer(-6, 0);
                      sound.playClick();
                    }}
                    className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs active:scale-95"
                    title="Oeste (A / Esquerda)"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      sound.playSonarPing();
                      onTriggerRadarScan();
                    }}
                    className="w-8 h-8 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center justify-center text-xs active:scale-95"
                    title="Pulso Radar"
                  >
                    <Radio className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      onMovePlayer(6, 0);
                      sound.playClick();
                    }}
                    className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs active:scale-95"
                    title="Este (D / Direita)"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div />
                  <button
                    onClick={() => {
                      onMovePlayer(0, 6);
                      sound.playClick();
                    }}
                    className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs active:scale-95"
                    title="Sul (S / Baixo)"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <div />
                </div>
              </div>
            )}

            {/* Tab Body: Hidden Items */}
            {activeTab === 'items' && (
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {uncollectedItems.length === 0 ? (
                  <div className="text-center py-4 text-xs font-mono text-slate-500">
                    Todas as relíquias deste setor foram recuperadas! Explora mais longe para novas frequências.
                  </div>
                ) : (
                  uncollectedItems.map((item) => {
                    const dist = Math.round(Math.hypot(item.relativeMeters.x, item.relativeMeters.z));
                    const rCfg = RARITY_CONFIGS[item.rarity];
                    const canDecrypt = dist <= 35;

                    return (
                      <div
                        key={item.id}
                        className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs font-mono"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border"
                            style={{
                              backgroundColor: `${rCfg.color}20`,
                              borderColor: `${rCfg.color}40`,
                              color: rCfg.color,
                            }}
                          >
                            {rCfg.label}
                          </span>
                          <span className="font-semibold text-slate-200 truncate">{item.name}</span>
                          <span className="text-slate-500 tabular-nums">({dist}m)</span>
                        </div>

                        {canDecrypt ? (
                          <button
                            onClick={() => onSelectItemToDecrypt(item)}
                            className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold uppercase text-[10px] transition-colors"
                          >
                            Desencriptar
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500">Aproxima-te ({dist}m)</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Tab Body: Rivals */}
            {activeTab === 'rivals' && (
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {activeRivals.length === 0 ? (
                  <div className="text-center py-4 text-xs font-mono text-slate-500">
                    Nenhum rival hostil detetado no quadrante. O território está seguro.
                  </div>
                ) : (
                  activeRivals.map((rival) => {
                    const dist = Math.round(Math.hypot(rival.relativeMeters.x, rival.relativeMeters.z));
                    const rCfg = RARITY_CONFIGS[rival.rarityTier];
                    const canDuel = dist <= 45;

                    return (
                      <div
                        key={rival.id}
                        className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs font-mono"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border"
                            style={{
                              backgroundColor: `${rCfg.color}20`,
                              borderColor: `${rCfg.color}40`,
                              color: rCfg.color,
                            }}
                          >
                            {rCfg.label}
                          </span>
                          <span className="font-semibold text-slate-200 truncate">
                            {rival.name} ({rival.codename})
                          </span>
                          <span className="text-slate-500 tabular-nums">({dist}m)</span>
                        </div>

                        {canDuel ? (
                          <button
                            onClick={() => onSelectRivalToConfront(rival)}
                            className="px-2.5 py-1 rounded bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold uppercase text-[10px] transition-colors flex items-center gap-1"
                          >
                            <Swords className="w-3 h-3" />
                            Duelo
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500">Aproxima-te ({dist}m)</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
