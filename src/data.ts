import { Item, Dungeon, Quest, PlayerState } from './types';

export const SHOP_ITEMS: Item[] = [
  // Potions
  {
    id: 'potion_low_recovery',
    name: 'Lower-Grade Healing Potion',
    description: 'A standard blue elixir. Relieves fatigue and replenishes minor physical fatigue.',
    type: 'potion',
    rarity: 'E',
    price: 30,
    effects: { fatigueReduction: 25 },
    iconName: 'Droplet'
  },
  {
    id: 'potion_full_recovery',
    name: 'Full Recovery Elixir',
    description: 'A powerful glowing potion. Fully restores physical energy and resets your fatigue to zero.',
    type: 'potion',
    rarity: 'B',
    price: 150,
    effects: { fatigueReduction: 100 },
    iconName: 'Sparkles'
  },
  {
    id: 'potion_stat_str',
    name: 'Strength Growth Elixir',
    description: 'Infused with high-grade mana, permanently grants +1 point to your Strength attribute.',
    type: 'potion',
    rarity: 'A',
    price: 500,
    effects: { stat: 'strength', value: 1 },
    iconName: 'Flame'
  },

  // Dungeon Keys
  {
    id: 'key_dungeon_e',
    name: 'E-Rank Gate Key',
    description: 'A worn iron key that opens a portal to an E-Rank Instant Dungeon (5-min focus challenge).',
    type: 'key',
    rarity: 'E',
    price: 20,
    effects: { xpBonus: 10 },
    iconName: 'Key'
  },
  {
    id: 'key_dungeon_c',
    name: 'C-Rank Gate Key',
    description: 'A heavy copper key that opens a C-Rank Double Dungeon gating stronger beasts (10-min focus challenge).',
    type: 'key',
    rarity: 'C',
    price: 120,
    iconName: 'KeyRound'
  },
  {
    id: 'key_dungeon_a',
    name: 'A-Rank Red Gate Key',
    description: 'A crystalline red key guiding access to a high-difficulty Blizzard Dungeon (15-min focus challenge).',
    type: 'key',
    rarity: 'A',
    price: 450,
    iconName: 'KeyRound'
  },
  {
    id: 'key_dungeon_s',
    name: 'S-Rank Jeju Island Gate Key',
    description: 'A golden key radiating terrifying mana. Entrance to a cataclysmic ant nest dungeon (25-min focus challenge).',
    type: 'key',
    rarity: 'S',
    price: 1200,
    iconName: 'Key'
  },

  // Weapons & Accessories
  {
    id: 'weapon_rusty_dagger',
    name: 'Rusty Hunter Dagger',
    description: 'An inexpensive, slightly chipped iron dagger. Grants +2 Strength when equipped.',
    type: 'weapon',
    rarity: 'E',
    price: 80,
    effects: { stat: 'strength', value: 2 },
    iconName: 'Swords'
  },
  {
    id: 'weapon_kasaka_fang',
    name: "Kasaka's Venom Fang",
    description: 'Carved from the tooth of Kasaka, the blue-fanged viper. Grants +10 Strength and +6 Agility.',
    type: 'weapon',
    rarity: 'A',
    price: 800,
    effects: { stat: 'strength', value: 10 },
    iconName: 'Zap'
  },
  {
    id: 'weapon_knight_killer',
    name: 'Knight Killer',
    description: 'An B-grade serrated dagger designed to tear through heavy steel plates. Grants +6 Strength and +4 Agility.',
    type: 'weapon',
    rarity: 'B',
    price: 400,
    effects: { stat: 'strength', value: 6 },
    iconName: 'Sword'
  },
  {
    id: 'weapon_demon_sword',
    name: "Demon King's Shortsword",
    description: 'S-Rank heavy steel blade infused with lightning properties. Grants +22 Strength and +14 Agility.',
    type: 'weapon',
    rarity: 'S',
    price: 2500,
    effects: { stat: 'strength', value: 22 },
    iconName: 'ShieldAlert'
  },
  {
    id: 'armor_shadow_cloak',
    name: "Shadow Monarch's Cloak",
    description: 'An S-Rank dark garment woven from shadows. Grants +15 Vitality and +18 Intelligence.',
    type: 'armor',
    rarity: 'S',
    price: 3000,
    effects: { stat: 'intelligence', value: 18 },
    iconName: 'Shield'
  },
  {
    id: 'acc_ring_monarch',
    name: "Monarch's Signet Ring",
    description: 'A royal ring radiating ancient presence. Grants +10 Sense and +5 Intelligence.',
    type: 'accessory',
    rarity: 'S',
    price: 1500,
    effects: { stat: 'sense', value: 10 },
    iconName: 'Octagon'
  }
];

export const DUNGEONS: Dungeon[] = [
  {
    id: 'dungeon_e',
    name: 'E-Rank Dungeon: Goblin Warrens',
    rank: 'E',
    description: 'A modest cave infested with scattered Goblins. Ideal for starting hunters looking to test their limits.',
    requiredKeyId: 'key_dungeon_e',
    focusSeconds: 300, // 5 minutes
    xpReward: 120,
    goldReward: 50,
    lootChance: 40,
    bossName: 'Gargoyle Sentinel'
  },
  {
    id: 'dungeon_c',
    name: 'C-Rank Dungeon: Snake Nest',
    rank: 'C',
    description: 'A swampy subterranean layout guarded by venomous arachnids and giant high-class vipers.',
    requiredKeyId: 'key_dungeon_c',
    focusSeconds: 600, // 10 minutes
    xpReward: 350,
    goldReward: 200,
    lootChance: 60,
    bossName: 'Blue-Fanged Kasaka Venom-Viper'
  },
  {
    id: 'dungeon_a',
    name: 'A-Rank Dungeon: Red Gate Ice Keep',
    rank: 'A',
    description: 'An isolated pocket dimension locked in complete sub-zero temperatures. Dangerous Frost Elves await.',
    requiredKeyId: 'key_dungeon_a',
    focusSeconds: 900, // 15 minutes
    xpReward: 900,
    goldReward: 600,
    lootChance: 80,
    bossName: 'Baruka, the Ice King'
  },
  {
    id: 'dungeon_s',
    name: 'S-Rank Dungeon: Jeju Island Nest',
    rank: 'S',
    description: 'A terrifying dark system containing mutant giant ants capable of mimicking and devouring hunters.',
    requiredKeyId: 'key_dungeon_s',
    focusSeconds: 1500, // 25 minutes
    xpReward: 2500,
    goldReward: 2000,
    lootChance: 100,
    bossName: 'Ant King Beru'
  }
];

export const DEFAULT_DAILY_QUESTS: Quest[] = [
  {
    id: 'quest_pushups',
    title: 'Daily Training: Push-ups',
    description: 'Rebuild core physical strength to endure system adaptation.',
    currentValue: 0,
    targetValue: 100,
    unit: 'reps',
    completed: false,
    xpReward: 25,
    goldReward: 10,
    category: 'daily'
  },
  {
    id: 'quest_situps',
    title: 'Daily Training: Sit-ups',
    description: 'Condition your muscles to optimize movement speed and torso rotation.',
    currentValue: 0,
    targetValue: 100,
    unit: 'reps',
    completed: false,
    xpReward: 25,
    goldReward: 10,
    category: 'daily'
  },
  {
    id: 'quest_squats',
    title: 'Daily Training: Squats',
    description: 'Unleash high explosive jumping power and quick reflex evasion.',
    currentValue: 0,
    targetValue: 100,
    unit: 'reps',
    completed: false,
    xpReward: 25,
    goldReward: 10,
    category: 'daily'
  },
  {
    id: 'quest_running',
    title: 'Daily Training: Running',
    description: 'Build absolute aerobic stamina. Critical for evading dungeon zone wipeouts.',
    currentValue: 0,
    targetValue: 10,
    unit: 'km',
    completed: false,
    xpReward: 50,
    goldReward: 20,
    category: 'daily'
  }
];

export const SYSTEM_CLASSES = [
  { name: 'E-Rank Hunter (Starter)', minLevel: 1, bonus: 'The System observes you' },
  { name: 'Necromancer / Spellcaster', minLevel: 15, bonus: 'Intelligence attributes grant +10% maximum MP' },
  { name: 'Agile Assassin / Shadow Striker', minLevel: 25, bonus: 'Agility attributes grant +15% extra physical movement speed' },
  { name: 'Shadow Monarch (Supreme Master)', minLevel: 40, bonus: '"Arise" command active. Revive shadows under your total command' }
];

export const SYSTEM_TITLES = [
  { name: 'One Who Survived Death', condition: 'Earned at level 1.', bonus: 'Slightly reduces fatigue fatigue' },
  { name: 'Demon Slayer', condition: 'Clear 5 Double Dungeons', bonus: '+5 to Strength' },
  { name: 'Absolute Monarch', condition: 'Reach Level 40 and possess the Shadow Monarch class.', bonus: '+15 to all attributes' }
];

export const INITIAL_PLAYER_STATE: PlayerState = {
  name: 'Sung Jin-Woo',
  title: 'One Who Survived Death',
  className: 'E-Rank Hunter (Starter)',
  level: 1,
  xp: 0,
  maxXp: 100,
  gold: 100,
  fatigue: 0,
  statPoints: 10,
  stats: {
    strength: 10,
    agility: 10,
    sense: 10,
    vitality: 10,
    intelligence: 10
  },
  quests: DEFAULT_DAILY_QUESTS,
  inventory: [
    {
      id: 'potion_low_recovery',
      name: 'Lower-Grade Healing Potion',
      description: 'A standard blue elixir. Relieves fatigue and replenishes minor physical fatigue.',
      type: 'potion',
      rarity: 'E',
      price: 30,
      effects: { fatigueReduction: 25 },
      iconName: 'Droplet',
      count: 2
    },
    {
      id: 'key_dungeon_e',
      name: 'E-Rank Gate Key',
      description: 'A worn iron key that opens a portal to an E-Rank Instant Dungeon (5-min focus challenge).',
      type: 'key',
      rarity: 'E',
      price: 20,
      effects: { xpBonus: 10 },
      iconName: 'Key',
      count: 1
    }
  ],
  logs: [
    {
      id: 'log_start',
      message: 'System initialization complete. Welcome, Hunter, to the Program for growth.',
      timestamp: new Date().toLocaleTimeString(),
      type: 'alert'
    },
    {
      id: 'log_quest',
      message: 'Daily Quest: [Preparation to Become Strong] has been active. Alert: Failure leads to PENALTY ZONE.',
      timestamp: new Date().toLocaleTimeString(),
      type: 'alert'
    }
  ],
  completedQuestsCount: 0,
  completedDungeonsCount: 0,
  penaltyActive: false,
  penaltySecondsLeft: 0
};
