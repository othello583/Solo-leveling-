import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckSquare, Square, Plus, Sparkles, AlertOctagon, HelpCircle, 
  Dumbbell, Play, Timer, ShieldAlert, Award, Gift, Trash2 
} from 'lucide-react';
import { PlayerState, Quest, Item } from '../types';
import { SHOP_ITEMS } from '../data';

interface QuestTrackerProps {
  playerState: PlayerState;
  onUpdateState: (newState: Partial<PlayerState>) => void;
  addLog: (message: string, type: 'alert' | 'level' | 'quest' | 'shop' | 'dungeon' | 'info') => void;
  triggerLevelUpCheck: (state: PlayerState) => void;
}

export const QuestTracker: React.FC<QuestTrackerProps> = ({
  playerState,
  onUpdateState,
  addLog,
  triggerLevelUpCheck
}) => {
  const { quests, gold, xp, fatigue, penaltyActive, penaltySecondsLeft } = playerState;

  // State for manual custom quest input
  const [customTitle, setCustomTitle] = useState('');
  const [customTarget, setCustomTarget] = useState(1);
  const [customUnit, setCustomUnit] = useState('times');
  const [customDesc, setCustomDesc] = useState('');

  // State for AI-generated urgent quest input
  const [goalInput, setGoalInput] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState('');

  // State for interactive penalty runner challenge
  const [penaltyTimer, setPenaltyTimer] = useState<NodeJS.Timeout | null>(null);
  const [panickedCentipedeCount, setPanickedCentipedeCount] = useState(0);
  const [centipedeProgress, setCentipedeProgress] = useState(0); // 0% up to 100% (at 100%, caught!)
  const [survivalSecs, setSurvivalSecs] = useState(25);
  const [penaltyLog, setPenaltyLog] = useState<string[]>([]);

  // Filter quests
  const dailyQuests = quests.filter(q => q.category === 'daily');
  const customQuests = quests.filter(q => q.category === 'custom');

  // Increments target progress
  const incrementProgress = (id: string, step: number) => {
    const updatedQuests = quests.map(q => {
      if (q.id === id) {
        if (q.completed) return q;

        const nextVal = Math.min(q.currentValue + step, q.targetValue);
        const isNowCompleted = nextVal >= q.targetValue;

        if (isNowCompleted) {
          // Grant single quest rewards immediately
          const newGold = gold + q.goldReward;
          const newXp = xp + q.xpReward;
          // Apply fatigue slightly for physical work (+5 per quest completed)
          const nextFatigue = Math.min(fatigue + 8, 100);

          setTimeout(() => {
            addLog(`Quest milestone [${q.title}] completed! Earned +${q.xpReward} XP, +${q.goldReward} Gold. Fatigue +8`, 'quest');
            // Trigger check
            const interimState = { ...playerState, xp: newXp, gold: newGold, fatigue: nextFatigue };
            triggerLevelUpCheck(interimState);
          }, 100);

          return { ...q, currentValue: nextVal, completed: true };
        }
        return { ...q, currentValue: nextVal };
      }
      return q;
    });

    onUpdateState({ quests: updatedQuests });
  };

  // Check if ALL standard daily physical quests are completed
  const allDailiesCompleted = dailyQuests.length > 0 && dailyQuests.every(q => q.completed);

  // Add custom quest manually
  const handleAddCustomQuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const newQuest: Quest = {
      id: `quest_custom_${Date.now()}`,
      title: customTitle,
      description: customDesc || 'Honed through personal commitment to growth.',
      currentValue: 0,
      targetValue: Math.max(1, customTarget),
      unit: customUnit || 'reps',
      completed: false,
      xpReward: Math.round(customTarget * 5) + 15,
      goldReward: Math.round(customTarget * 2) + 5,
      category: 'custom'
    };

    onUpdateState({ quests: [...quests, newQuest] });
    addLog(`System registered active personal goal: [${newQuest.title}]`, 'info');

    // Reset inputs
    setCustomTitle('');
    setCustomTarget(1);
    setCustomUnit('times');
    setCustomDesc('');
  };

  // Delete a custom quest
  const deleteQuest = (id: string) => {
    onUpdateState({ quests: quests.filter(q => q.id !== id) });
    addLog('Quest registration retracted.', 'info');
  };

  // Generate Quest via server-side Gemini AI
  const handleAIGenerateQuest = async () => {
    if (!goalInput.trim()) return;
    setIsLoadingAI(true);
    setAiError('');

    try {
      const response = await fetch('/api/system/generate-quest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerGoal: goalInput,
          playerLevel: playerState.level
        })
      });

      if (!response.ok) {
        throw new Error('Server returned error or invalid status.');
      }

      const data = await response.json();
      if (data.success && data.quest) {
        const generated = data.quest;
        
        // Formulate standard quest out of JSON structures
        const customAIQuest: Quest = {
          id: `quest_ai_${Date.now()}`,
          title: `[Urgent Quest] ${generated.title}`,
          description: generated.description,
          currentValue: 0,
          targetValue: generated.goals?.[0]?.target || 1,
          unit: generated.goals?.[0]?.unit || 'task',
          completed: false,
          xpReward: generated.xpReward || 150,
          goldReward: generated.goldReward || 60,
          category: 'custom'
        };

        onUpdateState({ quests: [...quests, customAIQuest] });
        addLog(`System dispatch: Urgent objective incoming! [${customAIQuest.title}]`, 'alert');
        setGoalInput('');
      } else {
        throw new Error(data.error || 'Syntax failure in quest generation.');
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'System failed to contact the System Core. Please retry library parameters.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Claim Daily Quest complete lootbox reward
  const handleClaimLootbox = () => {
    if (!allDailiesCompleted) return;

    // Reset standard physical daily quests back to 0 for replayability
    const resetDailies = quests.map(q => {
      if (q.category === 'daily') {
        return { ...q, currentValue: 0, completed: false };
      }
      return q;
    });

    // Pick a random reward item
    // 60% chance standard potion, 35% chance dungeon keys, 5% rare accessory
    const roll = Math.random();
    let rewardItem: Item;
    if (roll < 0.5) {
      rewardItem = SHOP_ITEMS.find(item => item.id === 'potion_low_recovery') || SHOP_ITEMS[0];
    } else if (roll < 0.85) {
      rewardItem = SHOP_ITEMS.find(item => item.id === 'key_dungeon_e') || SHOP_ITEMS[3];
    } else {
      rewardItem = SHOP_ITEMS.find(item => item.id === 'potion_full_recovery') || SHOP_ITEMS[1];
    }

    // Add item to inventory
    const updatedInventory = [...playerState.inventory];
    const itemInInv = updatedInventory.find(i => i.id === rewardItem.id);
    if (itemInInv) {
      itemInInv.count += 1;
    } else {
      updatedInventory.push({ ...rewardItem, count: 1 });
    }

    const bounteousXp = 150;
    const bounteousGold = 50;
    const finalXp = xp + bounteousXp;
    const finalGold = gold + bounteousGold;
    // Clearing daily physical training resets fatigue to 0! Absolute full-recovery rewards!
    const finalFatigue = 0;

    const finalState = {
      ...playerState,
      quests: resetDailies,
      gold: finalGold,
      xp: finalXp,
      fatigue: finalFatigue,
      inventory: updatedInventory,
      completedQuestsCount: playerState.completedQuestsCount + 1
    };

    onUpdateState(finalState);
    addLog(`Claimed Daily Loot Rewards Chest! Received: ${rewardItem.name}. Full fatigue cure applied. Gold +50, XP +150`, 'alert');
    triggerLevelUpCheck(finalState);
  };

  // Reset all daily quests manually
  const resetDailyTracker = () => {
    const resetQuests = quests.map(q => {
      if (q.category === 'daily') {
        return { ...q, currentValue: 0, completed: false };
      }
      return q;
    });
    onUpdateState({ quests: resetQuests });
    addLog('System: Physical daily counters reset to zero.', 'info');
  };

  // Enter / Simulate Penalty Zone Survival Mini-Game
  const triggerPenaltySurvival = () => {
    onUpdateState({ penaltyActive: true, fatigue: 100 });
    setCentipedeProgress(12); // Start close (100% means caught!)
    setSurvivalSecs(20);
    setPanickedCentipedeCount(0);
    setPenaltyLog(['WARNING: FAILED SYSTEM MOTIVATION PROTOCOL.', 'ENTERING PENALTY ZONE: DESERT INSECT INFESTATION.', 'Survival time parameter set: survive 20 seconds.', 'CRITICAL: Tap/Click the "RUN AWAY" button rapidly to boost your evasion pace!']);

    // Clear previous timer if any
    if (penaltyTimer) clearInterval(penaltyTimer);

    const timer = setInterval(() => {
      setSurvivalSecs((prevSecs) => {
        if (prevSecs <= 1) {
          clearInterval(timer);
          completePenaltySurvival(true);
          return 0;
        }

        // Centipedes creep closer every second based on luck
        setCentipedeProgress((prevProgress) => {
          const creep = Math.floor(Math.random() * 8) + 4; // 4-12% creep
          const next = prevProgress + creep;
          if (next >= 100) {
            clearInterval(timer);
            completePenaltySurvival(false);
            return 100;
          }
          return next;
        });

        // Add fun flavor texts randomly
        if (Math.random() < 0.4) {
          const scaryMessages = [
            "A giant centipede snaps its twin mandibles inches from your neck!",
            "The shifting sands buckle beneath your sprint!",
            "Extreme heat stroke sets in. Fatigue maximum!",
            "Distant screeches echoing from the toxic sky!"
          ];
          const msg = scaryMessages[Math.floor(Math.random() * scaryMessages.length)];
          setPenaltyLog(prev => [...prev, msg].slice(-5));
        }

        return prevSecs - 1;
      });
    }, 1000);

    setPenaltyTimer(timer);
  };

  // Click handler to sprint away in Penalty
  const handleSprintClick = () => {
    setPanickedCentipedeCount((prev) => prev + 1);
    // Increases physical evasion distance—shoves back centipede progress!
    setCentipedeProgress((prev) => Math.max(0, prev - 4));
  };

  const completePenaltySurvival = (success: boolean) => {
    if (penaltyTimer) {
      clearInterval(penaltyTimer);
      setPenaltyTimer(null);
    }

    if (success) {
      // Earning rewards for survival
      const recoveryGold = 80;
      const finalGold = gold + recoveryGold;
      // Clears heavy fatigue by surviving survival training!
      const clearedFatigue = 30;

      onUpdateState({
        penaltyActive: false,
        fatigue: clearedFatigue,
        gold: finalGold
      });
      addLog('System Protocol: Penalty Zone successfully survived. Survival bonus dispatched: Gold +80, Fatigue reduced to 30.', 'alert');
    } else {
      // Caught!
      const penaltyCost = Math.min(gold, 40);
      const clearedFatigue = 95;

      onUpdateState({
        penaltyActive: false,
        fatigue: clearedFatigue,
        gold: gold - penaltyCost
      });
      addLog(`CRITICAL: You were engulfed by desert centipedes! Reclaiming Gold penalty: -${penaltyCost} Gold. Fatigue maximum remains.`, 'alert');
    }
  };

  return (
    <div className="bg-[#050A0F]/60 backdrop-blur-md rounded-xl p-6 border border-sky-500/20 glow-border h-full flex flex-col justify-between shadow-[0_0_30px_rgba(14,165,233,0.05)]">
      <div>
        <div className="flex justify-between items-center mb-5 border-b border-sky-900/30 pb-3">
          <h2 className="text-xl font-black font-display uppercase tracking-widest text-[#E0F2FE] flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-sky-400" /> Active Quests
          </h2>
          <div className="flex gap-2">
            <button
              onClick={resetDailyTracker}
              className="text-[10px] font-mono bg-sky-950 border border-sky-500/25 hover:border-sky-450 px-2 py-1 rounded text-sky-300 hover:text-white transition-colors cursor-pointer"
              title="Reset Daily Physical Goals to 0"
            >
              Reset Physicals
            </button>
            <button
              onClick={triggerPenaltySurvival}
              title="Risk everything inside the sand-storm penalty runner"
              className="text-[10px] font-mono bg-orange-500/15 border border-orange-500/40 text-orange-400 hover:bg-orange-500 hover:text-slate-950 transition-colors px-2 py-1 rounded font-bold cursor-pointer"
            >
              Simulate Penalty
            </button>
          </div>
        </div>

        {/* PENALTY COMPONENT ACTIVE IF SO */}
        <AnimatePresence>
          {penaltyActive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#050A0F]/95 border border-orange-500/45 rounded-lg p-5 mb-6 z-20 shadow-[0_0_35px_rgba(249,115,22,0.15)] relative scanline-bg"
            >
              <div className="flex items-center gap-3 text-orange-500 mb-3 animate-pulse">
                <ShieldAlert className="w-6 h-6 text-orange-500" />
                <h3 className="text-md font-black font-display tracking-widest uppercase text-orange-400">[PENALTY ZONE ENGAGED]</h3>
              </div>
              <p className="text-xs text-orange-200 font-mono mb-4 leading-relaxed">
                E-Rank gate closed. Toxic Giant Centipedes are approaching fast from all vectors. Avoid getting cornered before the time expires!
              </p>

              {/* Progress visualizer */}
              <div className="mb-4 bg-orange-950/20 p-3 rounded border border-orange-500/20">
                <div className="flex justify-between text-xs font-mono mb-1 text-orange-400">
                  <span>CENTIPEDE PROXIMITY</span>
                  <span className="font-bold">{Math.round(centipedeProgress)}% CLOSE</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-3 border border-orange-900/30 overflow-hidden relative">
                  <div
                    className="absolute bg-gradient-to-r from-orange-600 to-orange-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${centipedeProgress}%` }}
                  />
                  {/* Runner indicator */}
                  <span className="absolute right-3.5 top-0 text-[8px] font-bold text-slate-100 uppercase animate-pulse">Player Zone</span>
                </div>
              </div>

              {/* Survival Time indicator */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-sky-950/20 p-2.5 rounded border border-sky-500/10 text-center">
                  <p className="text-[9px] font-mono text-slate-500 uppercase">Evasion Period</p>
                  <p className="text-xl font-bold font-display text-orange-450 flex items-center justify-center gap-1">
                    <Timer className="w-4 h-4 text-orange-400 inline" /> {survivalSecs}s
                  </p>
                </div>
                <div className="bg-sky-950/20 p-2.5 rounded border border-sky-500/10 text-center">
                  <p className="text-[9px] font-mono text-slate-500 uppercase">Sprints Logged</p>
                  <p className="text-xl font-bold font-display text-sky-450">{panickedCentipedeCount} Tap</p>
                </div>
              </div>

              {/* Survival Console Log */}
              <div className="bg-slate-950/80 p-2 text-[10px] font-mono text-orange-400 rounded h-20 overflow-y-auto mb-4 border border-orange-950/50 leading-relaxed">
                {penaltyLog.map((logLine, i) => (
                  <p key={i}>&gt; {logLine}</p>
                ))}
              </div>

              {/* SPRINT BUTTON */}
              <button
                onClick={handleSprintClick}
                className="w-full py-3.5 text-xs font-black font-display tracking-widest bg-orange-500 text-black border border-orange-400 hover:bg-orange-400 transition-all rounded flex items-center justify-center gap-2 cursor-pointer animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.2)]"
              >
                <Play className="w-4 h-4 inline-block fill-black" /> SPRINT / DODGE ATTACK!
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Daily Physical Training List */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center text-xs uppercase tracking-[0.2em] text-sky-400 font-mono mb-2">
            <span>Core Physical Training</span>
            <span className="text-sky-500">Preparation to Become Strong</span>
          </div>

          <div className="grid gap-2.5">
            {dailyQuests.map((quest) => (
              <div
                key={quest.id}
                className={`p-3.5 rounded bg-sky-950/10 border ${
                  quest.completed 
                    ? 'border-sky-500/20 bg-sky-500/5' 
                    : 'border-sky-500/10'
                } transition-all`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <button 
                      onClick={() => !quest.completed && incrementProgress(quest.id, 10)}
                      className={`text-sky-400 hover:text-sky-300 transition-colors cursor-pointer ${quest.completed ? 'pointer-events-none' : ''}`}
                    >
                      {quest.completed ? (
                        <CheckSquare className="w-5 h-5 text-sky-400" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-500 hover:text-sky-400" />
                      )}
                    </button>
                    <div>
                      <p className={`text-xs font-bold font-display uppercase tracking-wide ${quest.completed ? 'text-sky-500/40 line-through' : 'text-slate-100'}`}>
                        {quest.title}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 max-w-sm md:max-w-md leading-relaxed">{quest.description}</p>
                    </div>
                  </div>

                  {/* Increment buttons */}
                  {!quest.completed && (
                    <div className="flex gap-1">
                      {quest.unit === 'reps' ? (
                        <>
                          <button
                            onClick={() => incrementProgress(quest.id, 10)}
                            className="text-[10px] font-mono bg-sky-550/10 hover:bg-sky-500/20 text-sky-300 border border-sky-550/20 px-2 py-0.5 rounded cursor-pointer"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => incrementProgress(quest.id, 25)}
                            className="text-[10px] font-mono bg-sky-500/10 hover:bg-sky-500/25 text-sky-300 border border-sky-500/20 px-2 py-0.5 rounded cursor-pointer"
                          >
                            +25
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => incrementProgress(quest.id, 1)}
                            className="text-[10px] font-mono bg-sky-550/10 hover:bg-sky-500/20 text-sky-300 border border-sky-550/20 px-2 py-0.5 rounded cursor-pointer"
                          >
                            +1 km
                          </button>
                          <button
                            onClick={() => incrementProgress(quest.id, 5)}
                            className="text-[10px] font-mono bg-sky-500/10 hover:bg-sky-500/25 text-sky-300 border border-sky-500/20 px-2 py-0.5 rounded cursor-pointer"
                          >
                            +5 km
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mt-2.5">
                  <div className="flex justify-between items-center text-[10px] font-mono text-sky-500">
                    <span>PROGRESS GAUGE</span>
                    <span>
                      {quest.currentValue} / {quest.targetValue} {quest.unit}
                    </span>
                  </div>
                  <div className="w-full bg-sky-950/40 rounded-full h-1.5 overflow-hidden mt-1.5 border border-sky-500/10 shadow-inner">
                    <div
                      className={`h-full rounded-full ${quest.completed ? 'bg-sky-400' : 'bg-sky-600'}`}
                      style={{ width: `${(quest.currentValue / quest.targetValue) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Core Reward box if completed */}
          {allDailiesCompleted && (
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#050A0F]/90 border border-sky-500/30 p-5 rounded text-center shadow-lg relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-1 bg-sky-500/10 rounded-bl border-b border-l border-sky-500/25">
                <Gift className="w-4 h-4 text-sky-400 animate-bounce" />
              </div>
              <h4 className="text-xs font-black font-display uppercase tracking-widest text-white flex items-center justify-center gap-1.5">
                <Award className="w-4 h-4 text-sky-400" /> Daily Loot Claim Available
              </h4>
              <p className="text-[11px] text-sky-300 font-mono mt-1 mb-3 bg-sky-950/20 p-2 border border-sky-500/10 rounded">
                All training parameters met. Dispatched: 1x Elixir, +150 XP, Full fatigue cleanse!
              </p>
              <button
                onClick={handleClaimLootbox}
                className="w-full py-2 bg-gradient-to-r from-sky-600 via-sky-400 to-white text-[#050A0F] font-black font-display text-xs uppercase tracking-widest rounded shadow-sm hover:brightness-110 active:scale-98 transition-all cursor-pointer"
              >
                Accept Selection Gift
              </button>
            </motion.div>
          )}
        </div>

        {/* 2. Custom Hunters Quests */}
        <div className="space-y-3 mb-6">
          <div className="text-xs uppercase tracking-[0.15em] text-sky-400 font-mono border-b border-sky-900/30 pb-1.5 flex justify-between items-center">
            <span>Personal & AI Urgent Objectives</span>
            <span className="text-[10px] text-sky-500/70 font-sans">({customQuests.length} custom active)</span>
          </div>

          {customQuests.length === 0 ? (
            <p className="text-xs text-sky-500/60 font-mono text-center p-4 bg-sky-950/10 rounded border border-sky-500/10 italic">
              No personal or AI urgent objectives registered. Add them to track customized real-world goals.
            </p>
          ) : (
            <div className="grid gap-2">
              {customQuests.map((quest) => (
                <div
                  key={quest.id}
                  className={`p-3.5 rounded bg-sky-950/10 border ${
                    quest.completed ? 'border-sky-500/20 bg-sky-500/5' : 'border-sky-500/10'
                  } flex justify-between items-start gap-4 transition-all`}
                >
                  <div className="flex-1">
                    <p className={`text-xs font-bold font-display uppercase ${quest.completed ? 'text-sky-500/30 line-through' : 'text-slate-100'}`}>
                      {quest.title}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{quest.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-sky-400/80 font-mono">
                      <span>REWARDS: <span className="text-orange-400 font-bold">+{quest.goldReward}G</span> / <span className="text-sky-300">+{quest.xpReward}XP</span></span>
                      <span>•</span>
                      <span>GOAL: {quest.currentValue}/{quest.targetValue} {quest.unit}</span>
                    </div>

                    {/* Simple numeric slider/input */}
                    {!quest.completed && (
                      <div className="flex gap-2 items-center mt-2.5">
                        <button
                          onClick={() => incrementProgress(quest.id, 1)}
                          className="bg-sky-500/10 hover:bg-sky-500/20 border border-sky-550/20 text-[10px] text-sky-300 font-bold px-2.5 py-1 rounded cursor-pointer font-mono"
                        >
                          +1 Completed
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => deleteQuest(quest.id)}
                    className="text-slate-600 hover:text-orange-500 transition-colors p-1 rounded hover:bg-sky-950/30 cursor-pointer"
                    title="Abandon Quest"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Adding Quests - Interactive Panel */}
      <div className="space-y-4 border-t border-sky-900/30 pt-5">
        
        {/* A. System AI Urgent Generator */}
        <div className="bg-sky-950/15 p-4 rounded border border-sky-500/15 shadow-sm">
          <label className="text-[11px] font-black font-mono tracking-wider uppercase text-sky-400 flex items-center gap-1 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" /> AI [Urgent Quest] Dispenser
          </label>
          <p className="text-[10px] text-slate-450 font-mono mb-3">
            Type a real-life productivity goal (e.g. "Draft thesis proposal", "Drink water") to receive a gamified quest.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="E.g., Complete computer science exam prep..."
              className="flex-1 bg-slate-950 border border-sky-500/20 rounded px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
            <button
              onClick={handleAIGenerateQuest}
              disabled={isLoadingAI || !goalInput.trim()}
              className="text-xs glow-btn px-4 py-2 font-black uppercase rounded disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {isLoadingAI ? 'Dispatching...' : 'AI Generate'}
            </button>
          </div>
          {aiError && <p className="text-[10px] text-orange-500 font-mono mt-1.5">{aiError}</p>}
        </div>

        {/* B. Manual Personal Goal Add */}
        <form onSubmit={handleAddCustomQuest} className="bg-[#050A0F]/50 p-4 rounded border border-sky-500/10 grid grid-cols-6 gap-3 shadow-inner">
          <div className="col-span-6 border-b border-sky-900/20 pb-1.5 mb-1">
            <p className="text-[10px] text-sky-450 font-bold uppercase font-mono tracking-widest">Add Manual Training Parameter</p>
          </div>
          <div className="col-span-3">
            <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Quest Title</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="E.g., Drink water glasses..."
              className="w-full bg-slate-950 border border-sky-500/20 rounded p-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              required
            />
          </div>
          <div className="col-span-1.5">
            <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Target</label>
            <input
              type="number"
              value={customTarget}
              onChange={(e) => setCustomTarget(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-sky-500/20 rounded p-1.5 text-xs text-slate-200 text-center focus:outline-none"
              min={1}
            />
          </div>
          <div className="col-span-1.5">
            <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Unit</label>
            <input
              type="text"
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
              placeholder="e.g. times"
              className="w-full bg-slate-950 border border-sky-500/20 rounded p-1.5 text-xs text-slate-200 text-center focus:outline-none"
              required
            />
          </div>
          <div className="col-span-6">
            <input
              type="text"
              value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value)}
              placeholder="Provide a small description (optional)..."
              className="w-full bg-slate-950 border border-sky-500/10 rounded p-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div className="col-span-6 text-right">
            <button
              type="submit"
              className="w-full text-xs font-mono font-bold bg-sky-950/40 border border-sky-500/30 hover:bg-sky-500 hover:text-[#050A0F] px-4 py-2 rounded cursor-pointer leading-none text-sky-300 transition-all"
            >
              Register Personal Objective
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
