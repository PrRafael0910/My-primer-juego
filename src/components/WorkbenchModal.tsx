import React, { useState } from 'react';
import { X, Hammer, Rocket, Check, AlertCircle, Wrench, Shield, Zap } from 'lucide-react';
import { GameItem, ShipStage } from '../types/game';
import { WORKBENCH_RECIPES, CraftingRecipe } from '../data/items';
import { sound } from '../audio/soundManager';

interface WorkbenchModalProps {
  inventory: GameItem[];
  shipStages: ShipStage[];
  onCraftRecipe: (recipe: CraftingRecipe) => void;
  onContributeToShip: (stageId: string) => void;
  onClose: () => void;
}

export const WorkbenchModal: React.FC<WorkbenchModalProps> = ({
  inventory,
  shipStages,
  onCraftRecipe,
  onContributeToShip,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'crafting' | 'ship'>('crafting');

  // Helper to count item quantity in player's inventory
  const getItemCount = (itemId: string): number => {
    const it = inventory.find((i) => i.id === itemId);
    return it ? it.quantity : 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md select-none font-scifi">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <Hammer className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100 font-arcade uppercase">
                Mesa de Trabajo · Estación (X: 10..13, Y: 2..4)
              </h2>
              <p className="text-xs text-slate-400">
                Banco industrial (4x3 tiles): Arsenal y ensamblaje de la Nave Rudimentaria
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

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 pt-2">
          <button
            onClick={() => {
              sound.playHover();
              setActiveTab('crafting');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
              activeTab === 'crafting'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Fabricación de Arsenal</span>
          </button>

          <button
            onClick={() => {
              sound.playHover();
              setActiveTab('ship');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
              activeTab === 'ship'
                ? 'border-amber-400 text-amber-300 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Rocket className="w-4 h-4" />
            <span>Nave Rudimentaria (Proyecto de Fuga)</span>
          </button>
        </div>

        {/* Tab 1: Crafting Arsenal */}
        {activeTab === 'crafting' && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
            {WORKBENCH_RECIPES.map((recipe) => {
              const canCraft = recipe.ingredients.every(
                (ing) => getItemCount(ing.itemId) >= ing.quantity
              );

              return (
                <div
                  key={recipe.id}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-bold text-slate-100 font-arcade">
                        {recipe.name}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-800">
                        x{recipe.outputQty}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      {recipe.description}
                    </p>

                    {/* Ingredients List */}
                    <div className="mt-3 space-y-1.5 text-xs">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Ingredientes Requeridos:
                      </span>
                      {recipe.ingredients.map((ing) => {
                        const current = getItemCount(ing.itemId);
                        const hasEnough = current >= ing.quantity;
                        return (
                          <div
                            key={ing.itemId}
                            className="flex items-center justify-between text-xs p-1.5 rounded bg-slate-900"
                          >
                            <span className="text-slate-300">{ing.name}</span>
                            <span
                              className={`font-telemetry font-bold ${
                                hasEnough ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            >
                              {current} / {ing.quantity}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={() => {
                        if (canCraft) {
                          sound.playCraft();
                          onCraftRecipe(recipe);
                        } else {
                          sound.playLocked();
                        }
                      }}
                      disabled={!canCraft}
                      className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
                        canCraft
                          ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer shadow-md'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Hammer className="w-3.5 h-3.5" />
                      <span>{canCraft ? 'Fabricar' : 'Faltan Materiales'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Rudimentary Ship Builder */}
        {activeTab === 'ship' && (
          <div className="p-6 space-y-4 overflow-y-auto">
            <div className="p-4 bg-slate-950 border border-amber-500/40 rounded-xl flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-amber-300 font-arcade">
                  Proyecto: Nave Rudimentaria de Salto
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Reúne los componentes para escapar de Aethel y asaltar el Casino Intergaláctico.
                </p>
              </div>
              <Rocket className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shipStages.map((stage) => {
                const canComplete = stage.materialsNeeded.every(
                  (mat) => getItemCount(mat.itemId) >= mat.required
                );

                return (
                  <div
                    key={stage.id}
                    className={`p-4 rounded-lg border transition-all ${
                      stage.completed
                        ? 'bg-emerald-950/30 border-emerald-500/60'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="text-xs font-bold text-slate-100 font-arcade">
                        {stage.name}
                      </h4>
                      {stage.completed && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                          <Check className="w-3.5 h-3.5" /> INSTALADO
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      {stage.description}
                    </p>

                    {/* Requirements */}
                    <div className="mt-3 space-y-1.5 text-xs">
                      {stage.materialsNeeded.map((mat) => {
                        const current = getItemCount(mat.itemId);
                        const hasEnough = current >= mat.required || stage.completed;
                        return (
                          <div
                            key={mat.itemId}
                            className="flex items-center justify-between p-1.5 rounded bg-slate-900 text-xs"
                          >
                            <span className="text-slate-300">{mat.name}</span>
                            <span
                              className={`font-telemetry font-bold ${
                                hasEnough ? 'text-emerald-400' : 'text-amber-400'
                              }`}
                            >
                              {stage.completed ? mat.required : current} / {mat.required}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {!stage.completed && (
                      <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                        <button
                          onClick={() => {
                            if (canComplete) {
                              sound.playCraft();
                              onContributeToShip(stage.id);
                            } else {
                              sound.playLocked();
                            }
                          }}
                          disabled={!canComplete}
                          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase rounded transition-colors ${
                            canComplete
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-md'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Rocket className="w-3.5 h-3.5" />
                          <span>{canComplete ? 'Instalar Módulo' : 'Recursos Insuficientes'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
