import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PlayerState, KitDroneState, Tile, CharacterProfile, Enemy, CombatCooldowns, VisualFX, ToolId } from '../types/game';
import { MAP_SIZE, BUNKER_MAX_X, BUNKER_MAX_Y, STASIS_EXIT_POINT } from './mapGenerator';
import { sound } from '../audio/soundManager';
import { ZoomIn, ZoomOut, Gamepad as GamepadIcon } from 'lucide-react';

interface GameCanvasProps {
  map: Tile[][];
  player: PlayerState;
  character: CharacterProfile;
  enemies: Enemy[];
  cooldowns: CombatCooldowns;
  doorUnlocked: boolean;
  awakeningTrigger?: number;
  onPlayerUpdate: (update: Partial<PlayerState>) => void;
  onOpenMap: () => void;
  onOpenPause: () => void;
  onOpenInventory: () => void;
  onOpenRevengeList: () => void;
  onCycleTool: () => void;
  onInteract: (tile: Tile) => void;
  onAttackNormal: () => void;
  onSpecial1StarPulse: () => void;
  onSpecial2KitLaser: () => void;
  onSpecial3Overcharge: () => void;
  onHitEnemy: (enemyId: string, damage: number) => void;
  onMineResource: (tile: Tile) => void;
  onPlayerDamage: (damage: number) => void;
  onPlayerDeath: () => void;
}

// Dynamic Base Tile Size before user zoom
function calculateBaseActionTileSize(w: number, h: number): number {
  const byWidth = w / 10.5;
  const byHeight = h / 8.5;
  return Math.max(60, Math.min(96, Math.round(Math.min(byWidth, byHeight))));
}

// Steam particle for industrial bunker floor vents & stasis hatch decompression
interface SteamParticle {
  x: number;
  y: number;
  vy: number;
  vx: number;
  alpha: number;
  size: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  map,
  player,
  character,
  enemies,
  cooldowns,
  doorUnlocked,
  awakeningTrigger = 1,
  onPlayerUpdate,
  onOpenMap,
  onOpenPause,
  onOpenInventory,
  onOpenRevengeList,
  onCycleTool,
  onInteract,
  onAttackNormal,
  onSpecial1StarPulse,
  onSpecial2KitLaser,
  onSpecial3Overcharge,
  onHitEnemy,
  onMineResource,
  onPlayerDamage,
  onPlayerDeath,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Position, direction and camera refs
  const posRef = useRef({ x: player.x, y: player.y });
  const dirRef = useRef<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>(player.direction);
  const baseTileSizeRef = useRef(calculateBaseActionTileSize(window.innerWidth, window.innerHeight));
  
  // Dynamic Zoom Control (0.5x to 2.0x)
  const zoomRef = useRef<number>(1.0);
  const [zoomDisplay, setZoomDisplay] = useState<number>(1.0);

  const cameraRef = useRef({
    x: player.x * baseTileSizeRef.current,
    y: player.y * baseTileSizeRef.current,
  });

  const keysRef = useRef<{ [key: string]: boolean }>({});
  const prevGamepadButtonsRef = useRef<{ [index: number]: boolean }>({});
  const [gamepadNotice, setGamepadNotice] = useState<string | null>(null);

  // Stasis Pod Awakening & Auto-Exit Sequence State
  const awakeningRef = useRef<{
    phase: 'DECOMPRESSING' | 'WALKING_OUT' | 'FREE';
    progress: number;
    timer: number;
  }>({
    phase: 'FREE',
    progress: 1.0,
    timer: 0,
  });

  const droneRef = useRef<KitDroneState>({
    x: player.x,
    y: player.y,
    hoverAngle: 0,
    scanning: false,
    scanProgress: 0,
    scanRadius: 0,
    laserFiring: false,
    laserStartX: 0,
    laserStartY: 0,
    laserEndX: 0,
    laserEndY: 0,
  });

  const visualFXRef = useRef<VisualFX[]>([]);
  const steamRef = useRef<SteamParticle[]>([]);
  const enemiesRef = useRef<Enemy[]>(enemies);
  enemiesRef.current = enemies;

  const [nearbyInteraction, setNearbyInteraction] = useState<Tile | null>(null);
  const staminaRef = useRef(player.stamina);
  const stepTimerRef = useRef(0);
  const lastAttackTimeRef = useRef(0);

  // Listen for gamepad connection
  useEffect(() => {
    const handleConnected = (e: GamepadEvent) => {
      setGamepadNotice(`🎮 Mando Conectado: ${e.gamepad.id.slice(0, 24)}... (Mapeo Activo)`);
      sound.playSelect();
      setTimeout(() => setGamepadNotice(null), 4000);
    };
    const handleDisconnected = () => {
      setGamepadNotice('Mando Desconectado');
      setTimeout(() => setGamepadNotice(null), 2500);
    };

    window.addEventListener('gamepadconnected', handleConnected);
    window.addEventListener('gamepaddisconnected', handleDisconnected);

    // Initial check for already connected gamepads
    if (navigator.getGamepads) {
      const gps = navigator.getGamepads();
      for (let i = 0; i < gps.length; i++) {
        if (gps[i]?.connected) {
          setGamepadNotice(`🎮 Mando Detectado: ${gps[i]!.id.slice(0, 24)} (Mapeo Activo)`);
          setTimeout(() => setGamepadNotice(null), 4000);
          break;
        }
      }
    }

    return () => {
      window.removeEventListener('gamepadconnected', handleConnected);
      window.removeEventListener('gamepaddisconnected', handleDisconnected);
    };
  }, []);

  // Trigger Awakening Sequence whenever awakeningTrigger changes (start or respawn)
  useEffect(() => {
    // Only if at pod origin (X <= 3, Y >= 8)
    if (player.x <= 3 && player.y >= 8) {
      posRef.current = { x: 2, y: 9 };
      dirRef.current = 'RIGHT';
      awakeningRef.current = {
        phase: 'DECOMPRESSING',
        progress: 0,
        timer: 0,
      };
      sound.playDeploy();
    } else {
      awakeningRef.current = {
        phase: 'FREE',
        progress: 1.0,
        timer: 0,
      };
    }
  }, [awakeningTrigger, player.x, player.y]);

  // Sync position on respawn or external change
  useEffect(() => {
    const S = Math.round(baseTileSizeRef.current * zoomRef.current);
    if (Math.hypot(posRef.current.x - player.x, posRef.current.y - player.y) > 2) {
      posRef.current.x = player.x;
      posRef.current.y = player.y;
      cameraRef.current.x = player.x * S;
      cameraRef.current.y = player.y * S;
    }
  }, [player.x, player.y]);

  // Scan Trigger
  const triggerScan = useCallback(() => {
    droneRef.current.scanning = true;
    droneRef.current.scanProgress = 0;
    droneRef.current.scanRadius = 0;
    sound.playScan();
  }, []);

  // Trigger Normal Attack
  const handlePerformAttackNormal = useCallback(() => {
    const now = performance.now();
    if (now - lastAttackTimeRef.current < 280) return;
    lastAttackTimeRef.current = now;

    onAttackNormal();
    sound.playSlash();

    const facing = dirRef.current;
    let fxX = posRef.current.x;
    let fxY = posRef.current.y;
    if (facing === 'UP') fxY -= 1.1;
    if (facing === 'DOWN') fxY += 1.1;
    if (facing === 'LEFT') fxX -= 1.1;
    if (facing === 'RIGHT') fxX += 1.1;

    visualFXRef.current.push({
      id: `slash_${now}`,
      type: 'slash',
      x: fxX,
      y: fxY,
      duration: 0.18,
      elapsed: 0,
    });

    const damage = player.overchargeActive ? 88 : 35;

    enemiesRef.current.forEach((en) => {
      if (en.isDead) return;
      const dist = Math.hypot(en.x - fxX, en.y - fxY);
      if (dist < 1.4) {
        onHitEnemy(en.id, damage);
        visualFXRef.current.push({
          id: `dmg_${now}_${en.id}`,
          type: 'damageText',
          x: en.x,
          y: en.y - 0.5,
          text: `-${damage}`,
          color: player.overchargeActive ? '#facc15' : '#38bdf8',
          duration: 0.6,
          elapsed: 0,
        });
      }
    });

    // Resource check
    const targetTileX = Math.round(fxX);
    const targetTileY = Math.round(fxY);
    if (map[targetTileY] && map[targetTileY][targetTileX]) {
      const tile = map[targetTileY][targetTileX];
      if (
        tile.type === 'RESOURCE_ORE_VEIN' ||
        tile.type === 'RESOURCE_SILICA_TREE' ||
        tile.type === 'RESOURCE_CRYSTAL' ||
        tile.type === 'RESOURCE_SCRAP'
      ) {
        onMineResource(tile);
      }
    }
  }, [map, onAttackNormal, onHitEnemy, onMineResource, player.overchargeActive]);

  // Trigger Special 1: Pulso Estelar
  const handlePerformSpecial1 = useCallback(() => {
    if (cooldowns.starPulse > 0) {
      sound.playLocked();
      return;
    }
    onSpecial1StarPulse();
    sound.playStarPulse();

    const pX = posRef.current.x;
    const pY = posRef.current.y;

    visualFXRef.current.push({
      id: `pulse_${performance.now()}`,
      type: 'starPulse',
      x: pX,
      y: pY,
      radius: 3.5,
      duration: 0.45,
      elapsed: 0,
    });

    enemiesRef.current.forEach((en) => {
      if (en.isDead) return;
      const dist = Math.hypot(en.x - pX, en.y - pY);
      if (dist <= 3.8) {
        const damage = 55;
        onHitEnemy(en.id, damage);

        const angle = Math.atan2(en.y - pY, en.x - pX);
        en.x += Math.cos(angle) * 1.5;
        en.y += Math.sin(angle) * 1.5;

        visualFXRef.current.push({
          id: `dmg_pulse_${performance.now()}_${en.id}`,
          type: 'damageText',
          x: en.x,
          y: en.y - 0.5,
          text: `-${damage} PULSO!`,
          color: '#38bdf8',
          duration: 0.7,
          elapsed: 0,
        });
      }
    });
  }, [cooldowns.starPulse, onHitEnemy, onSpecial1StarPulse]);

  // Trigger Special 2: Corte Láser de K.I.T.
  const handlePerformSpecial2 = useCallback(() => {
    if (cooldowns.kitLaser > 0) {
      sound.playLocked();
      return;
    }
    onSpecial2KitLaser();
    sound.playKitLaser();

    const pX = posRef.current.x;
    const pY = posRef.current.y;
    const facing = dirRef.current;

    let targetX = pX;
    let targetY = pY;
    if (facing === 'UP') targetY -= 9;
    if (facing === 'DOWN') targetY += 9;
    if (facing === 'LEFT') targetX -= 9;
    if (facing === 'RIGHT') targetX += 9;

    visualFXRef.current.push({
      id: `laser_${performance.now()}`,
      type: 'laser',
      x: pX,
      y: pY - 0.5,
      targetX,
      targetY,
      duration: 0.35,
      elapsed: 0,
    });

    const damage = 85;
    enemiesRef.current.forEach((en) => {
      if (en.isDead) return;
      let hit = false;
      if (facing === 'UP' && en.x >= pX - 1 && en.x <= pX + 1 && en.y <= pY && en.y >= pY - 9) hit = true;
      if (facing === 'DOWN' && en.x >= pX - 1 && en.x <= pX + 1 && en.y >= pY && en.y <= pY + 9) hit = true;
      if (facing === 'LEFT' && en.y >= pY - 1 && en.y <= pY + 1 && en.x <= pX && en.x >= pX - 9) hit = true;
      if (facing === 'RIGHT' && en.y >= pY - 1 && en.y <= pY + 1 && en.x >= pX && en.x <= pX + 9) hit = true;

      if (hit) {
        onHitEnemy(en.id, damage);
        visualFXRef.current.push({
          id: `dmg_laser_${performance.now()}_${en.id}`,
          type: 'damageText',
          x: en.x,
          y: en.y - 0.5,
          text: `-${damage} LÁSER`,
          color: '#22d3ee',
          duration: 0.8,
          elapsed: 0,
        });
      }
    });
  }, [cooldowns.kitLaser, onHitEnemy, onSpecial2KitLaser]);

  // Trigger Special 3: Sobrecarga de Aethel
  const handlePerformSpecial3 = useCallback(() => {
    if (cooldowns.overcharge > 0) {
      sound.playLocked();
      return;
    }
    onSpecial3Overcharge();
    sound.playOvercharge();

    visualFXRef.current.push({
      id: `overcharge_${performance.now()}`,
      type: 'overcharge',
      x: posRef.current.x,
      y: posRef.current.y,
      duration: 10,
      elapsed: 0,
    });
  }, [cooldowns.overcharge, onSpecial3Overcharge]);

  // Zoom Adjustment Helpers (0.5x to 2.0x)
  const adjustZoom = useCallback((delta: number) => {
    const next = Math.min(2.0, Math.max(0.5, Math.round((zoomRef.current + delta) * 100) / 100));
    zoomRef.current = next;
    setZoomDisplay(next);
  }, []);

  // Keyboard Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;

      if (e.code === 'KeyE') {
        if (nearbyInteraction) {
          sound.playInteract();
          onInteract(nearbyInteraction);
        } else {
          onOpenInventory();
        }
      } else if (e.code === 'KeyQ' || e.code === 'Tab') {
        e.preventDefault();
        onCycleTool();
      } else if (e.code === 'KeyI') {
        e.preventDefault();
        sound.playSelect();
        onOpenInventory();
      } else if (e.code === 'KeyL') {
        e.preventDefault();
        sound.playSelect();
        onOpenRevengeList();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        sound.playSelect();
        onOpenMap();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        sound.playSelect();
        onOpenPause();
      } else if (e.code === 'Space') {
        e.preventDefault();
        triggerScan();
      } else if (e.code === 'KeyJ' || e.code === 'KeyF') {
        e.preventDefault();
        handlePerformAttackNormal();
      } else if (e.code === 'Digit1') {
        e.preventDefault();
        handlePerformSpecial1();
      } else if (e.code === 'Digit2') {
        e.preventDefault();
        handlePerformSpecial2();
      } else if (e.code === 'Digit3') {
        e.preventDefault();
        handlePerformSpecial3();
      } else if (e.code === 'Equal' || e.code === 'NumpadAdd') {
        e.preventDefault();
        adjustZoom(0.1);
      } else if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
        e.preventDefault();
        adjustZoom(-0.1);
      } else if (e.code === 'Digit0') {
        zoomRef.current = 1.0;
        setZoomDisplay(1.0);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        handlePerformAttackNormal();
      }
    };

    const handleBlur = () => {
      keysRef.current = {};
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('blur', handleBlur);
    };
  }, [
    nearbyInteraction,
    onInteract,
    onOpenInventory,
    onOpenRevengeList,
    onOpenMap,
    onOpenPause,
    onCycleTool,
    adjustZoom,
    triggerScan,
    handlePerformAttackNormal,
    handlePerformSpecial1,
    handlePerformSpecial2,
    handlePerformSpecial3,
  ]);

  // Wheel and Touch Pinch-to-Zoom Listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Mouse Wheel Zoom
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.08 : -0.08;
      adjustZoom(delta);
    };

    // Touch Pinch-to-Zoom
    let initialTouchDist: number | null = null;
    let initialZoom = 1.0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialZoom = zoomRef.current;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialTouchDist !== null) {
        e.preventDefault();
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const scale = currentDist / initialTouchDist;
        const targetZoom = Math.min(2.0, Math.max(0.5, Math.round(initialZoom * scale * 100) / 100));
        zoomRef.current = targetZoom;
        setZoomDisplay(targetZoom);
      }
    };

    const handleTouchEnd = () => {
      initialTouchDist = null;
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [adjustZoom]);

  // Main 60 FPS Render & Simulation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    let tickCount = 0;

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        baseTileSizeRef.current = calculateBaseActionTileSize(canvas.width, canvas.height);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const gameLoop = (currentTime: number) => {
      const rawDt = (currentTime - lastTime) / 1000;
      const dt = Math.min(rawDt, 0.05);
      lastTime = currentTime;
      tickCount++;

      // Effective Tile Size and Sprite Scale from Dynamic Zoom (0.5x to 2.0x)
      const baseS = baseTileSizeRef.current;
      const S = Math.round(baseS * zoomRef.current);
      const spriteScale = S / 40;

      // -------------------------------------------------------------
      // GAMEPAD API POLLING (100% Function Mapping)
      // -------------------------------------------------------------
      let gpDx = 0;
      let gpDy = 0;

      if (navigator.getGamepads) {
        const gamepads = navigator.getGamepads();
        let gp: Gamepad | null = null;
        for (let i = 0; i < gamepads.length; i++) {
          if (gamepads[i]?.connected) {
            gp = gamepads[i];
            break;
          }
        }

        if (gp) {
          const prevButtons = prevGamepadButtonsRef.current;

          // 1. D-Pad Movement (12: Up, 13: Down, 14: Left, 15: Right)
          if (gp.buttons[12]?.pressed) gpDy -= 1;
          if (gp.buttons[13]?.pressed) gpDy += 1;
          if (gp.buttons[14]?.pressed) gpDx -= 1;
          if (gp.buttons[15]?.pressed) gpDx += 1;

          // 2. Left Stick Analog Movement (Axes 0, 1) with Deadzone 0.18
          const leftStickX = gp.axes[0] ?? 0;
          const leftStickY = gp.axes[1] ?? 0;
          if (Math.abs(leftStickX) > 0.18) gpDx += leftStickX;
          if (Math.abs(leftStickY) > 0.18) gpDy += leftStickY;

          // 3. Right Stick Directional Aiming (Axes 2, 3) with Deadzone 0.35
          const rightStickX = gp.axes[2] ?? 0;
          const rightStickY = gp.axes[3] ?? 0;
          if (Math.hypot(rightStickX, rightStickY) > 0.35) {
            if (Math.abs(rightStickX) > Math.abs(rightStickY)) {
              dirRef.current = rightStickX > 0 ? 'RIGHT' : 'LEFT';
            } else {
              dirRef.current = rightStickY > 0 ? 'DOWN' : 'UP';
            }
          }

          // 4. Front Face Buttons (Attacks & Powers)
          // Botón A (0): Ataque Normal / Golpe Básico
          if (gp.buttons[0]?.pressed) {
            handlePerformAttackNormal();
          }

          // Botón X (2): Poder 1 (Pulso Estelar)
          if (gp.buttons[2]?.pressed && !prevButtons[2]) {
            handlePerformSpecial1();
          }

          // Botón Y (3): Poder 2 (Corte Láser K.I.T.)
          if (gp.buttons[3]?.pressed && !prevButtons[3]) {
            handlePerformSpecial2();
          }

          // Botón B (1): Poder 3 (Sobrecarga de Aethel)
          if (gp.buttons[1]?.pressed && !prevButtons[1]) {
            handlePerformSpecial3();
          }

          // 5. Shoulder Buttons & Triggers
          // R1 / RB (5): Interactuar / Abrir inventario K.I.T.
          if (gp.buttons[5]?.pressed && !prevButtons[5]) {
            if (nearbyInteraction) {
              sound.playInteract();
              onInteract(nearbyInteraction);
            } else {
              sound.playSelect();
              onOpenInventory();
            }
          }

          // L1 / LB (4): Cambiar / Rotar herramientas equipadas
          if (gp.buttons[4]?.pressed && !prevButtons[4]) {
            onCycleTool();
          }

          // R2 / RT (7): Zoom In (Acercar cámara manualmente)
          const r2Val = gp.buttons[7]?.value ?? (gp.buttons[7]?.pressed ? 1 : 0);
          if (r2Val > 0.15) {
            zoomRef.current = Math.min(2.0, zoomRef.current + dt * 0.75 * r2Val);
            setZoomDisplay(Math.round(zoomRef.current * 100) / 100);
          }

          // L2 / LT (6): Zoom Out (Alejar cámara manualmente)
          const l2Val = gp.buttons[6]?.value ?? (gp.buttons[6]?.pressed ? 1 : 0);
          if (l2Val > 0.15) {
            zoomRef.current = Math.max(0.5, zoomRef.current - dt * 0.75 * l2Val);
            setZoomDisplay(Math.round(zoomRef.current * 100) / 100);
          }

          // 6. Central Buttons
          // Select / Back (8): Abrir / Cerrar Lista de la Venganza
          if (gp.buttons[8]?.pressed && !prevButtons[8]) {
            sound.playSelect();
            onOpenRevengeList();
          }

          // Start / Menu (9): Menú de Pausa y Ajustes
          if (gp.buttons[9]?.pressed && !prevButtons[9]) {
            sound.playSelect();
            onOpenPause();
          }

          // Store current button states for edge triggering
          const currStates: { [k: number]: boolean } = {};
          gp.buttons.forEach((btn, idx) => {
            currStates[idx] = btn.pressed;
          });
          prevGamepadButtonsRef.current = currStates;
        }
      }

      // -------------------------------------------------------------
      // 1. AWAKENING & STASIS POD EXIT SIMULATION
      // -------------------------------------------------------------
      const awakening = awakeningRef.current;
      let isAwakeningRestricted = false;

      if (awakening.phase === 'DECOMPRESSING') {
        isAwakeningRestricted = true;
        awakening.timer += dt;
        awakening.progress = Math.min(1.0, awakening.timer / 1.2);

        // Spawn copious steam clouds puffing from pod hatch base
        if (tickCount % 2 === 0 && steamRef.current.length < 50) {
          steamRef.current.push({
            x: (2 + (Math.random() - 0.5) * 1.5) * S,
            y: (9.5 + (Math.random() - 0.5) * 0.6) * S,
            vy: -(Math.random() * 32 + 22),
            vx: (Math.random() - 0.2) * 12,
            alpha: 0.85,
            size: Math.random() * 6 + 5,
          });
        }

        if (awakening.timer >= 1.2) {
          awakening.phase = 'WALKING_OUT';
          awakening.timer = 0;
          dirRef.current = 'RIGHT';
        }
      } else if (awakening.phase === 'WALKING_OUT') {
        isAwakeningRestricted = true;
        awakening.timer += dt;
        dirRef.current = 'RIGHT';

        // Auto walk from (2, 9) to (4, 9)
        const walkSpeed = 2.0; // tiles per second
        posRef.current.x = Math.min(STASIS_EXIT_POINT.x, 2.0 + awakening.timer * walkSpeed);
        posRef.current.y = STASIS_EXIT_POINT.y;

        // Footstep sounds
        stepTimerRef.current += dt;
        if (stepTimerRef.current >= 0.3) {
          sound.playStep(true);
          stepTimerRef.current = 0;
        }

        if (posRef.current.x >= STASIS_EXIT_POINT.x) {
          posRef.current.x = STASIS_EXIT_POINT.x;
          awakening.phase = 'FREE';
          awakening.progress = 1.0;
          sound.playInteract();
        }
      }

      // -------------------------------------------------------------
      // 2. NORMAL MOVEMENT LOGIC (When Not Awakening)
      // -------------------------------------------------------------
      let isMoving = awakening.phase === 'WALKING_OUT';
      let canSprint = false;

      if (!isAwakeningRestricted) {
        const isShift = keysRef.current['ShiftLeft'] || keysRef.current['ShiftRight'];
        canSprint = isShift && staminaRef.current > 5;
        const speedMultiplier = player.overchargeActive ? 1.3 : 1.0;
        const baseSpeed = (character.stats.speed / 100) * 4.5 * speedMultiplier;
        const currentSpeed = canSprint ? baseSpeed * 1.6 : baseSpeed;

        let dx = 0;
        let dy = 0;

        // Keyboard movement
        if (keysRef.current['KeyW'] || keysRef.current['ArrowUp']) {
          dy -= 1;
          dirRef.current = 'UP';
        }
        if (keysRef.current['KeyS'] || keysRef.current['ArrowDown']) {
          dy += 1;
          dirRef.current = 'DOWN';
        }
        if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) {
          dx -= 1;
          dirRef.current = 'LEFT';
        }
        if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) {
          dx += 1;
          dirRef.current = 'RIGHT';
        }

        // Merge Gamepad Movement
        if (Math.hypot(gpDx, gpDy) > 0.2) {
          dx += gpDx;
          dy += gpDy;
          // Set direction if right stick didn't already set it
          const rightStickMag = Math.hypot(
            (navigator.getGamepads?.()[0]?.axes[2] ?? 0),
            (navigator.getGamepads?.()[0]?.axes[3] ?? 0)
          );
          if (rightStickMag <= 0.35) {
            if (Math.abs(dx) > Math.abs(dy)) {
              dirRef.current = dx > 0 ? 'RIGHT' : 'LEFT';
            } else {
              dirRef.current = dy > 0 ? 'DOWN' : 'UP';
            }
          }
        }

        const moveMag = Math.hypot(dx, dy);
        if (moveMag > 0.01) {
          dx = (dx / moveMag);
          dy = (dy / moveMag);
          isMoving = true;
        }

        // Stamina
        if (isMoving && canSprint) {
          staminaRef.current = Math.max(0, staminaRef.current - dt * 25);
        } else {
          staminaRef.current = Math.min(player.maxStamina, staminaRef.current + dt * 18);
        }

        // Footstep sound
        if (isMoving) {
          stepTimerRef.current += dt;
          const interval = canSprint ? 0.22 : 0.35;
          if (stepTimerRef.current >= interval) {
            const isBunker = posRef.current.x <= BUNKER_MAX_X && posRef.current.y <= BUNKER_MAX_Y;
            sound.playStep(isBunker);
            stepTimerRef.current = 0;
          }
        }

        // Collision Check
        const nextX = Math.max(0.5, Math.min(MAP_SIZE - 1.5, posRef.current.x + dx * currentSpeed * dt));
        const nextY = Math.max(0.5, Math.min(MAP_SIZE - 1.5, posRef.current.y + dy * currentSpeed * dt));

        const targetTileX = Math.floor(nextX);
        const targetTileY = Math.floor(nextY);

        if (map[targetTileY] && map[targetTileY][targetTileX] && map[targetTileY][targetTileX].walkable) {
          posRef.current.x = nextX;
          posRef.current.y = nextY;
        } else {
          const checkTileX = Math.floor(nextX);
          const currTileY = Math.floor(posRef.current.y);
          if (map[currTileY] && map[currTileY][checkTileX] && map[currTileY][checkTileX].walkable) {
            posRef.current.x = nextX;
          }
          const currTileX = Math.floor(posRef.current.x);
          const checkTileY = Math.floor(nextY);
          if (map[checkTileY] && map[checkTileY][currTileX] && map[checkTileY][currTileX].walkable) {
            posRef.current.y = nextY;
          }
        }
      }

      // Interaction check
      const playerTileX = Math.round(posRef.current.x);
      const playerTileY = Math.round(posRef.current.y);
      let foundInteract: Tile | null = null;

      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const checkY = playerTileY + oy;
          const checkX = playerTileX + ox;
          if (map[checkY] && map[checkY][checkX] && map[checkY][checkX].interactive) {
            foundInteract = map[checkY][checkX];
            break;
          }
        }
        if (foundInteract) break;
      }
      setNearbyInteraction(foundInteract);

      // Enemy AI
      const pX = posRef.current.x;
      const pY = posRef.current.y;
      const isPlayerOutsideBunker = pX > BUNKER_MAX_X || pY > BUNKER_MAX_Y;

      enemiesRef.current.forEach((en) => {
        if (en.isDead) return;
        const distToPlayer = Math.hypot(pX - en.x, pY - en.y);

        if (isPlayerOutsideBunker && distToPlayer <= en.aggroDistance) {
          const angle = Math.atan2(pY - en.y, pX - en.x);
          en.x += Math.cos(angle) * en.speed * dt;
          en.y += Math.sin(angle) * en.speed * dt;

          if (distToPlayer <= 1.0) {
            if (tickCount % 48 === 0) {
              const appliedDmg = player.overchargeActive ? Math.round(en.damage * 0.4) : en.damage;
              onPlayerDamage(appliedDmg);
              sound.playLocked();

              visualFXRef.current.push({
                id: `player_hit_${tickCount}`,
                type: 'damageText',
                x: pX,
                y: pY - 0.7,
                text: `-${appliedDmg} HP`,
                color: '#ef4444',
                duration: 0.6,
                elapsed: 0,
              });

              if (player.health - appliedDmg <= 0) {
                sound.playDeath();
                onPlayerDeath();
              }
            }
          }
        } else {
          const distToCenter = Math.hypot(en.x - en.patrolCenter.x, en.y - en.patrolCenter.y);
          if (distToCenter > en.patrolRadius) {
            const angle = Math.atan2(en.patrolCenter.y - en.y, en.patrolCenter.x - en.x);
            en.x += Math.cos(angle) * (en.speed * 0.5) * dt;
            en.y += Math.sin(angle) * (en.speed * 0.5) * dt;
          }
        }
      });

      // Update Steam Particles for bunker floor vents (X: 4, 10 at Y: 10)
      if (tickCount % 5 === 0 && steamRef.current.length < 40) {
        const ventCols = [4, 10];
        const vxCol = ventCols[Math.floor(Math.random() * ventCols.length)];
        steamRef.current.push({
          x: (vxCol + 0.5) * S + (Math.random() - 0.5) * 12,
          y: 10.4 * S,
          vy: -(Math.random() * 24 + 18),
          vx: (Math.random() - 0.5) * 8,
          alpha: 0.65,
          size: Math.random() * 5 + 4,
        });
      }

      steamRef.current = steamRef.current.filter((sp) => {
        sp.y += sp.vy * dt;
        sp.x += Math.sin(sp.y * 0.05 + tickCount * 0.05) * 0.6;
        sp.alpha -= dt * 0.32;
        sp.size += dt * 6.0;
        return sp.alpha > 0;
      });

      // Sync position periodically
      if (tickCount % 6 === 0) {
        onPlayerUpdate({
          x: posRef.current.x,
          y: posRef.current.y,
          direction: dirRef.current,
          moving: isMoving,
          sprinting: canSprint,
          stamina: Math.round(staminaRef.current),
        });
      }

      // Camera Lerp
      const targetCamX = posRef.current.x * S + S / 2;
      const targetCamY = posRef.current.y * S + S / 2;
      cameraRef.current.x += (targetCamX - cameraRef.current.x) * (dt * 7.5);
      cameraRef.current.y += (targetCamY - cameraRef.current.y) * (dt * 7.5);

      const viewX = cameraRef.current.x - canvas.width / 2;
      const viewY = cameraRef.current.y - canvas.height / 2;

      // Clear Canvas
      ctx.fillStyle = '#05070e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 1. RENDER BUNKER ROOM AS UNIFIED ARCHITECTURAL SPACE (Smooth Titanium, No Grid Lines)
      const bunkerScreenX0 = 0 * S - viewX;
      const bunkerScreenY0 = 0 * S - viewY;
      const bunkerScreenX1 = (BUNKER_MAX_X + 1) * S - viewX;
      const bunkerScreenY1 = (BUNKER_MAX_Y + 1) * S - viewY;

      if (
        bunkerScreenX1 >= 0 &&
        bunkerScreenX0 <= canvas.width &&
        bunkerScreenY1 >= 0 &&
        bunkerScreenY0 <= canvas.height
      ) {
        drawBunkerRoom(
          ctx,
          viewX,
          viewY,
          S,
          tickCount,
          doorUnlocked,
          awakening.progress,
          awakening.phase === 'DECOMPRESSING'
        );
      }

      // 2. RENDER WILDERNESS TILES OUTSIDE BUNKER
      const startTileX = Math.max(0, Math.floor(viewX / S) - 1);
      const endTileX = Math.min(MAP_SIZE - 1, Math.ceil((viewX + canvas.width) / S) + 1);
      const startTileY = Math.max(0, Math.floor(viewY / S) - 1);
      const endTileY = Math.min(MAP_SIZE - 1, Math.ceil((viewY + canvas.height) / S) + 1);

      for (let y = startTileY; y <= endTileY; y++) {
        for (let x = startTileX; x <= endTileX; x++) {
          if (x > BUNKER_MAX_X || y > BUNKER_MAX_Y) {
            const tile = map[y][x];
            const screenX = Math.round(x * S - viewX);
            const screenY = Math.round(y * S - viewY);
            drawWildernessTile(ctx, tile, screenX, screenY, S, tickCount);
          }
        }
      }

      // Ambient Sci-Fi Neon Lighting Reflections
      drawBunkerAmbientLighting(ctx, viewX, viewY, S, tickCount, doorUnlocked);

      // Render Steam Clouds
      steamRef.current.forEach((sp) => {
        const sx = sp.x - viewX;
        const sy = sp.y - viewY;
        const radius = Math.max(0.1, sp.size * (S / 40));
        ctx.save();
        ctx.fillStyle = `rgba(165, 243, 252, ${Math.max(0, sp.alpha * 0.75)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(103, 232, 249, ${Math.max(0, sp.alpha * 0.35)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(0.1, radius * 0.6), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Security Boundary line
      drawBunkerSecurityBoundary(ctx, viewX, viewY, S, tickCount);

      // Render Enemies
      enemiesRef.current.forEach((en) => {
        if (en.isDead) return;
        const eScreenX = en.x * S - viewX;
        const eScreenY = en.y * S - viewY;
        ctx.save();
        ctx.translate(eScreenX, eScreenY);
        ctx.scale(spriteScale, spriteScale);
        drawEnemySprite(ctx, 0, 0, en, tickCount);
        ctx.restore();
      });

      // Render Player Character with IN-HAND WEAPON VISIBLE
      const playerScreenX = posRef.current.x * S - viewX;
      const playerScreenY = posRef.current.y * S - viewY;

      ctx.save();
      ctx.translate(playerScreenX, playerScreenY);
      ctx.scale(spriteScale, spriteScale);
      drawPlayerSprite(
        ctx,
        0,
        0,
        character,
        isMoving,
        tickCount,
        dirRef.current,
        player.overchargeActive,
        player.activeToolId
      );
      ctx.restore();

      // Render Drone K.I.T.
      ctx.save();
      ctx.translate(playerScreenX, playerScreenY);
      ctx.scale(spriteScale, spriteScale);
      drawKitDrone(ctx, 0, 0, tickCount);
      ctx.restore();

      // Render Visual Combat FX & Projectiles
      visualFXRef.current = visualFXRef.current.filter((fx) => {
        fx.elapsed += dt;
        if (fx.elapsed >= fx.duration) {
          return false;
        }

        const progress = Math.min(1, Math.max(0, fx.elapsed / fx.duration));
        const fxScreenX = fx.x * S - viewX;
        const fxScreenY = fx.y * S - viewY;

        if (fx.type === 'slash') {
          const slashRadius = Math.max(0.1, 28 * (1 - progress) * spriteScale);
          ctx.save();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 4 * spriteScale;
          ctx.beginPath();
          ctx.arc(fxScreenX, fxScreenY, slashRadius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else if (fx.type === 'starPulse') {
          ctx.save();
          const r = Math.max(0.1, (fx.radius || 3.5) * S * progress);
          ctx.strokeStyle = `rgba(56, 189, 248, ${Math.max(0, 1 - progress)})`;
          ctx.lineWidth = 6 * spriteScale;
          ctx.beginPath();
          ctx.arc(fxScreenX, fxScreenY, r, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = `rgba(14, 165, 233, ${Math.max(0, 0.25 - progress * 0.25)})`;
          ctx.fill();
          ctx.restore();
        } else if (fx.type === 'laser') {
          ctx.save();
          const targetScreenX = (fx.targetX || fx.x) * S - viewX;
          const targetScreenY = (fx.targetY || fx.y) * S - viewY;

          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 8 * spriteScale;
          ctx.shadowColor = '#00e5ff';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.moveTo(fxScreenX, fxScreenY);
          ctx.lineTo(targetScreenX, targetScreenY);
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3 * spriteScale;
          ctx.beginPath();
          ctx.moveTo(fxScreenX, fxScreenY);
          ctx.lineTo(targetScreenX, targetScreenY);
          ctx.stroke();
          ctx.restore();
        } else if (fx.type === 'damageText') {
          ctx.save();
          ctx.fillStyle = fx.color || '#f43f5e';
          ctx.font = `bold ${Math.round(12 * spriteScale)}px "Press Start 2P", monospace`;
          ctx.fillText(fx.text || '', fxScreenX - 10, fxScreenY - progress * 24);
          ctx.restore();
        }

        return true;
      });

      // Drone Scan Wave
      if (droneRef.current.scanning) {
        droneRef.current.scanProgress += dt * 1.6;
        droneRef.current.scanRadius = Math.max(0.1, droneRef.current.scanProgress * 320 * spriteScale);

        ctx.save();
        ctx.beginPath();
        ctx.arc(playerScreenX, playerScreenY, droneRef.current.scanRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56, 189, 248, ${Math.max(0, 0.8 - droneRef.current.scanProgress * 0.7)})`;
        ctx.lineWidth = 3 * spriteScale;
        ctx.stroke();
        ctx.restore();

        if (droneRef.current.scanProgress >= 1) {
          droneRef.current.scanning = false;
        }
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [
    map,
    character,
    doorUnlocked,
    onPlayerUpdate,
    onPlayerDamage,
    onPlayerDeath,
    onCycleTool,
    onInteract,
    onOpenInventory,
    onOpenPause,
    onOpenRevengeList,
    handlePerformAttackNormal,
    handlePerformSpecial1,
    handlePerformSpecial2,
    handlePerformSpecial3,
    nearbyInteraction,
    player.maxStamina,
    player.health,
    player.overchargeActive,
    player.activeToolId,
  ]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-950">
      <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />

      {/* Awakening Notification Banner */}
      {awakeningRef.current.phase !== 'FREE' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-900/90 border-2 border-emerald-400 rounded-lg shadow-xl shadow-emerald-950/60 backdrop-blur-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold text-emerald-300 font-arcade uppercase tracking-wider">
              {awakeningRef.current.phase === 'DECOMPRESSING' 
                ? 'DESPRESURIZANDO CÁPSULA CRIOGÉNICA...' 
                : 'SALIENDO A CASILLA LIBRE (X: 4, Y: 9)...'}
            </span>
          </div>
        </div>
      )}

      {/* Gamepad Connection Toast */}
      {gamepadNotice && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-900/95 border border-cyan-400/80 rounded-full shadow-2xl shadow-cyan-950/80 backdrop-blur-md">
            <GamepadIcon className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-100 font-scifi">
              {gamepadNotice}
            </span>
          </div>
        </div>
      )}

      {/* Floating Dynamic Zoom Controls (0.5x to 2.0x) */}
      <div className="absolute bottom-24 right-5 z-20 flex items-center gap-1.5 p-1.5 bg-slate-950/85 border border-slate-800 hover:border-cyan-500/50 rounded-lg shadow-xl backdrop-blur-xs">
        <button
          onClick={() => adjustZoom(-0.1)}
          title="Alejar Cámara (Rueda Abajo / L2 en Mando / Tecla -)"
          className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span
          onClick={() => {
            zoomRef.current = 1.0;
            setZoomDisplay(1.0);
          }}
          title="Restablecer Zoom a 1.0x (Tecla 0)"
          className="text-[11px] font-bold text-cyan-300 font-telemetry px-1.5 cursor-pointer hover:underline"
        >
          {zoomDisplay.toFixed(1)}x
        </span>

        <button
          onClick={() => adjustZoom(0.1)}
          title="Acercar Cámara (Rueda Arriba / R2 en Mando / Tecla +)"
          className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>

      {/* Proximity Interaction Prompt */}
      {nearbyInteraction && nearbyInteraction.interactLabel && awakeningRef.current.phase === 'FREE' && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-900/90 border-2 border-cyan-400 rounded-lg shadow-xl shadow-cyan-950/60 backdrop-blur-xs">
            <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-cyan-950 bg-cyan-400 rounded-sm font-arcade">
              E / R1
            </span>
            <span className="text-sm font-medium text-slate-100 font-scifi">
              {nearbyInteraction.interactLabel}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 1. ARCHITECTURAL UNIFIED BUNKER ROOM RENDERING (14x12 TILES, SMOOTH TITANIUM)
// ============================================================================

function drawBunkerRoom(
  ctx: CanvasRenderingContext2D,
  viewX: number,
  viewY: number,
  S: number,
  tick: number,
  doorUnlocked: boolean,
  hatchProgress: number,
  isDecompressing: boolean
) {
  const roomX = Math.round(0 * S - viewX);
  const roomY = Math.round(0 * S - viewY);
  const roomW = Math.round(14 * S);
  const roomH = Math.round(12 * S);

  const floorX = Math.round(1 * S - viewX);
  const floorY = Math.round(1 * S - viewY);
  const floorW = Math.round(12 * S);
  const floorH = Math.round(10 * S);

  // -------------------------------------------------------------
  // A. CONTINUOUS SMOOTH TITANIUM FLOOR (NO 1x1 GRID SQUARES!)
  // -------------------------------------------------------------
  ctx.fillStyle = '#161d28';
  ctx.fillRect(floorX, floorY, floorW, floorH);

  // Main titanium floor polished slab
  const floorGrad = ctx.createLinearGradient(floorX, floorY, floorX, floorY + floorH);
  floorGrad.addColorStop(0, '#2d3748');
  floorGrad.addColorStop(0.5, '#262f3d');
  floorGrad.addColorStop(1, '#1e2633');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(floorX + 1, floorY + 1, floorW - 2, floorH - 2);

  // Continuous diagonal specular sheen across entire floor
  const sheenGrad = ctx.createLinearGradient(floorX, floorY, floorX + floorW, floorY + floorH);
  sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
  sheenGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.16)');
  sheenGrad.addColorStop(0.65, 'rgba(255, 255, 255, 0.02)');
  sheenGrad.addColorStop(1, 'rgba(0, 0, 0, 0.16)');
  ctx.fillStyle = sheenGrad;
  ctx.fillRect(floorX + 1, floorY + 1, floorW - 2, floorH - 2);

  // Architectural Large-Format Panel Seams (4 Wide Bays)
  const midY = floorY + Math.round(floorH * 0.5);
  ctx.fillStyle = '#111622';
  ctx.fillRect(floorX + 2, midY - 1, floorW - 4, 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.fillRect(floorX + 2, midY + 1, floorW - 4, 1);

  // Vertical panel seams at X = 4.5 and X = 9.5
  const seamX1 = Math.round(5 * S - viewX);
  const seamX2 = Math.round(9 * S - viewX);
  [seamX1, seamX2].forEach((sx) => {
    ctx.fillStyle = '#111622';
    ctx.fillRect(sx - 1, floorY + 2, 2, floorH - 4);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(sx + 1, floorY + 2, 1, floorH - 4);
  });

  // Corner rivets only at large panel corners
  const drawCornerRivet = (rx: number, ry: number) => {
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(rx - 2, ry - 2, 4, 4);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(rx - 1, ry - 1, 2, 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(rx - 1, ry - 1, 1, 1);
  };

  [floorX + 8, seamX1, seamX2, floorX + floorW - 8].forEach((rx) => {
    [floorY + 8, midY, floorY + floorH - 8].forEach((ry) => {
      drawCornerRivet(rx, ry);
    });
  });

  // Lower Floor Conduit Pipes (Green & Red) running horizontally along bottom wall (Y = 10)
  const pipeY = Math.round(10.6 * S - viewY);
  ctx.fillStyle = '#14532d';
  ctx.fillRect(floorX, pipeY, floorW, Math.max(3, Math.round(S * 0.09)));
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(floorX, pipeY + 1, floorW, Math.max(1, Math.round(S * 0.03)));

  ctx.fillStyle = '#7f1d1d';
  ctx.fillRect(floorX, pipeY + Math.round(S * 0.1), floorW, Math.max(3, Math.round(S * 0.09)));
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(floorX, pipeY + Math.round(S * 0.1) + 1, floorW, Math.max(1, Math.round(S * 0.03)));

  // Silver conduit mounting brackets every 2 tiles
  for (let bx = 2; bx <= 12; bx += 2) {
    const clX = Math.round(bx * S - viewX);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(clX - 2, pipeY - 2, 5, Math.max(8, Math.round(S * 0.24)));
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(clX - 1, pipeY - 1, 3, Math.max(6, Math.round(S * 0.2)));
  }

  // Floor Exhaust Steam Vents at X = 4 and X = 10, Y = 10
  [4, 10].forEach((vxCol) => {
    const ventX = Math.round((vxCol + 0.15) * S - viewX);
    const ventY = Math.round(10.25 * S - viewY);
    const ventW = Math.round(S * 0.7);
    const ventH = Math.round(S * 0.35);

    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(ventX, ventY, ventW, ventH);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(ventX + 1.5, ventY + 1.5, ventW - 3, ventH - 3);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(ventX + 1.5, ventY + 1.5, ventW - 3, ventH - 3);

    const ventPulse = 0.4 + Math.sin(tick * 0.1 + vxCol) * 0.25;
    ctx.fillStyle = `rgba(34, 211, 238, ${ventPulse})`;
    ctx.fillRect(ventX + 3, ventY + 3, ventW - 6, ventH - 6);

    ctx.fillStyle = '#020617';
    for (let gy = ventY + 4; gy <= ventY + ventH - 4; gy += 3) {
      ctx.fillRect(ventX + 3, gy, ventW - 6, 1.5);
    }
  });

  // -------------------------------------------------------------
  // B. PERIMETER WALLS & CORNER BULKHEADS WITH DARK OUTLINES
  // -------------------------------------------------------------
  const topWallH = Math.round(1 * S);
  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(roomX, roomY, roomW, topWallH);

  const topWallGrad = ctx.createLinearGradient(roomX, roomY, roomX, roomY + topWallH);
  topWallGrad.addColorStop(0, '#1a2230');
  topWallGrad.addColorStop(0.7, '#151b27');
  topWallGrad.addColorStop(1, '#0e131d');
  ctx.fillStyle = topWallGrad;
  ctx.fillRect(roomX + 2, roomY + 2, roomW - 4, topWallH - 4);

  // Recessed warm ceiling downlight fixtures at X = 3, 7, 11
  [3, 7, 11].forEach((lxCol) => {
    const lx = Math.round(lxCol * S - viewX);
    ctx.fillStyle = '#080c14';
    ctx.fillRect(lx - 12, roomY + 3, 24, 7);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(lx - 9, roomY + 4.5, 18, 4);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(lx - 6, roomY + 5.5, 12, 2);
  });

  // Hanging catenary electrical cable loops dropping from ceiling (X = 4..6)
  const cableStartX = Math.round(4.4 * S - viewX);
  const cableEndX = Math.round(6.2 * S - viewX);
  const cableSagY = roomY + Math.round(S * 0.72);
  ctx.strokeStyle = '#05070d';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cableStartX, roomY);
  ctx.bezierCurveTo(cableStartX + 10, cableSagY, cableEndX - 10, cableSagY, cableEndX, roomY);
  ctx.stroke();

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cableStartX + 1, roomY);
  ctx.bezierCurveTo(cableStartX + 10, cableSagY - 1, cableEndX - 10, cableSagY - 1, cableEndX - 1, roomY);
  ctx.stroke();

  // CRT Diagnostic Screen at X = 4
  const crtX = Math.round(3.8 * S - viewX);
  const crtY = roomY + Math.round(S * 0.25);
  const crtW = Math.round(S * 0.7);
  const crtH = Math.round(S * 0.45);
  ctx.fillStyle = '#05070d';
  ctx.fillRect(crtX, crtY, crtW, crtH);
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(crtX, crtY, crtW, crtH);

  ctx.fillStyle = '#22d3ee';
  ctx.fillRect(crtX + 4, crtY + 4, crtW - 14, 2);
  ctx.fillStyle = '#10b981';
  ctx.fillRect(crtX + 4, crtY + 8, crtW - 8, 2);
  ctx.fillStyle = '#10b981';
  ctx.fillRect(crtX + 4, crtY + 12, crtW - 16, 2);
  ctx.fillStyle = '#22d3ee';
  ctx.fillRect(crtX + 4, crtY + 16, crtW - 10, 2);

  // Continuous Full-Width Cyan Neon Glow Stripe
  const neonY = roomY + Math.round(topWallH * 0.75);
  ctx.fillStyle = '#0891b2';
  ctx.fillRect(roomX + 4, neonY - 1, roomW - 8, 5);
  ctx.fillStyle = '#00f5ff';
  ctx.fillRect(roomX + 4, neonY, roomW - 8, 3);
  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(roomX + 4, neonY + 0.5, roomW - 8, 1);

  // Ventilation grille band beneath the cyan neon stripe
  const ventBandY = neonY + 4;
  const ventBandH = topWallH - (ventBandY - roomY);
  ctx.fillStyle = '#090d16';
  ctx.fillRect(roomX + 4, ventBandY, roomW - 8, Math.max(4, ventBandH - 2));
  for (let gx = roomX + 8; gx < roomX + roomW - 8; gx += 5) {
    ctx.fillStyle = '#020617';
    ctx.fillRect(gx, ventBandY + 1, 2, Math.max(2, ventBandH - 4));
  }

  // Left & Right Walls
  const leftWallW = Math.round(1 * S);
  const rightWallX = Math.round(13 * S - viewX);

  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(roomX, roomY, leftWallW, roomH);
  ctx.fillStyle = '#161e2e';
  ctx.fillRect(roomX + 2, roomY + 2, leftWallW - 4, roomH - 4);
  ctx.fillStyle = '#00f5ff';
  ctx.fillRect(roomX + Math.round(leftWallW * 0.5) - 1, roomY + S, 2, roomH - S * 2);

  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(rightWallX, roomY, leftWallW, roomH);
  ctx.fillStyle = '#161e2e';
  ctx.fillRect(rightWallX + 2, roomY + 2, leftWallW - 4, roomH - 4);
  ctx.fillStyle = '#00f5ff';
  ctx.fillRect(rightWallX + Math.round(leftWallW * 0.5) - 1, roomY + S, 2, roomH - S * 2);

  // Bottom Wall excluding door at X = 6..9
  const botWallY = Math.round(11 * S - viewY);
  const botWallH = Math.round(1 * S);
  ctx.fillStyle = '#0a0d14';
  const doorStartX = Math.round(6 * S - viewX);
  const doorEndX = Math.round(10 * S - viewX);
  ctx.fillRect(roomX, botWallY, doorStartX - roomX, botWallH);
  ctx.fillStyle = '#161e2e';
  ctx.fillRect(roomX + 2, botWallY + 2, doorStartX - roomX - 4, botWallH - 4);

  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(doorEndX, botWallY, roomX + roomW - doorEndX, botWallH);
  ctx.fillStyle = '#161e2e';
  ctx.fillRect(doorEndX + 2, botWallY + 2, roomX + roomW - doorEndX - 4, botWallH - 4);

  // 45° Chamfered Corner Bulkheads
  const drawCornerChamfer = (cx: number, cy: number, flipX: boolean, flipY: boolean) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    ctx.fillStyle = '#0a0d14';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.round(S * 1.5), 0);
    ctx.lineTo(0, Math.round(S * 1.5));
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(2, 2);
    ctx.lineTo(Math.round(S * 1.4), 2);
    ctx.lineTo(2, Math.round(S * 1.4));
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(Math.round(S * 1.4), 2);
    ctx.lineTo(2, Math.round(S * 1.4));
    ctx.stroke();
    ctx.restore();
  };

  drawCornerChamfer(roomX, roomY, false, false);
  drawCornerChamfer(roomX + roomW, roomY, true, false);
  drawCornerChamfer(roomX, roomY + roomH, false, true);
  drawCornerChamfer(roomX + roomW, roomY + roomH, true, true);

  // -------------------------------------------------------------
  // C. MULTICELL COHESIVE SPRITES AT SCALE
  // -------------------------------------------------------------
  drawPortalBasePlatform(ctx, S, viewX, viewY, tick);
  drawEmptyStasisPod(ctx, S, viewX, viewY, tick, hatchProgress, isDecompressing);
  drawWorkbenchStation(ctx, S, viewX, viewY, tick);
  drawCentralPedestalKit(ctx, S, viewX, viewY, tick);
  drawStorageVaultChest(ctx, S, viewX, viewY, tick);
  drawExitBlastDoor(ctx, S, viewX, viewY, tick, doorUnlocked);
}

// -------------------------------------------------------------
// MULTICELL COMPONENT DRAWING FUNCTIONS
// -------------------------------------------------------------

// 1. Base de Construcción del Portal (5x5 circular platform)
function drawPortalBasePlatform(
  ctx: CanvasRenderingContext2D,
  S: number,
  viewX: number,
  viewY: number,
  tick: number
) {
  const centerX = Math.round(3.5 * S - viewX);
  const centerY = Math.round(4.5 * S - viewY);
  const radius = Math.round(2.1 * S);

  ctx.save();
  ctx.fillStyle = '#090d16';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1.5;
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
    ctx.beginPath();
    ctx.moveTo(centerX + Math.cos(a) * (radius - 22), centerY + Math.sin(a) * (radius - 22));
    ctx.lineTo(centerX + Math.cos(a) * (radius - 9), centerY + Math.sin(a) * (radius - 9));
    ctx.stroke();
  }

  const corePulse = 0.5 + Math.sin(tick * 0.08) * 0.3;
  ctx.strokeStyle = `rgba(34, 211, 238, ${corePulse})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.38, 0, Math.PI * 2);
  ctx.moveTo(centerX - radius * 0.55, centerY);
  ctx.lineTo(centerX + radius * 0.55, centerY);
  ctx.moveTo(centerX, centerY - radius * 0.55);
  ctx.lineTo(centerX, centerY + radius * 0.55);
  ctx.stroke();

  ctx.fillStyle = `rgba(0, 245, 255, ${corePulse})`;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(centerX - 1.5, centerY - 1.5, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// 2. Cápsula de Estasis Vacía con Animación de Escotilla
function drawEmptyStasisPod(
  ctx: CanvasRenderingContext2D,
  S: number,
  viewX: number,
  viewY: number,
  tick: number,
  hatchProgress: number = 1.0,
  isDecompressing: boolean = false
) {
  const podX = Math.round(1 * S - viewX);
  const podY = Math.round(8 * S - viewY);
  const podW = Math.round(3 * S);
  const podH = Math.round(4 * S);

  const cx = podX + podW * 0.5;

  ctx.save();
  // Heavy industrial base pedestal with ventilation slits
  const baseH = Math.round(podH * 0.28);
  const baseY = podY + podH - baseH;

  ctx.fillStyle = '#090d16';
  ctx.fillRect(podX + 8, baseY, podW - 16, baseH);
  ctx.fillStyle = '#334155';
  ctx.fillRect(podX + 10, baseY + 2, podW - 20, baseH - 4);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(podX + 14, baseY + 4, podW - 28, 4);

  // Base ventilation slits
  ctx.fillStyle = '#0f172a';
  for (let bx = podX + 22; bx <= podX + podW - 26; bx += 14) {
    ctx.fillRect(bx, baseY + Math.round(baseH * 0.4), 8, 4);
  }

  // Metallic top canopy / cap
  const capH = Math.round(podH * 0.2);
  const capY = podY + 4 - Math.round(hatchProgress * 12); // slides up on opening
  ctx.fillStyle = '#090d16';
  ctx.beginPath();
  ctx.roundRect(podX + 12, capY, podW - 24, capH, [8, 8, 2, 2]);
  ctx.fill();
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.roundRect(podX + 14, capY + 2, podW - 28, capH - 4, [6, 6, 2, 2]);
  ctx.fill();
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(podX + 20, capY + 4, podW - 40, 3);

  // Vertical Cryo-Chamber
  const glassY = podY + capH + 2;
  const glassH = baseY - glassY + 2;
  const glassW = podW - 28;
  const glassX = podX + 14;

  // Interior chamber cavity
  ctx.fillStyle = '#090f1d';
  ctx.fillRect(glassX, glassY, glassW, glassH);

  // Headrest & spine rail (empty once hatched)
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(cx - 10, glassY + 8, 20, 8);
  ctx.fillRect(cx - 5, glassY + 16, 10, glassH - 32);
  ctx.fillRect(glassX + 6, glassY + glassH - 12, glassW - 12, 4);

  // If decompressing, draw energetic stasis mist
  if (isDecompressing) {
    const mistPulse = 0.5 + Math.sin(tick * 0.2) * 0.3;
    ctx.fillStyle = `rgba(14, 165, 233, ${mistPulse})`;
    ctx.fillRect(glassX, glassY, glassW, glassH);
  }

  // Cryo-glass hatch layer (slides up based on hatchProgress)
  const hatchOffset = Math.round(hatchProgress * (glassH * 0.65));
  const visibleGlassY = glassY - hatchOffset;
  const visibleGlassH = Math.max(4, glassH);

  const glassGlow = 0.22 + Math.sin(tick * 0.08) * 0.06;
  ctx.fillStyle = `rgba(34, 211, 238, ${glassGlow})`;
  ctx.fillRect(glassX, visibleGlassY, glassW, visibleGlassH);

  // Specular glass streaks
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillRect(glassX + 5, visibleGlassY + 4, 3, visibleGlassH - 8);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.fillRect(glassX + 11, visibleGlassY + 4, 2, visibleGlassH - 8);

  ctx.strokeStyle = '#090d16';
  ctx.lineWidth = 2;
  ctx.strokeRect(glassX, glassY, glassW, glassH);

  // Side diagnostic terminal
  const termX = podX + podW - 12;
  const termY = podY + Math.round(podH * 0.35);
  ctx.fillStyle = '#090d16';
  ctx.fillRect(termX, termY, 12, 18);
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(termX + 1.5, termY + 1.5, 9, 15);
  ctx.fillStyle = isDecompressing ? '#f59e0b' : '#10b981';
  ctx.fillRect(termX + 3, termY + 4, 6, 2);
  ctx.fillRect(termX + 3, termY + 8, 4, 2);
  ctx.fillStyle = '#22d3ee';
  ctx.fillRect(termX + 3, termY + 12, 6, 2);

  ctx.restore();
}

// 3. Mesa de Trabajo / Crafteo
function drawWorkbenchStation(
  ctx: CanvasRenderingContext2D,
  S: number,
  viewX: number,
  viewY: number,
  tick: number
) {
  const bx = Math.round(10 * S - viewX);
  const by = Math.round(2 * S - viewY);
  const bw = Math.round(4 * S);
  const bh = Math.round(3 * S);

  ctx.save();
  // Pegboard
  const pegH = Math.round(bh * 0.52);
  ctx.fillStyle = '#080c14';
  ctx.fillRect(bx + 4, by + 2, bw - 8, pegH);
  ctx.fillStyle = '#334155';
  ctx.fillRect(bx + 6, by + 4, bw - 12, pegH - 4);
  ctx.strokeStyle = '#050811';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx + 6, by + 4, bw - 12, pegH - 4);

  ctx.fillStyle = '#1e293b';
  for (let px = bx + 12; px <= bx + bw - 16; px += 8) {
    for (let py = by + 8; py <= by + pegH - 6; py += 8) {
      ctx.fillRect(px, py, 2, 2);
    }
  }

  // Hanging Tools
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(bx + 14, by + 8, 3, 16);
  ctx.fillRect(bx + 12, by + 8, 7, 3);
  ctx.fillRect(bx + 24, by + 10, 3, 14);

  ctx.fillStyle = '#ef4444';
  ctx.fillRect(bx + 34, by + 8, 3, 12);
  ctx.fillRect(bx + 40, by + 8, 3, 12);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(bx + 36, by + 6, 5, 4);

  ctx.fillStyle = '#eab308';
  ctx.fillRect(bx + 50, by + 8, 10, 6);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(bx + 54, by + 14, 4, 8);
  ctx.fillRect(bx + 66, by + 8, 10, 6);

  // Mounted Plasma Blaster
  const rifleX = bx + 14;
  const rifleY = by + Math.round(pegH * 0.65);
  ctx.fillStyle = '#090d16';
  ctx.fillRect(rifleX - 1, rifleY - 1, 56, 12);
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(rifleX, rifleY, 54, 10);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(rifleX + 14, rifleY + 2, 18, 4);
  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(rifleX + 16, rifleY + 3, 14, 2);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(rifleX + 44, rifleY + 3, 12, 4);
  ctx.fillRect(rifleX + 16, rifleY - 4, 12, 4);

  // Tabletop
  const tableY = by + pegH;
  const tableH = bh - pegH - 4;
  ctx.fillStyle = '#080c14';
  ctx.fillRect(bx + 4, tableY, bw - 8, tableH);
  ctx.fillStyle = '#475569';
  ctx.fillRect(bx + 6, tableY + 2, bw - 12, tableH - 4);
  ctx.strokeStyle = '#050811';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx + 6, tableY + 2, bw - 12, tableH - 4);

  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(bx + 6, tableY + 2, bw - 12, 3);

  // Hardware on table
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(bx + 16, tableY + 8, 4, 3);
  ctx.fillRect(bx + 26, tableY + 9, 5, 3);
  ctx.fillRect(bx + 38, tableY + 8, 3, 4);

  // Drawers
  const drawerY = tableY + 16;
  const drawerW = Math.round(bw * 0.45);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(bx + 12, drawerY, drawerW, 14);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(bx + 12 + drawerW * 0.5 - 8, drawerY + 6, 16, 2.5);

  // Blueprint screen
  const monX = bx + bw - Math.round(bw * 0.42);
  const monY = tableY + 6;
  const monW = Math.round(bw * 0.36);
  const monH = tableH - 12;

  ctx.fillStyle = '#0284c7';
  ctx.fillRect(monX, monY, monW, monH);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(monX, monY, monW, monH);

  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(monX + 4, monY + 4, monW - 8, 2);
  ctx.fillRect(monX + 4, monY + 8, monW - 14, 2);
  ctx.fillRect(monX + 4, monY + 12, monW - 10, 2);

  ctx.strokeStyle = '#e0f2fe';
  ctx.lineWidth = 1;
  ctx.strokeRect(monX + monW * 0.5 - 6, monY + 16, 12, 14);

  ctx.restore();
}

// 4. Pedestal Central y K.I.T. con Menú Holográfico 2x2
function drawCentralPedestalKit(
  ctx: CanvasRenderingContext2D,
  S: number,
  viewX: number,
  viewY: number,
  tick: number
) {
  const pedCenterX = Math.round(7.5 * S - viewX);
  const pedCenterY = Math.round(6.5 * S - viewY);
  const baseRadius = Math.round(1.1 * S);

  ctx.save();
  ctx.fillStyle = '#090d16';
  ctx.beginPath();
  ctx.arc(pedCenterX, pedCenterY + 6, baseRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.arc(pedCenterX, pedCenterY + 6, baseRadius - 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.arc(pedCenterX, pedCenterY + 6, baseRadius - 6, 0, Math.PI * 2);
  ctx.fill();

  const riserW = Math.round(S * 0.7);
  const riserH = Math.round(S * 0.45);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(pedCenterX - riserW * 0.5, pedCenterY - riserH * 0.5, riserW, riserH);
  ctx.strokeStyle = '#090d16';
  ctx.lineWidth = 2;
  ctx.strokeRect(pedCenterX - riserW * 0.5, pedCenterY - riserH * 0.5, riserW, riserH);

  ctx.fillStyle = '#ef4444';
  ctx.fillRect(pedCenterX - 10, pedCenterY - riserH * 0.5 + 2, 4, riserH - 4);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(pedCenterX - 2, pedCenterY - riserH * 0.5 + 2, 4, riserH - 4);
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(pedCenterX + 6, pedCenterY - riserH * 0.5 + 2, 4, riserH - 4);

  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.ellipse(pedCenterX, pedCenterY - riserH * 0.5, riserW * 0.45, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#090d16';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#00f5ff';
  ctx.beginPath();
  ctx.ellipse(pedCenterX, pedCenterY - riserH * 0.5, riserW * 0.32, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const coneGrad = ctx.createLinearGradient(
    pedCenterX,
    pedCenterY - riserH * 0.5,
    pedCenterX,
    pedCenterY - S * 1.3
  );
  coneGrad.addColorStop(0, 'rgba(0, 245, 255, 0.55)');
  coneGrad.addColorStop(1, 'rgba(0, 245, 255, 0.04)');
  ctx.fillStyle = coneGrad;
  ctx.beginPath();
  ctx.moveTo(pedCenterX - riserW * 0.32, pedCenterY - riserH * 0.5);
  ctx.lineTo(pedCenterX - S * 0.8, pedCenterY - S * 1.3);
  ctx.lineTo(pedCenterX + S * 0.8, pedCenterY - S * 1.3);
  ctx.lineTo(pedCenterX + riserW * 0.32, pedCenterY - riserH * 0.5);
  ctx.closePath();
  ctx.fill();

  const kitBob = Math.sin(tick * 0.1) * 3;
  const kitX = pedCenterX;
  const kitY = pedCenterY - S * 0.95 + kitBob;
  const kitR = Math.max(12, Math.round(S * 0.26));

  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.moveTo(kitX - kitR * 0.6, kitY + kitR * 0.5);
  ctx.lineTo(kitX - kitR * 1.1, kitY + kitR * 1.1);
  ctx.lineTo(kitX - kitR * 0.3, kitY + kitR * 0.8);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(kitX + kitR * 0.6, kitY + kitR * 0.5);
  ctx.lineTo(kitX + kitR * 1.1, kitY + kitR * 1.1);
  ctx.lineTo(kitX + kitR * 0.3, kitY + kitR * 0.8);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#090d16';
  ctx.beginPath();
  ctx.arc(kitX, kitY, kitR + 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.arc(kitX, kitY, kitR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.arc(kitX + 2, kitY + 2, kitR * 0.82, 0, Math.PI * 2);
  ctx.fill();

  const eyeGlow = 0.8 + Math.sin(tick * 0.15) * 0.2;
  ctx.fillStyle = `rgba(0, 245, 255, ${eyeGlow})`;
  ctx.beginPath();
  ctx.arc(kitX, kitY, kitR * 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(kitX - kitR * 0.18, kitY - kitR * 0.18, kitR * 0.16, 0, Math.PI * 2);
  ctx.fill();

  // Projected 2x2 Holographic HUD Panel
  const holoX = kitX + Math.round(S * 0.45);
  const holoY = kitY - Math.round(S * 0.65);
  const holoW = Math.round(S * 1.1);
  const holoH = Math.round(S * 1.2);

  ctx.strokeStyle = 'rgba(0, 245, 255, 0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(kitX + kitR * 0.5, kitY);
  ctx.lineTo(holoX, holoY + 6);
  ctx.moveTo(kitX + kitR * 0.5, kitY);
  ctx.lineTo(holoX, holoY + holoH - 6);
  ctx.stroke();

  ctx.fillStyle = 'rgba(6, 182, 212, 0.18)';
  ctx.fillRect(holoX, holoY, holoW, holoH);
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(holoX, holoY, holoW, holoH);

  ctx.strokeStyle = 'rgba(34, 211, 238, 0.35)';
  ctx.beginPath();
  ctx.moveTo(holoX + holoW * 0.5, holoY + 3);
  ctx.lineTo(holoX + holoW * 0.5, holoY + holoH - 3);
  ctx.moveTo(holoX + 3, holoY + holoH * 0.5);
  ctx.lineTo(holoX + holoW - 3, holoY + holoH * 0.5);
  ctx.stroke();

  // Slot 1: REPAIR KIT
  const s1X = holoX + 4;
  const s1Y = holoY + 4;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(s1X + 4, s1Y + 4, 16, 12);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
  ctx.strokeRect(s1X + 4, s1Y + 4, 16, 12);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(s1X + 11, s1Y + 7, 2, 6);
  ctx.fillRect(s1X + 9, s1Y + 9, 6, 2);
  ctx.fillStyle = '#a5f3fc';
  ctx.font = '6px "Space Mono", monospace';
  ctx.fillText('REPAIR', s1X + 2, s1Y + 22);
  ctx.fillText('KIT', s1X + 7, s1Y + 29);

  // Slot 2: PLASMA CELL
  const s2X = holoX + holoW * 0.5 + 4;
  const s2Y = holoY + 4;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(s2X + 4, s2Y + 5, 16, 10);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(s2X + 7, s2Y + 7, 4, 6);
  ctx.fillStyle = '#a855f7';
  ctx.fillRect(s2X + 13, s2Y + 7, 4, 6);
  ctx.fillStyle = '#a5f3fc';
  ctx.font = '6px "Space Mono", monospace';
  ctx.fillText('PLASMA', s2X + 2, s2Y + 22);
  ctx.fillText('CELL', s2X + 6, s2Y + 29);

  // Slot 3: MEDPACK
  const s3X = holoX + 4;
  const s3Y = holoY + holoH * 0.5 + 4;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(s3X + 4, s3Y + 4, 16, 12);
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1;
  ctx.strokeRect(s3X + 4, s3Y + 4, 16, 12);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(s3X + 11, s3Y + 7, 2, 6);
  ctx.fillRect(s3X + 9, s3Y + 9, 6, 2);
  ctx.fillStyle = '#a5f3fc';
  ctx.font = '6px "Space Mono", monospace';
  ctx.fillText('MED', s3X + 7, s3Y + 22);
  ctx.fillText('PACK', s3X + 5, s3Y + 29);

  // Slot 4: VAULT KEY
  const s4X = holoX + holoW * 0.5 + 4;
  const s4Y = holoY + holoH * 0.5 + 4;
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(s4X + 9, s4Y + 10, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(s4X + 11, s4Y + 8, 9, 3);
  ctx.fillRect(s4X + 17, s4Y + 11, 3, 4);
  ctx.fillStyle = '#a5f3fc';
  ctx.font = '6px "Space Mono", monospace';
  ctx.fillText('VAULT', s4X + 4, s4Y + 22);
  ctx.fillText('KEY', s4X + 7, s4Y + 29);

  ctx.restore();
}

// 5. Cofre de Almacenamiento Seguro
function drawStorageVaultChest(
  ctx: CanvasRenderingContext2D,
  S: number,
  viewX: number,
  viewY: number,
  tick: number
) {
  const vx = Math.round(11 * S - viewX);
  const vy = Math.round(8 * S - viewY);
  const vw = Math.round(3 * S);
  const vh = Math.round(3 * S);

  const cx = vx + vw * 0.5;
  const cy = vy + vh * 0.5;

  ctx.save();
  ctx.fillStyle = '#090d16';
  ctx.fillRect(vx + 4, vy + 4, vw - 8, vh - 8);

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(vx + 6, vy + 6, vw - 12, vh - 12);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.strokeRect(vx + 6, vy + 6, vw - 12, vh - 12);

  const drawVaultRivet = (rx: number, ry: number) => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(rx - 2, ry - 2, 4, 4);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(rx - 1, ry - 1, 2, 2);
  };
  drawVaultRivet(vx + 12, vy + 12);
  drawVaultRivet(vx + vw - 12, vy + 12);
  drawVaultRivet(vx + 12, vy + vh - 12);
  drawVaultRivet(vx + vw - 12, vy + vh - 12);

  ctx.fillStyle = '#0f172a';
  for (let fy = vy + 18; fy <= vy + vh - 22; fy += 12) {
    ctx.fillRect(vx + 12, fy, Math.round(vw * 0.28), 3);
    ctx.fillRect(vx + vw - Math.round(vw * 0.28) - 12, fy, Math.round(vw * 0.28), 3);
  }

  ctx.fillStyle = '#090d16';
  ctx.beginPath();
  ctx.arc(cx, cy, Math.round(vw * 0.2), 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.arc(cx, cy, Math.round(vw * 0.16), 0, Math.PI * 2);
  ctx.fill();

  const ledPulse = 0.75 + Math.sin(tick * 0.12) * 0.25;
  ctx.fillStyle = `rgba(0, 245, 255, ${ledPulse})`;
  ctx.fillRect(cx - 2, cy - 2, 4, 4);

  ctx.fillRect(vx + Math.round(vw * 0.32), vy + 14, 2, vh - 28);
  ctx.fillRect(vx + vw - Math.round(vw * 0.32), vy + 14, 2, vh - 28);

  ctx.restore();
}

// 6. Puerta de Salida Ampliada
function drawExitBlastDoor(
  ctx: CanvasRenderingContext2D,
  S: number,
  viewX: number,
  viewY: number,
  tick: number,
  doorUnlocked: boolean
) {
  const dx = Math.round(6 * S - viewX);
  const dy = Math.round(10 * S - viewY);
  const dw = Math.round(4 * S);
  const dh = Math.round(2 * S);

  ctx.save();
  ctx.fillStyle = '#090d16';
  ctx.fillRect(dx, dy, dw, dh);

  if (doorUnlocked) {
    ctx.fillStyle = '#082f49';
    ctx.fillRect(dx + 2, dy + 2, dw - 4, dh - 4);

    const starTime = tick * 0.08;
    for (let i = 0; i < 16; i++) {
      const spX = dx + ((Math.sin(starTime + i * 1.3) * 0.5 + 0.5) * (dw - 12)) + 6;
      const spY = dy + ((Math.cos(starTime * 1.1 + i * 1.7) * 0.5 + 0.5) * (dh - 12)) + 6;
      const color = i % 3 === 0 ? '#38bdf8' : i % 3 === 1 ? '#c084fc' : '#ffffff';
      ctx.fillStyle = color;
      ctx.fillRect(spX, spY, 2.5, 2.5);
    }

    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.strokeRect(dx + 2, dy + 2, dw - 4, dh - 4);

    ctx.fillStyle = '#22c55e';
    ctx.fillRect(dx + Math.round(dw * 0.5) - 16, dy + 4, 32, 4);
  } else {
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(dx + 2, dy + 2, dw - 4, dh - 4);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(dx + 2, dy + 2, dw - 4, dh - 4);

    ctx.fillStyle = '#dc2626';
    for (let hx = dx + 8; hx < dx + dw - 8; hx += 16) {
      ctx.fillRect(hx, dy + 10, 8, dh - 20);
    }

    const pulse = 0.5 + Math.sin(tick * 0.15) * 0.5;
    ctx.fillStyle = `rgba(239, 68, 68, ${pulse})`;
    ctx.fillRect(dx + Math.round(dw * 0.5) - 6, dy + 6, 12, 8);
  }

  ctx.restore();
}

// -------------------------------------------------------------
// D. WILDERNESS HARVESTABLE TILES & TERRAIN
// -------------------------------------------------------------
function drawWildernessTile(
  ctx: CanvasRenderingContext2D,
  tile: Tile,
  x: number,
  y: number,
  S: number,
  tick: number
) {
  switch (tile.type) {
    case 'RESOURCE_ORE_VEIN': {
      ctx.fillStyle = '#151324';
      ctx.fillRect(x, y, S, S);
      ctx.fillStyle = '#475569';
      ctx.fillRect(x + 4, y + 6, S - 8, S - 12);
      ctx.strokeStyle = '#050811';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 4, y + 6, S - 8, S - 12);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x + 8, y + 10, S * 0.35, S * 0.35);
      break;
    }
    case 'RESOURCE_SILICA_TREE': {
      ctx.fillStyle = '#131b2e';
      ctx.fillRect(x, y, S, S);
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(x + S / 2 - 3, y + 12, 6, S - 12);
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(x + S / 2, y + 12, S * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#050811';
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    }
    case 'RESOURCE_CRYSTAL': {
      ctx.fillStyle = '#151324';
      ctx.fillRect(x, y, S, S);
      const glow = 0.5 + Math.sin(tick * 0.08 + tile.x) * 0.4;
      ctx.fillStyle = `rgba(56, 189, 248, ${glow})`;
      ctx.beginPath();
      ctx.moveTo(x + S / 2, y + 4);
      ctx.lineTo(x + S - 8, y + S - 8);
      ctx.lineTo(x + 8, y + S - 8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#050811';
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    }
    case 'RESOURCE_SCRAP': {
      ctx.fillStyle = '#151324';
      ctx.fillRect(x, y, S, S);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(x + 8, y + 10, S * 0.45, S * 0.35);
      ctx.strokeStyle = '#050811';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 8, y + 10, S * 0.45, S * 0.35);
      break;
    }
    case 'TERRAIN_PLAINS': {
      ctx.fillStyle = '#151324';
      ctx.fillRect(x, y, S, S);
      break;
    }
    case 'TERRAIN_BASALT': {
      ctx.fillStyle = '#110f1c';
      ctx.fillRect(x, y, S, S);
      ctx.fillStyle = '#201b33';
      ctx.fillRect(x + 4, y + 4, S - 8, S - 8);
      break;
    }
    case 'TERRAIN_SILICA': {
      ctx.fillStyle = '#131b2e';
      ctx.fillRect(x, y, S, S);
      break;
    }
    case 'TERRAIN_CRAG': {
      ctx.fillStyle = '#20152e';
      ctx.fillRect(x, y, S, S);
      ctx.fillStyle = '#3b1d54';
      ctx.fillRect(x + 4, y + 4, S - 8, S - 8);
      break;
    }
    case 'TERRAIN_VORTEX': {
      ctx.fillStyle = '#2e101a';
      ctx.fillRect(x, y, S, S);
      const vortexGlow = 0.4 + Math.sin(tick * 0.12 + tile.x + tile.y) * 0.3;
      ctx.fillStyle = `rgba(239, 68, 68, ${vortexGlow})`;
      ctx.fillRect(x + 4, y + 4, S - 8, S - 8);
      break;
    }
    default: {
      ctx.fillStyle = '#171c26';
      ctx.fillRect(x, y, S, S);
    }
  }
}

// -------------------------------------------------------------
// E. AMBIENT NEON LIGHTING REFLECTIONS & SECURITY SHIELD
// -------------------------------------------------------------
function drawBunkerAmbientLighting(
  ctx: CanvasRenderingContext2D,
  viewX: number,
  viewY: number,
  S: number,
  tick: number,
  doorUnlocked: boolean
) {
  [3, 7, 11].forEach((lxCol) => {
    const lampX = Math.round(lxCol * S - viewX);
    const lampY = Math.round(1 * S - viewY);
    const lampGrad = ctx.createRadialGradient(lampX, lampY, 4, lampX, lampY, S * 1.5);
    lampGrad.addColorStop(0, 'rgba(254, 240, 138, 0.22)');
    lampGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.08)');
    lampGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = lampGrad;
    ctx.beginPath();
    ctx.arc(lampX, lampY, S * 1.5, 0, Math.PI * 2);
    ctx.fill();
  });

  const wallNeonY = Math.round(1 * S - viewY);
  const wallStartX = Math.round(1 * S - viewX);
  const wallEndX = Math.round(13 * S - viewX);
  const wallGrad = ctx.createLinearGradient(0, wallNeonY, 0, wallNeonY + S * 0.9);
  wallGrad.addColorStop(0, 'rgba(0, 245, 255, 0.22)');
  wallGrad.addColorStop(1, 'rgba(0, 245, 255, 0)');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(wallStartX, wallNeonY, Math.max(10, wallEndX - wallStartX), Math.round(S * 0.9));

  const safeX = Math.round(7.5 * S - viewX);
  const safeY = Math.round(6.5 * S - viewY);
  const safeGrad = ctx.createRadialGradient(safeX, safeY, 6, safeX, safeY, S * 2.2);
  safeGrad.addColorStop(0, 'rgba(0, 245, 255, 0.38)');
  safeGrad.addColorStop(0.6, 'rgba(6, 182, 212, 0.12)');
  safeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = safeGrad;
  ctx.beginPath();
  ctx.arc(safeX, safeY, S * 2.2, 0, Math.PI * 2);
  ctx.fill();

  const doorX = Math.round(8 * S - viewX);
  const doorY = Math.round(11 * S - viewY);
  const doorColor = doorUnlocked ? 'rgba(56, 189, 248, 0.45)' : 'rgba(239, 68, 68, 0.45)';
  const doorGrad = ctx.createRadialGradient(doorX, doorY, 6, doorX, doorY, S * 2.4);
  doorGrad.addColorStop(0, doorColor);
  doorGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = doorGrad;
  ctx.beginPath();
  ctx.arc(doorX, doorY, S * 2.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawBunkerSecurityBoundary(
  ctx: CanvasRenderingContext2D,
  viewX: number,
  viewY: number,
  S: number,
  tick: number
) {
  const boundX = (BUNKER_MAX_X + 1) * S - viewX;
  const boundY = (BUNKER_MAX_Y + 1) * S - viewY;

  const pulseAlpha = 0.35 + Math.sin(tick * 0.05) * 0.2;
  ctx.save();
  ctx.strokeStyle = `rgba(16, 185, 129, ${pulseAlpha})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);

  ctx.beginPath();
  ctx.moveTo(0 - viewX, boundY);
  ctx.lineTo(boundX, boundY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(boundX, 0 - viewY);
  ctx.lineTo(boundX, boundY);
  ctx.stroke();

  ctx.restore();
}

// -------------------------------------------------------------
// F. SPRITES: PLAYER, DRONE, WEAPONS, ENEMIES
// -------------------------------------------------------------

function drawPlayerSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  char: CharacterProfile,
  isMoving: boolean,
  tick: number,
  facing: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT',
  overchargeActive: boolean,
  activeToolId: ToolId
) {
  ctx.save();

  // Overcharge Radiant Aura
  if (overchargeActive) {
    const auraPulse = 0.5 + Math.sin(tick * 0.2) * 0.3;
    ctx.strokeStyle = `rgba(250, 204, 21, ${auraPulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.stroke();

    const rot = tick * 0.1;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    if (activeToolId === 'sword') {
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-22, -3, 8, 6);
      ctx.fillRect(14, -3, 8, 6);
    } else if (activeToolId === 'drill') {
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(18, 0, 4, 0, Math.PI * 2);
      ctx.arc(-18, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (activeToolId === 'pickaxe') {
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(16, -4, 6, 6);
      ctx.fillRect(-20, -4, 6, 6);
    } else {
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(16, 0, 5, 5);
      ctx.fillRect(-20, 0, 5, 5);
    }
    ctx.restore();
  }

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.ellipse(x, y + 14, 13, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const bob = isMoving ? Math.sin(tick * 0.4) * 2 : Math.sin(tick * 0.08) * 0.8;
  const py = y + bob;

  const strokeDark = (bx: number, by: number, bw: number, bh: number) => {
    ctx.strokeStyle = '#050811';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, bw, bh);
  };

  // 1. Backpack with Dark Outlines
  ctx.fillStyle = '#5c3a21';
  ctx.fillRect(x - 9, py - 12, 18, 14);
  strokeDark(x - 9, py - 12, 18, 14);

  // 2. Explorer Suit Torso
  ctx.fillStyle = char.colorScheme.suit;
  ctx.fillRect(x - 7, py - 8, 14, 15);
  strokeDark(x - 7, py - 8, 14, 15);

  // Leather Pauldrons
  ctx.fillStyle = char.colorScheme.leather;
  ctx.fillRect(x - 10, py - 8, 4, 5);
  strokeDark(x - 10, py - 8, 4, 5);
  ctx.fillRect(x + 6, py - 8, 4, 5);
  strokeDark(x + 6, py - 8, 4, 5);

  // 3. Legs and Kneepads
  const legOffset = isMoving ? Math.sin(tick * 0.4) * 3 : 0;
  ctx.fillStyle = char.colorScheme.suit;
  ctx.fillRect(x - 6, py + 7, 5, 8 + legOffset);
  strokeDark(x - 6, py + 7, 5, 8 + legOffset);
  ctx.fillRect(x + 1, py + 7, 5, 8 - legOffset);
  strokeDark(x + 1, py + 7, 5, 8 - legOffset);

  // Titanium knee pads
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(x - 6, py + 9, 5, 3);
  ctx.fillRect(x + 1, py + 9, 5, 3);

  // Boots
  ctx.fillStyle = '#2e1c10';
  ctx.fillRect(x - 7, py + 14 + legOffset, 6, 4);
  ctx.fillRect(x + 1, py + 14 - legOffset, 6, 4);

  // 4. Head and Skin
  ctx.fillStyle = '#fcd34d';
  ctx.fillRect(x - 6, py - 20, 12, 10);
  strokeDark(x - 6, py - 20, 12, 10);

  // Directional Eyes
  ctx.fillStyle = '#0f172a';
  if (facing === 'LEFT') {
    ctx.fillRect(x - 5, py - 16, 2, 2);
  } else if (facing === 'RIGHT') {
    ctx.fillRect(x + 3, py - 16, 2, 2);
  } else if (facing === 'DOWN') {
    ctx.fillRect(x - 4, py - 16, 2, 2);
    ctx.fillRect(x + 2, py - 16, 2, 2);
  }

  // Hair
  ctx.fillStyle = char.colorScheme.hair;
  if (char.id === 'elian') {
    ctx.fillRect(x - 7, py - 23, 14, 5);
    strokeDark(x - 7, py - 23, 14, 5);
    ctx.fillRect(x - 7, py - 20, 3, 4);
    ctx.fillRect(x + 4, py - 20, 3, 4);
  } else {
    ctx.fillRect(x - 7, py - 23, 14, 5);
    strokeDark(x - 7, py - 23, 14, 5);
    ctx.fillRect(x - 8, py - 20, 4, 6);
    ctx.fillRect(x - 9, py - 14, 3, 9);
    strokeDark(x - 9, py - 14, 3, 9);
  }

  // 5. Left Hand: Glowing Blue Holocron
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(x - 14, py - 4, 6, 6);
  ctx.strokeStyle = '#050811';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 14, py - 4, 6, 6);

  // 6. Right Hand: VISIBLE EQUIPPED WEAPON / TOOL
  const weaponHandX = x + 11;
  const weaponHandY = py - 4;
  drawInHandWeapon(ctx, weaponHandX, weaponHandY, activeToolId, tick);

  ctx.restore();
}

function drawInHandWeapon(
  ctx: CanvasRenderingContext2D,
  hx: number,
  hy: number,
  toolId: ToolId,
  tick: number
) {
  ctx.save();

  if (toolId === 'sword') {
    ctx.fillStyle = '#64748b';
    ctx.fillRect(hx, hy, 4, 8);
    ctx.strokeStyle = '#050811';
    ctx.lineWidth = 1;
    ctx.strokeRect(hx, hy, 4, 8);

    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(hx - 3, hy - 2, 10, 3);
    ctx.strokeRect(hx - 3, hy - 2, 10, 3);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(hx - 1, hy - 14, 5, 12);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(hx, hy - 13, 3, 10);
    ctx.strokeStyle = '#050811';
    ctx.lineWidth = 1;
    ctx.strokeRect(hx - 1, hy - 14, 5, 12);
  } else if (toolId === 'pickaxe') {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(hx + 1, hy - 4, 3, 12);
    ctx.strokeStyle = '#050811';
    ctx.strokeRect(hx + 1, hy - 4, 3, 12);

    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(hx - 6, hy - 7, 16, 4);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(hx + 7, hy - 9, 4, 3);
    ctx.strokeStyle = '#050811';
    ctx.strokeRect(hx - 6, hy - 7, 16, 4);
  } else if (toolId === 'drill') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(hx - 2, hy - 6, 8, 10);
    ctx.strokeStyle = '#050811';
    ctx.strokeRect(hx - 2, hy - 6, 8, 10);

    ctx.fillStyle = '#10b981';
    ctx.fillRect(hx, hy - 12, 4, 6);
    ctx.strokeStyle = '#050811';
    ctx.strokeRect(hx, hy - 12, 4, 6);

    if (tick % 4 === 0) {
      ctx.fillStyle = '#f97316';
      ctx.fillRect(hx + 1, hy - 14, 2, 2);
    }
  } else if (toolId === 'axe') {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(hx + 1, hy - 4, 3, 13);
    ctx.strokeStyle = '#050811';
    ctx.strokeRect(hx + 1, hy - 4, 3, 13);

    ctx.fillStyle = '#ea580c';
    ctx.fillRect(hx + 2, hy - 8, 9, 7);
    ctx.strokeStyle = '#050811';
    ctx.strokeRect(hx + 2, hy - 8, 9, 7);
  } else if (toolId === 'knife') {
    ctx.fillStyle = '#334155';
    ctx.fillRect(hx + 1, hy - 1, 3, 6);
    ctx.strokeStyle = '#050811';
    ctx.strokeRect(hx + 1, hy - 1, 3, 6);

    ctx.fillStyle = '#c084fc';
    ctx.fillRect(hx + 1, hy - 8, 3, 7);
    ctx.strokeStyle = '#050811';
    ctx.strokeRect(hx + 1, hy - 8, 3, 7);
  }

  ctx.restore();
}

function drawKitDrone(
  ctx: CanvasRenderingContext2D,
  playerX: number,
  playerY: number,
  tick: number
) {
  ctx.save();
  const hoverX = playerX + 22 + Math.cos(tick * 0.05) * 4;
  const hoverY = playerY - 26 + Math.sin(tick * 0.08) * 5;

  ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
  ctx.beginPath();
  ctx.moveTo(hoverX - 3, hoverY + 7);
  ctx.lineTo(hoverX + 3, hoverY + 7);
  ctx.lineTo(hoverX, hoverY + 11);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.arc(hoverX, hoverY, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#050811';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const eyePulse = 0.7 + Math.sin(tick * 0.1) * 0.3;
  ctx.fillStyle = `rgba(0, 229, 255, ${eyePulse})`;
  ctx.beginPath();
  ctx.arc(hoverX, hoverY, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(hoverX - 1, hoverY - 1, 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawEnemySprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  enemy: Enemy,
  tick: number
) {
  ctx.save();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y + 14, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const strokeDark = (bx: number, by: number, bw: number, bh: number) => {
    ctx.strokeStyle = '#050811';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, bw, bh);
  };

  if (enemy.type === 'beast') {
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(x - 12, y - 6, 24, 14);
    strokeDark(x - 12, y - 6, 24, 14);
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(x + 6, y - 12, 10, 10);
    strokeDark(x + 6, y - 12, 10, 10);

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + 12, y - 9, 2, 2);
  } else if (enemy.type === 'jailer') {
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(x - 9, y - 14, 18, 22);
    strokeDark(x - 9, y - 14, 18, 22);
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(x - 7, y - 22, 14, 10);
    strokeDark(x - 7, y - 22, 14, 10);

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + 10, y - 18, 3, 24);
  } else {
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(x - 7, y - 10, 14, 18);
    strokeDark(x - 7, y - 10, 14, 18);
    ctx.fillStyle = '#4338ca';
    ctx.fillRect(x - 6, y - 18, 12, 10);
    strokeDark(x - 6, y - 18, 12, 10);
  }

  // Health Bar
  const barWidth = 28;
  const barHeight = 4;
  const barX = x - barWidth / 2;
  const barY = y - 26;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(barX, barY, barWidth, barHeight);

  const hpRatio = Math.max(0, enemy.health / enemy.maxHealth);
  ctx.fillStyle = hpRatio > 0.5 ? '#10b981' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';
  ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

  ctx.strokeStyle = '#050811';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  ctx.restore();
}
