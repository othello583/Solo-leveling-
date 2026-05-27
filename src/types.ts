export type StatType = 'strength' | 'agility' | 'sense' | 'vitality' | 'intelligence';

export interface Stats {
  strength: number;
  agility: number;
  sense: number;
  vitality: number;
  intelligence: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  completed: boolean;
  xpReward: number;
  goldReward: number;
  category: 'daily' | 'custom';
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'potion' | 'key' | 'accessory';
  rarity: 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
  price: number;
  effects?: {
    stat?: StatType;
    value?: number;
    fatigueReduction?: number;
    xpBonus?: number;
  };
  iconName: string;
  equipped?: boolean;
}

export interface InventoryItem extends Item {
  count: number;
  equipped?: boolean;
}

export interface Dungeon {
  id: string;
  name: string;
  rank: 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
  description: string;
  requiredKeyId: string;
  focusSeconds: number; // focus time
  xpReward: number;
  goldReward: number;
  lootChance: number;
  bossName: string;
}

export interface SystemLog {
  id: string;
  message: string;
  timestamp: string;
  type: 'alert' | 'level' | 'quest' | 'shop' | 'dungeon' | 'info';
}

export interface PlayerState {
  name: string;
  title: string;
  className: string;
  level: number;
  xp: number;
  maxXp: number;
  gold: number;
  fatigue: number; // 0 to 100
  statPoints: number; // unallocated stat points
  stats: Stats;
  quests: Quest[];
  inventory: InventoryItem[];
  logs: SystemLog[];
  completedQuestsCount: number;
  completedDungeonsCount: number;
  penaltyActive: boolean;
  penaltySecondsLeft: number;
}
