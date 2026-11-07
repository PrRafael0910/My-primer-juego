import React, { useState } from 'react';
import { X, Sword, Pickaxe, Drill, Axe, Scissors, ShieldAlert, Sparkles, Check, Play, Eye, Radio, Zap } from 'lucide-react';
import { GameItem, ToolId } from '../types/game';
import { sound } from '../audio/soundManager';

interface InventoryModalProps {
  inventory: GameItem[];
  activeToolId: ToolId;
  onSelectActiveTool: (toolId: ToolId) => void;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  inventory,
  activeToolId,
  onSelectActiveTool,
  onClose,
}) => {
  const tools = inventory.filter((item) => item.category === 'weapon' || item.category === 'tool');
  const resources = inventory.filter((item) => item.category !== 'weapon' && item.category !== 'tool');

  const [selectedToolId, setSelectedToolId] = useState<ToolId>(activeToolId);
  const [isSimulatingWork, setIsSimulatingWork] = useState(false);

  const currentTool = tools.find((t) => t.toolType === selectedToolId) || tools[0];

  const handleSimulateWork = (toolType: ToolId) => {
    setIsSimulatingWork(true);
    switch (toolType) {
      case 'sword':
        sound.playSlash();
        break;
      case 'pickaxe':
        sound.playMine();
        break;
      case 'drill':
        sound.playDrill();
        break;
      case 'axe':
        sound.playChop();
        break;
      case 'knife':
        sound.playSkin();
        break;
    }

    setTimeout(() => {
      setIsSimulatingWork(false);
    }, 900);
  };

  const handleEquipTool = (toolType: ToolId) => {
    sound.playSelect();
    setSelectedToolId(toolType);
    onSelectActiveTool(toolType);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md select-none font-scifi">
      {/* Hologram Emitter Frame from K.I.T.'s Eye */}
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] bg-slate-900/95 border-2 border-cyan-400 rounded-2xl shadow-[0_0_60px_rgba(34,211,238,0.35)] overflow-hidden">
        {/* Hologram Header Bar: K.I.T. Projection Identity */}
        <div className="relative flex items-center justify-between px-6 py-4 border-b border-cyan-500/40 bg-slate-950">
          <div className="flex items-center gap-3">
            {/* K.I.T. Eye Avatar with animated holographic pulse */}
            <div className="relative w-10 h-10 rounded-full bg-slate-800 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_20px_#22d3ee]">
              <Eye className="w-5 h-5 text-cyan-300 animate-pulse" />
              <div className="absolute -inset-1 border border-cyan-400/40 rounded-full animate-ping" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-100 font-arcade uppercase tracking-wider">
                  K.I.T. // Proyección Holográfica de Inventario
                </h2>
                <span className="text-[10px] px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-500/50 rounded font-telemetry">
                  OJO CENTRAL ACTIVO
                </span>
              </div>
              <p className="text-xs text-slate-400">
                K.I.T. administra el arsenal y equipa las herramientas visibles en la mano
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playSelect();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-cyan-300 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left column Tools & Interactive Simulator, Right column Resources */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-y-auto">
          {/* Left Column: Tools Selector & Interactive Live Simulation (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-arcade">
                Arsenal y Herramientas (5)
              </span>
              <span className="text-xs text-cyan-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Visible en Mano: <strong>{currentTool?.name}</strong></span>
              </span>
            </div>

            {/* Tool Selection Cards Row */}
            <div className="grid grid-cols-5 gap-2">
              {tools.map((tool) => {
                const isSelected = selectedToolId === tool.toolType;
                const isEquipped = activeToolId === tool.toolType;

                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setSelectedToolId(tool.toolType!);
                      handleEquipTool(tool.toolType!);
                      handleSimulateWork(tool.toolType!);
                    }}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 border-cyan-400 shadow-lg shadow-cyan-950/60 scale-105'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-md bg-slate-900 flex items-center justify-center text-cyan-400 mb-1.5 border border-slate-800">
                      {tool.toolType === 'sword' && <Sword className="w-5 h-5" />}
                      {tool.toolType === 'pickaxe' && <Pickaxe className="w-5 h-5" />}
                      {tool.toolType === 'drill' && <Drill className="w-5 h-5" />}
                      {tool.toolType === 'axe' && <Axe className="w-5 h-5" />}
                      {tool.toolType === 'knife' && <Scissors className="w-5 h-5" />}
                    </div>
                    <span className="text-[11px] font-bold text-slate-200 truncate w-full">
                      {tool.name}
                    </span>
                    {isEquipped && (
                      <span className="mt-1 text-[9px] px-1 bg-cyan-950 text-cyan-300 border border-cyan-500/40 rounded font-telemetry font-bold">
                        EN MANO
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Interactive Live Work Simulation Stage */}
            <div className="relative flex flex-col p-5 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-amber-300 font-arcade">
                    {currentTool?.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {currentTool?.description}
                  </p>
                </div>

                <button
                  onClick={() => handleSimulateWork(currentTool.toolType!)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded transition-all cursor-pointer active:scale-95 font-scifi"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Probar Animación</span>
                </button>
              </div>

              {/* Dynamic Interactive Work Simulation Viewport */}
              <div className="relative w-full h-44 my-4 bg-slate-900 rounded-lg border border-slate-800/80 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

                {/* 1. Sword: Slash and Thrust Animation */}
                {currentTool.toolType === 'sword' && (
                  <div className="relative flex flex-col items-center">
                    <div
                      className={`transition-all duration-300 origin-bottom-right ${
                        isSimulatingWork ? 'rotate-45 scale-125' : 'rotate-0'
                      }`}
                    >
                      <div className="w-4 h-24 bg-gradient-to-t from-slate-400 via-slate-100 to-cyan-300 rounded-t-sm shadow-[0_0_20px_#22d3ee] flex items-center justify-center border border-slate-950">
                        <div className="w-0.5 h-20 bg-cyan-400/80" />
                      </div>
                      <div className="w-12 h-3 -mt-1 bg-amber-500 rounded-sm -ml-4 border border-slate-950" />
                      <div className="w-3 h-8 bg-slate-800 rounded-b -ml-0.5 border border-slate-950" />
                    </div>

                    {isSimulatingWork && (
                      <div className="absolute -top-6 -right-10 text-cyan-300 text-xs font-bold animate-ping">
                        ✦ ESTOCADA DE COMBATE ✦
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Pickaxe: Mineral Mining Animation with Spark Burst */}
                {currentTool.toolType === 'pickaxe' && (
                  <div className="relative flex items-center gap-4">
                    <div
                      className={`transition-transform duration-200 origin-bottom ${
                        isSimulatingWork ? '-rotate-45 translate-x-3' : 'rotate-12'
                      }`}
                    >
                      <Pickaxe className="w-20 h-20 text-cyan-400 drop-shadow-[0_0_12px_#38bdf8]" />
                    </div>

                    <div className="w-16 h-16 rounded bg-slate-800 border-2 border-amber-400/80 flex items-center justify-center relative">
                      <Sparkles className="w-8 h-8 text-amber-300" />
                      {isSimulatingWork && (
                        <div className="absolute -top-4 -right-4 flex gap-1">
                          <span className="w-2 h-2 bg-amber-300 rounded-full animate-ping" />
                          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Drill: Rotational Vibration & Heat Friction Animation */}
                {currentTool.toolType === 'drill' && (
                  <div className="relative flex items-center gap-3">
                    <div
                      className={`transition-all duration-75 ${
                        isSimulatingWork ? 'translate-x-4 animate-bounce' : ''
                      }`}
                    >
                      <Drill className="w-20 h-20 text-emerald-400 drop-shadow-[0_0_15px_#10b981]" />
                    </div>

                    <div className="w-16 h-16 rounded-lg bg-zinc-900 border-2 border-red-500/80 flex items-center justify-center relative">
                      <span className="text-[10px] text-red-400 font-bold uppercase">Basalto</span>
                      {isSimulatingWork && (
                        <div className="absolute -inset-1 border border-orange-400 animate-pulse rounded-lg" />
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Axe: Wood Chopping Arc */}
                {currentTool.toolType === 'axe' && (
                  <div className="relative flex items-center gap-4">
                    <div
                      className={`transition-transform duration-300 origin-bottom ${
                        isSimulatingWork ? 'rotate-45 -translate-y-2' : '-rotate-15'
                      }`}
                    >
                      <Axe className="w-20 h-20 text-amber-400 drop-shadow-[0_0_12px_#f59e0b]" />
                    </div>

                    <div className="w-12 h-24 rounded bg-emerald-950 border border-emerald-400 flex flex-col items-center justify-center">
                      <span className="text-[9px] text-emerald-300 font-bold rotate-90">SILICIO</span>
                    </div>
                  </div>
                )}

                {/* 5. Knife: Precision Skinning */}
                {currentTool.toolType === 'knife' && (
                  <div className="relative flex items-center gap-6">
                    <div
                      className={`transition-all duration-200 ${
                        isSimulatingWork ? 'translate-x-6 rotate-12' : ''
                      }`}
                    >
                      <Scissors className="w-16 h-16 text-purple-400 drop-shadow-[0_0_12px_#c084fc]" />
                    </div>

                    <div className="w-20 h-16 rounded bg-purple-950/60 border border-purple-400/60 flex items-center justify-center text-[10px] text-purple-300 font-bold">
                      Piel de Bestia
                    </div>
                  </div>
                )}
              </div>

              {/* Action Equip Button */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">
                  Daño base: <strong className="text-emerald-400 font-telemetry">{currentTool?.damage} pts</strong>
                </span>

                <button
                  onClick={() => handleEquipTool(currentTool.toolType!)}
                  disabled={activeToolId === currentTool.toolType}
                  className={`flex items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
                    activeToolId === currentTool.toolType
                      ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40 cursor-default'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer shadow-md'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {activeToolId === currentTool.toolType ? 'Equipado en Mano' : 'Equipar en Mano'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Inventory Resources & Safe Chest Warning (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-arcade">
                Mochila de Expedición ({resources.length})
              </span>
              <span className="text-xs text-slate-400 font-telemetry">
                Telemetría K.I.T.
              </span>
            </div>

            {/* Resources Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {resources.length === 0 ? (
                <div className="col-span-2 py-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded border border-slate-800">
                  Mochila vacía. Extrae minerales, madera o chatarra fuera del búnker.
                </div>
              ) : (
                resources.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-bold text-slate-200 leading-tight">
                        {item.name}
                      </span>
                      <span className="text-xs font-bold text-cyan-400 font-telemetry px-1.5 py-0.5 bg-slate-900 rounded">
                        x{item.quantity}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Safe Chest Warning */}
            <div className="mt-auto p-3.5 bg-amber-950/40 border border-amber-600/50 rounded-lg text-xs text-amber-200">
              <div className="flex items-center gap-2 font-bold mb-1">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Protocolo de Protección del Búnker</span>
              </div>
              <p className="text-[11px] text-amber-300/90 leading-relaxed">
                Al morir en Aethel perderás los recursos no procesados que lleves en la mochila. Guárdalos en el <strong>Cofre Seguro de Almacenamiento (X: 11..13, Y: 8..10)</strong> para mantenerlos a salvo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
