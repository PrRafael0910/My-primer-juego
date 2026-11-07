import React from 'react';
import { 
  Shield, 
  Heart, 
  Zap, 
  Map as MapIcon, 
  Pause, 
  Compass, 
  Volume2, 
  VolumeX, 
  Briefcase, 
  Flame, 
  Sword, 
  Radio, 
  Sun,
  Pickaxe,
  Drill,
  Axe,
  Scissors
} from 'lucide-react';
import { PlayerState, CharacterProfile, Tile, CombatCooldowns, ToolId } from '../types/game';
import { BUNKER_MAX_X, BUNKER_MAX_Y, MAP_SIZE, getSectorName } from '../game/mapGenerator';
import { sound } from '../audio/soundManager';

interface GameHUDProps {
  player: PlayerState;
  character: CharacterProfile;
  map: Tile[][];
  cooldowns: CombatCooldowns;
  doorUnlocked: boolean;
  onOpenMap: () => void;
  onOpenPause: () => void;
  onOpenInventory: () => void;
  onOpenRevengeList: () => void;
  onCycleTool?: () => void;
  onTriggerScan: () => void;
  onAttackNormal: () => void;
  onSpecial1StarPulse: () => void;
  onSpecial2KitLaser: () => void;
  onSpecial3Overcharge: () => void;
  activeDialog: { title: string; text: string; actionLabel?: string } | null;
  onCloseDialog: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  player,
  character,
  cooldowns,
  doorUnlocked,
  onOpenMap,
  onOpenPause,
  onOpenInventory,
  onOpenRevengeList,
  onCycleTool,
  onAttackNormal,
  onSpecial1StarPulse,
  onSpecial2KitLaser,
  onSpecial3Overcharge,
  activeDialog,
  onCloseDialog,
}) => {
  const isInsideBunker = player.x <= BUNKER_MAX_X && player.y <= BUNKER_MAX_Y;
  const sectorInfo = getSectorName(Math.floor(player.x), Math.floor(player.y));
  const isMuted = sound.getIsMuted();

  const radarPlayerPctX = (player.x / MAP_SIZE) * 100;
  const radarPlayerPctY = (player.y / MAP_SIZE) * 100;
  const bunkerPct = (BUNKER_MAX_X / MAP_SIZE) * 100;

  const getToolIcon = (toolId: ToolId) => {
    switch (toolId) {
      case 'sword': return <Sword className="w-4 h-4 text-cyan-400" />;
      case 'pickaxe': return <Pickaxe className="w-4 h-4 text-amber-400" />;
      case 'drill': return <Drill className="w-4 h-4 text-emerald-400" />;
      case 'axe': return <Axe className="w-4 h-4 text-orange-400" />;
      case 'knife': return <Scissors className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-4 sm:p-6 font-scifi">
      {/* --- TOP ROW HUD --- */}
      <header className="flex items-start justify-between w-full gap-4">
        {/* Top Left: Vitals Cluster */}
        <div className="flex flex-col gap-2 p-3 bg-slate-950/85 border border-slate-800/90 rounded-lg shadow-xl backdrop-blur-xs pointer-events-auto min-w-[240px]">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-100 font-arcade">
                {character.name}
              </span>
              <span className="text-[10px] text-cyan-400 font-telemetry">
                [{character.gender}]
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
              <span>K.I.T. VINCULADO</span>
            </div>
          </div>

          {/* Health Bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-300 mb-0.5">
              <span className="flex items-center gap-1 text-red-400">
                <Heart className="w-3 h-3" /> SALUD
              </span>
              <span className="font-telemetry tabular-nums font-bold">
                {player.health} / {player.maxHealth}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-red-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(0, (player.health / player.maxHealth) * 100)}%` }}
              />
            </div>
          </div>

          {/* Shield Bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-300 mb-0.5">
              <span className="flex items-center gap-1 text-cyan-400">
                <Shield className="w-3 h-3" /> ESCUDO
              </span>
              <span className="font-telemetry tabular-nums font-bold">
                {player.shield}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                style={{ width: `${player.shield}%` }}
              />
            </div>
          </div>

          {/* Stamina Bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-300 mb-0.5">
              <span className="flex items-center gap-1 text-emerald-400">
                <Zap className="w-3 h-3" /> ESTAMINA (SHIFT)
              </span>
              <span className="font-telemetry tabular-nums font-bold">
                {player.stamina}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-75"
                style={{ width: `${player.stamina}%` }}
              />
            </div>
          </div>

          {/* Active Tool Badge with Rotation Trigger */}
          <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Arma/Herramienta:</span>
            <button
              onClick={() => onCycleTool && onCycleTool()}
              title="Cambiar Herramienta (Q en Teclado / L1 en Mando)"
              className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-slate-200 rounded text-xs font-bold uppercase font-telemetry cursor-pointer transition-colors"
            >
              {getToolIcon(player.activeToolId)}
              <span>{player.activeToolId}</span>
              <span className="text-[9px] text-cyan-400 bg-slate-950 px-1 rounded ml-1 border border-slate-800">
                Q / L1
              </span>
            </button>
          </div>
        </div>

        {/* Top Center: Sector Name, Coordinates, and Door State */}
        <div className="flex flex-col items-center p-2.5 px-4 bg-slate-950/85 border border-slate-800/90 rounded-lg shadow-xl backdrop-blur-xs pointer-events-auto text-center">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300 font-arcade">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>{sectorInfo.sector}</span>
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs">
            <span className={`font-semibold ${sectorInfo.dangerColor}`}>
              {sectorInfo.levelName}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300 font-telemetry tabular-nums font-bold">
              X: {player.x.toFixed(1)} · Y: {player.y.toFixed(1)}
            </span>
          </div>

          {/* Door Status */}
          <div className="mt-1 flex items-center gap-1.5 text-[10px]">
            <span className="text-slate-400">Gran Portón (6..9, 10..11):</span>
            <span className={`font-bold font-telemetry ${doorUnlocked ? 'text-emerald-400' : 'text-red-400'}`}>
              {doorUnlocked ? 'ABIERTO A AETHEL' : 'BLOQUEADO (Activar Holocrón en Pedestal Central)'}
            </span>
          </div>
        </div>

        {/* Top Right: Mini Radar & Utility Controls */}
        <div className="flex items-start gap-3 pointer-events-auto">
          {/* Mini-Radar */}
          <div
            onClick={() => {
              sound.playSelect();
              onOpenMap();
            }}
            title="Abrir Mapa Táctico (M)"
            className="group relative w-24 h-24 sm:w-28 sm:h-28 bg-slate-950/90 border border-slate-800 hover:border-cyan-500 rounded-lg overflow-hidden shadow-xl cursor-pointer transition-all p-1"
          >
            <div className="relative w-full h-full bg-slate-900 border border-slate-800/60 rounded overflow-hidden">
              <div
                className="absolute left-0 top-0 border border-emerald-500/80 bg-emerald-500/20"
                style={{
                  width: `${bunkerPct}%`,
                  height: `${bunkerPct}%`,
                }}
              />
              <div
                className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 bg-cyan-400 rounded-full shadow-[0_0_6px_#38bdf8] border border-white"
                style={{
                  left: `${radarPlayerPctX}%`,
                  top: `${radarPlayerPctY}%`,
                }}
              />
            </div>
            <div className="absolute bottom-1 right-1 text-[8px] font-telemetry text-cyan-400 font-bold bg-slate-950/80 px-1 rounded">
              RADAR (M)
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                sound.playSelect();
                onOpenInventory();
              }}
              title="Inventario y Herramientas (Tecla I)"
              className="p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-slate-200 rounded-lg shadow-md transition-colors cursor-pointer"
            >
              <Briefcase className="w-4 h-4 text-cyan-400" />
            </button>

            <button
              onClick={() => {
                sound.playSelect();
                onOpenRevengeList();
              }}
              title="Lista de la Venganza (Tecla L)"
              className="p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-red-400 text-slate-200 rounded-lg shadow-md transition-colors cursor-pointer"
            >
              <Flame className="w-4 h-4 text-red-500" />
            </button>

            <button
              onClick={() => {
                sound.toggleMute();
              }}
              title="Silenciar / Activar Sonido"
              className="p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-slate-200 rounded-lg shadow-md transition-colors cursor-pointer"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-cyan-400" />
              )}
            </button>

            <button
              onClick={() => {
                sound.playSelect();
                onOpenPause();
              }}
              title="Menú de Pausa (Tecla Esc)"
              className="p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 text-slate-200 rounded-lg shadow-md transition-colors cursor-pointer"
            >
              <Pause className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      </header>

      {/* --- INTERACTIVE DIALOG MODAL --- */}
      {activeDialog && (
        <div className="pointer-events-auto self-center max-w-lg w-full p-5 bg-slate-900/95 border border-cyan-500/70 rounded-lg shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2.5 pb-2.5 border-b border-cyan-500/30">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h3 className="text-base font-bold text-cyan-300 font-arcade">
              {activeDialog.title}
            </h3>
          </div>

          <p className="mt-3 text-sm text-slate-200 leading-relaxed font-scifi whitespace-pre-line">
            {activeDialog.text}
          </p>

          <div className="flex items-center justify-end gap-3 mt-5 pt-3 border-t border-slate-800">
            <button
              onClick={() => {
                sound.playSelect();
                onCloseDialog();
              }}
              className="px-4 py-2 text-xs font-bold tracking-wider uppercase bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded transition-colors font-scifi cursor-pointer"
            >
              {activeDialog.actionLabel || 'Entendido'}
            </button>
          </div>
        </div>
      )}

      {/* --- BOTTOM COMBAT BAR & ACTION ROW (4 Powers System) --- */}
      <footer className="flex items-end justify-between w-full pointer-events-auto">
        {/* Left: Quick Guide (Keyboard & Gamepad) */}
        <div className="hidden lg:flex flex-col gap-1 text-[10px] text-slate-300 font-telemetry bg-slate-950/90 p-2.5 rounded-lg border border-slate-800 shadow-xl backdrop-blur-xs max-w-sm">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold border-b border-slate-800/80 pb-1">
            <span>🎮 CONTROL DUAL: TECLADO & MANDO</span>
          </div>
          <div className="text-slate-400">
            <span className="text-slate-200 font-bold">Mando:</span> [L-Stick/D-Pad] Mover · [R-Stick] Apuntar · [A/X/Y/B] Ataques · [R1] Acción · [L1] Arma · [R2/L2] Zoom
          </div>
          <div className="text-slate-400">
            <span className="text-slate-200 font-bold">Teclado:</span> [WASD] Mover · [Shift] Correr · [E] Acción · [Q] Arma · [Rueda/Touch] Zoom
          </div>
        </div>

        {/* Center: The 4 Combat Powers Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3 p-2 bg-slate-950/90 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-md mx-auto">
          {/* Power 0: Normal Attack */}
          <button
            onClick={() => {
              onAttackNormal();
            }}
            title="Ataque Normal (Clic Izq / Tecla J / Mando Botón A)"
            className="group relative flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 transition-all cursor-pointer active:scale-95"
          >
            <Sword className="w-5 h-5 text-cyan-300 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-slate-200 mt-1 font-scifi truncate px-1">
              Estocada
            </span>
            <div className="absolute -top-2 flex items-center gap-0.5">
              <span className="text-[9px] px-1 bg-cyan-950 text-cyan-300 border border-cyan-500/40 rounded font-telemetry font-bold">
                J
              </span>
              <span className="text-[9px] px-1 bg-emerald-950 text-emerald-300 border border-emerald-500/50 rounded font-telemetry font-bold">
                A
              </span>
            </div>
          </button>

          {/* Power 1: Pulso Estelar */}
          <button
            onClick={() => {
              onSpecial1StarPulse();
            }}
            disabled={cooldowns.starPulse > 0}
            title="Poder 1: Pulso Estelar (Tecla 1 / Mando Botón X)"
            className={`group relative flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-lg border transition-all cursor-pointer active:scale-95 ${
              cooldowns.starPulse > 0
                ? 'bg-slate-950/60 border-slate-800 opacity-60 cursor-not-allowed'
                : 'bg-slate-900 border-cyan-500/60 hover:border-cyan-400 shadow-md shadow-cyan-950/50'
            }`}
          >
            <Zap className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-slate-200 mt-1 font-scifi truncate px-1">
              Pulso
            </span>
            <div className="absolute -top-2 flex items-center gap-0.5">
              <span className="text-[9px] px-1 bg-slate-900 text-cyan-400 border border-cyan-500/40 rounded font-telemetry font-bold">
                1
              </span>
              <span className="text-[9px] px-1 bg-blue-950 text-blue-300 border border-blue-500/50 rounded font-telemetry font-bold">
                X
              </span>
            </div>
            {cooldowns.starPulse > 0 && (
              <span className="absolute inset-0 flex items-center justify-center bg-slate-950/80 rounded-lg text-xs font-bold text-cyan-300 font-telemetry">
                {cooldowns.starPulse.toFixed(1)}s
              </span>
            )}
          </button>

          {/* Power 2: Corte Láser de K.I.T. */}
          <button
            onClick={() => {
              onSpecial2KitLaser();
            }}
            disabled={cooldowns.kitLaser > 0}
            title="Poder 2: Corte Láser de K.I.T. (Tecla 2 / Mando Botón Y)"
            className={`group relative flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-lg border transition-all cursor-pointer active:scale-95 ${
              cooldowns.kitLaser > 0
                ? 'bg-slate-950/60 border-slate-800 opacity-60 cursor-not-allowed'
                : 'bg-slate-900 border-purple-500/60 hover:border-purple-400 shadow-md shadow-purple-950/50'
            }`}
          >
            <Radio className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-slate-200 mt-1 font-scifi truncate px-1">
              Láser K.I.T.
            </span>
            <div className="absolute -top-2 flex items-center gap-0.5">
              <span className="text-[9px] px-1 bg-slate-900 text-purple-400 border border-purple-500/40 rounded font-telemetry font-bold">
                2
              </span>
              <span className="text-[9px] px-1 bg-amber-950 text-amber-300 border border-amber-500/50 rounded font-telemetry font-bold">
                Y
              </span>
            </div>
            {cooldowns.kitLaser > 0 && (
              <span className="absolute inset-0 flex items-center justify-center bg-slate-950/80 rounded-lg text-xs font-bold text-purple-300 font-telemetry">
                {cooldowns.kitLaser.toFixed(1)}s
              </span>
            )}
          </button>

          {/* Power 3: Sobrecarga de Aethel (Definitiva) */}
          <button
            onClick={() => {
              onSpecial3Overcharge();
            }}
            disabled={cooldowns.overcharge > 0 || player.overchargeActive}
            title="Poder 3: Sobrecarga de Aethel (+150% Daño Melee) (Tecla 3 / Mando Botón B)"
            className={`group relative flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-lg border transition-all cursor-pointer active:scale-95 ${
              player.overchargeActive
                ? 'bg-amber-950/60 border-amber-400 shadow-lg shadow-amber-500/40 animate-pulse'
                : cooldowns.overcharge > 0
                ? 'bg-slate-950/60 border-slate-800 opacity-60 cursor-not-allowed'
                : 'bg-slate-900 border-amber-500/60 hover:border-amber-400 shadow-md shadow-amber-950/50'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-300 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-slate-200 mt-1 font-scifi truncate px-1">
              Sobrecarga
            </span>
            <div className="absolute -top-2 flex items-center gap-0.5">
              <span className="text-[9px] px-1 bg-slate-900 text-amber-300 border border-amber-500/40 rounded font-telemetry font-bold">
                3
              </span>
              <span className="text-[9px] px-1 bg-rose-950 text-rose-300 border border-rose-500/50 rounded font-telemetry font-bold">
                B
              </span>
            </div>
            {player.overchargeActive && (
              <span className="absolute inset-0 flex items-center justify-center bg-amber-950/80 rounded-lg text-xs font-bold text-amber-200 font-telemetry">
                ACTIVO ({player.overchargeTimer.toFixed(0)}s)
              </span>
            )}
            {!player.overchargeActive && cooldowns.overcharge > 0 && (
              <span className="absolute inset-0 flex items-center justify-center bg-slate-950/80 rounded-lg text-xs font-bold text-amber-400 font-telemetry">
                {cooldowns.overcharge.toFixed(0)}s
              </span>
            )}
          </button>
        </div>

        {/* Right: Quick Map / Scan Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playSelect();
              onOpenInventory();
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg shadow cursor-pointer font-scifi"
          >
            <Briefcase className="w-4 h-4 text-cyan-400" />
            <span>Inventario (I)</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
