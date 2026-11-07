import React, { useState } from 'react';
import { X, Shield, AlertTriangle, Compass, Crosshair } from 'lucide-react';
import { PlayerState, Tile } from '../types/game';
import { MAP_SIZE, BUNKER_MAX_X, BUNKER_MAX_Y, SPAWN_POINT, getSectorName } from '../game/mapGenerator';
import { sound } from '../audio/soundManager';

interface WorldMapModalProps {
  player: PlayerState;
  map: Tile[][];
  onClose: () => void;
}

export const WorldMapModal: React.FC<WorldMapModalProps> = ({
  player,
  onClose,
}) => {
  const [hoveredCoords, setHoveredCoords] = useState<{ x: number; y: number } | null>(null);

  const handleMapMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * MAP_SIZE)));
    const py = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(((e.clientY - rect.top) / rect.height) * MAP_SIZE)));
    setHoveredCoords({ x: px, y: py });
  };

  const currentHoverSector = hoveredCoords
    ? getSectorName(hoveredCoords.x, hoveredCoords.y)
    : getSectorName(Math.floor(player.x), Math.floor(player.y));

  const hoveredX = hoveredCoords ? hoveredCoords.x : Math.floor(player.x);
  const hoveredY = hoveredCoords ? hoveredCoords.y : Math.floor(player.y);

  // Distance danger calculation
  const dx = Math.max(0, hoveredX - BUNKER_MAX_X);
  const dy = Math.max(0, hoveredY - BUNKER_MAX_Y);
  const maxDist = Math.hypot(MAP_SIZE - BUNKER_MAX_X, MAP_SIZE - BUNKER_MAX_Y);
  const currentDist = Math.hypot(dx, dy);
  const dangerPct = (hoveredX <= BUNKER_MAX_X && hoveredY <= BUNKER_MAX_Y)
    ? 0
    : Math.round(Math.min(1, Math.max(0.05, currentDist / maxDist)) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md select-none font-scifi">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-cyan-500/60 rounded-xl shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <Compass className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-lg font-bold text-slate-100 font-arcade uppercase">
                Cartografía Táctica de Aethel
              </h2>
              <p className="text-xs text-slate-400">
                Cuadrícula Planetaria de 100x100 Celdas · Búnker Alpha (14x12 Celdas, 0..13, 0..11)
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playSelect();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tactical Map Container & Coordinate Grid */}
        <div className="flex flex-col md:flex-row gap-6 p-6 overflow-y-auto">
          {/* Left: 100x100 Visual Grid */}
          <div className="relative flex-1 aspect-square max-w-[460px] mx-auto bg-slate-950 border-2 border-slate-700 rounded-lg overflow-hidden shadow-inner cursor-crosshair">
            <div
              onMouseMove={handleMapMouseMove}
              onMouseLeave={() => setHoveredCoords(null)}
              className="relative w-full h-full"
            >
              {/* Background gradient from bunker (emerald) to vortex apex (red/purple) */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/40 to-red-950/70" />

              {/* Grid Lines (every 10 units) */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: `linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)`,
                  backgroundSize: '10% 10%',
                }}
              />

              {/* Sector 1 to 4 concentric arc / zone overlays */}
              {/* Bunker Safe Zone (14x12, 0..13, 0..11) */}
              <div
                className="absolute left-0 top-0 border-2 border-emerald-400 bg-emerald-500/25 transition-colors"
                style={{
                  width: `${((BUNKER_MAX_X + 1) / MAP_SIZE) * 100}%`,
                  height: `${((BUNKER_MAX_Y + 1) / MAP_SIZE) * 100}%`,
                }}
              >
                <div className="absolute bottom-1 right-2 text-[10px] font-bold text-emerald-300 font-arcade">
                  BÚNKER 14x12
                </div>
              </div>

              {/* Spawn Point Marker (2, 9) */}
              <div
                className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300 bg-emerald-400 shadow-[0_0_8px_#34d399]"
                style={{
                  left: `${(SPAWN_POINT.x / MAP_SIZE) * 100}%`,
                  top: `${(SPAWN_POINT.y / MAP_SIZE) * 100}%`,
                }}
                title={`Punto de Spawn Inicial (${SPAWN_POINT.x}, ${SPAWN_POINT.y})`}
              />

              {/* Apex Vortex Marker (100, 100) */}
              <div
                className="absolute bottom-2 right-2 text-right p-1.5 bg-red-950/80 border border-red-500/50 rounded pointer-events-none"
              >
                <span className="text-[9px] font-bold text-red-400 font-arcade uppercase block">
                  VÓRTICE SOLAR
                </span>
                <span className="text-[8px] text-red-300">Peligro 100%</span>
              </div>

              {/* Current Player Realtime Position */}
              <div
                className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400 border-2 border-white shadow-[0_0_12px_#38bdf8] pointer-events-none animate-pulse"
                style={{
                  left: `${(player.x / MAP_SIZE) * 100}%`,
                  top: `${(player.y / MAP_SIZE) * 100}%`,
                }}
              >
                {/* Ping ring */}
                <div className="absolute -inset-2 border border-cyan-400 rounded-full animate-ping opacity-75" />
              </div>

              {/* Hover crosshair target */}
              {hoveredCoords && (
                <div
                  className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center text-amber-400"
                  style={{
                    left: `${(hoveredCoords.x / MAP_SIZE) * 100}%`,
                    top: `${(hoveredCoords.y / MAP_SIZE) * 100}%`,
                  }}
                >
                  <Crosshair className="w-5 h-5 animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Right: Telemetry & Sector Legend */}
          <div className="flex flex-col justify-between flex-1 gap-4">
            {/* Target Coordinate Telemetry Card */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-telemetry mb-1">
                {hoveredCoords ? 'Objetivo Apuntado' : 'Posición del Jugador'}
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold text-amber-300 font-arcade">
                  X: {hoveredX} · Y: {hoveredY}
                </span>
                <span className={`text-xs font-bold ${currentHoverSector.dangerColor}`}>
                  {currentHoverSector.levelName}
                </span>
              </div>

              <p className="text-sm font-semibold text-slate-200 mt-2">
                {currentHoverSector.sector}
              </p>

              {/* Danger meter bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Nivel de Hostilidad Ambiental:</span>
                  <span className="font-telemetry font-bold text-slate-200">{dangerPct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-150 ${
                      dangerPct === 0
                        ? 'bg-emerald-400'
                        : dangerPct < 30
                        ? 'bg-cyan-400'
                        : dangerPct < 65
                        ? 'bg-yellow-400'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${dangerPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Sector Guide Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800">
                División Territorial de Aethel
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-emerald-950/30 border border-emerald-500/30">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-emerald-300">Búnker Alpha (0..13, 0..11)</span>
                </div>
                <span className="text-emerald-400 font-telemetry">Peligro 0% · Zona Segura (14x12)</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-cyan-950/20 border border-cyan-500/20">
                <span className="text-slate-300">Sector 1: Planicies de Polvo (21..50)</span>
                <span className="text-cyan-400 font-telemetry">Dificultad Baja</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-yellow-950/20 border border-yellow-500/20">
                <span className="text-slate-300">Sector 2: Cañones de Silicio (51..70)</span>
                <span className="text-yellow-400 font-telemetry">Dificultad Media</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-orange-950/20 border border-orange-500/20">
                <span className="text-slate-300">Sector 3: Cráteres de Plasma (71..85)</span>
                <span className="text-orange-400 font-telemetry">Dificultad Alta</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-red-950/30 border border-red-500/30">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="font-semibold text-red-300">Sector 4: Vórtice Solar (86..100)</span>
                </div>
                <span className="text-red-400 font-telemetry">Dificultad Extrema</span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                sound.playSelect();
                onClose();
              }}
              className="w-full py-2.5 mt-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider rounded text-xs transition-colors font-scifi cursor-pointer"
            >
              Volver a la Simulación (M / Esc)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
