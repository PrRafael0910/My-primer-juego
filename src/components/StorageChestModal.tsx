import React from 'react';
import { X, Archive, ArrowRight, ArrowLeft, Shield, ShieldCheck } from 'lucide-react';
import { GameItem } from '../types/game';
import { sound } from '../audio/soundManager';

interface StorageChestModalProps {
  playerInventory: GameItem[];
  chestItems: GameItem[];
  onTransferToChest: (item: GameItem) => void;
  onTransferToPlayer: (item: GameItem) => void;
  onDepositAllResources: () => void;
  onClose: () => void;
}

export const StorageChestModal: React.FC<StorageChestModalProps> = ({
  playerInventory,
  chestItems,
  onTransferToChest,
  onTransferToPlayer,
  onDepositAllResources,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md select-none font-scifi">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <Archive className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100 font-arcade uppercase">
                Cofre de Almacenamiento Seguro · Búnker (X: 11..13, Y: 8..10)
              </h2>
              <p className="text-xs text-slate-400">
                Almacén blindado (3x3 tiles) con garantía de preservación total ante muerte en Aethel
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

        {/* Protection Banner */}
        <div className="px-6 py-2.5 bg-emerald-950/50 border-b border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Todos los recursos y herramientas dentro del cofre están protegidos ante una caída en Aethel.</span>
          </div>

          <button
            onClick={() => {
              sound.playChest();
              onDepositAllResources();
            }}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold uppercase tracking-wider rounded text-[11px] transition-colors cursor-pointer"
          >
            Depositar Todos los Recursos
          </button>
        </div>

        {/* Dual Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 overflow-y-auto">
          {/* Panel 1: Player Inventory (Vulnerable) */}
          <div className="flex flex-col gap-3 p-4 bg-slate-950 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase text-slate-300 font-arcade">
                Mochila Personal (Riesgo al Morir)
              </span>
              <span className="text-xs text-slate-400 font-telemetry">
                {playerInventory.length} ítems
              </span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[46vh]">
              {playerInventory.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Mochila vacía.
                </div>
              ) : (
                playerInventory.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-slate-900 border border-slate-800 rounded-md flex items-center justify-between hover:border-slate-700"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-cyan-400 font-telemetry font-bold">
                          x{item.quantity}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block line-clamp-1">
                        {item.description}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        sound.playChest();
                        onTransferToChest(item);
                      }}
                      title="Guardar en Cofre Seguro"
                      className="p-1.5 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 rounded transition-colors cursor-pointer ml-2"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Panel 2: Secure Storage Chest (Safe) */}
          <div className="flex flex-col gap-3 p-4 bg-slate-950 rounded-lg border border-emerald-500/40 shadow-inner">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-500/30">
              <span className="text-xs font-bold uppercase text-emerald-400 font-arcade flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Cofre Seguro Blindado
              </span>
              <span className="text-xs text-emerald-300 font-telemetry">
                {chestItems.length} ítems guardados
              </span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[46vh]">
              {chestItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Cofre vacío. Transfiere materiales desde tu mochila para mantenerlos a salvo.
                </div>
              ) : (
                chestItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-slate-900 border border-emerald-950 rounded-md flex items-center justify-between hover:border-emerald-500/40"
                  >
                    <button
                      onClick={() => {
                        sound.playChest();
                        onTransferToPlayer(item);
                      }}
                      title="Retirar a Mochila"
                      className="p-1.5 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 rounded transition-colors cursor-pointer mr-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    <div className="flex-1 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs font-bold text-slate-200">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-telemetry font-bold">
                          x{item.quantity}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block line-clamp-1">
                        {item.description}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-800 bg-slate-950">
          <button
            onClick={() => {
              sound.playSelect();
              onClose();
            }}
            className="px-5 py-2 text-xs font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors cursor-pointer"
          >
            Cerrar Cofre
          </button>
        </div>
      </div>
    </div>
  );
};
