import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { DailyBounty, DailyBountiesState, RARITY_CONFIGS } from '../types/game';
import { formatTimeRemaining } from '../utils/dailyBounties';
import { sound } from '../utils/audio';
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  Trophy,
  Footprints,
  Radio,
  Swords,
  Sparkles,
  Zap,
  RotateCcw,
  Gift,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface DailyBountiesModalProps {
  bountiesState: DailyBountiesState;
  onClaimBounty: (bountyId: string) => void;
  onClaimGrandBonus: () => void;
  onForceReset: () => void;
  onClose: () => void;
}

const ICON_COMPONENTS = {
  Footprints: <Footprints className="w-5 h-5" />,
  Radio: <Radio className="w-5 h-5" />,
  Swords: <Swords className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
  Zap: <Zap className="w-5 h-5" />,
};

export const DailyBountiesModal: React.FC<DailyBountiesModalProps> = ({
  bountiesState,
  onClaimBounty,
  onClaimGrandBonus,
  onForceReset,
  onClose,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(() =>
    Math.max(0, bountiesState.nextResetTimestamp - Date.now())
  );

  // Live 24-hour countdown tick
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, bountiesState.nextResetTimestamp - Date.now());
      setTimeLeft(remaining);
      if (remaining <= 0) {
        // Auto-refresh when countdown hits zero
        onForceReset();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [bountiesState.nextResetTimestamp, onForceReset]);

  const allCompleted = bountiesState.bounties.every((b) => b.isCompleted);
  const allClaimed = bountiesState.bounties.every((b) => b.isClaimed);
  const claimedCount = bountiesState.bounties.filter((b) => b.isClaimed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none pointer-events-auto">
      <div className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 text-slate-100 flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span>CICLO DE 24 HORAS</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">RESET AUTOMÁTICO</span>
              </div>
              <h3 className="text-base font-bold text-slate-100">Caçadas Diárias (Daily Bounties)</h3>
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

        {/* 24-Hour Timer & Force Reset Status Bar */}
        <div className="my-3.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
              <Clock className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">PRÓXIMO RESET EM</div>
              <div className="text-sm font-bold font-mono text-cyan-300 tabular-nums">
                {formatTimeRemaining(timeLeft)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] font-mono text-slate-400">STATUS DIÁRIO</div>
              <div className="text-xs font-bold font-mono text-amber-400">
                {claimedCount} / {bountiesState.bounties.length} RECLAMADAS
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onForceReset();
              }}
              className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors"
              title="Forçar novo ciclo de 24 horas para testar novas missões"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Novo Ciclo</span>
            </button>
          </div>
        </div>

        {/* Bounties List */}
        <div className="overflow-y-auto space-y-3 pr-1 flex-1">
          {bountiesState.bounties.map((bounty) => {
            const rCfg = RARITY_CONFIGS[bounty.rarityTier];
            const pct = Math.min(100, Math.round((bounty.progress / bounty.maxProgress) * 100));
            const icon = ICON_COMPONENTS[bounty.iconName] || <Sparkles className="w-5 h-5" />;

            return (
              <div
                key={bounty.id}
                className={`p-4 rounded-xl border transition-all ${
                  bounty.isClaimed
                    ? 'bg-slate-950/40 border-slate-800/80 opacity-70'
                    : bounty.isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: `${rCfg.color}15`,
                        borderColor: `${rCfg.color}50`,
                        color: rCfg.color,
                      }}
                    >
                      {icon}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border"
                          style={{
                            backgroundColor: `${rCfg.color}20`,
                            borderColor: `${rCfg.color}50`,
                            color: rCfg.color,
                          }}
                        >
                          {rCfg.label}
                        </span>
                        <h4 className="text-sm font-bold text-slate-100">{bounty.title}</h4>
                      </div>
                      <p className="text-xs text-slate-300 font-sans mt-1 leading-relaxed">
                        {bounty.description}
                      </p>
                    </div>
                  </div>

                  {/* Reward / Claim Action */}
                  <div className="shrink-0 text-right">
                    <div className="text-xs font-mono font-bold text-emerald-400 mb-1.5">
                      +{bounty.xpReward} XP
                    </div>

                    {bounty.isClaimed ? (
                      <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Reclamado
                      </span>
                    ) : bounty.isCompleted ? (
                      <button
                        onClick={() => {
                          onClaimBounty(bounty.id);
                        }}
                        className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_10px_rgba(16,185,129,0.5)] active:scale-95 cursor-pointer"
                      >
                        RECLAMAR
                      </button>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
                        Em Curso
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>
                      Progresso:{' '}
                      <span className="text-slate-200 font-semibold">
                        {Math.round(bounty.progress)} / {bounty.maxProgress}
                      </span>
                    </span>
                    <span className="font-semibold tabular-nums text-cyan-300">{pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        bounty.isClaimed
                          ? 'bg-slate-600'
                          : bounty.isCompleted
                          ? 'bg-emerald-400'
                          : 'bg-cyan-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Grand Completion Vault Card */}
        <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-slate-950 border border-amber-500/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-400 shrink-0">
              <Gift className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-300 uppercase">
                  COFRE DE CAÇADOR DIÁRIO
                </span>
                <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-amber-500/20 text-amber-200 border border-amber-400/30">
                  +800 XP BÓNUS
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Cumpre e reclama todas as 3 caçadas do ciclo para desbloquear a recompensa suprema.
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {bountiesState.allClaimedBonusAwarded ? (
              <span className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Resgatado Hoje
              </span>
            ) : allClaimed ? (
              <button
                onClick={() => {
                  onClaimGrandBonus();
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(245,158,11,0.6)] active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Trophy className="w-4 h-4 text-slate-950" />
                ABRIR COFRE
              </button>
            ) : (
              <div className="text-right text-[11px] font-mono text-slate-500">
                {3 - claimedCount} restantes
              </div>
            )}
          </div>
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
