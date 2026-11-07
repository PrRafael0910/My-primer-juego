import { GameItem, ShipStage, ToolId } from '../types/game';

export const INITIAL_TOOLS: GameItem[] = [
  {
    id: 'tool_sword',
    name: 'La Espada',
    category: 'weapon',
    toolType: 'sword',
    quantity: 1,
    maxStack: 1,
    damage: 32,
    description: 'Espada básica de aleación templada para combate cuerpo a cuerpo contra los secuaces y carceleros.',
    iconName: 'sword',
    workAnimation: 'slash',
  },
  {
    id: 'tool_pickaxe',
    name: 'El Pico',
    category: 'tool',
    toolType: 'pickaxe',
    quantity: 1,
    maxStack: 1,
    damage: 18,
    description: 'Herramienta de extracción geológica con punta de carburo. Genera destellos de fragmentación al golpear vetas de mineral estelar.',
    iconName: 'pickaxe',
    workAnimation: 'mine',
  },
  {
    id: 'tool_drill',
    name: 'El Taladro',
    category: 'tool',
    toolType: 'drill',
    quantity: 1,
    maxStack: 1,
    damage: 24,
    description: 'Perforador rotativo de alta frecuencia. Produce vibración intensa y fricción térmica para desintegrar rocas basálticas ultra-duras.',
    iconName: 'drill',
    workAnimation: 'drill',
  },
  {
    id: 'tool_axe',
    name: 'El Hacha',
    category: 'tool',
    toolType: 'axe',
    quantity: 1,
    maxStack: 1,
    damage: 22,
    description: 'Hacha de corte de choque térmico para talar formaciones vegetales de silicio y fibras leñosas extraterrestres.',
    iconName: 'axe',
    workAnimation: 'chop',
  },
  {
    id: 'tool_knife',
    name: 'El Cuchillo',
    category: 'tool',
    toolType: 'knife',
    quantity: 1,
    maxStack: 1,
    damage: 16,
    description: 'Hoja de precisión microquirúrgica para desollar pieles de bestias y recolectar especímenes biológicos sin dañarlos.',
    iconName: 'knife',
    workAnimation: 'skin',
  },
];

export const INITIAL_SAFE_CHEST_ITEMS: GameItem[] = [
  {
    id: 'res_iron',
    name: 'Hierro Estelar',
    category: 'resource',
    quantity: 25,
    maxStack: 99,
    description: 'Mineral denso y maleable extraído del lecho rocoso de Aethel. Resistente a altas temperaturas.',
    iconName: 'mountain',
  },
  {
    id: 'res_energy_cell',
    name: 'Célula de Plasma',
    category: 'resource',
    quantity: 5,
    maxStack: 20,
    description: 'Batería de energía recargada en el reactor solar del búnker.',
    iconName: 'battery',
  },
  {
    id: 'item_nanomed',
    name: 'Nanogel Reparador',
    category: 'consumable',
    quantity: 3,
    maxStack: 10,
    description: 'Restaura 50 puntos de salud de inmediato y sella roturas del traje de explorador.',
    iconName: 'heart-pulse',
  },
];

export interface CraftingRecipe {
  id: string;
  name: string;
  outputItemId: string;
  outputName: string;
  outputQty: number;
  category: 'tool_upgrade' | 'consumable' | 'ship';
  description: string;
  ingredients: { itemId: string; name: string; quantity: number }[];
}

export const WORKBENCH_RECIPES: CraftingRecipe[] = [
  {
    id: 'recipe_nanomed',
    name: 'Fabricar Nanogel Reparador',
    outputItemId: 'item_nanomed',
    outputName: 'Nanogel Reparador',
    outputQty: 1,
    category: 'consumable',
    description: 'Sintetiza un aplicador médico usando cristales de Lumina y chatarra filtrada.',
    ingredients: [
      { itemId: 'res_crystal', name: 'Cristal de Lumina', quantity: 2 },
      { itemId: 'res_scrap', name: 'Chatarra Tecnológica', quantity: 3 },
    ],
  },
  {
    id: 'recipe_plasma_cell',
    name: 'Ensamblar Batería de Plasma',
    outputItemId: 'res_energy_cell',
    outputName: 'Célula de Plasma',
    outputQty: 2,
    category: 'consumable',
    description: 'Carga acumuladores energéticos para potenciar los sistemas de K.I.T.',
    ingredients: [
      { itemId: 'res_iron', name: 'Hierro Estelar', quantity: 4 },
      { itemId: 'res_crystal', name: 'Cristal de Lumina', quantity: 1 },
    ],
  },
  {
    id: 'recipe_sword_upgrade',
    name: 'Espada Reforzada de Plasma',
    outputItemId: 'tool_sword_plasma',
    outputName: 'Espada de Plasma Reforzada',
    outputQty: 1,
    category: 'tool_upgrade',
    description: 'Aumenta el filo de la espada con inducción de plasma (+20 de daño base).',
    ingredients: [
      { itemId: 'res_iron', name: 'Hierro Estelar', quantity: 12 },
      { itemId: 'res_crystal', name: 'Cristal de Lumina', quantity: 4 },
      { itemId: 'res_wood', name: 'Madera de Silicio', quantity: 6 },
    ],
  },
  {
    id: 'recipe_drill_turbo',
    name: 'Taladro Iónico de Alta Presión',
    outputItemId: 'tool_drill_turbo',
    outputName: 'Taladro Iónico Turbo',
    outputQty: 1,
    category: 'tool_upgrade',
    description: 'Doble velocidad de perforación y fragmentación mineral acelerada.',
    ingredients: [
      { itemId: 'res_iron', name: 'Hierro Estelar', quantity: 15 },
      { itemId: 'res_scrap', name: 'Chatarra Tecnológica', quantity: 8 },
    ],
  },
];

export const INITIAL_SHIP_STAGES: ShipStage[] = [
  {
    id: 'ship_stage_hull',
    name: '1. Fuselaje Blindado Anti-Radiación',
    completed: false,
    description: 'Estructura externa capaz de resistir las tormentas del Vórtice Solar y las anomalías de hiperespacio.',
    materialsNeeded: [
      { itemId: 'res_iron', name: 'Hierro Estelar', required: 30, current: 0 },
      { itemId: 'res_scrap', name: 'Chatarra Tecnológica', required: 15, current: 0 },
    ],
  },
  {
    id: 'ship_stage_engine',
    name: '2. Motor Iónico Rudimentario',
    completed: false,
    description: 'Sistema de propulsión sublumínico para despegue planetario y vuelo orbital.',
    materialsNeeded: [
      { itemId: 'res_crystal', name: 'Cristal de Lumina', required: 10, current: 0 },
      { itemId: 'res_energy_cell', name: 'Célula de Plasma', required: 6, current: 0 },
    ],
  },
  {
    id: 'ship_stage_cockpit',
    name: '3. Cabina Blindada y Soporte Vital',
    completed: false,
    description: 'Módulo de pilotaje estanco aislado con interfaz compatible con la telemetría de K.I.T.',
    materialsNeeded: [
      { itemId: 'res_wood', name: 'Madera de Silicio', required: 15, current: 0 },
      { itemId: 'res_hide', name: 'Piel de Bestia de Aethel', required: 8, current: 0 },
    ],
  },
  {
    id: 'ship_stage_warp',
    name: '4. Núcleo de Salto al Casino Intergaláctico',
    completed: false,
    description: 'Generador de portal de hiperespacio para cruzar las galaxias de los captores y recuperar los soles.',
    materialsNeeded: [
      { itemId: 'res_crystal', name: 'Cristal de Lumina', required: 25, current: 0 },
      { itemId: 'res_iron', name: 'Hierro Estelar', required: 20, current: 0 },
    ],
  },
];
