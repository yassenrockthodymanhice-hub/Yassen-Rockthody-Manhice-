import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none">
      {!isOnline ? (
        <div className="flex items-center gap-2 rounded-full bg-amber-500/90 backdrop-blur-md px-3.5 py-1.5 text-xs font-mono font-semibold text-slate-950 shadow-xl border border-amber-300">
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>Modo Offline Ativo · Dados e radar em cache local</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-full bg-emerald-500/90 backdrop-blur-md px-3.5 py-1.5 text-xs font-mono font-semibold text-slate-950 shadow-xl border border-emerald-300 animate-fade-in">
          <Wifi className="w-3.5 h-3.5 shrink-0" />
          <span>Rede Reestabelecida · Sincronização GPS Ativa</span>
        </div>
      )}
    </div>
  );
};
