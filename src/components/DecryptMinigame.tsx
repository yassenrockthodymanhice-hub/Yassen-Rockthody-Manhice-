import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { HiddenItem, RARITY_CONFIGS } from '../types/game';
import { sound } from '../utils/audio';
import { Radio, CheckCircle2, X, Sparkles, Activity, ShieldAlert, Cpu } from 'lucide-react';

interface DecryptMinigameProps {
  item: HiddenItem;
  onSuccess: (item: HiddenItem) => void;
  onCancel: () => void;
}

export const DecryptMinigame: React.FC<DecryptMinigameProps> = ({ item, onSuccess, onCancel }) => {
  const rarityCfg = RARITY_CONFIGS[item.rarity];
  const [targetFrequency, setTargetFrequency] = useState<number>(() => Math.floor(Math.random() * 60) + 20);
  const [currentFrequency, setCurrentFrequency] = useState<number>(50);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const diff = Math.abs(currentFrequency - targetFrequency);
  const isAligned = diff <= 4;

  useEffect(() => {
    let interval: number;
    if (isAligned && !isSuccess) {
      interval = window.setInterval(() => {
        setSyncProgress((prev) => {
          if (prev >= 100) {
            setIsSuccess(true);
            sound.playCollectSuccess();
            confetti({
              particleCount: 75,
              spread: 60,
              origin: { y: 0.6 },
              colors: [rarityCfg.color, '#ffffff', '#38bdf8'],
            });
            setTimeout(() => {
              onSuccess(item);
            }, 1200);
            return 100;
          }
          sound.playClick();
          return prev + 12;
        });
      }, 100);
    } else {
      setSyncProgress((prev) => Math.max(0, prev - 8));
    }

    return () => clearInterval(interval);
  }, [isAligned, isSuccess, item, onSuccess, rarityCfg]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentFrequency(val);
    if (Math.abs(val - targetFrequency) <= 4) {
      sound.playSonarPing(1.4);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm pointer-events-auto select-none">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 text-slate-100 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: `${rarityCfg.color}15`,
                borderColor: `${rarityCfg.color}50`,
                color: rarityCfg.color,
              }}
            >
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border"
                  style={{
                    backgroundColor: `${rarityCfg.color}20`,
                    borderColor: `${rarityCfg.color}60`,
                    color: rarityCfg.color,
                  }}
                >
                  {rarityCfg.label}
                </span>
                <span className="text-xs font-mono text-slate-400">DESENCRIPTAÇÃO AR</span>
              </div>
              <h3 className="text-base font-bold text-slate-100">{item.name}</h3>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onCancel();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lore / Description */}
        <div className="mt-3.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-sans">
          {item.lore}
        </div>

        {/* Tactical Wave Signal Visualizer */}
        <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 relative flex flex-col items-center">
          <div className="flex items-center justify-between w-full text-[11px] font-mono text-slate-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Sinal Geodésico Local
            </span>
            <span
              className="font-bold tabular-nums"
              style={{ color: isAligned ? '#10b981' : '#f59e0b' }}
            >
              {isAligned ? 'SINTONIA BLOQUEADA' : 'A PROCURAR SINAL...'}
            </span>
          </div>

          {/* SVG Oscilloscope wave */}
          <div className="w-full h-24 bg-slate-900/80 rounded-lg border border-slate-800 overflow-hidden relative flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none">
              {/* Target Wave */}
              <path
                d={`M 0 40 Q 75 ${40 - targetFrequency * 0.4} 150 40 T 300 40`}
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              {/* Player Current Frequency Wave */}
              <path
                d={`M 0 40 Q 75 ${40 - currentFrequency * 0.4} 150 40 T 300 40`}
                fill="none"
                stroke={isAligned ? '#10b981' : rarityCfg.color}
                strokeWidth="3"
                className="transition-all duration-75"
              />
            </svg>

            {/* Crosshair indicator */}
            <div className="absolute inset-y-0 w-px bg-cyan-400/40" />
          </div>

          {/* Calibration Frequency Slider */}
          <div className="w-full mt-4 space-y-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>Frequência: {currentFrequency.toFixed(1)} MHz</span>
              <span>Alvo: {isAligned ? `${targetFrequency}.0 MHz ✓` : '??? MHz'}</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              value={currentFrequency}
              onChange={handleSliderChange}
              disabled={isSuccess}
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
            />
          </div>

          {/* Sync Progress Bar */}
          <div className="w-full mt-4 space-y-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>Sincronização do Núcleo:</span>
              <span className="tabular-nums font-bold text-cyan-300">{syncProgress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${syncProgress}%`,
                  backgroundColor: isAligned ? '#10b981' : rarityCfg.color,
                  boxShadow: `0 0 10px ${isAligned ? '#10b981' : rarityCfg.color}`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Item Stats Boost */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
            <div className="text-[10px] font-mono text-slate-400">ATAQUE</div>
            <div className="text-sm font-bold font-mono text-rose-400">+{item.powerStats.attackBonus}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
            <div className="text-[10px] font-mono text-slate-400">DEFESA</div>
            <div className="text-sm font-bold font-mono text-sky-400">+{item.powerStats.defenseBonus}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
            <div className="text-[10px] font-mono text-slate-400">RADAR</div>
            <div className="text-sm font-bold font-mono text-emerald-400">+{item.powerStats.radarBonus}m</div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            onClick={() => {
              sound.playClick();
              onCancel();
            }}
            className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800 transition-colors"
          >
            Abortar
          </button>
          <button
            disabled={!isAligned || isSuccess}
            onClick={() => {
              setSyncProgress(100);
            }}
            className={`px-5 py-2 rounded-xl text-xs font-mono font-bold tracking-wider flex items-center gap-2 transition-all ${
              isAligned
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.5)] cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>DESENCRIPTADO!</span>
              </>
            ) : (
              <>
                <Radio className="w-4 h-4" />
                <span>EXTRAIR RELÍQUIA</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
