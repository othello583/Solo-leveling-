import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Skull, Swords, Play, ShieldAlert, Key, Zap, Flame, Compass, 
  Sparkles, ShieldCheck, Trophy, FastForward, HelpCircle, AlertTriangle 
} from 'lucide-react';
import { Dungeon, PlayerState, Item, InventoryItem } from '../types';
import { DUNGEONS, SHOP_ITEMS } from '../data';

interface DungeonGateProps {
  playerState: PlayerState;
  onUpdateState: (newState: Partial<PlayerState>) => void;
  addLog: (message: string, type: 'alert' | 'level' | 'quest' | 'shop' | 'dungeon' | 'info') => void;
  triggerLevelUpCheck: (state: PlayerState) => void;
}

export const DungeonGate: React.FC<DungeonGateProps> = ({
  playerState,
  onUpdateState,
  addLog,
  triggerLevelUpCheck
}) => {
  const { inventory, gold, xp, fatigue, stats } = playerState;

  // Active Dungeon State
  const [activeDungeon, setActiveDungeon] = useState<Dungeon | null>(null);
  const [dungeonSecondsLeft, setDungeonSecondsLeft] = useState(0);
  const [bossHp, setBossHp] = useState(0);
  const [maxBossHp, setMaxBossHp] = useState(0);
  const [monstersDefeated, setMonstersDefeated] = useState(0);
  const [isDungeonRunning, setIsDungeonRunning] = useState(false);
  const [isHyperCombatActive, setIsHyperCombatActive] = useState(false); // Speedhack for test evaluation
  const [playerCurHp, setPlayerCurHp] = useState(100);
  const [playerMaxHp, setPlayerMaxHp] = useState(100);

  // Sound effects of sorts (text-based battles)
  const [battleLogs, setBattleLogs] = useState<string[]>([]);

  // Setup loop for active dungeons
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isDungeonRunning && activeDungeon) {
      interval = setInterval(() => {
        setDungeonSecondsLeft((prev) => {
          // Decrement timer
          const tick = isHyperCombatActive ? 15 : 1; // Speed hack
          const nextVal = prev - tick;

          // Natural boss passive healing or damage back
          if (Math.random() < 0.15) {
            const damageDealtToPlayer = Math.max(2, Math.floor(Math.random() * 8) + 4 - Math.floor(stats.vitality / 4));
            setPlayerCurHp((p) => Math.max(10, p - damageDealtToPlayer));
            setBattleLogs((bl) => [
              ...bl,
              `⚠️ Boss [${activeDungeon.bossName}] counters! dealt ${damageDealtToPlayer} strike damage to your guard.`
            ].slice(-4));
          }

          if (nextVal <= 0) {
            clearInterval(interval!);
            handleDungeonVictory();
            return 0;
          }
          return nextVal;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDungeonRunning, activeDungeon, isHyperCombatActive]);

  // Launch Dungeon
  const enterDungeon = (dungeon: Dungeon) => {
    // Check if player has the required key in inventory
    const keyItem = inventory.find((item) => item.id === dungeon.requiredKeyId && item.count > 0);
    if (!keyItem) {
      addLog(`ACCESS DENIED: Required key [${dungeon.requiredKeyId}] is missing from inventory. Visit the Shop to buy keys!`, 'alert');
      return;
    }

    // Fatigue warning
    if (fatigue >= 90) {
      addLog(`CRITICAL FATIGUE: Stagnation level is too high (${fatigue}/100) to safely execute dungeons. Perform recovery routines first!`, 'alert');
      return;
    }

    // Spend Key
    const updatedInventory = inventory.map((item) => {
      if (item.id === dungeon.requiredKeyId) {
        return { ...item, count: item.count - 1 };
      }
      return item;
    }).filter((item) => item.count > 0);

    const calculatedPlayerHp = 100 + stats.vitality * 12;
    setPlayerMaxHp(calculatedPlayerHp);
    setPlayerCurHp(calculatedPlayerHp);

    // Boss attributes scaled to rank
    const rankMultipliers = { E: 1, D: 2, C: 4, B: 7, A: 12, S: 25 };
    const baseBossHp = 150;
    const computedBossHp = baseBossHp * rankMultipliers[dungeon.rank] + stats.strength * 2;

    setActiveDungeon(dungeon);
    setDungeonSecondsLeft(dungeon.focusSeconds);
    setBossHp(computedBossHp);
    setMaxBossHp(computedBossHp);
    setMonstersDefeated(0);
    setIsDungeonRunning(true);
    setBattleLogs([
      `⚡ Gate breached. Entered [${dungeon.name}].`,
      `☣️ Boss: ${dungeon.bossName} | HP: ${computedBossHp}`,
      `⚔️ Commencing clearing directives. Defeat the Boss or survive the lock timer to escape!`
    ]);

    onUpdateState({
      inventory: updatedInventory,
      fatigue: Math.min(fatigue + 15, 100) // Gate entry incurs fatigue
    });
    addLog(`Breached Gate: Spent 1x [${dungeon.requiredKeyId.replace('key_', '').toUpperCase()}-Rank Key] to enter ${dungeon.name}. Fatigue +15.`, 'dungeon');
  };

  // Perform physical basic strike (slam attack)
  const handleStrikeBoss = () => {
    if (!activeDungeon || !isDungeonRunning) return;

    // Strike power bases on Strength attribute and minor Agility multipliers
    const strikePower = Math.floor(stats.strength * 1.5) + Math.floor(stats.agility * 0.4) + Math.floor(Math.random() * 5) + 5;
    const nextBossHp = Math.max(0, bossHp - strikePower);

    setBossHp(nextBossHp);
    setBattleLogs((prev) => [
      ...prev,
      `💥 You struck [${activeDungeon.bossName}] for ${strikePower} damage!`
    ].slice(-4));

    // Decollect dungeon seconds as active combat speed benefit! Shave 15 seconds per click!
    setDungeonSecondsLeft((prev) => Math.max(0, prev - 12));

    if (nextBossHp <= 0) {
      handleDungeonVictory();
    }
  };

  // Dungeon Cleared & Disburse Bounties
  const handleDungeonVictory = () => {
    if (!activeDungeon) return;

    setIsDungeonRunning(false);
    setActiveDungeon(null);

    // Rewards
    let finalGold = gold + activeDungeon.goldReward;
    let finalXp = xp + activeDungeon.xpReward;

    // Roll random high value item drop in dungeons based on lootChance
    let droppedItemName = '';
    const updatedInventory = [...inventory];
    const dropRoll = Math.random() * 100;
    
    if (dropRoll <= activeDungeon.lootChance) {
      // Pick random loot item (high level potion or rare daggers)
      const rareItems = SHOP_ITEMS.filter((item) => item.rarity === activeDungeon.rank || item.rarity === 'B' || item.rarity === 'A');
      const droppedItem = rareItems.length > 0 
        ? rareItems[Math.floor(Math.random() * rareItems.length)] 
        : SHOP_ITEMS[0]; // Lower Grade Potion fallback
      
      droppedItemName = droppedItem.name;

      const itemInInv = updatedInventory.find(i => i.id === droppedItem.id);
      if (itemInInv) {
        itemInInv.count += 1;
      } else {
        updatedInventory.push({ ...droppedItem, count: 1 });
      }
    }

    const nextState = {
      ...playerState,
      gold: finalGold,
      xp: finalXp,
      inventory: updatedInventory,
      completedDungeonsCount: playerState.completedDungeonsCount + 1
    };

    onUpdateState(nextState);
    addLog(`GATE CLEARED! Relocated to safe zone. Earned +${activeDungeon.xpReward} XP, +${activeDungeon.goldReward} Gold.${droppedItemName ? ` Rare loot discovered: [${droppedItemName}]!` : ''}`, 'dungeon');
    
    // Check levelup
    triggerLevelUpCheck(nextState);
  };

  // Flee / Retreat (Gives zero gold/xp and increases fatigue further from exhausting retreat)
  const retreatDungeon = () => {
    setIsDungeonRunning(false);
    setActiveDungeon(null);
    onUpdateState({
      fatigue: Math.min(fatigue + 25, 100)
    });
    addLog('TACTICAL FLEE: Retracted from Gate core. Fatigue penalty +25 applied. Zero dungeon spoils retrieved.', 'alert');
  };

  // Convert seconds to clean clock format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="bg-[#050A0F]/60 backdrop-blur-md rounded-xl p-6 border border-sky-500/20 glow-border h-full flex flex-col justify-between shadow-[0_0_30px_rgba(14,165,233,0.05)]">
      <div>
        <div className="flex justify-between items-center mb-5 border-b border-sky-900/30 pb-3">
          <h2 className="text-xl font-black font-display uppercase tracking-widest text-[#E0F2FE] flex items-center gap-2">
            <Compass className="w-5 h-5 text-sky-400" /> Dungeon Gates
          </h2>
          <span className="text-[10px] font-mono border border-sky-500/10 bg-sky-950/20 px-2.5 py-0.5 rounded text-sky-300">
            {playerState.completedDungeonsCount} Gate Clears
          </span>
        </div>

        {/* 1. DUNGEON RUNNING SCREEN ARENA */}
        <AnimatePresence>
          {isDungeonRunning && activeDungeon && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#050A0F] p-5 rounded-lg border border-sky-500/30 relative overflow-hidden scanline-bg shadow-2xl mb-6"
            >
              {/* Title Header */}
              <div className="flex justify-between items-start border-b border-sky-900/35 pb-3 mb-4">
                <div>
                  <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[9px] uppercase font-mono px-2 py-0.5 rounded font-black animate-pulse">
                    Rank {activeDungeon.rank} Dimension Gated
                  </span>
                  <h3 className="text-sm font-black font-display text-sky-100 uppercase tracking-wider mt-1">{activeDungeon.name}</h3>
                </div>
                <div className="text-right">
                  <p className="text-[8px] uppercase tracking-wider text-slate-500 font-mono">Extraction clock</p>
                  <p className="text-2xl font-black font-display text-sky-400">{formatTime(dungeonSecondsLeft)}</p>
                </div>
              </div>

              {/* Combat graphics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Boss health meter */}
                <div className="bg-red-950/20 p-3 rounded border border-red-900/45">
                  <div className="flex justify-between items-center text-xs font-mono mb-2">
                    <span className="font-bold text-red-400 flex items-center gap-1">
                      <Skull className="w-4 h-4 text-red-500 animate-bounce" /> BOSS: {activeDungeon.bossName}
                    </span>
                    <span className="text-red-400 font-bold">{bossHp} / {maxBossHp} HP</span>
                  </div>
                  <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-red-950">
                    <motion.div
                      className="bg-gradient-to-r from-red-650 to-amber-500 h-full rounded-full"
                      initial={{ width: '100%' }}
                      animate={{ width: `${(bossHp / maxBossHp) * 100}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                </div>

                {/* Player Health Vitals */}
                <div className="bg-emerald-950/20 p-3 rounded border border-emerald-900/42">
                  <div className="flex justify-between items-center text-xs font-mono mb-2">
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" /> PLAYER VITAL GUARD
                    </span>
                    <span className="text-emerald-400 font-bold">{playerCurHp} / {playerMaxHp} HP</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-emerald-950">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${(playerCurHp / playerMaxHp) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Real-time battle feed */}
              <div className="bg-[#050A0F] p-3.5 rounded h-32 overflow-y-auto mb-4 border border-sky-500/10 font-mono text-[10px] leading-relaxed text-sky-400 shadow-inner">
                {battleLogs.map((logLine, i) => (
                  <p key={i}>&gt; {logLine}</p>
                ))}
              </div>

              {/* Interaction panels */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleStrikeBoss}
                    className="flex-1 py-3.5 bg-gradient-to-r from-red-950/20 via-red-500 to-red-950/20 border border-red-500 hover:border-red-400 hover:text-white transition-all rounded font-bold font-display text-xs tracking-widest uppercase text-slate-100 flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
                  >
                    <Swords className="w-5 h-5 text-red-300 animate-pulse" /> Strike Gate Boss!
                  </button>

                  <button
                    onClick={() => setIsHyperCombatActive((p) => !p)}
                    title="Developer Quick Fight Hack (15x speed ticks)"
                    className={`p-3.5 rounded border flex items-center justify-center tooltip transition-all cursor-pointer ${
                      isHyperCombatActive
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-lg'
                        : 'bg-sky-950/10 text-sky-405 border-sky-500/20 hover:border-sky-500/40'
                    }`}
                  >
                    <FastForward className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1 text-sky-500/60 font-mono text-[9px] uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                    Tip: Clicks deal damage equal to 1.5x your Str stat ({stats.strength}) and shaves time!
                  </span>
                  <button
                    onClick={retreatDungeon}
                    className="text-red-400 hover:text-red-300 hover:underline cursor-pointer uppercase font-bold font-mono tracking-wider animate-pulse"
                  >
                    Flee/Retreat
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. INACTIVE GATE SELECTION PORTAL */}
        {!isDungeonRunning && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              Choose a Dungeon Gate to enter. Breaching Gates requires purchasing corresponding Gate Keys from the Item Shop. Higher Rank cages yield glorious relics and massive level increments!
            </p>

            <div className="space-y-3">
              {DUNGEONS.map((dungeon) => {
                const keyCount = inventory.find((item) => item.id === dungeon.requiredKeyId)?.count || 0;
                const canBreach = keyCount > 0;

                return (
                  <div
                    key={dungeon.id}
                    className={`p-4 rounded border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all bg-[#050A0F]/50 ${
                      canBreach
                        ? 'border-sky-500/20 bg-sky-950/5 hover:border-sky-500/35'
                        : 'border-sky-500/5 bg-sky-950/0 opacity-60'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-black border tracking-wider ${
                          dungeon.rank === 'E' ? 'bg-[#050A0F] border-slate-700 text-slate-300' :
                          dungeon.rank === 'C' ? 'bg-blue-950/40 border-blue-800/60 text-blue-400' :
                          dungeon.rank === 'A' ? 'bg-red-950/30 border-red-900/50 text-red-400' :
                          'bg-amber-955/35 border-amber-500/40 text-amber-400 animate-pulse'
                        }`}>
                          Rank {dungeon.rank}
                        </span>
                        <h3 className="text-sm font-black font-display text-slate-200 uppercase tracking-wide">{dungeon.name}</h3>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-lg leading-relaxed">{dungeon.description}</p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-1 gap-x-4 mt-2.5 text-[10px] font-mono text-slate-500">
                        <p>Key Required: <span className="text-slate-300 font-bold uppercase">{dungeon.requiredKeyId.replace('key_dungeon_', '').replace('key_', '').toUpperCase()} KEY</span></p>
                        <p>Loot Likelihood: <span className="text-slate-300 font-bold">{dungeon.lootChance}%</span></p>
                        <p>Clearing Limit: <span className="text-slate-300 font-bold">{dungeon.focusSeconds / 60} MIN</span></p>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-end gap-3 w-full md:w-auto border-t md:border-t-0 border-sky-900/15 pt-3 md:pt-0 justify-between">
                      <div className="text-right">
                        <p className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Clear Bounty</p>
                        <p className="text-xs font-mono font-bold text-slate-300">
                          <span className="text-amber-400">+{dungeon.goldReward}G</span> / <span className="text-sky-400">+{dungeon.xpReward}XP</span>
                        </p>
                      </div>

                      {canBreach ? (
                        <button
                          onClick={() => enterDungeon(dungeon)}
                          className="px-4 py-2 bg-sky-500 text-slate-950 font-black font-display text-xs uppercase tracking-widest rounded border border-sky-400 hover:bg-[#050A0F] hover:text-sky-400 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" /> Breach Gate ({keyCount})
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-[#050A0F] px-2.5 py-1.5 rounded border border-sky-500/5">
                          <Key className="w-3.5 h-3.5 leading-none" /> Keys Missing
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {!isDungeonRunning && (
        <div className="mt-6 border-t border-sky-900/30 pt-4 flex items-center gap-2.5 text-[10px] text-sky-405/80 bg-sky-950/10 p-3.5 rounded border border-sky-500/10 leading-relaxed uppercase tracking-wider">
          <AlertTriangle className="w-4.5 h-4.5 text-amber-500 flex-shrink-0 animate-pulse" />
          <span>Notice: Accessing dungeon gates increases exhaustion. Ensure you stock up on Recovery Potions from the Item Shop before initiating S-rank challenges!</span>
        </div>
      )}
    </div>
  );
};
