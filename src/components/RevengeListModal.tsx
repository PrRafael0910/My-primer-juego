import React, { useState } from 'react';
import { X, Flame, ShieldAlert, Sun, Crosshair, Award } from 'lucide-react';
import { REVENGE_TARGETS } from '../data/revengeList';
import { sound } from '../audio/soundManager';

interface RevengeListModalProps {
  onClose: () => void;
}

export const RevengeListModal: React.FC<RevengeListModalProps> = ({ onClose }) => {
  const [selectedTargetId, setSelectedTargetId] = useState(REVENGE_TARGETS[0].id);
  const currentTarget = REVENGE_TARGETS.find((t) => t.id === selectedTargetId) || REVENGE_TARGETS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md select-none font-scifi">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] bg-slate-900 border-2 border-red-500/60 rounded-xl shadow-[0_0_40px_rgba(239,68,68,0.2)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-red-500/30 bg-slate-950">
          <div className="flex items-center gap-3">
            <Flame className="w-5 h-5 text-red-500 animate-pulse" />
            <div>
              <h2 className="text-base font-bold text-slate-100 font-arcade uppercase tracking-wider">
                Lista de la Venganza · Casino Intergaláctico
              </h2>
              <p className="text-xs text-slate-400">
                Soles de Aethel robados · Administradores de Prisiones y Secuaces
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playSelect();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-y-auto">
          {/* Target List (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-arcade pb-1 border-b border-slate-800">
              Objetivos Prioritarios (4)
            </span>

            {REVENGE_TARGETS.map((target) => {
              const isSelected = selectedTargetId === target.id;
              return (
                <div
                  key={target.id}
                  onClick={() => {
                    sound.playHover();
                    setSelectedTargetId(target.id);
                  }}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-red-950/40 border-red-500 shadow-lg shadow-red-950/50 scale-[1.01]'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-100 font-arcade">
                        {target.name}
                      </h4>
                      <p className="text-[11px] text-amber-400 font-medium mt-0.5">
                        "{target.alias}"
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-900/60 border border-red-500/40 text-red-300 font-telemetry">
                      {target.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-1">
                    {target.sector}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Target Dossier (7 cols) */}
          <div className="lg:col-span-7 flex flex-col bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-inner">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-telemetry">
                  Expediente de Represalia
                </span>
                <h3 className="text-lg font-bold text-amber-300 font-arcade mt-0.5">
                  {currentTarget.name}
                </h3>
              </div>
              <span className="text-xs text-red-400 font-bold font-telemetry">
                {currentTarget.difficulty}
              </span>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-300 block mb-1">Ubicación y Sector:</span>
                <p className="text-cyan-300 font-telemetry bg-slate-900 p-2 rounded border border-slate-800">
                  {currentTarget.sector}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-300 block mb-1">Crimen contra Aethel:</span>
                <p className="text-slate-300 bg-slate-900 p-2.5 rounded border border-slate-800 leading-relaxed">
                  {currentTarget.crime}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-300 block mb-1">Descripción Táctica:</span>
                <p className="text-slate-400 leading-relaxed">
                  {currentTarget.description}
                </p>
              </div>

              {/* Sun Reward Card */}
              <div className="p-3.5 bg-gradient-to-r from-amber-950/40 to-yellow-950/30 border border-amber-500/50 rounded-lg flex items-center gap-3">
                <Sun className="w-6 h-6 text-amber-400 shrink-0 animate-spin" />
                <div>
                  <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider font-telemetry">
                    Sol en Apuesta a Recuperar:
                  </div>
                  <div className="text-sm font-bold text-amber-200 font-arcade">
                    {currentTarget.sunReward}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{currentTarget.coordinatesHint}</span>
              </div>
            </div>

            <div className="mt-auto pt-4 flex justify-end">
              <button
                onClick={() => {
                  sound.playSelect();
                  onClose();
                }}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-500 text-slate-950 rounded transition-colors cursor-pointer"
              >
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
