import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Shield, Zap, Sparkles, AlertTriangle, Plus, Flame, Eye, Heart, Brain, Dumbbell } from 'lucide-react';
import { PlayerState, StatType } from '../types';

interface StatusCardProps {
  playerState: PlayerState;
  onAllocateStat: (stat: StatType) => void;
  onUpdateState: (newState: Partial<PlayerState>) => void;
  addLog: (message: string, type: 'alert' | 'level' | 'quest' | 'shop' | 'dungeon' | 'info') => void;
  isLoadingAI: boolean;
  onTriggerEvaluation: () => void;
  aiEvaluation: string;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  playerState,
  onAllocateStat,
  onUpdateState,
  addLog,
  isLoadingAI,
  onTriggerEvaluation,
  aiEvaluation
}) => {
  const { stats, level, xp, maxXp, gold, fatigue, statPoints, className, title, name } = playerState;

  // Dynamic HP and MP formulas based on stats
  const maxHp = 100 + stats.vitality * 12;
  const maxMp = 50 + stats.intelligence * 10;

  // Stat descriptions
  const statInfo: Record<StatType, { name: string; desc: string; icon: React.ReactNode; color: string }> = {
    strength: {
      name: 'Strength [STR]',
      desc: 'Controls physical striking damage and inventory capacity.',
      icon: <Flame className="w-5 h-5 text-red-400" />,
      color: 'from-red-500/20 to-orange-500/10'
    },
    agility: {
      name: 'Agility [AGI]',
      desc: 'Enhances movement speed, evasive swiftness, and physical reflexes.',
      icon: <Zap className="w-5 h-5 text-yellow-400" />,
      color: 'from-yellow-500/20 to-amber-500/10'
    },
    sense: {
      name: 'Sense [SEN]',
      desc: 'Sharpens perception, warning of dungeon dangers early.',
      icon: <Eye className="w-5 h-5 text-green-400" />,
      color: 'from-green-500/20 to-emerald-500/10'
    },
    vitality: {
      name: 'Vitality [VIT]',
      desc: 'Increases maximum Health Points [HP] and physical endurance.',
      icon: <Heart className="w-5 h-5 text-teal-400" />,
      color: 'from-teal-500/20 to-cyan-500/10'
    },
    intelligence: {
      name: 'Intelligence [INT]',
      desc: 'Amplifies maximum Mana Points [MP] and magical spell capabilities.',
      icon: <Brain className="w-5 h-5 text-fuchsia-400" />,
      color: 'from-fuchsia-500/20 to-purple-500/10'
    }
  };

  // Quick action: reset custom name
  const [editingName, setEditingName] = React.useState(false);
  const [tempName, setTempName] = React.useState(name);

  const saveName = () => {
    if (tempName.trim()) {
      onUpdateState({ name: tempName });
      addLog(`Hunter registration modified. Identity mapped: ${tempName}`, 'info');
    }
    setEditingName(false);
  };

  return (
    <div className="bg-[#050A0F]/60 backdrop-blur-md rounded-xl p-6 border border-sky-500/20 glow-border h-full flex flex-col justify-between shadow-[0_0_30px_rgba(14,165,233,0.05)]">
      {/* Name and class info */}
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              {editingName ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="bg-slate-950 border border-sky-400 rounded px-2 py-0.5 text-sm text-sky-400 focus:outline-none w-36 font-display"
                    onKeyDown={(e) => e.key === 'Enter' && saveName()}
                  />
                  <button onClick={saveName} className="text-xs bg-sky-500/20 border border-sky-400 px-2 py-0.5 rounded text-sky-400 hover:bg-sky-500/30">
                    Save
                  </button>
                </div>
              ) : (
                <h2 
                  onClick={() => setEditingName(true)} 
                  className="text-2xl font-black font-display tracking-tight text-white cursor-pointer hover:text-sky-400 transition-colors flex items-center gap-1.5"
                  title="Click to rename"
                >
                  {name} <span className="text-xs text-sky-500/60 font-sans font-normal italic">(Edit)</span>
                </h2>
              )}
            </div>
            <p className="text-xs text-sky-500 uppercase tracking-[0.2em] mt-1 font-mono flex items-center gap-1.5">
              <span className="text-sky-400 inline-block">■</span> Title: {title}
            </p>
            <p className="text-xs text-sky-400 mt-1 font-mono font-medium uppercase tracking-wide">
              Class Status: <span className="text-white font-bold">{className}</span>
            </p>
          </div>
          <div className="bg-sky-500/10 border border-sky-400/30 rounded p-2.5 text-center min-w-[70px]">
            <p className="text-[10px] uppercase font-mono text-sky-400">Level</p>
            <p className="text-3xl font-black text-sky-400 font-display">{level}</p>
          </div>
        </div>

        {/* Level & XP Gauge */}
        <div className="space-y-4 mb-6">
          <div>
            <div className="flex justify-between items-end text-xs font-mono mb-1 text-sky-300">
              <span className="uppercase tracking-widest text-[10px] font-bold">Experience Progression</span>
              <span>
                {xp} / {maxXp} XP ({Math.floor((xp / maxXp) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-sky-950/40 rounded-full h-3.5 overflow-hidden border border-sky-500/20 shadow-inner">
              <motion.div
                className="bg-gradient-to-r from-sky-600 via-sky-400 to-white h-full rounded-full relative"
                initial={{ width: 0 }}
                animate={{ width: `${(xp / maxXp) * 100}%` }}
                transition={{ duration: 0.5 }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.15)_50%,transparent_75%)] bg-[length:15px_15px]"></div>
              </motion.div>
            </div>
          </div>

          {/* Vitals */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-sky-950/20 p-3 rounded border border-sky-500/15">
              <div className="flex justify-between text-[11px] font-mono mb-1 text-red-400 font-bold">
                <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> HP</span>
                <span>{maxHp} / {maxHp}</span>
              </div>
              <div className="w-full bg-slate-950/80 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-red-600 to-rose-500 h-full rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            <div className="bg-sky-950/20 p-3 rounded border border-sky-500/15">
              <div className="flex justify-between text-[11px] font-mono mb-1 text-sky-300 font-bold">
                <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> MP</span>
                <span>{maxMp} / {maxMp}</span>
              </div>
              <div className="w-full bg-slate-950/80 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-sky-600 to-sky-400 h-full rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </div>

          {/* Fatigue Meter */}
          <div className="bg-sky-950/20 p-3.5 rounded border border-sky-500/15">
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-orange-400 font-bold flex items-center gap-1">
                <Dumbbell className="w-4 h-4 text-orange-400" /> FATIGUE GAUGE
              </span>
              <span className={fatigue >= 80 ? 'text-orange-500 animate-pulse font-bold' : 'text-orange-400 font-bold'}>
                {fatigue} / 100
              </span>
            </div>
            <div className="w-full bg-slate-950/80 rounded-full h-2 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  fatigue >= 80
                    ? 'bg-gradient-to-r from-orange-600 to-orange-400 animate-pulse'
                    : 'bg-orange-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${fatigue}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            {fatigue >= 80 && (
              <div className="flex items-center gap-1.5 text-[10px] text-orange-400 mt-2 font-mono uppercase bg-orange-950/30 border border-orange-900/40 p-1.5 rounded animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Stagnation alert. Clear fatigue with Elixirs soon!</span>
              </div>
            )}
          </div>
        </div>

        {/* Attribute System */}
        <div className="space-y-3">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-xs font-bold font-display uppercase tracking-widest text-sky-450">Ability Scores</h3>
            {statPoints > 0 && (
              <span className="bg-sky-500/10 text-white border border-sky-500/30 px-2.5 py-0.5 rounded text-[10px] font-bold animate-pulse font-mono tracking-wider">
                {statPoints} {statPoints > 1 ? 'POINTS' : 'POINT'} AVAILABLE
              </span>
            )}
          </div>

          <div className="space-y-2">
            {(Object.keys(statInfo) as StatType[]).map((statKey) => {
              const item = statInfo[statKey];
              const value = stats[statKey];

              return (
                <div
                  key={statKey}
                  className="bg-sky-950/10 p-2.5 rounded border border-sky-500/10 flex items-center justify-between group hover:border-sky-500/30 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-sky-950/50 rounded border border-sky-500/15 text-sky-400">
                      {React.cloneElement(item.icon as React.ReactElement, { className: 'w-4 h-4 text-sky-400' })}
                    </div>
                    <div>
                      <p className="text-xs font-mono font-bold text-sky-300 uppercase tracking-wider">{statKey}</p>
                      <p className="text-[10px] text-slate-400 group-hover:text-slate-300 transition-colors leading-tight">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold font-mono text-white">{value}</span>
                    {statPoints > 0 && (
                      <button
                        onClick={() => onAllocateStat(statKey)}
                        className="bg-sky-500/10 border border-sky-400/40 hover:bg-sky-500 hover:text-slate-950 aspect-square rounded p-1 transition-all flex items-center justify-center cursor-pointer"
                        title="Allocate Points"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Trigger System Evaluation */}
      <div className="mt-6 border-t border-sky-900/30 pt-4">
        <button
          onClick={onTriggerEvaluation}
          disabled={isLoadingAI}
          className="w-full text-xs font-display font-bold uppercase tracking-widest glow-btn py-3 rounded flex items-center justify-center gap-2 text-sky-300 disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(14,165,233,0.1)]"
        >
          <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
          {isLoadingAI ? 'Analyzing hunter attributes...' : 'Enact System AI Evaluation'}
        </button>

        <AnimatePresence>
          {aiEvaluation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 bg-sky-950/20 p-4 rounded border border-sky-500/20 overflow-y-auto max-h-48 text-xs leading-relaxed text-sky-250 font-mono shadow-inner"
            >
              <p className="text-[10px] text-sky-400 border-b border-sky-950 pb-1 mb-2.5 uppercase tracking-widest font-bold">
                [SYSTEM FEEDBACK REPORT]
              </p>
              <div className="whitespace-pre-line prose prose-invert prose-xs text-[#E0F2FE]">
                {aiEvaluation}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
