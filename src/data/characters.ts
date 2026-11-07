import { CharacterProfile } from '../types/game';

export const CHARACTERS: CharacterProfile[] = [
  {
    id: 'elian',
    name: 'Elian',
    title: 'Especialista en Reconocimiento de Campo',
    gender: 'Varón',
    category: 'Explorador Inicial',
    locked: false,
    description: 'Pionero de la expedición con entrenamiento de supervivencia de choque en mundos hostiles. Analítico, ágil y preparado para cartografiar los sectores desconocidos de Aethel.',
    appearance: {
      hair: 'Cabello castaño corto con flequillo texturizado militar.',
      expression: 'Mirada concentrada, ceño firme y expresión de determinación imperturbable ante lo desconocido.',
      suit: 'Traje de explorador verde oliva de alta resistencia balística y térmica, con sellado hermético atmosférico.',
      pauldrons: 'Hombreras protectoras de cuero marrón curtido con refuerzos de remache sintético.',
      accessories: 'Mochila de supervivencia de expedición con arnés de carga equilibrado y rodilleras reforzadas de titanio liviano.',
      items: 'Sostiene un holocrón de navegación con brillo azul pulsante y una llave multiusos técnica con haz de plasma verde.',
      companion: 'Acompañado por la unidad autónoma flotante K.I.T. con propulsión antigravitatoria y ojo sensor azul central.'
    },
    stats: {
      health: 100,
      speed: 105,
      energyShield: 100,
      scanEfficiency: 110,
      survivalSkill: 95
    },
    portraitUrl: '/src/assets/images/character_elian_explorer_1794085025426.jpg',
    colorScheme: {
      hair: '#8B5A2B',
      suit: '#4a6741',
      leather: '#78462a',
      holocron: '#38bdf8',
      tool: '#22c55e',
      droneEye: '#00e5ff'
    }
  },
  {
    id: 'amara',
    name: 'Amara',
    title: 'Especialista en Bio-Supervivencia y Rastreo',
    gender: 'Hembra',
    category: 'Explorador Inicial',
    locked: false,
    description: 'Veterana de reconocimiento táctico y análisis de xenomateriales. Su agudeza perceptiva y dominio del equipo utilitario le permiten resistir las fluctuaciones ambientales de Aethel.',
    appearance: {
      hair: 'Cabello negro azabache recogido en una trenza práctica de combate sobre el hombro.',
      expression: 'Rostro sereno y agudo, mirada de estratega con absoluta confianza en sus capacidades de supervivencia.',
      suit: 'Mismo traje de exploradora utilitaria en verde oliva reforzado con forro aislante de radiación.',
      pauldrons: 'Hombreras de cuero marrón estructurado con enganches para calibradores de señal.',
      accessories: 'Mochila técnica de campaña con kit de primeros auxilios y rodilleras articuladas antigolpe.',
      items: 'Equipada con holocrón estelar de pulsación azul y llave multiusos de diagnóstico de brillo verde.',
      companion: 'Unidad flotante K.I.T. sincronizada con su red biométrica, dotada de lente óptico cian-azul centelleante.'
    },
    stats: {
      health: 105,
      speed: 100,
      energyShield: 105,
      scanEfficiency: 105,
      survivalSkill: 115
    },
    portraitUrl: '/src/assets/images/character_amara_explorer_1794085025373.jpg',
    colorScheme: {
      hair: '#1c1917',
      suit: '#4a6741',
      leather: '#78462a',
      holocron: '#38bdf8',
      tool: '#22c55e',
      droneEye: '#00e5ff'
    }
  },
  {
    id: 'aethelgard',
    name: 'Aethelgard',
    title: 'Señor Cósmico de las Tormentas Estelares',
    gender: 'Varón',
    category: 'Avatar de Lumina (Nivel Maestro)',
    locked: true,
    unlockCondition: 'Requiere sincronización en Modo Multijugador o completar la Campaña en Nivel Maestro.',
    description: 'Manifestación divina nacida de las ondas gravitacionales de Aethel. Canaliza la energía estelar sin necesidad de trajes de respiración ni herramientas convencionales.',
    appearance: {
      hair: 'Melena ondeante impregnada de partículas cósmicas sin casco.',
      expression: 'Mirada sobrehumana; ojos que arden con la intensidad radiante de dos supernovas gemelas.',
      suit: 'Armadura rúnica titánica forjada en aleación estelar que late con energía cósmica pura azul-violeta.',
      pauldrons: 'Estructuras de choque astronómicas grabadas con runas celestes que generan campos de fuerza permanentes.',
      accessories: 'Cadenas de confinamiento estelar y runas arcanas flotantes.',
      items: 'Desprende relámpagos estelares desde el torso y las extremidades; no requiere instrumentos mecánicos.',
      companion: 'Unidad K.I.T. en frecuencia cósmica sobrecargada con energía de vacío.'
    },
    stats: {
      health: 500,
      speed: 130,
      energyShield: 400,
      scanEfficiency: 200,
      survivalSkill: 250
    },
    portraitUrl: '/src/assets/images/character_aethelgard_god_1794085025610.jpg',
    colorScheme: {
      hair: '#0f172a',
      suit: '#1e1b4b',
      leather: '#3b82f6',
      holocron: '#60a5fa',
      tool: '#38bdf8',
      droneEye: '#67e8f9'
    }
  },
  {
    id: 'luminara',
    name: 'Luminara',
    title: 'Encarnación Solar de la Corona de Aethel',
    gender: 'Hembra',
    category: 'Avatar de Lumina (Nivel Maestro)',
    locked: true,
    unlockCondition: 'Requiere sincronización en Modo Multijugador o desbloqueo en la Frecuencia Divina Post-Game.',
    description: 'Entidad de luz estelar absoluta reverenciada en las antiguas leyendas de los sistemas solares. Su presencia apacigua las anomalías gravitacionales y refracta cualquier hostilidad.',
    appearance: {
      hair: 'Cabello radiante compuesto de llamaradas solares vivas que flotan ingrávidas en el vacío.',
      expression: 'Estatura divina benevolente pero inconmensurable, con ojos de luz dorada resplandeciente.',
      suit: 'Armadura ligera de cristal solar translúcido entretejido con hebras de oro cósmico primordial.',
      pauldrons: 'Guardahombros flotantes que canalizan halos de luz solar y bendición térmica.',
      accessories: 'Capa solar etérea que se disuelve en ráfagas de fotones y polvareda estelar.',
      items: 'Emite una esfera de fusión solar concentrada; las leyes de la termodinámica se inclinan a su voluntad.',
      companion: 'Unidad K.I.T. transmutada en orbe de plasma sagrado solar.'
    },
    stats: {
      health: 450,
      speed: 140,
      energyShield: 450,
      scanEfficiency: 250,
      survivalSkill: 220
    },
    portraitUrl: '/src/assets/images/character_luminara_goddess_1794085026362.jpg',
    colorScheme: {
      hair: '#f59e0b',
      suit: '#78350f',
      leather: '#fbbf24',
      holocron: '#fde047',
      tool: '#fef08a',
      droneEye: '#ffffff'
    }
  }
];

export const TITLE_BG_IMAGE = '/src/assets/images/planet_aethel_space_menu_1794085023946.jpg';
