import React from 'react';
import { Achievement, PlayerProfile } from '../types/game';
import { sound } from '../utils/audio';
import { X, Award, CheckCircle2, Lock, MapPin, Footprints, Compass, Globe, Sparkles, ShieldAlert, Zap, Swords, Crosshair } from 'lucide-react';

interface AchievementsPanelProps {
  achievements: Achievement[];
  player: PlayerProfile;
  onClose: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  MapPin: <MapPin className="w-5 h-5" />,
  Footprints: <Footprints className="w-5 h-5" />,
  Compass: <Compass className="w-5 h-5" />,
  Globe: <Globe className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
  ShieldAlert: <ShieldAlert className="w-5 h-5" />,
  Zap: <Zap className="w-5 h-5" />,
  Award: <Award className="w-5 h-5" />,
  Swords: <Swords className="w-5 h-5" />,
  Crosshair: <Crosshair className="w-5 h-5" />,
};

export const AchievementsPanel: React.FC<AchievementsPanelProps> = ({ achievements, player, onClose }) => {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const progressPct = Math.round((unlockedCount / achievements.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none pointer-events-auto">
      <div className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                EXPLORAÇÃO GEOGRÁFICA LOCAL
              </div>
              <h3 className="text-base font-bold text-slate-100">Conquistas de Território</h3>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Stats Summary */}
        <div className="grid grid-cols-3 gap-3 my-4">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">DISTÂNCIA PERCORRIDA</div>
            <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
              {Math.round(player.totalMetersExplored)}m
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">RELÍQUIAS RESGATADAS</div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
              {player.inventory.length}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">CONQUISTAS DESBLOQUEADAS</div>
            <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
              {unlockedCount} / {achievements.length} ({progressPct}%)
            </div>
          </div>
        </div>

        {/* List of achievements */}
        <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
          {achievements.map((ach) => {
            const icon = ICON_MAP[ach.iconName] || <Award className="w-5 h-5" />;
            return (
              <div
                key={ach.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                  ach.unlocked
                    ? 'bg-slate-950/80 border-cyan-500/30'
                    : 'bg-slate-950/40 border-slate-800/80 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                      ach.unlocked
                        ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-600'
                    }`}
                  >
                    {icon}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm font-bold ${
                          ach.unlocked ? 'text-slate-100' : 'text-slate-400'
                        }`}
                      >
                        {ach.title}
                      </h4>
                      {ach.unlocked && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Desbloqueada
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-sans mt-0.5">{ach.description}</p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {ach.unlocked ? (
                    <span className="text-[10px] font-mono text-cyan-400">
                      {ach.unlockedAt || 'Ativa'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                      <Lock className="w-3.5 h-3.5" /> Bloqueada
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
