import React, { useEffect, useRef } from 'react';
import { Lock, Play, RotateCcw, Sliders, Info, Shield, Radio } from 'lucide-react';
import { sound } from '../audio/soundManager';
import { TITLE_BG_IMAGE } from '../data/characters';

interface TitleMenuProps {
  onNewGame: () => void;
  onContinue: () => void;
  hasSavedGame: boolean;
  onOpenOptions: () => void;
  onOpenLore: () => void;
}

export const TitleMenu: React.FC<TitleMenuProps> = ({
  onNewGame,
  onContinue,
  hasSavedGame,
  onOpenOptions,
  onOpenLore,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Background ambient audio initiation on user gesture
  const handleUserInteract = () => {
    sound.startAmbient();
  };

  // Subtle twinkling starfield overlay on top of the planet art
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const stars: { x: number; y: number; s: number; speed: number; phase: number }[] = [];
    for (let i = 0; i < 70; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        s: Math.random() * 2 + 1,
        speed: Math.random() * 0.05 + 0.02,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const loop = () => {
      t += 0.03;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#ffffff';
      stars.forEach((st) => {
        const alpha = 0.3 + Math.sin(t * st.speed * 10 + st.phase) * 0.4;
        ctx.fillStyle = `rgba(224, 242, 254, ${Math.max(0, alpha)})`;
        ctx.fillRect(st.x * canvas.width, st.y * canvas.height, st.s, st.s);
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div
      onClick={handleUserInteract}
      className="relative flex flex-col items-center justify-between w-full h-full min-h-screen overflow-hidden text-slate-100 select-none bg-slate-950"
    >
      {/* Background Pixel Art Artwork of Space & Planet Aethel */}
      <div className="absolute inset-0 z-0">
        <img
          src={TITLE_BG_IMAGE}
          alt="Planeta Aethel y Espacio Exterior"
          referrerPolicy="no-referrer"
          className="object-cover w-full h-full pixelated brightness-85 contrast-110"
        />
        {/* Cinematic gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/70" />
      </div>

      {/* Starfield particles canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-1 pointer-events-none" />

      {/* Top Protocol Status Bar */}
      <header className="relative z-10 flex items-center justify-between w-full max-w-6xl px-6 py-4 mt-2">
        <div className="flex items-center gap-3 text-xs tracking-wider uppercase text-cyan-400 font-scifi">
          <Radio className="w-4 h-4 animate-pulse text-cyan-400" />
          <span>Frecuencia de Enlace: Sector Aethel 0-30</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-telemetry">
          <span>K.I.T. CORE STATUS: OPTIMAL</span>
          <span aria-hidden="true">·</span>
          <span>PASO 1 // DESPLIEGUE</span>
        </div>
      </header>

      {/* Main Title Centerpiece */}
      <main className="relative z-10 flex flex-col items-center justify-center max-w-4xl px-4 text-center my-auto">
        {/* Retro Subtitle Badge */}
        <div className="flex items-center gap-2 px-3 py-1 mb-4 text-xs tracking-widest uppercase border border-cyan-500/40 bg-slate-900/80 rounded-sm text-cyan-300 font-scifi shadow-sm">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>Supervivencia Espacial 2D · Expedición Aethel</span>
        </div>

        {/* Bespoke Retro Sci-Fi Game Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-transparent uppercase bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 font-arcade drop-shadow-[0_8px_25px_rgba(245,158,11,0.5)]">
          Solar Systems War
        </h1>

        <p className="max-w-xl mt-4 text-sm sm:text-base text-slate-300 font-scifi leading-relaxed">
          Establece la base en el Búnker Alpha, sincroniza tu dron acompañante K.I.T. y explora la cuadrícula de 100x100 de Aethel hacia el vórtice cósmico.
        </p>

        {/* Menu Navigation Buttons */}
        <div className="flex flex-col w-full max-w-xs gap-3 mt-8">
          {/* 1. Nueva Partida */}
          <button
            onClick={() => {
              sound.playSelect();
              onNewGame();
            }}
            onMouseEnter={() => sound.playHover()}
            className="flex items-center justify-center gap-3 px-6 py-3.5 text-sm font-semibold tracking-wide uppercase transition-all bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 rounded-md font-scifi shadow-lg shadow-cyan-900/50 hover:shadow-cyan-400/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Nueva Partida</span>
          </button>

          {/* 2. Continuar */}
          <button
            onClick={() => {
              if (hasSavedGame) {
                sound.playSelect();
                onContinue();
              } else {
                sound.playLocked();
              }
            }}
            onMouseEnter={() => sound.playHover()}
            disabled={!hasSavedGame}
            className={`flex items-center justify-center gap-3 px-6 py-3 text-sm font-semibold tracking-wide uppercase transition-all rounded-md font-scifi border ${
              hasSavedGame
                ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-100 border-slate-700 hover:border-cyan-500/60 shadow-md cursor-pointer hover:scale-[1.01]'
                : 'bg-slate-900/40 text-slate-500 border-slate-800 cursor-not-allowed opacity-60'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{hasSavedGame ? 'Continuar Partida' : 'Continuar (Sin Guardado)'}</span>
          </button>

          {/* 3. Multijugador (Gris, bloqueado) */}
          <div className="relative group">
            <button
              onClick={() => {
                sound.playLocked();
              }}
              className="flex items-center justify-center w-full gap-3 px-6 py-3 text-sm font-semibold tracking-wide uppercase transition-colors border rounded-md cursor-not-allowed bg-slate-950/70 text-slate-500 border-slate-800/80 font-scifi"
            >
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Multijugador</span>
            </button>
            {/* Tooltip explaining locked condition */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-10 hidden group-hover:flex items-center px-3 py-1 text-xs text-amber-300 bg-slate-950 border border-amber-500/40 rounded whitespace-nowrap shadow-lg pointer-events-none z-30 font-scifi">
              Bloqueado: Reservado para Expansión Multijugador y Post-Game
            </div>
          </div>

          {/* 4. Opciones */}
          <button
            onClick={() => {
              sound.playSelect();
              onOpenOptions();
            }}
            onMouseEnter={() => sound.playHover()}
            className="flex items-center justify-center gap-3 px-6 py-2.5 text-sm font-semibold tracking-wide uppercase transition-colors bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-500 rounded-md font-scifi cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-slate-300" />
            <span>Opciones</span>
          </button>

          {/* 5. Salir / Bitácora de Aethel */}
          <button
            onClick={() => {
              sound.playSelect();
              onOpenLore();
            }}
            onMouseEnter={() => sound.playHover()}
            className="flex items-center justify-center gap-3 px-6 py-2 text-xs font-semibold tracking-wide uppercase transition-colors bg-slate-950/60 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-md font-scifi cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Bitácora de Aethel</span>
          </button>
        </div>
      </main>

      {/* Control Hint Footer */}
      <footer className="relative z-10 w-full py-4 text-center border-t border-slate-800/60 bg-slate-950/80 backdrop-blur-xs">
        <p className="text-xs text-slate-400 font-telemetry tracking-wide">
          WASD / Flechas Mover · Shift Correr · Espacio Escáner K.I.T. · E Interactuar · M Mapa · Esc Pausa
        </p>
      </footer>
    </div>
  );
};
