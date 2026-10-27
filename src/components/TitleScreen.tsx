import React from 'react';
import { FAMOUS_EXPLORATION_ZONES, CityPreset } from '../utils/geo';
import { sound } from '../utils/audio';
import { PWAInstallButton } from './PWAInstallButton';
import { PlayerProfile, RARITY_CONFIGS } from '../types/game';
import { Compass, Crosshair, MapPin, Navigation, Sparkles, Volume2, VolumeX, ShieldCheck, Save, Trash2, RotateCcw } from 'lucide-react';

interface TitleScreenProps {
  onStartGame: (config: { isRealGps: boolean; selectedZone: CityPreset }) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  savedPlayer?: PlayerProfile | null;
  onResetProgress?: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  isMuted,
  onToggleMute,
  savedPlayer,
  onResetProgress,
}) => {
  const [selectedZone, setSelectedZone] = React.useState<CityPreset>(FAMOUS_EXPLORATION_ZONES[0]);
  const [useRealGps, setUseRealGps] = React.useState<boolean>(false);
  const [gpsDetecting, setGpsDetecting] = React.useState<boolean>(false);
  const [gpsError, setGpsError] = React.useState<string | null>(null);

  const handleDetectGps = () => {
    sound.playClick();
    if (!navigator.geolocation) {
      setGpsError('Geolocalização não é suportada neste navegador.');
      return;
    }

    setGpsDetecting(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsDetecting(false);
        setUseRealGps(true);
        const liveZone: CityPreset = {
          id: 'live_device_gps',
          name: 'Coordenadas Reais do Dispositivo',
          country: 'Localização Atual',
          coords: {
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
            accuracy: pos.coords.accuracy || 5,
          },
          description: 'Sincronizado diretamente com a antena GPS do teu dispositivo físico.',
        };
        setSelectedZone(liveZone);
        sound.playCollectSuccess();
      },
      (err) => {
        setGpsDetecting(false);
        setGpsError('Permissão GPS negada ou sinal indisponível. Usando setor simulado.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleStart = () => {
    sound.playLevelUp();
    onStartGame({ isRealGps: useRealGps, selectedZone });
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [useRealGps, selectedZone]);

  return (
    <div className="relative w-full h-full flex flex-col justify-between items-center p-6 md:p-10 select-none overflow-hidden z-20 pointer-events-auto bg-gradient-to-b from-slate-950/70 via-slate-950/40 to-slate-950/90">
      {/* Top Brand Bar */}
      <div className="w-full max-w-6xl flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-mono tracking-widest text-cyan-400 uppercase">Rede Geodésica AR v2.4</div>
            <div className="text-[11px] text-slate-400">Motor de Caça & Exploração Tática</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <PWAInstallButton variant="prominent" />

          <button
            onClick={() => {
              onToggleMute();
              sound.playClick();
            }}
            className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors flex items-center gap-2 text-xs font-mono"
            title="Alternar Áudio Procedural"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span className="hidden sm:inline">{isMuted ? 'Mudo' : 'Som Ativo'}</span>
          </button>
        </div>
      </div>

      {/* Hero Centerpiece: Bespoke SVG Title Lockup */}
      <div className="flex flex-col items-center text-center max-w-3xl my-auto px-4">
        {/* Bespoke SVG Title Lockup */}
        <div className="relative mb-3 flex flex-col items-center">
          <svg className="w-72 sm:w-96 md:w-[480px] h-auto drop-shadow-[0_0_35px_rgba(6,182,212,0.45)]" viewBox="0 0 480 84" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
              <linearGradient id="radarRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* Geometric Framing Tech Decals */}
            <path d="M 12 18 L 30 6 L 450 6 L 468 18" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.6" fill="none" />
            <path d="M 12 66 L 30 78 L 450 78 L 468 66" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.6" fill="none" />
            
            {/* Corner crosshairs */}
            <line x1="6" y1="42" x2="18" y2="42" stroke="#38bdf8" strokeWidth="2" />
            <line x1="462" y1="42" x2="474" y2="42" stroke="#38bdf8" strokeWidth="2" />

            {/* Title Typography */}
            <text x="240" y="52" textAnchor="middle" fill="url(#titleGrad)" fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont" fontWeight="900" letterSpacing="7" fontSize="42">
              GEO-HUNTER
            </text>
          </svg>

          <div className="flex items-center gap-2 mt-1">
            <span className="h-px w-8 bg-cyan-500/50" />
            <span className="text-xs sm:text-sm font-mono tracking-widest text-cyan-300 font-semibold uppercase">
              REAL-WORLD AR TACTICAL REALM
            </span>
            <span className="h-px w-8 bg-cyan-500/50" />
          </div>
        </div>

        <p className="text-sm sm:text-base text-slate-300 max-w-xl font-normal leading-relaxed mt-2 drop-shadow">
          Explora o mundo real através de coordenadas geográficas. Desenterra relíquias ocultas,
          cumpre desafios de setor, confronta caçadores rivais e ascende por escalões de raridade.
        </p>

        {/* Rarity Tier Preview Pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          <span className="px-2.5 py-1 text-[11px] font-mono rounded bg-sky-500/15 border border-sky-400/40 text-sky-300">
            ⚪ Comum
          </span>
          <span className="px-2.5 py-1 text-[11px] font-mono rounded bg-emerald-500/15 border border-emerald-400/40 text-emerald-300">
            🟢 Raro
          </span>
          <span className="px-2.5 py-1 text-[11px] font-mono rounded bg-purple-500/15 border border-purple-400/40 text-purple-300">
            🟣 Épico
          </span>
          <span className="px-2.5 py-1 text-[11px] font-mono rounded bg-amber-500/15 border border-amber-400/40 text-amber-300">
            🟡 Lendário
          </span>
          <span className="px-2.5 py-1 text-[11px] font-mono rounded bg-rose-500/15 border border-rose-400/40 text-rose-300">
            🔴 Mítico
          </span>
        </div>

        {/* Location / GPS Configuration Card */}
        <div className="mt-6 p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-2xl max-w-md w-full text-left">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase font-semibold">
              <MapPin className="w-3.5 h-3.5" />
              <span>Ponto de Entrada Geográfico</span>
            </div>
            <button
              onClick={handleDetectGps}
              disabled={gpsDetecting}
              className="text-[11px] font-mono px-2 py-1 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 transition-colors flex items-center gap-1.5"
            >
              <Navigation className="w-3 h-3" />
              {gpsDetecting ? 'Sincronizando...' : 'Usar GPS Real'}
            </button>
          </div>

          {gpsError && (
            <div className="mb-3 text-[11px] text-amber-400 bg-amber-950/40 border border-amber-800/60 p-2 rounded">
              {gpsError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400 uppercase">Setor Metropolitano Selecionado:</label>
            <div className="grid grid-cols-2 gap-1.5">
              {FAMOUS_EXPLORATION_ZONES.map((zone) => {
                const isSelected = selectedZone.id === zone.id && !useRealGps;
                return (
                  <button
                    key={zone.id}
                    onClick={() => {
                      setSelectedZone(zone);
                      setUseRealGps(false);
                      sound.playClick();
                    }}
                    className={`p-2 rounded text-left transition-all text-xs font-mono border ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold truncate">{zone.name.split('(')[0]}</div>
                    <div className="text-[10px] text-slate-500 truncate">{zone.country}</div>
                  </button>
                );
              })}
            </div>

            {useRealGps && (
              <div className="mt-2 p-2 rounded bg-emerald-950/30 border border-emerald-500/40 text-[11px] font-mono text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">GPS Físico Ativo: {selectedZone.coords.lat}, {selectedZone.coords.lng}</span>
              </div>
            )}
          </div>
        </div>

        {/* Saved Game Progress Banner */}
        {savedPlayer && (savedPlayer.level > 1 || (savedPlayer.inventory && savedPlayer.inventory.length > 0) || savedPlayer.totalMetersExplored > 10) && (
          <div className="mt-3.5 p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 shadow-xl max-w-md w-full text-left">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase">
                <Save className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Progresso Salvo no Navegador</span>
              </div>
              {onResetProgress && (
                <button
                  onClick={() => {
                    if (window.confirm('Tens a certeza que desejas apagar o progresso salvo e recomeçar do zero?')) {
                      onResetProgress();
                      sound.playClick();
                    }
                  }}
                  className="text-[10px] font-mono text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
                  title="Apagar dados salvos e recomeçar"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Resetar Save</span>
                </button>
              )}
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="p-1.5 rounded bg-slate-950/70 border border-slate-800">
                <span className="text-[9px] text-slate-400 block uppercase">PATENTE</span>
                <span className="font-bold text-sky-400">Lv {savedPlayer.level}</span>
              </div>
              <div className="p-1.5 rounded bg-slate-950/70 border border-slate-800">
                <span className="text-[9px] text-slate-400 block uppercase">INVENTÁRIO</span>
                <span className="font-bold text-emerald-400">{savedPlayer.inventory?.length || 0} Itens</span>
              </div>
              <div className="p-1.5 rounded bg-slate-950/70 border border-slate-800">
                <span className="text-[9px] text-slate-400 block uppercase">EXPLORADO</span>
                <span className="font-bold text-amber-400">{Math.round(savedPlayer.totalMetersExplored || 0)}m</span>
              </div>
            </div>

            <div className="mt-1.5 text-[10px] font-mono text-slate-500 flex items-center justify-between">
              <span>Auto-save ativo a cada 30 segundos</span>
              <span className="text-cyan-500/80">localStorage</span>
            </div>
          </div>
        )}

        {/* Primary CTA Start Button */}
        <div className="mt-5 flex flex-col items-center gap-2.5">
          <button
            onClick={handleStart}
            className="group relative px-8 py-3.5 rounded-xl font-mono text-base font-bold tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 shadow-[0_0_30px_rgba(56,189,248,0.5)] transition-all transform active:scale-95 flex items-center gap-3 cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-slate-950 group-hover:rotate-12 transition-transform" />
            <span>
              {savedPlayer && (savedPlayer.level > 1 || (savedPlayer.inventory && savedPlayer.inventory.length > 0))
                ? 'CONTINUAR MISSÃO SALVA'
                : 'INICIAR EXPLORAÇÃO TÁTICA'}
            </span>
            <span className="text-xs bg-slate-950/20 px-2 py-0.5 rounded font-mono">ENTER / ESPAÇO</span>
          </button>
        </div>
      </div>

      {/* Control Hint Line */}
      <div className="w-full max-w-4xl text-center pb-2">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-slate-900/90 border border-slate-800/80 text-[11px] font-mono text-slate-400">
          <span className="text-cyan-400 font-bold">CONTROLES:</span>
          <span>WASD / Setas Mover</span>
          <span className="text-slate-600">·</span>
          <span>ESPAÇO Pulso Radar</span>
          <span className="text-slate-600">·</span>
          <span>C Confrontar Rival</span>
          <span className="text-slate-600">·</span>
          <span>B Caçadas Diárias</span>
          <span className="text-slate-600">·</span>
          <span>I Inventário</span>
          <span className="text-slate-600">·</span>
          <span>H Ocultar Interface</span>
        </div>
      </div>
    </div>
  );
};
