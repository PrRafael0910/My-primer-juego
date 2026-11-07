import React from 'react';
import { Play, Map as MapIcon, Sliders, Save, Home, Shield } from 'lucide-react';
import { sound } from '../audio/soundManager';

interface PauseModalProps {
  onResume: () => void;
  onOpenMap: () => void;
  onOpenOptions: () => void;
  onSaveCheckpoint: () => void;
  onReturnToTitle: () => void;
  saveMessage: string | null;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onOpenMap,
  onOpenOptions,
  onSaveCheckpoint,
  onReturnToTitle,
  saveMessage,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none font-scifi">
      <div className="flex flex-col w-full max-w-sm bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 text-center">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-2 text-amber-300">
          <Shield className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-bold tracking-wider font-arcade uppercase">
            Juego Pausado
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Protocolo de simulación detenido temporalmente
        </p>

        {/* Buttons List */}
        <div className="flex flex-col gap-3">
          {/* Reanudar */}
          <button
            onClick={() => {
              sound.playSelect();
              onResume();
            }}
            onMouseEnter={() => sound.playHover()}
            className="flex items-center justify-center gap-2.5 py-3 px-4 text-xs font-bold uppercase tracking-wider bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-md transition-colors cursor-pointer shadow-md font-scifi"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Reanudar Exploración (Esc)</span>
          </button>

          {/* Abrir Mapa */}
          <button
            onClick={() => {
              sound.playSelect();
              onOpenMap();
            }}
            onMouseEnter={() => sound.playHover()}
            className="flex items-center justify-center gap-2.5 py-2.5 px-4 text-xs font-semibold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors cursor-pointer font-scifi"
          >
            <MapIcon className="w-4 h-4 text-cyan-400" />
            <span>Mapa Táctico (M)</span>
          </button>

          {/* Guardar Checkpoint */}
          <button
            onClick={() => {
              sound.playSelect();
              onSaveCheckpoint();
            }}
            onMouseEnter={() => sound.playHover()}
            className="flex items-center justify-center gap-2.5 py-2.5 px-4 text-xs font-semibold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors cursor-pointer font-scifi"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>Guardar Punto de Control</span>
          </button>

          {saveMessage && (
            <div className="text-[11px] text-emerald-400 font-semibold py-1 animate-pulse">
              {saveMessage}
            </div>
          )}

          {/* Opciones */}
          <button
            onClick={() => {
              sound.playSelect();
              onOpenOptions();
            }}
            onMouseEnter={() => sound.playHover()}
            className="flex items-center justify-center gap-2.5 py-2.5 px-4 text-xs font-semibold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors cursor-pointer font-scifi"
          >
            <Sliders className="w-4 h-4 text-slate-300" />
            <span>Opciones de Audio & Pantalla</span>
          </button>

          {/* Volver al Menú Principal */}
          <button
            onClick={() => {
              sound.playSelect();
              onReturnToTitle();
            }}
            onMouseEnter={() => sound.playHover()}
            className="flex items-center justify-center gap-2.5 py-2 px-4 mt-2 text-xs font-semibold uppercase tracking-wider bg-slate-950/80 hover:bg-red-950/40 text-slate-400 hover:text-red-300 border border-slate-800 hover:border-red-800 rounded-md transition-colors cursor-pointer font-scifi"
          >
            <Home className="w-4 h-4" />
            <span>Volver al Menú Principal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
