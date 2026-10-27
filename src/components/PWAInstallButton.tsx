import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { sound } from '../utils/audio';
import { Download, Share2, PlusSquare, X, CheckCircle2, Smartphone } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'prominent' | 'dock';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);

  // If already running in standalone app mode, hide
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    sound.playClick();
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstallSuccess(true);
        sound.playLevelUp();
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // General instructions modal if browser doesn't expose beforeinstallprompt yet
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {variant === 'prominent' ? (
        <button
          onClick={handleInstallClick}
          className="group px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-sky-500/20 border border-cyan-400/50 hover:border-cyan-400 text-cyan-300 text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(56,189,248,0.25)] flex items-center gap-2 cursor-pointer active:scale-95"
          title="Instalar GeoHunter como Aplicação Nativa"
        >
          <Download className="w-4 h-4 text-cyan-400 group-hover:translate-y-0.5 transition-transform" />
          <span>Instalar App</span>
        </button>
      ) : variant === 'dock' ? (
        <button
          onClick={handleInstallClick}
          className="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 transition-colors flex items-center gap-1.5 text-xs font-mono"
          title="Instalar no Smartphone ou Computador"
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Instalar App</span>
        </button>
      ) : (
        <button
          onClick={handleInstallClick}
          className="p-2 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1.5 text-xs font-mono"
          title="Instalar Aplicação PWA"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">Instalar App</span>
        </button>
      )}

      {/* iOS or General Guided Installation Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none pointer-events-auto">
          <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 text-slate-100 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold font-mono text-slate-100 uppercase">
                  Instalar no Teu Dispositivo
                </h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs text-slate-300 font-sans leading-relaxed">
              <p>
                Para jogar o <strong>GeoHunter</strong> em ecrã total como uma app nativa e com melhor desempenho GPS:
              </p>

              {isIOS ? (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 font-mono text-[11px]">
                  <div className="flex items-center gap-2 text-cyan-300">
                    <Share2 className="w-4 h-4 shrink-0 text-cyan-400" />
                    <span>1. Toca no botão <strong>Partilhar</strong> na barra do Safari.</span>
                  </div>
                  <div className="flex items-center gap-2 text-cyan-300">
                    <PlusSquare className="w-4 h-4 shrink-0 text-cyan-400" />
                    <span>2. Seleciona <strong>"Adicionar ao Ecrã Principal"</strong>.</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 font-mono text-[11px]">
                  <div className="flex items-center gap-2 text-cyan-300">
                    <Download className="w-4 h-4 shrink-0 text-cyan-400" />
                    <span>1. Toca no menu do navegador (três pontos ⋮).</span>
                  </div>
                  <div className="flex items-center gap-2 text-cyan-300">
                    <Smartphone className="w-4 h-4 shrink-0 text-cyan-400" />
                    <span>2. Escolhe <strong>"Instalar Aplicação"</strong> ou <strong>"Adicionar ao Ecrã Inicial"</strong>.</span>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-400">
                A app será adicionada ao teu ecrã com ícone próprio, funcionamento offline e carregamento ultra-rápido.
              </p>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl font-mono text-xs font-bold uppercase bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
