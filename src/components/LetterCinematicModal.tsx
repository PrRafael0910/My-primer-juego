import React, { useEffect, useState } from 'react';
import { Eye, Shield, Sparkles, Check, Radio, Wind, Key } from 'lucide-react';
import { sound } from '../audio/soundManager';

interface LetterCinematicModalProps {
  onComplete: () => void;
}

const LETTER_TEXT = 
  "Si estás leyendo esto, eres el último habitante libre de Aethel. Los monstruos no destruyeron nuestra galaxia por odio; lo hicieron por avaricia. Usan nuestros soles como fichas en su Casino Intergaláctico. Solo dejaron nuestro sistema solar como una carnada y juraron regresar para arrebatárnoslo cuando estemos listos. Dejaron a sus Secuaces en Aethel administrando prisiones y secuestrando a nuestra gente. No estás solo: K.I.T. tiene los conocimientos básicos. Recolecta, rescata a tu gente, construye portales, viaja a sus galaxias y apuesta tu destino para robarles de vuelta lo que es meustro.";

export const LetterCinematicModal: React.FC<LetterCinematicModalProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<'decompression' | 'holocron_transfer' | 'reading'>('decompression');
  const [displayedText, setDisplayedText] = useState('');
  const [isDoneTyping, setIsDoneTyping] = useState(false);
  const [steamParticles, setSteamParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  // Step 1: Steam and decompression sequence
  useEffect(() => {
    sound.playDeploy(); // Decompression sound

    // Generate steam particles
    const particles = Array.from({ length: 16 }, (_, i) => ({
      id: i,
      x: 35 + (i * 7) % 35,
      y: 60 - (i * 4),
    }));
    setSteamParticles(particles);

    const timer1 = setTimeout(() => {
      setStage('holocron_transfer');
      sound.playSelect();
    }, 1800);

    const timer2 = setTimeout(() => {
      setStage('reading');
      sound.playHoloLetter();
    }, 3400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Step 2: Typing effect when reading
  useEffect(() => {
    if (stage !== 'reading') return;

    let index = 0;
    const interval = setInterval(() => {
      index += 3;
      if (index >= LETTER_TEXT.length) {
        setDisplayedText(LETTER_TEXT);
        setIsDoneTyping(true);
        clearInterval(interval);
      } else {
        setDisplayedText(LETTER_TEXT.slice(0, index));
        if (index % 12 === 0) {
          sound.playHover();
        }
      }
    }, 22);

    return () => clearInterval(interval);
  }, [stage]);

  const handleSkipOrAccept = () => {
    if (stage !== 'reading') {
      setStage('reading');
      setDisplayedText(LETTER_TEXT);
      setIsDoneTyping(true);
      return;
    }

    if (!isDoneTyping) {
      setDisplayedText(LETTER_TEXT);
      setIsDoneTyping(true);
    } else {
      sound.playSelect();
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-md select-none font-scifi">
      <div className="relative flex flex-col w-full max-w-2xl bg-slate-900/95 border-2 border-cyan-400/80 rounded-2xl shadow-[0_0_60px_rgba(34,211,238,0.3)] overflow-hidden">
        {/* Hologram Projector Glow Header */}
        <div className="relative flex items-center justify-between px-6 py-4 border-b border-cyan-500/40 bg-slate-950">
          <div className="flex items-center gap-3">
            {/* Animated K.I.T. Drone Avatar with glowing eye */}
            <div className="relative w-10 h-10 rounded-full bg-slate-800 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_20px_#22d3ee]">
              <Eye className="w-5 h-5 text-cyan-300 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-300 font-arcade uppercase tracking-wider">
                  Caja Fuerte Ancestral · Pedestal Central (X: 6..8, Y: 5..7)
                </span>
                <span className="text-[10px] text-cyan-400 font-telemetry">
                  [BÚNKER 14x12]
                </span>
              </div>
              <p className="text-xs text-slate-400">
                K.I.T. despresuriza la cámara y proyecta el testamento
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-cyan-950/60 border border-cyan-500/50 rounded text-xs text-cyan-300 font-telemetry">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Frecuencia 842.0 Hz</span>
          </div>
        </div>

        {/* Cinematic Body */}
        <div className="relative p-6 sm:p-8 space-y-6">
          {/* STAGE 1: Decompression & Steam Animation */}
          {stage === 'decompression' && (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <div className="relative w-28 h-28 rounded-2xl bg-slate-950 border-2 border-amber-500/80 flex items-center justify-center shadow-xl">
                <Wind className="w-12 h-12 text-cyan-300 animate-spin" />
                {/* Steam particles rising */}
                {steamParticles.map((p) => (
                  <div
                    key={p.id}
                    className="absolute w-3 h-3 bg-slate-300/60 rounded-full blur-[2px] animate-ping"
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  />
                ))}
              </div>
              <div className="text-sm font-bold text-cyan-300 font-arcade">
                DESPRESURIZANDO CAJA FUERTE ANCESTRAL...
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Válvulas de vapor neumático liberadas. K.I.T. rompe el sello de compresión de titanio.
              </p>
            </div>
          )}

          {/* STAGE 2: Holocron Transfer Animation */}
          {stage === 'holocron_transfer' && (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 animate-in fade-in duration-300">
              <div className="relative w-24 h-24 rounded-xl bg-slate-950 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_30px_#22d3ee]">
                <Key className="w-10 h-10 text-amber-300 animate-bounce" />
                <div className="absolute inset-0 bg-cyan-400/20 rounded-xl animate-pulse" />
              </div>
              <div className="text-sm font-bold text-amber-300 font-arcade">
                HOLOCRÓN ENTREGADO AL EXPLORADOR
              </div>
              <p className="text-xs text-slate-300 max-w-sm">
                K.I.T. transfiere el artefacto cúbico a tus manos y activa la lectura de voz del testamento.
              </p>
            </div>
          )}

          {/* STAGE 3: Conversational Letter Reading */}
          {stage === 'reading' && (
            <>
              {/* Cyan Holo Beam Line */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee]" />

              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-amber-300 font-arcade">
                    La Carta de la Venganza
                  </h2>
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-400 font-telemetry">
                  <Shield className="w-4 h-4" />
                  <span>TESTAMENTO DE AETHEL</span>
                </div>
              </div>

              {/* Conversational Text Box with Hologram styling */}
              <div className="relative p-5 rounded-xl bg-slate-950/80 border border-cyan-500/40 shadow-inner">
                {/* Voice Speaker Indicator */}
                <div className="flex items-center gap-2 text-xs text-cyan-400 mb-2 font-telemetry font-bold">
                  <Eye className="w-3.5 h-3.5" />
                  <span>K.I.T. TRANSMITIENDO VOZ CONVERSACIONAL:</span>
                </div>

                <p className="text-sm sm:text-base text-slate-100 font-scifi leading-relaxed tracking-wide min-h-[160px]">
                  {displayedText}
                  {!isDoneTyping && (
                    <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse" />
                  )}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="text-cyan-400">K.I.T.: "Conocimientos transferidos a la unidad."</span>
                  <span>Gran Portón (6..9, 10..11) listo para apertura</span>
                </div>
              </div>

              {/* Unlocks Announcement */}
              {isDoneTyping && (
                <div className="p-3.5 bg-gradient-to-r from-cyan-950/60 to-emerald-950/60 border border-cyan-400/50 rounded-lg flex items-center justify-between animate-in fade-in duration-300">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
                    <div className="text-xs">
                      <div className="font-bold text-slate-100">
                        Protocolo de Venganza Iniciado:
                      </div>
                      <div className="text-slate-300">
                        1. <strong className="text-amber-300">Lista de la Venganza</strong> activada · 2. Gran Portón Blindado 4x2 en <strong className="text-cyan-300">(6..9, 10..11)</strong> desbloqueado.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Action Button */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleSkipOrAccept}
              className="flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 rounded-lg shadow-lg shadow-cyan-950/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer font-scifi"
            >
              {stage === 'reading' && isDoneTyping ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Aceptar y Desbloquear Gran Portón (6..9, 10..11)</span>
                </>
              ) : (
                <span>Omitir Animación / Mostrar Texto</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
