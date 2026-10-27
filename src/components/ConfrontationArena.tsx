import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { RivalOperative, PlayerProfile, RARITY_CONFIGS, HiddenItem } from '../types/game';
import { sound } from '../utils/audio';
import { Swords, Shield, Zap, Flame, Trophy, Skull, AlertTriangle, ArrowLeft } from 'lucide-react';

interface ConfrontationArenaProps {
  rival: RivalOperative;
  player: PlayerProfile;
  onVictory: (rival: RivalOperative, loot: HiddenItem) => void;
  onDefeat: () => void;
  onRetreat: () => void;
  onEmpUsed?: () => void;
}

export const ConfrontationArena: React.FC<ConfrontationArenaProps> = ({
  rival,
  player,
  onVictory,
  onDefeat,
  onRetreat,
  onEmpUsed,
}) => {
  const rivalTierCfg = RARITY_CONFIGS[rival.rarityTier];
  const playerTierCfg = RARITY_CONFIGS[player.rarityTier];

  // Battle states
  const [playerHp, setPlayerHp] = useState<number>(player.health);
  const [rivalHp, setRivalHp] = useState<number>(rival.currentHealth);
  const [playerEnergy, setPlayerEnergy] = useState<number>(100);
  const [isDefending, setIsDefending] = useState<boolean>(false);
  const [battleLog, setBattleLog] = useState<string[]>([
    `Confronto tático iniciado contra ${rival.name} [${rival.codename}]!`,
  ]);
  const [rivalTelegraph, setRivalTelegraph] = useState<{ action: string; timer: number } | null>(null);
  const [shake, setShake] = useState<boolean>(false);
  const [flash, setFlash] = useState<'player' | 'rival' | null>(null);
  const [battleEnded, setBattleEnded] = useState<'victory' | 'defeat' | null>(null);

  // Player bonus stats from collected items
  const attackBonus = player.inventory.reduce((sum, it) => sum + it.powerStats.attackBonus, 0);
  const defenseBonus = player.inventory.reduce((sum, it) => sum + it.powerStats.defenseBonus, 0);

  const playerBaseAttack = 20 + attackBonus;
  const playerBaseDefense = 5 + defenseBonus;

  // Trigger shake & hit flash helper
  const triggerHitEffects = (target: 'player' | 'rival') => {
    setFlash(target);
    setShake(true);
    setTimeout(() => {
      setFlash(null);
      setShake(false);
    }, 200);
  };

  // AI Attack Routine
  useEffect(() => {
    if (battleEnded) return;

    const interval = setInterval(() => {
      // Wind up telegraph
      const moves = [
        { name: 'Disparo de Feixe Concentrado', damage: rival.attackPower, energyCost: 0 },
        { name: 'Onda de Choque Sônica', damage: Math.round(rival.attackPower * 1.3), energyCost: 0 },
      ];
      const selectedMove = moves[Math.floor(Math.random() * moves.length)];

      setRivalTelegraph({ action: selectedMove.name, timer: 1.5 });

      setTimeout(() => {
        if (battleEnded) return;

        setRivalTelegraph(null);
        sound.playLaserShot();

        // Calculate damage to player
        setPlayerHp((prevHp) => {
          let dmg = selectedMove.damage;
          if (isDefending) {
            dmg = Math.max(2, Math.round(dmg * 0.25) - playerBaseDefense);
            sound.playShieldDeflect();
            setBattleLog((prev) => [`Barreira absorveu grande parte do ataque! (-${dmg} HP)`, ...prev.slice(0, 4)]);
          } else {
            dmg = Math.max(5, dmg - playerBaseDefense);
            sound.playHitImpact();
            triggerHitEffects('player');
            setBattleLog((prev) => [`${rival.codename} atingiu-te com ${selectedMove.name}! (-${dmg} HP)`, ...prev.slice(0, 4)]);
          }

          const newHp = Math.max(0, prevHp - dmg);
          if (newHp === 0) {
            setBattleEnded('defeat');
            setTimeout(onDefeat, 2000);
          }
          return newHp;
        });

        // Reset defend flag
        setIsDefending(false);
      }, 1500);
    }, 4500);

    return () => clearInterval(interval);
  }, [battleEnded, isDefending, rival, playerBaseDefense, onDefeat]);

  // Player action: Strike
  const handlePlayerAttack = () => {
    if (battleEnded) return;
    sound.playLaserShot();
    const dmg = Math.round(playerBaseAttack * (0.9 + Math.random() * 0.3));

    setRivalHp((prev) => {
      const nextHp = Math.max(0, prev - dmg);
      sound.playHitImpact();
      triggerHitEffects('rival');
      setBattleLog((prevLog) => [`Disparo de Plasma causou ${dmg} de dano ao rival!`, ...prevLog.slice(0, 4)]);

      if (nextHp === 0) {
        setBattleEnded('victory');
        sound.playLevelUp();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: [rivalTierCfg.color, '#38bdf8', '#f59e0b'],
        });
        setTimeout(() => {
          onVictory(rival, rival.lootItem);
        }, 1800);
      }
      return nextHp;
    });
  };

  // Player action: Shield Defend
  const handlePlayerDefend = () => {
    if (battleEnded) return;
    sound.playShieldDeflect();
    setIsDefending(true);
    setBattleLog((prev) => ['Barreira defletora ativada! Danos reduzidos no próximo turno.', ...prev.slice(0, 4)]);
  };

  // Player action: EMP Pulse (Cost 40 energy)
  const handleEmpPulse = () => {
    if (battleEnded || playerEnergy < 40) return;
    setPlayerEnergy((prev) => prev - 40);
    sound.playSonarPing(1.8);
    onEmpUsed?.();

    const dmg = Math.round(playerBaseAttack * 1.6);
    setRivalHp((prev) => {
      const nextHp = Math.max(0, prev - dmg);
      sound.playHitImpact();
      triggerHitEffects('rival');
      setBattleLog((prevLog) => [`PULSO EMP TÁTICO SOBRECARREGOU O RIVAL! (-${dmg} HP)`, ...prevLog.slice(0, 4)]);

      if (nextHp === 0) {
        setBattleEnded('victory');
        sound.playLevelUp();
        setTimeout(() => onVictory(rival, rival.lootItem), 1800);
      }
      return nextHp;
    });
  };

  // Passive energy recharge
  useEffect(() => {
    if (battleEnded) return;
    const interval = setInterval(() => {
      setPlayerEnergy((prev) => Math.min(100, prev + 8));
    }, 1000);
    return () => clearInterval(interval);
  }, [battleEnded]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none pointer-events-auto ${
        shake ? 'translate-x-1 translate-y-1' : ''
      }`}
    >
      <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 text-slate-100 flex flex-col justify-between min-h-[520px]">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold uppercase tracking-wider">
            <Swords className="w-4 h-4 animate-bounce" />
            <span>CONFRONTO TÁTICO TERRITORIAL</span>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onRetreat();
            }}
            disabled={battleEnded !== null}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Recuar
          </button>
        </div>

        {/* Combatants Center Arena */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
          {/* Player Combatant Card */}
          <div
            className={`p-4 rounded-xl bg-slate-950/70 border transition-all ${
              flash === 'player' ? 'border-rose-500 bg-rose-950/40' : 'border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/40 font-bold uppercase">
                  {playerTierCfg.label}
                </span>
                <h4 className="text-sm font-bold text-slate-200 mt-1">{player.name}</h4>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono text-slate-400">NÍVEL {player.level}</div>
                <div className="text-[11px] font-mono text-cyan-400">ATK +{attackBonus} · DEF +{defenseBonus}</div>
              </div>
            </div>

            {/* HP Bar */}
            <div className="space-y-1 mt-3">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Integridade Estrutural:</span>
                <span className="font-bold text-emerald-400 tabular-nums">
                  {playerHp} / {player.maxHealth}
                </span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-300"
                  style={{ width: `${(playerHp / player.maxHealth) * 100}%` }}
                />
              </div>
            </div>

            {/* Energy Bar */}
            <div className="space-y-1 mt-2.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Reserva de Energia EMP:</span>
                <span className="font-bold text-cyan-400 tabular-nums">{playerEnergy}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full transition-all duration-200"
                  style={{ width: `${playerEnergy}%` }}
                />
              </div>
            </div>

            {isDefending && (
              <div className="mt-3 p-1.5 rounded bg-sky-950/60 border border-sky-400/50 text-sky-300 text-[11px] font-mono flex items-center gap-1.5 justify-center">
                <Shield className="w-3.5 h-3.5" /> Barreira Defletora Pronta
              </div>
            )}
          </div>

          {/* Rival Combatant Card */}
          <div
            className={`p-4 rounded-xl bg-slate-950/70 border transition-all ${
              flash === 'rival' ? 'border-rose-500 bg-rose-950/40' : 'border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded border font-bold uppercase"
                  style={{
                    backgroundColor: `${rivalTierCfg.color}20`,
                    borderColor: `${rivalTierCfg.color}50`,
                    color: rivalTierCfg.color,
                  }}
                >
                  {rivalTierCfg.label}
                </span>
                <h4 className="text-sm font-bold text-slate-200 mt-1">
                  {rival.name} <span className="text-xs font-mono text-slate-400">({rival.codename})</span>
                </h4>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono text-rose-400">NÍVEL {rival.level}</div>
                <div className="text-[11px] font-mono text-slate-400">Poder: {rival.attackPower}</div>
              </div>
            </div>

            {/* Rival HP Bar */}
            <div className="space-y-1 mt-3">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Blindagem Rival:</span>
                <span className="font-bold text-rose-400 tabular-nums">
                  {rivalHp} / {rival.maxHealth}
                </span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-300"
                  style={{ width: `${(rivalHp / rival.maxHealth) * 100}%` }}
                />
              </div>
            </div>

            {/* Telegraph Warning */}
            {rivalTelegraph ? (
              <div className="mt-3 p-2 rounded bg-rose-950/70 border border-rose-500/70 text-rose-300 text-xs font-mono flex items-center justify-between animate-pulse">
                <span className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" /> {rivalTelegraph.action}
                </span>
                <span className="text-[10px] bg-rose-900 px-1.5 py-0.5 rounded">BLOQUEIA AGORA!</span>
              </div>
            ) : (
              <div className="mt-3 p-2 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-500 text-center">
                Rival em mira táctica...
              </div>
            )}
          </div>
        </div>

        {/* Battle Log Terminal */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1 min-h-[85px]">
          <div className="text-slate-500 uppercase text-[10px] tracking-widest border-b border-slate-800/80 pb-1 mb-1">
            REGISTO DE COMBATE
          </div>
          {battleLog.map((log, idx) => (
            <div key={idx} className={idx === 0 ? 'text-cyan-300 font-semibold' : 'text-slate-400'}>
              › {log}
            </div>
          ))}
        </div>

        {/* Player Action Buttons */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap gap-2.5 justify-center">
          <button
            onClick={handlePlayerAttack}
            disabled={battleEnded !== null}
            className="flex-1 min-w-[130px] px-4 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-40"
          >
            <Zap className="w-4 h-4 text-slate-950" />
            Disparo de Plasma
          </button>

          <button
            onClick={handlePlayerDefend}
            disabled={battleEnded !== null || isDefending}
            className="flex-1 min-w-[130px] px-4 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/40 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer disabled:opacity-40"
          >
            <Shield className="w-4 h-4 text-sky-400" />
            Barreira (Escudo)
          </button>

          <button
            onClick={handleEmpPulse}
            disabled={battleEnded !== null || playerEnergy < 40}
            className={`flex-1 min-w-[130px] px-4 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider border flex items-center justify-center gap-2 transition-transform active:scale-95 ${
              playerEnergy >= 40
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 hover:bg-cyan-500/30 cursor-pointer'
                : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            <Flame className="w-4 h-4 text-cyan-400" />
            Pulso EMP (40 E)
          </button>
        </div>

        {/* Victory / Defeat Overlay Modal */}
        {battleEnded && (
          <div className="absolute inset-0 bg-slate-950/90 rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            {battleEnded === 'victory' ? (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 mb-3">
                  <Trophy className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold font-mono text-emerald-400">VITÓRIA TERRITORIAL!</h3>
                <p className="text-xs text-slate-300 max-w-sm mt-1">
                  Derrotaste o caçador rival {rival.name}. O setor está agora sob o teu domínio temporário.
                </p>
                <div className="mt-4 p-3 rounded-xl bg-slate-900 border border-slate-800 text-left w-full max-w-xs">
                  <div className="text-[10px] font-mono text-slate-400">ESPÓLIO OBTIDO:</div>
                  <div className="text-xs font-bold text-amber-300 mt-0.5">{rival.lootItem.name}</div>
                  <div className="text-[10px] font-mono text-emerald-400 mt-1">+450 XP de Combate</div>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-400 mb-3">
                  <Skull className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold font-mono text-rose-400">SISTEMAS SOBRECARREGADOS</h3>
                <p className="text-xs text-slate-300 max-w-sm mt-1">
                  O drone foi repelido por {rival.name}. Recupera energia no quartel ou explora novas áreas.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
