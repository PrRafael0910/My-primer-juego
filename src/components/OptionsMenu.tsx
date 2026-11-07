import React from 'react';
import { X, Volume2, Monitor, Keyboard, RefreshCw } from 'lucide-react';
import { GameSettings } from '../types/game';
import { sound } from '../audio/soundManager';

interface OptionsMenuProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onResetSave: () => void;
  onClose: () => void;
}

export const OptionsMenu: React.FC<OptionsMenuProps> = ({
  settings,
  onUpdateSettings,
  onResetSave,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none font-scifi">
      <div className="relative flex flex-col w-full max-w-xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <Monitor className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100 font-arcade uppercase">
              Configuración y Controles
            </h2>
          </div>
          <button
            onClick={() => {
              sound.playSelect();
              onClose();
            }}
            className="p-1 text-slate-400 hover:text-slate-100 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Audio Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-1">
              <Volume2 className="w-4 h-4" />
              <span>Sintetizador de Audio Web</span>
            </div>

            {/* Master Volume */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                <span>Volumen Maestro</span>
                <span className="font-telemetry font-bold">{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.masterVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateSettings({ masterVolume: val });
                  sound.setVolumes(val, settings.sfxVolume, settings.musicVolume);
                }}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* SFX Volume */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                <span>Efectos de Sonido (SFX)</span>
                <span className="font-telemetry font-bold">{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateSettings({ sfxVolume: val });
                  sound.setVolumes(settings.masterVolume, val, settings.musicVolume);
                }}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Ambient Synth */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                <span>Música & Ambiente Estelar</span>
                <span className="font-telemetry font-bold">{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateSettings({ musicVolume: val });
                  sound.setVolumes(settings.masterVolume, settings.sfxVolume, val);
                }}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Video & Display Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-1">
              <Monitor className="w-4 h-4" />
              <span>Pantalla y Renderizado</span>
            </div>

            <label className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
              <span className="text-xs text-slate-300">Líneas de Escaneo CRT Retro (Scanlines)</span>
              <input
                type="checkbox"
                checked={settings.scanlines}
                onChange={(e) => onUpdateSettings({ scanlines: e.target.checked })}
                className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
              <span className="text-xs text-slate-300">Vibración de Pantalla (Screen Shake)</span>
              <input
                type="checkbox"
                checked={settings.screenShake}
                onChange={(e) => onUpdateSettings({ screenShake: e.target.checked })}
                className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Controls Reference Sheet */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-1">
              <Keyboard className="w-4 h-4" />
              <span>Asignación de Teclas (Controles)</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Movimiento</span>
                <span className="font-telemetry font-bold text-cyan-400">W, A, S, D / Flechas</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Correr (Sprint)</span>
                <span className="font-telemetry font-bold text-cyan-400">Shift</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Escáner K.I.T.</span>
                <span className="font-telemetry font-bold text-cyan-400">Espacio</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Interactuar</span>
                <span className="font-telemetry font-bold text-cyan-400">E</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Mapa Completo</span>
                <span className="font-telemetry font-bold text-cyan-400">M</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Pausar Juego</span>
                <span className="font-telemetry font-bold text-cyan-400">Escape</span>
              </div>
            </div>
          </div>

          {/* Reset Save Data */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                if (window.confirm('¿Reiniciar todos los datos de guardado y telemetría?')) {
                  onResetSave();
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-red-900/50 rounded transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reiniciar Progreso Guardado</span>
            </button>

            <button
              onClick={() => {
                sound.playSelect();
                onClose();
              }}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded transition-colors cursor-pointer"
            >
              Guardar y Salir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
