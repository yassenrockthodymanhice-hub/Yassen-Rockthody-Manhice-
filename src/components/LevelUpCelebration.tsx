import React from 'react';
import { RarityTier, RARITY_CONFIGS } from '../types/game';
import { sound } from '../utils/audio';
import { Award, Sparkles, Radio, Shield, Zap, ChevronRight } from 'lucide-react';

interface LevelUpCelebrationProps {
  level: number;
  rarityTier: RarityTier;
  isNewRank: boolean;
  onDismiss: () => void;
}

export const LevelUpCelebration: React.FC<LevelUpCelebrationProps> = ({
  level,
  rarityTier,
  isNewRank,
  onDismiss,
}) => {
  const rarityCfg = RARITY_CONFIGS[rarityTier];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none pointer-events-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 text-slate-100 flex flex-col items-center text-center">
        {/* Animated Rarity Icon */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center border shadow-2xl mb-4"
          style={{
            backgroundColor: `${rarityCfg.color}25`,
            borderColor: rarityCfg.color,
            color: rarityCfg.color,
            boxShadow: `0 0 30px ${rarityCfg.glowColor}`,
          }}
        >
          <Award className="w-10 h-10" />
        </div>

        {/* Title */}
        <div className="text-xs font-mono font-bold tracking-widest uppercase text-cyan-400 mb-1">
          {isNewRank ? '✦ ASCENSÃO DE ESCALÃO DE RARIDADE ✦' : '✦ PROGRESSÃO DE NÍVEL ✦'}
        </div>

        <h2 className="text-2xl font-black font-mono text-slate-100">
          NÍVEL {level} ALCANÇADO!
        </h2>

        {/* Rarity Rank Badge */}
        <div
          className="mt-3 px-4 py-1.5 rounded-xl border text-sm font-mono font-bold tracking-wider uppercase inline-flex items-center gap-2"
          style={{
            backgroundColor: `${rarityCfg.color}20`,
            borderColor: `${rarityCfg.color}60`,
            color: rarityCfg.color,
          }}
        >
          <Sparkles className="w-4 h-4" />
          <span>{rarityCfg.label} · {rarityCfg.namePt}</span>
        </div>

        <p className="text-xs text-slate-300 mt-3 font-sans leading-relaxed">
          {isNewRank
            ? `Parabéns, Caçador! Desbloqueaste a patente ${rarityCfg.label}. O teu radar agora sintoniza artefatos mais raros e poderosos no mundo real.`
            : `Continuas a tua jornada de domínio cartográfico. As tuas habilidades de combate e rastreamento foram aprimoradas.`}
        </p>

        {/* Unlocked Perks */}
        <div className="w-full mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-left space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2 text-emerald-400">
              <Radio className="w-3.5 h-3.5" /> Alcance de Radar Expandido:
            </span>
            <span className="font-bold text-slate-100">{rarityCfg.sonarRadiusMeters}m</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2 text-cyan-400">
              <Zap className="w-3.5 h-3.5" /> Multiplicador de XP:
            </span>
            <span className="font-bold text-slate-100">{rarityCfg.xpMultiplier}x</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2 text-purple-400">
              <Shield className="w-3.5 h-3.5" /> Acesso a Relíquias:
            </span>
            <span className="font-bold text-slate-100 uppercase">{rarityCfg.label}+</span>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => {
            sound.playClick();
            onDismiss();
          }}
          className="mt-6 w-full py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
        >
          <span>CONTINUAR EXPLORAÇÃO</span>
          <ChevronRight className="w-4 h-4 text-slate-950" />
        </button>
      </div>
    </div>
  );
};
