import React from 'react';
import { X, BookOpen, Radio, Shield, Eye, Flame } from 'lucide-react';
import { sound } from '../audio/soundManager';

interface LoreModalProps {
  onClose: () => void;
}

export const LoreModal: React.FC<LoreModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none font-scifi">
      <div className="relative flex flex-col w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100 font-arcade uppercase">
              Archivos de la Expedición Aethel
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

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto text-xs leading-relaxed text-slate-300">
          {/* Section 1: Contexto Global */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg">
            <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1.5 font-arcade text-[11px]">
              <Radio className="w-4 h-4" />
              <span>Solar Systems War · Año Estelar 284.1</span>
            </div>
            <p>
              Tras el colapso de las rutas hiperespaciales entre los sistemas solares centrales, las facciones exploratorias han fijado sus coordenadas en el enigmático planeta <strong>Aethel</strong>: un mundo rico en cristales de resonancia Lumina pero castigado por tormentas de plasma gravitatorio.
            </p>
          </div>

          {/* Section 2: El Búnker Alpha */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg">
            <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1.5 font-arcade text-[11px]">
              <Shield className="w-4 h-4" />
              <span>El Búnker Alpha (Refugio Industrial: 14x12 Celdas, X:0-13, Y:0-11)</span>
            </div>
            <p>
              Blindado con paneles de titanio pulido continuo sin cuadrículas visibles, luces neón cian y rejillas de vapor inferior, el Búnker Alpha (14x12) es tu base inexpugnable. Cuenta con la Base del Portal (5x5) en <strong>(X: 1..5, Y: 2..6)</strong>, la Cápsula de Estasis (3x4) en <strong>(X: 1..3, Y: 8..11)</strong>, la Mesa de Trabajo (4x3) en <strong>(X: 10..13, Y: 2..4)</strong>, el Pedestal Central con K.I.T. y el Menú Holográfico 2x2 en <strong>(X: 6..8, Y: 5..7)</strong>, el Cofre Blindado (3x3) en <strong>(X: 11..13, Y: 8..10)</strong> y el Gran Portón Blindado (4x2) en <strong>(X: 6..9, Y: 10..11)</strong>.
            </p>
          </div>

          {/* Section 3: Unidad Flotante K.I.T. */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg">
            <div className="flex items-center gap-2 text-cyan-300 font-bold mb-1.5 font-arcade text-[11px]">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Unidad K.I.T. (Kinetic Intelligence Transmitter)</span>
            </div>
            <p>
              Todos los exploradores van escoltados por una unidad autónoma K.I.T. Dotada de un ojo sensor óptico azul central y propulsión antigravitacional suave, K.I.T. proyecta pulsos de sonar radial (tecla <kbd className="px-1.5 py-0.5 bg-slate-800 text-cyan-300 rounded font-telemetry">Espacio</kbd>) para cartografiar vetas de mineral, restos de expediciones pasadas y avisar de anomalías.
            </p>
          </div>

          {/* Section 4: Avatares de Lumina (Nivel Maestro) */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg">
            <div className="flex items-center gap-2 text-amber-400 font-bold mb-1.5 font-arcade text-[11px]">
              <Flame className="w-4 h-4" />
              <span>Avatares de Lumina: Aethelgard & Luminara</span>
            </div>
            <p>
              En el vértice opuesto (100, 100) yace el Vórtice Solar. Se rumorea que quienes sobrevivan al viaje desbloquearán la sintonía con las deidades <strong>Aethelgard</strong> (Avatar Cósmico de armadura rúnica) y <strong>Luminara</strong> (Diosa Solar de aura solar directa), disponibles exclusivamente en el Modo Multijugador y Post-Game.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-800 bg-slate-950">
          <button
            onClick={() => {
              sound.playSelect();
              onClose();
            }}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded transition-colors font-scifi cursor-pointer"
          >
            Cerrar Bitácora
          </button>
        </div>
      </div>
    </div>
  );
};
