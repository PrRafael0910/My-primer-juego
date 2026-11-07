import { Tile, TileCategory, Enemy } from '../types/game';

export const MAP_SIZE = 100;
export const BUNKER_MAX_X = 13; // 14 tiles wide (X: 0..13)
export const BUNKER_MAX_Y = 11; // 12 tiles high (Y: 0..11)

// Multicell Object Coordinates (Exact 14x12 layout)
export const STASIS_POD_POINT = { x: 2, y: 9 };       // Center of 3x4 pod (X: 1..3, Y: 8..11)
export const STASIS_EXIT_POINT = { x: 4, y: 9 };      // Adjacent free tile outside pod
export const PORTAL_BASE_POINT = { x: 3, y: 4 };      // Center of 5x5 dais (X: 1..5, Y: 2..6)
export const ANCESTRAL_SAFE_POINT = { x: 7, y: 6 };   // Center of 3x3 pedestal (X: 6..8, Y: 5..7)
export const WORKBENCH_POINT = { x: 11, y: 3 };       // Center of 4x3 workbench (X: 10..13, Y: 2..4)
export const STORAGE_CHEST_POINT = { x: 12, y: 9 };   // Center of 3x3 vault (X: 11..13, Y: 8..10)
export const SPAWN_POINT = STASIS_POD_POINT;          // Origin and respawn point

// Pseudo-random deterministic generator based on seed
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function generateWorldMap(doorUnlocked: boolean = false): Tile[][] {
  const map: Tile[][] = [];

  for (let y = 0; y < MAP_SIZE; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < MAP_SIZE; x++) {
      const tile = createTile(x, y, doorUnlocked);
      row.push(tile);
    }
    map.push(row);
  }

  return map;
}

function createTile(x: number, y: number, doorUnlocked: boolean): Tile {
  const isInsideBunker = x <= BUNKER_MAX_X && y <= BUNKER_MAX_Y;

  if (isInsideBunker) {
    return createBunkerTile(x, y, doorUnlocked);
  } else {
    return createWildernessTile(x, y);
  }
}

function createBunkerTile(x: number, y: number, doorUnlocked: boolean): Tile {
  // 1. Puerta de Salida Ampliada (X: 6..9, Y: 10..11): Portón industrial de 4x2 tiles en la pared inferior
  if (x >= 6 && x <= 9 && (y === 10 || y === 11)) {
    return {
      x,
      y,
      type: 'BUNKER_EXIT_DOOR',
      walkable: doorUnlocked, // Opens after the letter cinematic
      interactive: true,
      interactLabel: doorUnlocked 
        ? 'Gran Portón Industrial (4x2) - Salida Abierta a Aethel' 
        : 'Gran Portón Blindado (4x2) - Bloqueado con Escáner de Acceso',
      dangerLevel: 0,
      discovered: true,
    };
  }

  // 2. Base de Construcción del Portal (X: 1..5, Y: 2..6): Plataforma circular de 5x5 tiles
  if (x >= 1 && x <= 5 && y >= 2 && y <= 6) {
    return {
      x,
      y,
      type: 'BUNKER_PORTAL_BASE',
      walkable: true, // Integrada directamente en el suelo liso
      interactive: true,
      interactLabel: 'Base de Construcción del Portal (Plataforma circular 5x5 con grabados)',
      dangerLevel: 0,
      discovered: true,
    };
  }

  // 3. Mesa de Trabajo / Crafteo (X: 10..13, Y: 2..4): Banco industrial pesado de 4x3 tiles
  if (x >= 10 && x <= 13 && y >= 2 && y <= 4) {
    return {
      x,
      y,
      type: 'BUNKER_WORKBENCH',
      walkable: false,
      interactive: true,
      interactLabel: 'Mesa de Trabajo (4x3): Arsenal y Fabricación de Nave Rudimentaria',
      dangerLevel: 0,
      discovered: true,
    };
  }

  // 4. Pedestal Central y K.I.T. (X: 6..8, Y: 5..7): Estructura de 3x3 tiles en el centro exacto
  if (x >= 6 && x <= 8 && y >= 5 && y <= 7) {
    return {
      x,
      y,
      type: 'BUNKER_ANCESTRAL_SAFE',
      walkable: false,
      interactive: true,
      interactLabel: 'Pedestal Central (3x3): Caja Fuerte Ancestral y Menú Holográfico de K.I.T.',
      dangerLevel: 0,
      discovered: true,
    };
  }

  // 5. Cápsula de Estasis Vacía (X: 1..3, Y: 8..11): Tubo criogénico masivo de 3x4 tiles
  if (x >= 1 && x <= 3 && y >= 8 && y <= 11) {
    // Center point (2, 9) is walkable for awakening and exit
    const isCenterRespawn = x === 2 && y === 9;
    return {
      x,
      y,
      type: 'BUNKER_STASIS_POD',
      walkable: isCenterRespawn,
      interactive: true,
      interactLabel: 'Cápsula de Estasis Vacía (3x4): Tubo Criogénico Despresurizado (Origen/Respawn)',
      dangerLevel: 0,
      discovered: true,
    };
  }

  // 6. Cofre de Almacenamiento Seguro (X: 11..13, Y: 8..10): Bóveda metálica de 3x3 tiles
  if (x >= 11 && x <= 13 && y >= 8 && y <= 10) {
    return {
      x,
      y,
      type: 'BUNKER_STORAGE_CHEST',
      walkable: false,
      interactive: true,
      interactLabel: 'Cofre de Almacenamiento Seguro (3x3): Bóveda Blindada 100% Protegida',
      dangerLevel: 0,
      discovered: true,
    };
  }

  // Perimeter walls enclosing 14x12 room (0..13, 0..11) (excluding the exit door gate at X: 6..9, Y: 11)
  const isWallNorth = y === 0;
  const isWallSouth = y === BUNKER_MAX_Y && (x < 6 || x > 9);
  const isWallWest = x === 0;
  const isWallEast = x === BUNKER_MAX_X;

  if (isWallNorth || isWallEast || isWallWest || isWallSouth) {
    return {
      x,
      y,
      type: 'BUNKER_WALL',
      walkable: false,
      dangerLevel: 0,
      discovered: true,
    };
  }

  // Industrial continuous smooth titanium floor
  return {
    x,
    y,
    type: 'BUNKER_FLOOR',
    walkable: true,
    dangerLevel: 0,
    discovered: true,
  };
}

function createWildernessTile(x: number, y: number): Tile {
  // Distance from bunker boundary (20, 20) towards (99, 99)
  const dx = Math.max(0, x - BUNKER_MAX_X);
  const dy = Math.max(0, y - BUNKER_MAX_Y);
  const maxDist = Math.hypot(MAP_SIZE - BUNKER_MAX_X, MAP_SIZE - BUNKER_MAX_Y);
  const currentDist = Math.hypot(dx, dy);

  // Danger rating scaling from 5% to 100%
  const dangerFraction = Math.min(1, Math.max(0.05, currentDist / maxDist));
  const dangerLevel = Math.round(dangerFraction * 100);

  const seed = x * 374761393 + y * 668265263;
  const rand = pseudoRandom(seed);
  const rand2 = pseudoRandom(seed + 99);

  let type: TileCategory = 'TERRAIN_PLAINS';
  let walkable = true;
  let interactive = false;
  let interactLabel = '';

  // Procedural resource distribution
  if (rand < 0.08) {
    type = 'RESOURCE_ORE_VEIN';
    interactive = true;
    interactLabel = 'Veta de Hierro Estelar (Usar Pico o Taladro)';
  } else if (rand < 0.15) {
    type = 'RESOURCE_SILICA_TREE';
    interactive = true;
    interactLabel = 'Formación Arbórea de Silicio (Usar Hacha)';
  } else if (rand < 0.22) {
    type = 'RESOURCE_CRYSTAL';
    interactive = true;
    interactLabel = 'Cristal de Lumina Pulsante (Usar Pico o Cuchillo)';
  } else if (rand < 0.26) {
    type = 'RESOURCE_SCRAP';
    interactive = true;
    interactLabel = 'Chatarra de Sonda Espacial (Recolectar)';
  } else if (dangerFraction < 0.28) {
    // Zone 1
    type = rand2 > 0.5 ? 'TERRAIN_BASALT' : 'TERRAIN_PLAINS';
  } else if (dangerFraction < 0.6) {
    // Zone 2
    type = rand2 > 0.4 ? 'TERRAIN_SILICA' : 'TERRAIN_BASALT';
  } else if (dangerFraction < 0.85) {
    // Zone 3
    type = rand2 > 0.4 ? 'TERRAIN_CRAG' : 'TERRAIN_SILICA';
  } else {
    // Zone 4
    type = 'TERRAIN_VORTEX';
  }

  // Impassable large crags
  if ((type === 'TERRAIN_CRAG' || type === 'TERRAIN_VORTEX') && rand2 > 0.88) {
    walkable = false;
  }

  return {
    x,
    y,
    type,
    walkable,
    interactive,
    interactLabel: interactive ? interactLabel : undefined,
    dangerLevel,
    discovered: false,
  };
}

export function generateInitialEnemies(): Enemy[] {
  return [
    {
      id: 'enemy_secuaz_1',
      name: 'Secuaz Explorador',
      title: 'Vanguardia del Casino',
      type: 'minion',
      x: 10,
      y: 25,
      health: 60,
      maxHealth: 60,
      damage: 12,
      speed: 2.2,
      patrolCenter: { x: 10, y: 25 },
      patrolRadius: 4,
      aggroDistance: 6,
      isDead: false,
      dropItemId: 'res_iron',
      dropItemQty: 4,
    },
    {
      id: 'enemy_secuaz_2',
      name: 'Secuaz Minero de Aethel',
      title: 'Carcelero de la Mano de Obra',
      type: 'minion',
      x: 18,
      y: 26,
      health: 75,
      maxHealth: 75,
      damage: 14,
      speed: 2.0,
      patrolCenter: { x: 18, y: 26 },
      patrolRadius: 5,
      aggroDistance: 6.5,
      isDead: false,
      dropItemId: 'res_scrap',
      dropItemQty: 3,
    },
    {
      id: 'enemy_beast_1',
      name: 'Bestia de Silicio',
      title: 'Fauna Hostil Mutada',
      type: 'beast',
      x: 24,
      y: 24,
      health: 80,
      maxHealth: 80,
      damage: 16,
      speed: 2.5,
      patrolCenter: { x: 24, y: 24 },
      patrolRadius: 4,
      aggroDistance: 5.5,
      isDead: false,
      dropItemId: 'res_hide',
      dropItemQty: 2,
    },
    {
      id: 'enemy_guard_1',
      name: 'Guardia de la Prisión Delta',
      title: 'Escolta del Capataz Krall',
      type: 'jailer',
      x: 28,
      y: 30,
      health: 120,
      maxHealth: 120,
      damage: 22,
      speed: 1.8,
      patrolCenter: { x: 28, y: 30 },
      patrolRadius: 5,
      aggroDistance: 7,
      isDead: false,
      dropItemId: 'res_crystal',
      dropItemQty: 2,
    },
    {
      id: 'enemy_secuaz_3',
      name: 'Centinela de Plasma',
      title: 'Patrullero de Frontera',
      type: 'minion',
      x: 12,
      y: 32,
      health: 85,
      maxHealth: 85,
      damage: 18,
      speed: 2.2,
      patrolCenter: { x: 12, y: 32 },
      patrolRadius: 6,
      aggroDistance: 6,
      isDead: false,
      dropItemId: 'res_wood',
      dropItemQty: 5,
    },
  ];
}

export function getSectorName(x: number, y: number): { sector: string; levelName: string; dangerColor: string } {
  if (x <= BUNKER_MAX_X && y <= BUNKER_MAX_Y) {
    return {
      sector: 'Búnker Alpha (Refugio Industrial 14x12)',
      levelName: 'Zona Segura Protegida',
      dangerColor: 'text-emerald-400',
    };
  }

  const dx = Math.max(0, x - BUNKER_MAX_X);
  const dy = Math.max(0, y - BUNKER_MAX_Y);
  const maxDist = Math.hypot(MAP_SIZE - BUNKER_MAX_X, MAP_SIZE - BUNKER_MAX_Y);
  const currentDist = Math.hypot(dx, dy);
  const fraction = Math.min(1, currentDist / maxDist);

  if (fraction < 0.28) {
    return {
      sector: 'Planicies de Polvo y Minas Delta',
      levelName: 'Peligro Bajo (Patrullas de Secuaces)',
      dangerColor: 'text-cyan-400',
    };
  } else if (fraction < 0.6) {
    return {
      sector: 'Tierras Quebradas y Cañones de Silicio',
      levelName: 'Peligro Medio (Zona de Prisiones)',
      dangerColor: 'text-yellow-400',
    };
  } else if (fraction < 0.85) {
    return {
      sector: 'Cráteres de Plasma y Biomas de Cristal',
      levelName: 'Peligro Alto (Fortaleza de Vexar)',
      dangerColor: 'text-orange-400',
    };
  } else {
    return {
      sector: 'El Vórtice Solar (Dimensión del Casino)',
      levelName: 'Peligro Extremo (Nivel Maestro)',
      dangerColor: 'text-red-400',
    };
  }
}
