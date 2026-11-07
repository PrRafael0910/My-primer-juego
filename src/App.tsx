import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  GameScreen, 
  CharacterProfile, 
  PlayerState, 
  GameSettings, 
  Tile, 
  GameItem, 
  ToolId, 
  CombatCooldowns, 
  Enemy, 
  ShipStage 
} from './types/game';
import { CHARACTERS } from './data/characters';
import { INITIAL_TOOLS, INITIAL_SAFE_CHEST_ITEMS, INITIAL_SHIP_STAGES, CraftingRecipe } from './data/items';
import { 
  generateWorldMap, 
  STASIS_POD_POINT, 
  BUNKER_MAX_X, 
  BUNKER_MAX_Y, 
  generateInitialEnemies 
} from './game/mapGenerator';
import { TitleMenu } from './components/TitleMenu';
import { CharacterSelect } from './components/CharacterSelect';
import { GameCanvas } from './game/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { WorldMapModal } from './components/WorldMapModal';
import { OptionsMenu } from './components/OptionsMenu';
import { PauseModal } from './components/PauseModal';
import { LoreModal } from './components/LoreModal';
import { LetterCinematicModal } from './components/LetterCinematicModal';
import { RevengeListModal } from './components/RevengeListModal';
import { InventoryModal } from './components/InventoryModal';
import { WorkbenchModal } from './components/WorkbenchModal';
import { StorageChestModal } from './components/StorageChestModal';
import { DeathModal } from './components/DeathModal';
import { sound } from './audio/soundManager';

const SAVE_KEY = 'SOLAR_SYSTEMS_WAR_SAVE_V2';
const SETTINGS_KEY = 'SOLAR_SYSTEMS_WAR_SETTINGS_V2';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('TITLE_MENU');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterProfile>(CHARACTERS[0]);

  // Inventory & Safe Chest State
  const [inventory, setInventory] = useState<GameItem[]>(() => [
    ...INITIAL_TOOLS,
    {
      id: 'res_iron',
      name: 'Hierro Estelar',
      category: 'resource',
      quantity: 10,
      maxStack: 99,
      description: 'Mineral básico extraído en la periferia de la estación.',
      iconName: 'mountain',
    },
    {
      id: 'res_scrap',
      name: 'Chatarra Tecnológica',
      category: 'resource',
      quantity: 5,
      maxStack: 99,
      description: 'Restos de circuitos metálicos útiles para reparaciones.',
      iconName: 'cpu',
    },
  ]);

  const [chestItems, setChestItems] = useState<GameItem[]>(INITIAL_SAFE_CHEST_ITEMS);
  const [shipStages, setShipStages] = useState<ShipStage[]>(INITIAL_SHIP_STAGES);
  const [activeToolId, setActiveToolId] = useState<ToolId>('sword');

  // Narrative & Door States
  const [letterRead, setLetterRead] = useState<boolean>(false);
  const [doorUnlocked, setDoorUnlocked] = useState<boolean>(false);

  // Enemies State
  const [enemies, setEnemies] = useState<Enemy[]>(() => generateInitialEnemies());

  // Player State (Spawns at Cápsula de Estasis (3, 10))
  const [player, setPlayer] = useState<PlayerState>({
    x: STASIS_POD_POINT.x,
    y: STASIS_POD_POINT.y,
    targetX: STASIS_POD_POINT.x,
    targetY: STASIS_POD_POINT.y,
    direction: 'DOWN',
    moving: false,
    sprinting: false,
    characterId: 'elian',
    health: 100,
    maxHealth: 100,
    oxygen: 100,
    shield: 100,
    stamina: 100,
    maxStamina: 100,
    activeToolId: 'sword',
    overchargeActive: false,
    overchargeTimer: 0,
  });

  // Combat Powers Cooldowns
  const [cooldowns, setCooldowns] = useState<CombatCooldowns>({
    normalAttack: 0,
    starPulse: 0,
    kitLaser: 0,
    overcharge: 0,
  });

  // Settings State
  const [settings, setSettings] = useState<GameSettings>({
    masterVolume: 0.8,
    sfxVolume: 0.8,
    musicVolume: 0.4,
    scanlines: true,
    screenShake: true,
  });

  // Modals Visibility
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isPauseOpen, setIsPauseOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isLoreOpen, setIsLoreOpen] = useState(false);
  const [isLetterCinematicOpen, setIsLetterCinematicOpen] = useState(false);
  const [isRevengeListOpen, setIsRevengeListOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isWorkbenchOpen, setIsWorkbenchOpen] = useState(false);
  const [isStorageChestOpen, setIsStorageChestOpen] = useState(false);
  const [isDeathModalOpen, setIsDeathModalOpen] = useState(false);
  const [lostResources, setLostResources] = useState<GameItem[]>([]);

  const [activeDialog, setActiveDialog] = useState<{ title: string; text: string; actionLabel?: string } | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [hasSavedGame, setHasSavedGame] = useState<boolean>(false);
  const [awakeningTrigger, setAwakeningTrigger] = useState<number>(1);

  // Memoized 100x100 Map (re-generated if doorUnlocked changes)
  const worldMap = useMemo<Tile[][]>(() => generateWorldMap(doorUnlocked), [doorUnlocked]);

  // Check saved game on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(SAVE_KEY);
      if (savedData) setHasSavedGame(true);
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        sound.setVolumes(parsed.masterVolume, parsed.sfxVolume, parsed.musicVolume);
      }
    } catch {
      // ignore
    }
  }, []);

  // Cooldown Ticker Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCooldowns((prev) => ({
        normalAttack: Math.max(0, prev.normalAttack - 0.1),
        starPulse: Math.max(0, prev.starPulse - 0.1),
        kitLaser: Math.max(0, prev.kitLaser - 0.1),
        overcharge: Math.max(0, prev.overcharge - 0.1),
      }));

      // Overcharge active countdown
      setPlayer((prev) => {
        if (prev.overchargeActive && prev.overchargeTimer > 0) {
          const nextTimer = prev.overchargeTimer - 0.1;
          if (nextTimer <= 0) {
            return { ...prev, overchargeActive: false, overchargeTimer: 0 };
          }
          return { ...prev, overchargeTimer: nextTimer };
        }
        return prev;
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  // Save Checkpoint
  const handleSaveCheckpoint = useCallback(() => {
    try {
      const saveData = {
        player: {
          x: player.x,
          y: player.y,
          health: player.health,
          shield: player.shield,
          characterId: selectedCharacter.id,
          activeToolId,
        },
        inventory,
        chestItems,
        shipStages,
        letterRead,
        doorUnlocked,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      setHasSavedGame(true);
      setSaveMessage(`¡Punto de control guardado en (${player.x.toFixed(0)}, ${player.y.toFixed(0)})!`);
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage('Error al guardar datos en el navegador.');
    }
  }, [player, selectedCharacter, activeToolId, inventory, chestItems, shipStages, letterRead, doorUnlocked]);

  // Continue Game
  const handleContinueGame = useCallback(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const savedChar = CHARACTERS.find((c) => c.id === parsed.player.characterId) || CHARACTERS[0];
        setSelectedCharacter(savedChar);
        if (parsed.inventory) setInventory(parsed.inventory);
        if (parsed.chestItems) setChestItems(parsed.chestItems);
        if (parsed.shipStages) setShipStages(parsed.shipStages);
        if (parsed.letterRead) setLetterRead(parsed.letterRead);
        if (parsed.doorUnlocked) setDoorUnlocked(parsed.doorUnlocked);
        if (parsed.player.activeToolId) setActiveToolId(parsed.player.activeToolId);

        setPlayer((prev) => ({
          ...prev,
          x: parsed.player.x ?? STASIS_POD_POINT.x,
          y: parsed.player.y ?? STASIS_POD_POINT.y,
          characterId: savedChar.id,
          health: parsed.player.health ?? savedChar.stats.health,
          maxHealth: savedChar.stats.health,
          shield: parsed.player.shield ?? savedChar.stats.energyShield,
          activeToolId: parsed.player.activeToolId ?? 'sword',
        }));
        setCurrentScreen('PLAYING');
      }
    } catch {
      handleNewGame();
    }
  }, []);

  // New Game -> Character Select
  const handleNewGame = () => {
    setCurrentScreen('CHARACTER_SELECT');
  };

  // Cycle through available tools (L1 on gamepad, Q on keyboard)
  const handleCycleTool = useCallback(() => {
    const tools: ToolId[] = ['sword', 'pickaxe', 'drill', 'axe', 'knife'];
    setActiveToolId((curr) => {
      const idx = tools.indexOf(curr);
      const next = tools[(idx + 1) % tools.length];
      setPlayer((prev) => ({ ...prev, activeToolId: next }));
      sound.playSelect();
      return next;
    });
  }, []);

  // Deploy confirmed character into Stasis Pod (2, 9) with automatic hatch opening and step-out
  const handleDeployCharacter = (char: CharacterProfile) => {
    setSelectedCharacter(char);
    setAwakeningTrigger((prev) => prev + 1);
    setPlayer({
      x: STASIS_POD_POINT.x,
      y: STASIS_POD_POINT.y,
      targetX: STASIS_POD_POINT.x,
      targetY: STASIS_POD_POINT.y,
      direction: 'RIGHT',
      moving: false,
      sprinting: false,
      characterId: char.id,
      health: char.stats.health,
      maxHealth: char.stats.health,
      oxygen: 100,
      shield: char.stats.energyShield,
      stamina: 100,
      maxStamina: 100,
      activeToolId: 'sword',
      overchargeActive: false,
      overchargeTimer: 0,
    });
    setCurrentScreen('PLAYING');
  };

  // Player position updates from 60fps loop
  const handlePlayerUpdate = useCallback((update: Partial<PlayerState>) => {
    setPlayer((prev) => ({ ...prev, ...update }));
  }, []);

  // Player takes damage
  const handlePlayerDamage = useCallback((damage: number) => {
    setPlayer((prev) => {
      let remShield = prev.shield;
      let remHealth = prev.health;

      if (remShield >= damage) {
        remShield -= damage;
      } else {
        const leftover = damage - remShield;
        remShield = 0;
        remHealth = Math.max(0, remHealth - leftover);
      }
      return { ...prev, shield: remShield, health: remHealth };
    });
  }, []);

  // Player Death Rule: Loses raw backpack resources, preserves chest, respawns at Stasis Pod
  const handlePlayerDeath = useCallback(() => {
    const rawResources = inventory.filter((item) => item.category !== 'weapon' && item.category !== 'tool');
    const toolsOnly = inventory.filter((item) => item.category === 'weapon' || item.category === 'tool');

    setLostResources(rawResources);
    setInventory(toolsOnly);
    setIsDeathModalOpen(true);
  }, [inventory]);

  // Respawn at Stasis Pod (2, 9) with automatic hatch opening and step-out
  const handleRespawn = useCallback(() => {
    setIsDeathModalOpen(false);
    setAwakeningTrigger((prev) => prev + 1);
    setPlayer((prev) => ({
      ...prev,
      x: STASIS_POD_POINT.x,
      y: STASIS_POD_POINT.y,
      health: prev.maxHealth,
      shield: 100,
      stamina: prev.maxStamina,
      overchargeActive: false,
      overchargeTimer: 0,
    }));
    sound.playSelect();
  }, []);

  // Combat Power Handlers
  const handleAttackNormal = useCallback(() => {
    setCooldowns((prev) => ({ ...prev, normalAttack: 0.3 }));
  }, []);

  const handleSpecial1StarPulse = useCallback(() => {
    setCooldowns((prev) => ({ ...prev, starPulse: 5.0 }));
  }, []);

  const handleSpecial2KitLaser = useCallback(() => {
    setCooldowns((prev) => ({ ...prev, kitLaser: 7.0 }));
  }, []);

  const handleSpecial3Overcharge = useCallback(() => {
    setCooldowns((prev) => ({ ...prev, overcharge: 25.0 }));
    setPlayer((prev) => ({ ...prev, overchargeActive: true, overchargeTimer: 10.0 }));
  }, []);

  // Enemy Hit & Drop Handling
  const handleHitEnemy = useCallback((enemyId: string, damage: number) => {
    setEnemies((prev) =>
      prev.map((en) => {
        if (en.id !== enemyId || en.isDead) return en;
        const newHp = Math.max(0, en.health - damage);
        if (newHp === 0) {
          // Drop resource into player inventory
          sound.playSelect();
          setInventory((inv) => {
            const existing = inv.find((i) => i.id === en.dropItemId);
            if (existing) {
              return inv.map((i) => (i.id === en.dropItemId ? { ...i, quantity: i.quantity + en.dropItemQty } : i));
            } else {
              return [
                ...inv,
                {
                  id: en.dropItemId,
                  name: en.dropItemId === 'res_iron' ? 'Hierro Estelar' : en.dropItemId === 'res_crystal' ? 'Cristal de Lumina' : en.dropItemId === 'res_hide' ? 'Piel de Bestia de Aethel' : 'Madera de Silicio',
                  category: 'resource',
                  quantity: en.dropItemQty,
                  maxStack: 99,
                  description: 'Botín obtenido al derrotar secuaces carceleros.',
                  iconName: 'gift',
                },
              ];
            }
          });
          return { ...en, health: 0, isDead: true };
        }
        return { ...en, health: newHp };
      })
    );
  }, []);

  // Mine Resource Node in Wilderness
  const handleMineResource = useCallback((tile: Tile) => {
    let resId = 'res_iron';
    let resName = 'Hierro Estelar';
    let qty = 3;

    if (tile.type === 'RESOURCE_SILICA_TREE') {
      resId = 'res_wood';
      resName = 'Madera de Silicio';
      sound.playChop();
      qty = 4;
    } else if (tile.type === 'RESOURCE_CRYSTAL') {
      resId = 'res_crystal';
      resName = 'Cristal de Lumina';
      sound.playMine();
      qty = 2;
    } else if (tile.type === 'RESOURCE_SCRAP') {
      resId = 'res_scrap';
      resName = 'Chatarra Tecnológica';
      sound.playInteract();
      qty = 3;
    } else {
      sound.playMine();
    }

    setInventory((inv) => {
      const existing = inv.find((i) => i.id === resId);
      if (existing) {
        return inv.map((i) => (i.id === resId ? { ...i, quantity: i.quantity + qty } : i));
      } else {
        return [
          ...inv,
          {
            id: resId,
            name: resName,
            category: 'resource',
            quantity: qty,
            maxStack: 99,
            description: 'Recurso extraído en el exterior de Aethel.',
            iconName: 'mountain',
          },
        ];
      }
    });
  }, []);

  // Interaction with Bunker Objects (Multicell 14x12 Room)
  const handleInteract = useCallback((tile: Tile) => {
    // 1. Cápsula de Estasis Vacía (X: 1..3, Y: 8..11)
    if (tile.x >= 1 && tile.x <= 3 && tile.y >= 8 && tile.y <= 11) {
      setPlayer((prev) => ({
        ...prev,
        health: prev.maxHealth,
        shield: 100,
        stamina: prev.maxStamina,
      }));
      setActiveDialog({
        title: 'Cápsula de Estasis Vacía (3x4 Tiles)',
        text: 'Tubo criogénico masivo en la pared izquierda, completamente despresurizado y sin habitante en su interior.\nFunciona como tu punto de despertar y módulo de reanimación automática.',
        actionLabel: 'Soporte Vital Estable',
      });
      return;
    }

    // 2. Base de Construcción del Portal (X: 1..5, Y: 2..6)
    if (tile.x >= 1 && tile.x <= 5 && tile.y >= 2 && tile.y <= 6) {
      setActiveDialog({
        title: 'Base de Construcción del Portal (5x5 Tiles)',
        text: 'Plataforma circular metálica con grabados tecnológicos integrada directamente en el suelo liso en la esquina superior izquierda.\nCimiento estructural para ensamblar el portal hiperespacial hacia los sistemas solares ocupados por el Casino.',
        actionLabel: 'Inspeccionar Cimientos',
      });
      return;
    }

    // 3. Pedestal Central y K.I.T. (X: 6..8, Y: 5..7)
    if (tile.x >= 6 && tile.x <= 8 && tile.y >= 5 && tile.y <= 7) {
      if (!letterRead) {
        setIsLetterCinematicOpen(true);
      } else {
        setIsRevengeListOpen(true);
      }
      return;
    }

    // 4. Mesa de Trabajo / Crafteo (X: 10..13, Y: 2..4)
    if (tile.x >= 10 && tile.x <= 13 && tile.y >= 2 && tile.y <= 4) {
      setIsWorkbenchOpen(true);
      return;
    }

    // 5. Cofre de Almacenamiento Seguro (X: 11..13, Y: 8..10)
    if (tile.x >= 11 && tile.x <= 13 && tile.y >= 8 && tile.y <= 10) {
      setIsStorageChestOpen(true);
      return;
    }

    // 6. Gran Portón de Salida Ampliado (X: 6..9, Y: 10..11)
    if (tile.x >= 6 && tile.x <= 9 && (tile.y === 10 || tile.y === 11)) {
      if (doorUnlocked) {
        setActiveDialog({
          title: 'Gran Portón Industrial (4x2 Tiles) Abierto',
          text: 'Conexión con el exterior de Aethel habilitada.\n¡Adéntrate con tus armas y herramientas! Recuerda guardar materiales en el cofre blindado (11..13, 8..10).',
          actionLabel: 'Avanzar a Aethel',
        });
      } else {
        setActiveDialog({
          title: 'Gran Portón Blindado (4x2 Tiles) Bloqueado',
          text: 'El gran portón industrial en la pared inferior está sellado con escáner en rojo.\nK.I.T. indica que debes activar la proyección del holocrón en el Pedestal Central (6..8, 5..7) para recibir la Carta de la Venganza.',
          actionLabel: 'Ir al Pedestal Central',
        });
      }
      return;
    }

    if (tile.interactLabel) {
      setActiveDialog({
        title: 'Inspección de Sector',
        text: tile.interactLabel,
        actionLabel: 'Entendido',
      });
    }
  }, [letterRead, doorUnlocked]);

  // Craft Recipe Handler
  const handleCraftRecipe = useCallback((recipe: CraftingRecipe) => {
    setInventory((inv) => {
      let updated = [...inv];
      recipe.ingredients.forEach((ing) => {
        const target = updated.find((i) => i.id === ing.itemId);
        if (target) {
          target.quantity -= ing.quantity;
        }
      });
      updated = updated.filter((i) => i.quantity > 0 || i.category === 'weapon' || i.category === 'tool');

      const existingOutput = updated.find((i) => i.id === recipe.outputItemId);
      if (existingOutput) {
        existingOutput.quantity += recipe.outputQty;
      } else {
        updated.push({
          id: recipe.outputItemId,
          name: recipe.outputName,
          category: recipe.category === 'tool_upgrade' ? 'tool' : 'consumable',
          quantity: recipe.outputQty,
          maxStack: 10,
          description: recipe.description,
          iconName: 'sparkles',
        });
      }
      return updated;
    });
  }, []);

  // Contribute to Rudimentary Ship
  const handleContributeToShip = useCallback((stageId: string) => {
    const stage = shipStages.find((s) => s.id === stageId);
    if (!stage || stage.completed) return;

    setInventory((inv) => {
      let updated = [...inv];
      stage.materialsNeeded.forEach((mat) => {
        const it = updated.find((i) => i.id === mat.itemId);
        if (it) it.quantity -= mat.required;
      });
      return updated.filter((i) => i.quantity > 0 || i.category === 'weapon' || i.category === 'tool');
    });

    setShipStages((prev) =>
      prev.map((s) => (s.id === stageId ? { ...s, completed: true } : s))
    );
  }, [shipStages]);

  // Transfer Player -> Chest
  const handleTransferToChest = useCallback((item: GameItem) => {
    setInventory((inv) => inv.filter((i) => i.id !== item.id));
    setChestItems((chest) => {
      const existing = chest.find((i) => i.id === item.id);
      if (existing) {
        return chest.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i));
      }
      return [...chest, item];
    });
  }, []);

  // Transfer Chest -> Player
  const handleTransferToPlayer = useCallback((item: GameItem) => {
    setChestItems((chest) => chest.filter((i) => i.id !== item.id));
    setInventory((inv) => {
      const existing = inv.find((i) => i.id === item.id);
      if (existing) {
        return inv.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i));
      }
      return [...inv, item];
    });
  }, []);

  // Deposit All Raw Resources into Safe Chest
  const handleDepositAllResources = useCallback(() => {
    const rawResources = inventory.filter((item) => item.category !== 'weapon' && item.category !== 'tool');
    const toolsOnly = inventory.filter((item) => item.category === 'weapon' || item.category === 'tool');

    setInventory(toolsOnly);
    setChestItems((chest) => {
      let updated = [...chest];
      rawResources.forEach((r) => {
        const found = updated.find((i) => i.id === r.id);
        if (found) {
          found.quantity += r.quantity;
        } else {
          updated.push(r);
        }
      });
      return updated;
    });
  }, [inventory]);

  // Complete Letter Cinematic: Unlocks Revenge List and Door at (9..11, 19..20)
  const handleCompleteLetter = useCallback(() => {
    setIsLetterCinematicOpen(false);
    setLetterRead(true);
    setDoorUnlocked(true);
    setIsRevengeListOpen(true);
    sound.playDeploy();
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-scifi">
      {/* 1. Title Menu Screen */}
      {currentScreen === 'TITLE_MENU' && (
        <TitleMenu
          onNewGame={handleNewGame}
          onContinue={handleContinueGame}
          hasSavedGame={hasSavedGame}
          onOpenOptions={() => setIsOptionsOpen(true)}
          onOpenLore={() => setIsLoreOpen(true)}
        />
      )}

      {/* 2. Character Select Screen */}
      {currentScreen === 'CHARACTER_SELECT' && (
        <CharacterSelect
          onSelectCharacter={handleDeployCharacter}
          onBackToTitle={() => setCurrentScreen('TITLE_MENU')}
        />
      )}

      {/* 3. Active Play Screen */}
      {currentScreen === 'PLAYING' && (
        <div className="relative w-full h-full">
          <GameCanvas
            map={worldMap}
            player={player}
            character={selectedCharacter}
            enemies={enemies}
            cooldowns={cooldowns}
            doorUnlocked={doorUnlocked}
            awakeningTrigger={awakeningTrigger}
            onPlayerUpdate={handlePlayerUpdate}
            onOpenMap={() => setIsMapOpen(true)}
            onOpenPause={() => setIsPauseOpen(true)}
            onOpenInventory={() => setIsInventoryOpen(true)}
            onOpenRevengeList={() => setIsRevengeListOpen(true)}
            onCycleTool={handleCycleTool}
            onInteract={handleInteract}
            onAttackNormal={handleAttackNormal}
            onSpecial1StarPulse={handleSpecial1StarPulse}
            onSpecial2KitLaser={handleSpecial2KitLaser}
            onSpecial3Overcharge={handleSpecial3Overcharge}
            onHitEnemy={handleHitEnemy}
            onMineResource={handleMineResource}
            onPlayerDamage={handlePlayerDamage}
            onPlayerDeath={handlePlayerDeath}
          />

          <GameHUD
            player={player}
            character={selectedCharacter}
            map={worldMap}
            cooldowns={cooldowns}
            doorUnlocked={doorUnlocked}
            onOpenMap={() => setIsMapOpen(true)}
            onOpenPause={() => setIsPauseOpen(true)}
            onOpenInventory={() => setIsInventoryOpen(true)}
            onOpenRevengeList={() => setIsRevengeListOpen(true)}
            onCycleTool={handleCycleTool}
            onTriggerScan={() => {
              window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
            }}
            onAttackNormal={handleAttackNormal}
            onSpecial1StarPulse={handleSpecial1StarPulse}
            onSpecial2KitLaser={handleSpecial2KitLaser}
            onSpecial3Overcharge={handleSpecial3Overcharge}
            activeDialog={activeDialog}
            onCloseDialog={() => setActiveDialog(null)}
          />
        </div>
      )}

      {/* CRT Scanlines */}
      {settings.scanlines && (
        <div className="absolute inset-0 z-40 pointer-events-none scanlines opacity-50" />
      )}

      {/* --- MODALS --- */}
      {/* 1. Letter of Revenge Cinematic Modal (Pedestal 10, 10) */}
      {isLetterCinematicOpen && (
        <LetterCinematicModal onComplete={handleCompleteLetter} />
      )}

      {/* 2. Revenge List Modal */}
      {isRevengeListOpen && (
        <RevengeListModal onClose={() => setIsRevengeListOpen(false)} />
      )}

      {/* 3. Interactive Inventory & Tool Simulator Modal */}
      {isInventoryOpen && (
        <InventoryModal
          inventory={inventory}
          activeToolId={activeToolId}
          onSelectActiveTool={(t) => {
            setActiveToolId(t);
            setPlayer((prev) => ({ ...prev, activeToolId: t }));
          }}
          onClose={() => setIsInventoryOpen(false)}
        />
      )}

      {/* 4. Workbench Modal (10, 3) */}
      {isWorkbenchOpen && (
        <WorkbenchModal
          inventory={inventory}
          shipStages={shipStages}
          onCraftRecipe={handleCraftRecipe}
          onContributeToShip={handleContributeToShip}
          onClose={() => setIsWorkbenchOpen(false)}
        />
      )}

      {/* 5. Secure Storage Chest Modal (17, 3) */}
      {isStorageChestOpen && (
        <StorageChestModal
          playerInventory={inventory}
          chestItems={chestItems}
          onTransferToChest={handleTransferToChest}
          onTransferToPlayer={handleTransferToPlayer}
          onDepositAllResources={handleDepositAllResources}
          onClose={() => setIsStorageChestOpen(false)}
        />
      )}

      {/* 6. Death & Respawn Modal */}
      {isDeathModalOpen && (
        <DeathModal
          lostResources={lostResources}
          onRespawn={handleRespawn}
        />
      )}

      {/* 7. Tactical World Map */}
      {isMapOpen && (
        <WorldMapModal
          player={player}
          map={worldMap}
          onClose={() => setIsMapOpen(false)}
        />
      )}

      {/* 8. Pause Menu */}
      {isPauseOpen && (
        <PauseModal
          onResume={() => setIsPauseOpen(false)}
          onOpenMap={() => {
            setIsPauseOpen(false);
            setIsMapOpen(true);
          }}
          onOpenOptions={() => {
            setIsPauseOpen(false);
            setIsOptionsOpen(true);
          }}
          onSaveCheckpoint={handleSaveCheckpoint}
          onReturnToTitle={() => {
            setIsPauseOpen(false);
            setCurrentScreen('TITLE_MENU');
          }}
          saveMessage={saveMessage}
        />
      )}

      {/* 9. Options Menu */}
      {isOptionsOpen && (
        <OptionsMenu
          settings={settings}
          onUpdateSettings={(ns) => {
            setSettings((prev) => {
              const m = { ...prev, ...ns };
              try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(m)); } catch {}
              return m;
            });
          }}
          onResetSave={() => {
            try {
              localStorage.removeItem(SAVE_KEY);
              setHasSavedGame(false);
              alert('Progreso reiniciado.');
              setIsOptionsOpen(false);
            } catch {}
          }}
          onClose={() => setIsOptionsOpen(false)}
        />
      )}

      {/* 10. Lore Modal */}
      {isLoreOpen && (
        <LoreModal onClose={() => setIsLoreOpen(false)} />
      )}
    </div>
  );
}
