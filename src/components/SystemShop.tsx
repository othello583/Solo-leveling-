import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShoppingBag, Sparkles, User, Key, ShieldAlert, Heart, Zap, 
  Flame, HelpCircle, Eye, Brain, ShoppingCart, RefreshCcw 
} from 'lucide-react';
import { PlayerState, Item, InventoryItem, StatType } from '../types';
import { SHOP_ITEMS } from '../data';

interface SystemShopProps {
  playerState: PlayerState;
  onUpdateState: (newState: Partial<PlayerState>) => void;
  addLog: (message: string, type: 'alert' | 'level' | 'quest' | 'shop' | 'dungeon' | 'info') => void;
  triggerLevelUpCheck: (state: PlayerState) => void;
}

export const SystemShop: React.FC<SystemShopProps> = ({
  playerState,
  onUpdateState,
  addLog,
  triggerLevelUpCheck
}) => {
  const { inventory, gold, stats, fatigue } = playerState;
  const [activeTab, setActiveTab] = useState<'shop' | 'inventory'>('shop');

  // Multipliers/Rarity badge colors
  const rarityColors = {
    E: 'bg-[#050A0F] text-[#E0F2FE]/60 border-sky-500/10',
    D: 'bg-green-950/20 text-green-400 border-green-500/20',
    C: 'bg-sky-950/20 text-sky-300 border-sky-500/20',
    B: 'bg-indigo-950/20 text-indigo-400 border-indigo-500/20',
    A: 'bg-red-955/20 text-red-500 border-red-500/20',
    S: 'bg-amber-950/30 text-amber-400 border-amber-500/30 animate-pulse font-bold'
  };

  // Buy item
  const handleBuyItem = (item: Item) => {
    if (gold < item.price) {
      addLog(`TRANSACTION REFUSED: Insufficient golden coins. Dungeon keys or quests required to replenish resources.`, 'alert');
      return;
    }

    const updatedGold = gold - item.price;
    const updatedInventory = [...inventory];
    const existingInBag = updatedInventory.find((ii) => ii.id === item.id);

    if (existingInBag) {
      existingInBag.count += 1;
    } else {
      updatedInventory.push({ ...item, count: 1, equipped: false });
    }

    onUpdateState({
      gold: updatedGold,
      inventory: updatedInventory
    });

    addLog(`Transaction approved: Purchased [${item.name}] for ${item.price} Gold. Spent resources registered.`, 'shop');
  };

  // Drink/Consume potions or elixirs
  const handleUsePotion = (invItem: InventoryItem) => {
    if (invItem.type !== 'potion') return;

    // Fatigue Reduction Potion
    if (invItem.effects?.fatigueReduction) {
      const reduction = invItem.effects.fatigueReduction;
      const nextFatigue = Math.max(0, fatigue - reduction);

      const nextInventory = inventory.map((ii) => {
        if (ii.id === invItem.id) {
          return { ...ii, count: ii.count - 1 };
        }
        return ii;
      }).filter((ii) => ii.count > 0);

      onUpdateState({
        fatigue: nextFatigue,
        inventory: nextInventory
      });
      addLog(`Ingested Potion: [${invItem.name}] relieved fatigue by -${reduction}. Current fatigue: ${nextFatigue}/100.`, 'shop');
    }

    // Permanent Stat Elixirs
    if (invItem.effects?.stat && invItem.effects?.value) {
      const statToBoost = invItem.effects.stat;
      const boostVal = invItem.effects.value;

      const nextStats = {
        ...stats,
        [statToBoost]: stats[statToBoost] + boostVal
      };

      const nextInventory = inventory.map((ii) => {
        if (ii.id === invItem.id) {
          return { ...ii, count: ii.count - 1 };
        }
        return ii;
      }).filter((ii) => ii.count > 0);

      const partialState = {
        ...playerState,
        stats: nextStats,
        inventory: nextInventory
      };

      onUpdateState(partialState);
      addLog(`Ingested Elixir: Permanent attribute transformation! ${statToBoost.toUpperCase()} altered +${boostVal}.`, 'level');
      
      // Level check
      triggerLevelUpCheck(partialState);
    }
  };

  // Equip Weapons / Accessories / Cloaks
  const handleEquipItem = (invItem: InventoryItem) => {
    if (invItem.type === 'potion' || invItem.type === 'key') return;

    const isNowEquipped = !invItem.equipped;

    const nextInventory = inventory.map((item) => {
      // Toggle targeted item
      if (item.id === invItem.id) {
        return { ...item, equipped: isNowEquipped };
      }
      // Automatical unequip other items in same category (Only allow one weapon, one armor at a time)
      if (isNowEquipped && item.type === invItem.type) {
        return { ...item, equipped: false };
      }
      return item;
    });

    onUpdateState({ inventory: nextInventory });

    if (isNowEquipped) {
      addLog(`Equipped items inventory update: Armed [${invItem.name}]. Stat boosts recalculated.`, 'shop');
    } else {
      addLog(`Unequipped item: Disarmed [${invItem.name}].`, 'shop');
    }
  };

  return (
    <div className="bg-[#050A0F]/60 backdrop-blur-md rounded-xl p-6 border border-sky-500/20 glow-border h-full flex flex-col justify-between shadow-[0_0_30px_rgba(14,165,233,0.05)]">
      <div>
        {/* Navigation Tabs */}
        <div className="flex justify-between items-center mb-5 border-b border-sky-900/35 pb-3">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('shop')}
              className={`text-sm font-black font-display uppercase tracking-widest pb-1 transition-all border-b-2 cursor-pointer ${
                activeTab === 'shop'
                  ? 'border-sky-500 text-sky-450'
                  : 'border-transparent text-[#E0F2FE]/60 hover:text-slate-200'
              }`}
            >
              System Shop
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`text-sm font-black font-display uppercase tracking-widest pb-1 transition-all border-b-2 cursor-pointer ${
                activeTab === 'inventory'
                  ? 'border-sky-500 text-sky-450'
                  : 'border-transparent text-[#E0F2FE]/60 hover:text-slate-200'
              }`}
            >
              Your Inventory ({inventory.reduce((sum, item) => sum + item.count, 0)})
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-sky-950/20 rounded border border-sky-500/10 text-xs font-mono">
            <span className="text-amber-400">🪙</span>
            <span className="text-amber-400 font-bold">{gold} Gold</span>
          </div>
        </div>

        {/* SHOP SCREEN */}
        {activeTab === 'shop' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              Expend Golden Coins achieved through Gates and daily training parameters to procure custom daggers, defense attributes, potions, or Gate challenge Keys.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[35rem] overflow-y-auto pr-1">
              {SHOP_ITEMS.map((item) => {
                const canAfford = gold >= item.price;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-sky-950/10 rounded border border-sky-500/10 flex flex-col justify-between gap-3 hover:border-sky-500/25 transition-all shadow-sm"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <span className={`text-[9px] font-black border uppercase px-1.5 py-0.5 rounded ${rarityColors[item.rarity] || 'border-sky-500/10'}`}>
                          Rank {item.rarity}
                        </span>
                        <span className="text-[10px] font-mono text-sky-400 capitalize">{item.type}</span>
                      </div>
                      <h4 className="text-xs font-bold font-display text-slate-200 uppercase">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{item.description}</p>
                      
                      {item.effects && (
                        <div className="mt-1.5 text-[9px] font-mono text-sky-400 flex items-center gap-1 bg-sky-500/5 px-2 py-0.5 rounded border border-sky-500/5">
                          <Sparkles className="w-3 h-3 text-sky-450" />
                          <span>
                            Effect:{' '}
                            {item.effects.fatigueReduction && `-${item.effects.fatigueReduction} Fatigue`}
                            {item.effects.stat && `+${item.effects.value} ${item.effects.stat.toUpperCase()}`}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center border-t border-sky-900/15 pt-2.5 mt-1">
                      <div className="text-xs font-mono text-amber-400 font-bold flex items-center gap-1">
                        <span>🪙</span> {item.price} G
                      </div>
                      <button
                        onClick={() => handleBuyItem(item)}
                        className={`text-[10px] font-mono uppercase font-bold px-3 py-1.5 rounded cursor-pointer ${
                          canAfford
                            ? 'bg-sky-500/10 border border-sky-500/30 text-sky-305 hover:bg-sky-500 hover:text-slate-950 transition-colors'
                            : 'bg-slate-900/50 text-slate-500 border border-sky-500/5 cursor-not-allowed'
                        }`}
                      >
                        Buy Item
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* INVENTORY BAG SCREEN */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              Manage your acquired materials. Equip weaponry and accessories to reinforce your core combat properties, or drink healing elixirs.
            </p>

            {inventory.length === 0 ? (
              <p className="text-xs text-sky-500/60 font-mono text-center p-6 bg-sky-950/10 rounded border border-sky-500/10 italic pb-6">
                Your inventory bag is currently vacant. Access the Shop tab to buy potions or Gate Keys!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[35rem] overflow-y-auto pr-1">
                {inventory.map((invItem) => (
                  <div
                    key={invItem.id}
                    className={`p-3.5 bg-sky-950/10 rounded border ${
                      invItem.equipped ? 'border-sky-455 bg-sky-500/5 shadow-[0_0_15px_rgba(14,165,233,0.05)]' : 'border-sky-500/10'
                    } flex flex-col justify-between gap-3 hover:border-sky-500/25 transition-all`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="bg-sky-950 border border-sky-500/20 text-sky-305 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                          Count: {invItem.count}
                        </span>
                        {invItem.equipped && (
                          <span className="bg-sky-400 text-slate-950 px-2 py-0.5 rounded text-[8px] font-black font-display uppercase tracking-widest animate-pulse">
                            Armed / Equipped
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold font-display text-slate-100 uppercase">{invItem.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{invItem.description}</p>

                      {invItem.effects && (
                        <div className="mt-1.5 text-[9px] font-mono text-sky-400 flex items-center gap-1 bg-sky-500/5 px-2 py-0.5 rounded border border-sky-500/5">
                          <Sparkles className="w-3 h-3 text-sky-450" />
                          <span>
                            Effect:{' '}
                            {invItem.effects.fatigueReduction && `-${invItem.effects.fatigueReduction} Fatigue`}
                            {invItem.effects.stat && `+${invItem.effects.value} ${invItem.effects.stat.toUpperCase()}`}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-1.5 border-t border-sky-900/15 pt-2 mt-1">
                      {invItem.type === 'potion' ? (
                        <button
                          onClick={() => handleUsePotion(invItem)}
                          className="w-full text-xs font-mono uppercase bg-emerald-555/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 px-3 py-1.5 rounded font-bold transition-all cursor-pointer text-center"
                        >
                          Drink / Consume
                        </button>
                      ) : invItem.type === 'weapon' || invItem.type === 'armor' || invItem.type === 'accessory' ? (
                        <button
                          onClick={() => handleEquipItem(invItem)}
                          className={`w-full text-xs font-mono uppercase px-3 py-1.5 rounded font-bold transition-all cursor-pointer text-center ${
                            invItem.equipped
                              ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-slate-950'
                              : 'bg-sky-500/15 border border-sky-500/30 text-sky-305 hover:bg-sky-500 hover:text-slate-950'
                          }`}
                        >
                          {invItem.equipped ? 'Disarm Item' : 'Equip Item'}
                        </button>
                      ) : (
                        <span className="text-[9px] font-mono text-slate-500 border border-sky-500/10 p-1.5 rounded font-bold uppercase tracking-wider bg-sky-950/20">
                          Gate Access Material
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-sky-900/35 pt-4 text-[10px] text-sky-500/60 font-mono text-center uppercase tracking-widest">
        The System regulates trading metrics. Returns are not supported.
      </div>
    </div>
  );
};
