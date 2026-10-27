import React, { useState } from 'react';
import { HiddenItem, RARITY_CONFIGS, RarityTier } from '../types/game';
import { sound } from '../utils/audio';
import { X, Sparkles, Eye, Shield, Zap, Radio, PackageOpen } from 'lucide-react';

interface InventoryModalProps {
  inventory: HiddenItem[];
  onInspectItem: (item: HiddenItem) => void;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({ inventory, onInspectItem, onClose }) => {
  const [filter, setFilter] = useState<RarityTier | 'all'>('all');

  const filteredItems = inventory.filter((item) => {
    if (filter === 'all') return true;
    return item.rarity === filter;
  });

  const totalAttack = inventory.reduce((sum, it) => sum + it.powerStats.attackBonus, 0);
  const totalDefense = inventory.reduce((sum, it) => sum + it.powerStats.defenseBonus, 0);
  const totalRadar = inventory.reduce((sum, it) => sum + it.powerStats.radarBonus, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none pointer-events-auto">
      <div className="relative w-full max-w-2xl max-h-[88vh] rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-400/40 flex items-center justify-center text-purple-400">
              <PackageOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">
                COLEÇÃO DE RELÍQUIAS OCULTAS
              </div>
              <h3 className="text-base font-bold text-slate-100">
                Inventário Tático ({inventory.length} Artefatos)
              </h3>
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

        {/* Aggregate Stats Banner */}
        <div className="grid grid-cols-3 gap-2.5 my-3.5">
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
            <div className="text-[10px] font-mono text-slate-400">BÓNUS DE ATAQUE</div>
            <div className="text-base font-bold font-mono text-rose-400">+{totalAttack}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
            <div className="text-[10px] font-mono text-slate-400">BÓNUS DE DEFESA</div>
            <div className="text-base font-bold font-mono text-sky-400">+{totalDefense}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
            <div className="text-[10px] font-mono text-slate-400">EXPANSÃO DE RADAR</div>
            <div className="text-base font-bold font-mono text-emerald-400">+{totalRadar}m</div>
          </div>
        </div>

        {/* Rarity filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-slate-800/80">
          {(['all', 'common', 'rare', 'epic', 'legendary', 'mythic'] as const).map((tier) => {
            const isSelected = filter === tier;
            return (
              <button
                key={tier}
                onClick={() => {
                  setFilter(tier);
                  sound.playClick();
                }}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors shrink-0 ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                    : 'bg-slate-950/40 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {tier === 'all' ? 'Todas' : RARITY_CONFIGS[tier].label}
              </button>
            );
          })}
        </div>

        {/* Items List */}
        <div className="overflow-y-auto space-y-2.5 my-3.5 pr-1 flex-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono text-xs">
              Nenhuma relíquia encontrada nesta categoria. Explora o mapa e sintoniza as frequências locais!
            </div>
          ) : (
            filteredItems.map((item) => {
              const rCfg = RARITY_CONFIGS[item.rarity];
              return (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: `${rCfg.color}15`,
                        borderColor: `${rCfg.color}40`,
                        color: rCfg.color,
                      }}
                    >
                      <Sparkles className="w-5 h-5" />
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
                        <h4 className="text-sm font-bold text-slate-200">{item.name}</h4>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 mt-1">
                        <span className="text-rose-400">ATK +{item.powerStats.attackBonus}</span>
                        <span className="text-sky-400">DEF +{item.powerStats.defenseBonus}</span>
                        <span className="text-emerald-400">RADAR +{item.powerStats.radarBonus}m</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      sound.playClick();
                      onInspectItem(item);
                    }}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors flex items-center gap-1.5 text-xs font-mono shrink-0"
                    title="Inspecionar em 3D"
                  >
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <span className="hidden sm:inline">Inspecionar 3D</span>
                  </button>
                </div>
              );
            })
          )}
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
