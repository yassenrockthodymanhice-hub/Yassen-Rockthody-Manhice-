import React from 'react';
import { Challenge, RARITY_CONFIGS } from '../types/game';
import { sound } from '../utils/audio';
import { X, Target, CheckCircle2, Trophy, Compass, Sparkles } from 'lucide-react';

interface ChallengesModalProps {
  challenges: Challenge[];
  onClose: () => void;
}

export const ChallengesModal: React.FC<ChallengesModalProps> = ({ challenges, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none pointer-events-auto">
      <div className="relative w-full max-w-xl max-h-[85vh] rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                MISSÕES ATIVAS DO SETOR
              </div>
              <h3 className="text-base font-bold text-slate-100">Desafios de Caça Territorial</h3>
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

        {/* Challenge Cards List */}
        <div className="overflow-y-auto space-y-3 my-4 pr-1 flex-1">
          {challenges.map((ch) => {
            const rewardTierCfg = RARITY_CONFIGS[ch.rarityReward];
            const pct = Math.min(100, Math.round((ch.progress / ch.maxProgress) * 100));

            return (
              <div
                key={ch.id}
                className={`p-4 rounded-xl border transition-all ${
                  ch.isCompleted
                    ? 'bg-slate-950/80 border-emerald-500/40'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-100">{ch.title}</h4>
                      {ch.isCompleted && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Concluído
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{ch.description}</p>
                  </div>

                  {/* Reward badge */}
                  <div className="shrink-0 text-right">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border"
                      style={{
                        backgroundColor: `${rewardTierCfg.color}15`,
                        borderColor: `${rewardTierCfg.color}40`,
                        color: rewardTierCfg.color,
                      }}
                    >
                      +{ch.xpReward} XP
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Progresso:</span>
                    <span className="tabular-nums font-semibold text-cyan-300">
                      {ch.progress} / {ch.maxProgress} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        ch.isCompleted ? 'bg-emerald-400' : 'bg-cyan-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
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
