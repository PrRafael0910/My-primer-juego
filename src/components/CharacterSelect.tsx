import React, { useState } from 'react';
import { ArrowLeft, Lock, CheckCircle, Eye, Cpu, Zap, Heart, Footprints, ShieldAlert, Sparkles } from 'lucide-react';
import { CharacterProfile, CharacterId } from '../types/game';
import { CHARACTERS } from '../data/characters';
import { sound } from '../audio/soundManager';

interface CharacterSelectProps {
  onSelectCharacter: (character: CharacterProfile) => void;
  onBackToTitle: () => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  onSelectCharacter,
  onBackToTitle,
}) => {
  const [selectedId, setSelectedId] = useState<CharacterId>('elian');
  const selectedCharacter = CHARACTERS.find((c) => c.id === selectedId) || CHARACTERS[0];

  const handleCardClick = (char: CharacterProfile) => {
    if (char.locked) {
      sound.playLocked();
      setSelectedId(char.id);
    } else {
      sound.playSelect();
      setSelectedId(char.id);
    }
  };

  const handleConfirmDeploy = () => {
    if (!selectedCharacter.locked) {
      sound.playDeploy();
      onSelectCharacter(selectedCharacter);
    } else {
      sound.playLocked();
    }
  };

  return (
    <div className="relative flex flex-col w-full h-full min-h-screen overflow-y-auto text-slate-100 select-none bg-slate-950 font-scifi p-4 sm:p-8">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/40 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 flex items-center justify-between w-full max-w-6xl mx-auto pb-4 border-b border-slate-800">
        <button
          onClick={() => {
            sound.playSelect();
            onBackToTitle();
          }}
          onMouseEnter={() => sound.playHover()}
          className="flex items-center gap-2 px-3 py-1.5 text-xs tracking-wider uppercase text-slate-400 hover:text-cyan-400 hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Menú</span>
        </button>

        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold tracking-wider text-amber-300 uppercase font-arcade drop-shadow-sm">
            Selección de Personaje
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Estilo Pixel Art 16-Bit · Cada explorador cuenta con la unidad K.I.T. de apoyo
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-cyan-400 border border-cyan-500/30 px-3 py-1 bg-cyan-950/30 rounded">
          <Eye className="w-3.5 h-3.5" />
          <span>K.I.T. Sincronizado</span>
        </div>
      </div>

      {/* Main Content: 4 Character Grid + Detailed Profile Inspector */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto w-full mt-6">
        {/* Left Column: 4 Character Selection Cards */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-1">
            Tripulación de Expedición & Avatares Divinos (4)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CHARACTERS.map((char) => {
              const isSelected = selectedId === char.id;

              return (
                <div
                  key={char.id}
                  onClick={() => handleCardClick(char)}
                  onMouseEnter={() => sound.playHover()}
                  className={`relative flex flex-col p-4 rounded-lg border transition-all cursor-pointer overflow-hidden ${
                    isSelected
                      ? char.locked
                        ? 'border-amber-500/80 bg-slate-900 shadow-lg shadow-amber-950/30 scale-[1.01]'
                        : 'border-cyan-400 bg-slate-900 shadow-xl shadow-cyan-950/50 scale-[1.01]'
                      : char.locked
                      ? 'border-slate-800/80 bg-slate-950/60 opacity-70 hover:opacity-90 hover:border-slate-700'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  {/* Portrait Box */}
                  <div className="relative w-full aspect-square bg-slate-950 rounded-md overflow-hidden border border-slate-800 mb-3">
                    <img
                      src={char.portraitUrl}
                      alt={char.name}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover pixelated transition-transform duration-300 ${
                        char.locked ? 'grayscale contrast-125' : 'hover:scale-105'
                      }`}
                    />

                    {/* Locked Badge Overlay */}
                    {char.locked ? (
                      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center text-center p-3">
                        <div className="p-3 bg-slate-900/90 border border-amber-500/50 rounded-full text-amber-400 mb-2 shadow-lg">
                          <Lock className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-amber-300 uppercase tracking-widest font-arcade">
                          Bloqueado
                        </span>
                        <span className="text-[10px] text-slate-300 mt-1 font-scifi">
                          Avatar de Lumina
                        </span>
                      </div>
                    ) : (
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-slate-950/80 border border-cyan-500/40 rounded text-[10px] text-cyan-300">
                        <Eye className="w-3 h-3 text-cyan-400" />
                        <span>K.I.T. Listo</span>
                      </div>
                    )}
                  </div>

                  {/* Character Name & Category Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-100 font-arcade">
                          {char.name}
                        </h3>
                        <span className="text-xs text-slate-400">
                          ({char.gender})
                        </span>
                      </div>
                      <p className="text-xs text-cyan-400 line-clamp-1 mt-0.5">
                        {char.title}
                      </p>
                    </div>

                    {isSelected && !char.locked && (
                      <CheckCircle className="w-5 h-5 text-cyan-400 shrink-0" />
                    )}
                  </div>

                  {/* Category Chip */}
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className={char.locked ? 'text-amber-400' : 'text-emerald-400'}>
                      {char.category}
                    </span>
                    <span>{char.locked ? 'Solo Multijugador' : 'Disponible'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Character Technical Dossier & Deployment Panel */}
        <div className="lg:col-span-5 flex flex-col bg-slate-900/90 border border-slate-800 rounded-lg p-5 shadow-2xl backdrop-blur-xs">
          {/* Dossier Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-telemetry">
              Ficha Técnica de Despliegue
            </span>
            {selectedCharacter.locked ? (
              <span className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                <Lock className="w-3.5 h-3.5" />
                Nivel Maestro
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                Listo para Despliegue
              </span>
            )}
          </div>

          {/* Character Identity */}
          <div className="mt-4">
            <div className="flex items-baseline gap-3">
              <h2 className="text-2xl font-bold text-amber-300 font-arcade">
                {selectedCharacter.name}
              </h2>
              <span className="text-xs text-cyan-300 font-scifi">
                [{selectedCharacter.gender}]
              </span>
            </div>
            <p className="text-sm font-medium text-slate-300 mt-1">
              {selectedCharacter.title}
            </p>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {selectedCharacter.description}
            </p>
          </div>

          {/* Locked Avatar Warning */}
          {selectedCharacter.locked && (
            <div className="mt-4 p-3 bg-amber-950/40 border border-amber-600/50 rounded text-xs text-amber-200">
              <div className="flex items-center gap-2 font-bold mb-1">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Restricción de Acceso Cósmico</span>
              </div>
              <p className="text-[11px] text-amber-300/90">
                {selectedCharacter.unlockCondition}
              </p>
            </div>
          )}

          {/* Appearance & Equipment Details (Stored for Future References) */}
          <div className="mt-4 space-y-2 text-xs">
            <div className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800">
              Registro de Apariencia y Equipo (16-Bit)
            </div>

            <div className="grid grid-cols-1 gap-1.5 text-slate-300 text-[11px]">
              <div>
                <span className="text-slate-400">Cabello:</span> {selectedCharacter.appearance.hair}
              </div>
              <div>
                <span className="text-slate-400">Expresión:</span> {selectedCharacter.appearance.expression}
              </div>
              <div>
                <span className="text-slate-400">Traje:</span> {selectedCharacter.appearance.suit}
              </div>
              <div>
                <span className="text-slate-400">Hombreras:</span> {selectedCharacter.appearance.pauldrons}
              </div>
              <div>
                <span className="text-slate-400">Accesorios:</span> {selectedCharacter.appearance.accessories}
              </div>
              <div>
                <span className="text-slate-400">Herramientas:</span> {selectedCharacter.appearance.items}
              </div>
              <div className="text-cyan-300 font-medium">
                <span className="text-cyan-400">Dron K.I.T.:</span> {selectedCharacter.appearance.companion}
              </div>
            </div>
          </div>

          {/* Attributes & Stats Breakdown */}
          <div className="mt-5 space-y-2.5">
            <div className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800">
              Atributos de Supervivencia
            </div>

            {/* Health */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-red-400" /> Salud Base
                </span>
                <span className="font-telemetry font-bold">{selectedCharacter.stats.health}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${Math.min(100, (selectedCharacter.stats.health / 500) * 100)}%` }}
                />
              </div>
            </div>

            {/* Speed */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <Footprints className="w-3.5 h-3.5 text-emerald-400" /> Movilidad / Velocidad
                </span>
                <span className="font-telemetry font-bold">{selectedCharacter.stats.speed}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.min(100, (selectedCharacter.stats.speed / 150) * 100)}%` }}
                />
              </div>
            </div>

            {/* Energy Shield */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" /> Escudo de Aislamiento
                </span>
                <span className="font-telemetry font-bold">{selectedCharacter.stats.energyShield}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full"
                  style={{ width: `${Math.min(100, (selectedCharacter.stats.energyShield / 500) * 100)}%` }}
                />
              </div>
            </div>

            {/* Radar Efficiency */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-400" /> Enlace K.I.T. & Escaneo
                </span>
                <span className="font-telemetry font-bold">{selectedCharacter.stats.scanEfficiency}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${Math.min(100, (selectedCharacter.stats.scanEfficiency / 250) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action Button: Confirm & Deploy to Bunker Alpha */}
          <div className="mt-auto pt-6">
            <button
              onClick={handleConfirmDeploy}
              onMouseEnter={() => !selectedCharacter.locked && sound.playHover()}
              disabled={selectedCharacter.locked}
              className={`w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-md text-sm font-bold uppercase tracking-wider transition-all font-scifi ${
                selectedCharacter.locked
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-lg shadow-emerald-950/50 hover:shadow-cyan-400/20 cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {selectedCharacter.locked ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Personaje Bloqueado</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Desplegar en Cápsula de Estasis (Búnker Alpha)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
