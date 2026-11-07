import React from 'react';
import { Skull, RotateCcw, ShieldCheck, AlertOctagon } from 'lucide-react';
import { GameItem } from '../types/game';
import { sound } from '../audio/soundManager';

interface DeathModalProps {
  lostResources: GameItem[];
  onRespawn: () => void;
}

export const DeathModal: React.FC<DeathModalProps> = ({
  lostResources,
  onRespawn,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg select-none font-scifi animate-in fade-in duration-300">
      <div className="flex flex-col w-full max-w-md bg-slate-900 border-2 border-red-600 rounded-2xl shadow-[0_0_60px_rgba(239,68,68,0.4)] p-6 text-center">
        {/* Skull Icon */}
        <div className="w-16 h-16 rounded-full bg-red-950/80 border-2 border-red-500 mx-auto flex items-center justify-center text-red-400 mb-4 animate-bounce">
          <Skull className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold tracking-wider text-red-400 font-arcade uppercase">
          Soporte Vital Crítico: Caído en Aethel
        </h2>
        <p className="text-xs text-slate-300 mt-1 mb-5">
          K.I.T. activó el protocolo de teletransporte de emergencia a la <strong>Cápsula de Estasis (X: 1..3, Y: 8..11)</strong>.
        </p>

        {/* Lost vs Preserved Details */}
        <div className="space-y-3 text-left mb-6">
          {/* Lost raw resources */}
          <div className="p-3 bg-slate-950 border border-red-900/60 rounded-lg">
            <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase font-arcade mb-1.5">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span>Recursos Perdidos en el Yermo:</span>
            </div>
            {lostResources.length === 0 ? (
              <span className="text-xs text-slate-400 italic">
                No llevabas recursos no procesados en la mochila.
              </span>
            ) : (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {lostResources.map((item) => (
                  <span
                    key={item.id}
                    className="text-[11px] px-2 py-0.5 bg-red-950/60 text-red-300 border border-red-800 rounded font-telemetry"
                  >
                    {item.name} (x{item.quantity})
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Preserved Chest Guarantee */}
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase font-arcade mb-1">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Cofre Seguro (X: 11..13, Y: 8..10) Intacto:</span>
            </div>
            <p className="text-[11px] text-emerald-300/90 leading-relaxed">
              Tus herramientas básicas y todos los ítems almacenados en el cofre del búnker se mantienen a salvo.
            </p>
          </div>
        </div>

        {/* Respawn Button */}
        <button
          onClick={() => {
            sound.playSelect();
            onRespawn();
          }}
          className="flex items-center justify-center gap-2.5 w-full py-3.5 px-6 text-xs sm:text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 hover:brightness-110 text-slate-950 rounded-lg shadow-lg cursor-pointer transition-transform active:scale-95 font-scifi"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reanimarse en Cápsula de Estasis (2, 9)</span>
        </button>
      </div>
    </div>
  );
};
