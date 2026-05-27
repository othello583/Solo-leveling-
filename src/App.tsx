import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dumbbell, Compass, ShoppingBag, Terminal, User, Sparkles, 
  ShieldAlert, Award, Ghost, Volume2, RefreshCw, EyeOff 
} from 'lucide-react';
import { PlayerState, StatType, SystemLog } from './types';
import { INITIAL_PLAYER_STATE, SHOP_ITEMS } from './data';
import { StatusCard } from './components/StatusCard';
import { QuestTracker } from './components/QuestTracker';
import { DungeonGate } from './components/DungeonGate';
import { SystemShop } from './components/SystemShop';
import { SystemLogs } from './components/SystemLogs';

export default function App() {
  const [playerState, setPlayerState] = useState<PlayerState>(INITIAL_PLAYER_STATE);
  const [activeTab, setActiveTab] = useState<'status' | 'quests' | 'dungeons' | 'shop' | 'logs'>('status');

  // AI evaluation responses loaded
  const [aiEvaluation, setAiEvaluation] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Load from local storage
  useEffect(() => {
    try {
      const persisted = localStorage.getItem('solo_leveling_system_state_v1');
      if (persisted) {
        const loadedState = JSON.parse(persisted);
        // Guarantee array structures exist in case of structure evolution
        if (loadedState && typeof loadedState === 'object') {
          setPlayerState({
            ...INITIAL_PLAYER_STATE,
            ...loadedState,
            // Deep merge safety
            stats: { ...INITIAL_PLAYER_STATE.stats, ...loadedState.stats },
            quests: Array.isArray(loadedState.quests) ? loadedState.quests : INITIAL_PLAYER_STATE.quests,
            inventory: Array.isArray(loadedState.inventory) ? loadedState.inventory : INITIAL_PLAYER_STATE.inventory,
            logs: Array.isArray(loadedState.logs) ? loadedState.logs : INITIAL_PLAYER_STATE.logs,
          });
        }
      }
    } catch (e) {
      console.error('Error loading state:', e);
    }
  }, []);

  // Save to local storage on any state change
  const handleUpdateState = (newState: Partial<PlayerState>) => {
    setPlayerState((prevState) => {
      const updated = { ...prevState, ...newState };
      // Save it
      try {
        localStorage.setItem('solo_leveling_system_state_v1', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed storing state:', e);
      }
      return updated;
    });
  };

  // Safe utility to push console logs
  const addLog = (
    message: string, 
    type: 'alert' | 'level' | 'quest' | 'shop' | 'dungeon' | 'info'
  ) => {
    const newLog: SystemLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      message,
      timestamp: new Date().toLocaleTimeString(),
      type
    };

    setPlayerState((prev) => {
      const updatedLogs = [...prev.logs, newLog].slice(-50); // Keep last 50 logs max
      const updated = { ...prev, logs: updatedLogs };
      localStorage.setItem('solo_leveling_system_state_v1', JSON.stringify(updated));
      return updated;
    });
  };

  // Attribute allocation handler
  const handleAllocateStat = (stat: StatType) => {
    if (playerState.statPoints <= 0) return;

    const nextStats = {
      ...playerState.stats,
      [stat]: playerState.stats[stat] + 1
    };

    const nextState = {
      ...playerState,
      statPoints: playerState.statPoints - 1,
      stats: nextStats
    };

    handleUpdateState(nextState);
    addLog(`System Modification: Permanently increased Attribute [${stat.toUpperCase()}] by +1 point.`, 'level');
    
    // Levelup safety run
    triggerLevelUpCheck(nextState);
  };

  // Dynamic stat checks & Level progression trigger
  const triggerLevelUpCheck = (state: PlayerState) => {
    let tempXp = state.xp;
    let tempLevel = state.level;
    let tempMaxXp = state.maxXp;
    let tempStatPoints = state.statPoints;
    let leveledUp = false;

    // Support sequential massive levels drops
    while (tempXp >= tempMaxXp) {
      tempXp -= tempMaxXp;
      tempLevel += 1;
      tempMaxXp = tempLevel * 100;
      tempStatPoints += 5; // +5 points to spend per level
      leveledUp = true;
    }

    if (leveledUp) {
      // Determine if a class change is triggered
      let nextClass = state.className;
      if (tempLevel >= 40 && state.className !== 'Shadow Monarch (Supreme Master)') {
        nextClass = 'Shadow Monarch (Supreme Master)';
      } else if (tempLevel >= 25 && state.className === 'E-Rank Hunter (Starter)' || state.className === 'Necromancer / Spellcaster') {
        nextClass = 'Agile Assassin / Shadow Striker';
      } else if (tempLevel >= 15 && state.className === 'E-Rank Hunter (Starter)') {
        nextClass = 'Necromancer / Spellcaster';
      }

      const updatedLogs = [...state.logs];
      updatedLogs.push({
        id: `level_up_alert_${Date.now()}`,
        message: `🚨 ALERT: [System Level Up!] Your structural boundaries have expanded. Reached Level ${tempLevel}. Granted +5 attribute points.`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'level'
      });

      if (nextClass !== state.className) {
        updatedLogs.push({
          id: `class_adv_${Date.now()}`,
          message: `👑 ADVANCEMENT PROTOCOL SECURED: Transferred class parameters to: ${nextClass}. Specialized shadows parameters altered.`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'level'
        });
      }

      const finalState = {
        ...state,
        level: tempLevel,
        xp: tempXp,
        maxXp: tempMaxXp,
        statPoints: tempStatPoints,
        className: nextClass,
        logs: updatedLogs
      };

      // Set immediately
      setPlayerState(finalState);
      localStorage.setItem('solo_leveling_system_state_v1', JSON.stringify(finalState));
    }
  };

  // Ingest player statistics, ask System AI for chilling custom progress reviews
  const handleTriggerEvaluation = async () => {
    setIsLoadingAI(true);
    setAiEvaluation('');
    try {
      const response = await fetch('/api/system/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playerState.name,
          level: playerState.level,
          title: playerState.title,
          className: playerState.className,
          stats: playerState.stats,
          fatigue: playerState.fatigue
        })
      });

      if (!response.ok) {
        throw new Error('System evaluation signal was deflected by the mainframe.');
      }

      const data = await response.json();
      if (data.success && data.report) {
        setAiEvaluation(data.report);
        addLog(`System evaluation complete. Progress recommendations delivered.`, 'info');
      } else {
        throw new Error(data.error || 'Syntax parsing issue in report delivery.');
      }
    } catch (e: any) {
      console.error(e);
      setAiEvaluation(`[The System encountered an error]: ${e.message || 'Mainframe disconnect. Please double-check the GEMINI_API_KEY initialization.'}`);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Reset entire account data (Warning option)
  const handleHardReset = () => {
    if (window.confirm('WARNING: Are you certain you wish to purge all level growth parameters? This acts as a complete systemic wipeout.')) {
      localStorage.removeItem('solo_leveling_system_state_v1');
      setPlayerState(INITIAL_PLAYER_STATE);
      setAiEvaluation('');
      addLog('Account purged. Repopulating index parameters... All stats set to base 10.', 'alert');
    }
  };

  // Tabbing helper
  const tabs = [
    { id: 'status', label: 'Hunter Status', icon: <User className="w-4 h-4" /> },
    { id: 'quests', label: 'Daily Training & Quests', icon: <Dumbbell className="w-4 h-4" /> },
    { id: 'dungeons', label: 'Instant Gate Dungeons', icon: <Compass className="w-4 h-4" /> },
    { id: 'shop', label: 'Item Shop & Vault', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'logs', label: 'Summons & Logs', icon: <Terminal className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen scanline-bg relative text-slate-100 flex flex-col justify-between py-6 px-4 md:px-8 max-w-7xl mx-auto space-y-6">
      
      {/* 1. Header Holograph Visualizer */}
      <header className="border-b border-sky-500/20 pb-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2.5">
            <span className="h-2 w-2 rounded-full bg-sky-400 animate-ping" />
            <h1 className="text-2xl md:text-3xl font-black tracking-widest font-display text-[#E0F2FE] uppercase holo-glow">
              Solo Leveling System
            </h1>
          </div>
          <p className="text-[10px] text-sky-550/70 font-mono tracking-widest uppercase mt-1">
            CORE PROGRAM FOR ULTIMATE HUNTER GROWTH • DIRECTING GAMIFICATION METRICS
          </p>
        </div>

        {/* Global stat trackers */}
        <div className="flex flex-wrap gap-3 items-center justify-center">
          <div className="bg-sky-950/20 p-2 py-1.5 rounded border border-sky-500/15 text-center flex items-center gap-3">
            <div>
              <p className="text-[8px] font-mono text-slate-505 uppercase">HOLOGRAPH STATUS</p>
              <p className="text-xs font-mono font-bold text-emerald-450 uppercase tracking-wider">● SYSTEM ONLINED</p>
            </div>
          </div>

          <div className="bg-sky-950/20 p-2 py-1.5 rounded border border-sky-500/15 text-center flex items-center gap-3">
            <div>
              <p className="text-[8px] font-mono text-slate-505 uppercase">HUNTER WALLET</p>
              <p className="text-xs font-mono font-bold text-amber-400">🪙 {playerState.gold} GOLD</p>
            </div>
          </div>

          <button
            onClick={handleHardReset}
            className="text-[9px] font-mono uppercase bg-red-500/10 hover:bg-red-500 border border-red-500/30 text-red-400 hover:text-slate-950 hover:font-bold px-3 py-1.5 rounded transition-all cursor-pointer"
            title="System Purge / Fresh Restart"
          >
            System reset
          </button>
        </div>
      </header>

      {/* 2. Urgent System Bulletin / Warning Flashers */}
      <section className="bg-red-500/5 p-3.5 rounded border border-red-500/20 text-center relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-3 shadow-[0_0_20px_rgba(239,68,68,0.03)]">
        <div className="absolute top-0 bottom-0 left-0 w-1 bg-red-500 animate-pulse" />
        <div className="flex items-center gap-2 text-red-450">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 animate-bounce text-red-500" />
          <p className="text-xs font-mono tracking-wider font-bold uppercase text-left leading-relaxed">
            [DAILY QUEST DIRECTIVE PROTOCOL ACTIVATED]: COMPLETE YOUR ASSIGNED TARGET PARAMETERS BEFORE MIDNIGHT TO AVOID PENALTY ROUTINE TRIGGERING.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-red-500/10 text-red-420 border border-red-500/15 px-3 py-1 font-mono rounded font-black animate-pulse">
            EXHAUSTION: {playerState.fatigue} / 100
          </span>
        </div>
      </section>

      {/* 3. Main Dashboard Interactive Grid Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Tab selection list for Mobile displays */}
        <div className="lg:hidden col-span-1 border border-sky-500/10 bg-[#050A0F]/60 p-2 rounded flex overflow-x-auto gap-2 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-3.5 rounded text-xs font-black font-display whitespace-nowrap uppercase cursor-pointer transition-all ${
                activeTab === tab.id
                  ? 'bg-sky-500 text-slate-950 shadow-md'
                  : 'text-[#E0F2FE]/60 bg-sky-950/20 hover:text-slate-100'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Desktop Sidebar (Left Column - Status Card is permanently displayed on desktop for maximum immersion) */}
        <div className="hidden lg:block lg:col-span-4 h-full">
          <StatusCard
            playerState={playerState}
            onAllocateStat={handleAllocateStat}
            onUpdateState={handleUpdateState}
            addLog={addLog}
            isLoadingAI={isLoadingAI}
            onTriggerEvaluation={handleTriggerEvaluation}
            aiEvaluation={aiEvaluation}
          />
        </div>

        {/* Tab Selector on Desktop to adjust the Middle panel */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Navigation Tab Selector Bar for Desktop panels only */}
          <div className="hidden lg:flex border border-sky-500/15 bg-[#050A0F]/65 p-1.5 rounded gap-1 justify-between shadow-[0_0_20px_rgba(14,165,233,0.02)]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded text-xs font-black font-display uppercase transition-all tracking-wider cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#E0F2FE]/10 border border-sky-500/35 text-sky-450 shadow-[0_0_15px_rgba(14,165,233,0.04)] font-black'
                    : 'text-slate-400 bg-transparent hover:text-slate-200 font-bold'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Dynamic Content Switching Container */}
          <div className="h-full">
            <AnimatePresence mode="wait">
              {/* STATUS CARD MOBILE FALLBACK SCREEN */}
              {activeTab === 'status' && (
                <motion.div
                  key="status"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="lg:hidden"
                >
                  <StatusCard
                    playerState={playerState}
                    onAllocateStat={handleAllocateStat}
                    onUpdateState={handleUpdateState}
                    addLog={addLog}
                    isLoadingAI={isLoadingAI}
                    onTriggerEvaluation={handleTriggerEvaluation}
                    aiEvaluation={aiEvaluation}
                  />
                </motion.div>
              )}

              {/* QUEST TRACKING PANEL */}
              {activeTab === 'quests' && (
                <motion.div
                  key="quests"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <QuestTracker
                    playerState={playerState}
                    onUpdateState={handleUpdateState}
                    addLog={addLog}
                    triggerLevelUpCheck={triggerLevelUpCheck}
                  />
                </motion.div>
              )}

              {/* DUNGEONS Breaching PANEL */}
              {activeTab === 'dungeons' && (
                <motion.div
                  key="dungeons"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <DungeonGate
                    playerState={playerState}
                    onUpdateState={handleUpdateState}
                    addLog={addLog}
                    triggerLevelUpCheck={triggerLevelUpCheck}
                  />
                </motion.div>
              )}

              {/* SHOP & INVENTORY PANEL */}
              {activeTab === 'shop' && (
                <motion.div
                  key="shop"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <SystemShop
                    playerState={playerState}
                    onUpdateState={handleUpdateState}
                    addLog={addLog}
                    triggerLevelUpCheck={triggerLevelUpCheck}
                  />
                </motion.div>
              )}

              {/* LIVE CONSOLE SYSTEMS & SUMMONS PANEL */}
              {activeTab === 'logs' && (
                <motion.div
                  key="logs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <SystemLogs
                    playerState={playerState}
                    onUpdateState={handleUpdateState}
                    addLog={addLog}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </main>

      {/* 4. Footer credits parameters */}
      <footer className="border-t border-sky-900/15 pt-5 text-center text-sky-500/40 text-[9px] font-mono uppercase tracking-widest flex flex-col md:flex-row justify-between gap-3">
        <span>© SYSTEM ADAPTATION CORE v508.41 • ALL RIGHTS REGULATED</span>
        <span>REGISTERED HUNTER CLASS PROTOCOLS • MONARCH AUTHORIZED SECURE ACCESS</span>
      </footer>

    </div>
  );
}
