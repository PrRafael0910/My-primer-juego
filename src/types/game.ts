export type GameScreen = 
  | 'TITLE_MENU' 
  | 'CHARACTER_SELECT' 
  | 'PLAYING' 
  | 'OPTIONS' 
  | 'LORE_MODAL';

export type CharacterId = 'elian' | 'amara' | 'aethelgard' | 'luminara';

export interface CharacterProfile {
  id: CharacterId;
  name: string;
  title: string;
  gender: 'Varón' | 'Hembra';
  category: 'Explorador Inicial' | 'Avatar de Lumina (Nivel Maestro)';
  locked: boolean;
  unlockCondition?: string;
  description: string;
  appearance: {
    hair: string;
    expression: string;
    suit: string;
    pauldrons: string;
    accessories: string;
    items: string;
    companion: string;
  };
  stats: {
    health: number;
    speed: number;
    energyShield: number;
    scanEfficiency: number;
    survivalSkill: number;
  };
  portraitUrl: string;
  colorScheme: {
    hair: string;
    suit: string;
    leather: string;
    holocron: string;
    tool: string;
    droneEye: string;
  };
}

export type TileCategory = 
  | 'BUNKER_FLOOR'
  | 'BUNKER_WALL'
  | 'BUNKER_STASIS_POD'       // X: 3, Y: 10 (Empty cryo-tube)
  | 'BUNKER_PORTAL_BASE'      // X: 3, Y: 4 (Circular floor portal dais)
  | 'BUNKER_ANCESTRAL_SAFE'   // X: 10, Y: 10 (Pedestal Central & K.I.T.)
  | 'BUNKER_WORKBENCH'        // X: 10, Y: 3 (Workbench & tool rack)
  | 'BUNKER_STORAGE_CHEST'    // X: 17, Y: 3 (Secure Vault Hatch)
  | 'BUNKER_EXIT_DOOR'        // X: 9..11, Y: 19..20 (Blast Door / Energy Gate)
  | 'BUNKER_CONSOLE'
  | 'BUNKER_REACTOR'
  | 'BUNKER_MEDBAY'
  | 'BUNKER_CRATE'
  | 'BUNKER_AIRLOCK'
  | 'TERRAIN_PLAINS'
  | 'TERRAIN_BASALT'
  | 'TERRAIN_SILICA'
  | 'TERRAIN_CRAG'
  | 'TERRAIN_VORTEX'
  | 'RESOURCE_CRYSTAL'
  | 'RESOURCE_SCRAP'
  | 'RESOURCE_ORE_VEIN'
  | 'RESOURCE_SILICA_TREE'
  | 'HAZARD_VENT'
  | 'HAZARD_STORM';

export interface Tile {
  x: number;
  y: number;
  type: TileCategory;
  walkable: boolean;
  interactive?: boolean;
  interactLabel?: string;
  dangerLevel: number; // 0 to 100
  discovered: boolean;
}

// Item & Tool Types
export type ToolId = 'sword' | 'pickaxe' | 'drill' | 'axe' | 'knife';
export type ItemCategory = 'tool' | 'weapon' | 'resource' | 'ship_component' | 'consumable';

export interface GameItem {
  id: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  maxStack: number;
  description: string;
  toolType?: ToolId;
  damage?: number;
  durability?: number;
  maxDurability?: number;
  iconName: string;
  workAnimation?: 'slash' | 'mine' | 'drill' | 'chop' | 'skin';
  isSafe?: boolean; // If in storage chest
}

export interface PlayerState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  moving: boolean;
  sprinting: boolean;
  characterId: CharacterId;
  health: number;
  maxHealth: number;
  oxygen: number;
  shield: number;
  stamina: number;
  maxStamina: number;
  activeToolId: ToolId;
  overchargeActive: boolean;
  overchargeTimer: number; // seconds remaining
}

export interface KitDroneState {
  x: number;
  y: number;
  hoverAngle: number;
  scanning: boolean;
  scanProgress: number; // 0 to 1
  scanRadius: number;
  laserFiring: boolean;
  laserStartX: number;
  laserStartY: number;
  laserEndX: number;
  laserEndY: number;
}

// Combat Powers Cooldowns
export interface CombatCooldowns {
  normalAttack: number;    // Ready when 0
  starPulse: number;       // Max: 5s
  kitLaser: number;        // Max: 7s
  overcharge: number;      // Max: 25s
}

// Enemy (Secuaces del Casino en Aethel)
export interface Enemy {
  id: string;
  name: string;
  title: string;
  type: 'minion' | 'jailer' | 'beast';
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  patrolCenter: { x: number; y: number };
  patrolRadius: number;
  aggroDistance: number;
  isDead: boolean;
  dropItemId: string;
  dropItemQty: number;
}

// Visual Combat FX
export interface VisualFX {
  id: string;
  type: 'slash' | 'starPulse' | 'laser' | 'overcharge' | 'spark' | 'damageText';
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  radius?: number;
  color?: string;
  duration: number; // in seconds
  elapsed: number;
  text?: string;
}

// Revenge List Target
export interface RevengeTarget {
  id: string;
  name: string;
  alias: string;
  sector: string;
  status: 'Vigilando' | 'Secuestrando' | 'Recluido' | 'Derrotado';
  sunReward: string;
  description: string;
  crime: string;
  difficulty: string;
  coordinatesHint: string;
}

// Ship Construction Stage
export interface ShipStage {
  id: string;
  name: string;
  completed: boolean;
  description: string;
  materialsNeeded: { itemId: string; name: string; required: number; current: number }[];
}

export interface GameSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  scanlines: boolean;
  screenShake: boolean;
}
