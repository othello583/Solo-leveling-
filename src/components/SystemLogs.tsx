import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, ShieldCheck, Zap, AlertOctagon, HelpCircle, Flame, 
  Sparkles, ShieldAlert, Award, Ghost, CornerDownLeft 
} from 'lucide-react';
import { PlayerState, SystemLog } from '../types';

interface SystemLogsProps {
  playerState: PlayerState;
  onUpdateState: (newState: Partial<PlayerState>) => void;
  addLog: (message: string, type: 'alert' | 'level' | 'quest' | 'shop' | 'dungeon' | 'info') => void;
}

export const SystemLogs: React.FC<SystemLogsProps> = ({
  playerState,
  onUpdateState,
  addLog
}) => {
  const { logs, className } = playerState;
  const [shadowQuery, setShadowQuery] = useState('');
  const [summonedShadow, setSummonedShadow] = useState('');
  const [ariseResponse, setAriseResponse] = useState('');
  const [isSummoning, setIsSummoning] = useState(false);

  // Filter color scheme for logs
  const logStyles: Record<string, string> = {
    alert: 'text-red-400 bg-red-950/20 border-red-900/35',
    level: 'text-sky-400 bg-sky-950/30 border-sky-500/30 font-bold shadow-[0_0_15px_rgba(14,165,233,0.05)]',
    quest: 'text-indigo-400 bg-indigo-950/20 border-indigo-900/35',
    shop: 'text-sky-300 bg-sky-950/15 border-sky-500/10',
    dungeon: 'text-sky-400 bg-sky-950/20 border-sky-500/20',
    info: 'text-slate-300 bg-[#050A0F]/50 border-sky-500/10'
  };

  // Shadow Arise action
  const handleAriseSummon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shadowQuery.trim()) return;

    setIsSummoning(true);
    setAriseResponse('');
    setSummonedShadow(shadowQuery);

    try {
      const response = await fetch('/api/system/arise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shadowName: shadowQuery })
      });

      if (!response.ok) {
        throw new Error('Summon command deflected.');
      }

      const data = await response.json();
      if (data.success && data.response) {
        setAriseResponse(data.response);
        addLog(`Monarch Command enacted: "ARISE" summoned your Shadow Soldier [${shadowQuery}].`, 'alert');
        setShadowQuery('');
      } else {
        throw new Error(data.error || 'Syntax deflection.');
      }
    } catch (err: any) {
      console.error(err);
      setAriseResponse(`[The System blocks summoning]: Stature or Class parameters of the Monarch limit this shadow adaptation.`);
    } finally {
      setIsSummoning(false);
    }
  };

  // Quick select preset shadows
  const summonPreset = (name: string) => {
    setShadowQuery(name);
  };

  return (
    <div className="bg-[#050A0F]/60 backdrop-blur-md rounded-xl p-6 border border-sky-500/20 glow-border h-full flex flex-col justify-between gap-6 shadow-[0_0_30px_rgba(14,165,233,0.05)]">
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-4 border-b border-sky-900/35 pb-3">
          <h2 className="text-xl font-black font-display uppercase tracking-widest text-[#E0F2FE] flex items-center gap-2">
            <Terminal className="w-5 h-5 text-sky-400" /> System Logs Console
          </h2>
          <button
            onClick={() => {
              onUpdateState({
                logs: [{
                  id: `log_cleared_${Date.now()}`,
                  message: 'System audit logs cleared. Mainframe online.',
                  timestamp: new Date().toLocaleTimeString(),
                  type: 'info'
                }]
              });
            }}
            className="text-[9px] font-mono hover:underline text-sky-500/60 hover:text-sky-400 cursor-pointer"
          >
            Clear Console
          </button>
        </div>

        {/* Real logs stream */}
        <div className="flex-1 overflow-y-auto max-h-[18rem] md:max-h-[22rem] pr-1 space-y-2.5">
          {logs.slice().reverse().map((log) => (
            <div
              key={log.id}
              className={`p-2.5 rounded border text-xs font-mono leading-relaxed transition-all ${
                logStyles[log.type] || logStyles.info
              }`}
            >
              <div className="flex justify-between text-[9px] text-sky-500/50 mb-1">
                <span>[{log.type.toUpperCase()}]</span>
                <span>{log.timestamp}</span>
              </div>
              <p>{log.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Active Shadow Arise Summon Command Panel */}
      <div className="border-t border-sky-900/30 pt-5 space-y-3">
        <div className="flex items-center gap-2 text-indigo-400">
          <Ghost className="w-5 h-5 text-indigo-400 animate-pulse" />
          <h3 className="text-xs font-black font-display uppercase tracking-widest leading-none text-indigo-300">
            Monarch "ARISE" Summoning Command
          </h3>
        </div>
        <p className="text-[10px] text-slate-450 font-mono leading-relaxed">
          Type or select a shadow warrior from deceased monsters on the battlefield (e.g. <b>Igris</b>, <b>Beru</b>, <b>Tusk</b>, <b>Iron</b>, or custom creations) to draft them into your shadow army.
        </p>

        {/* Preset quick buttons */}
        <div className="flex flex-wrap gap-1.5">
          {['Igris', 'Beru', 'Tusk', 'Iron'].map((name) => (
            <button
              key={name}
              onClick={() => summonPreset(name)}
              className="text-[10px] font-mono bg-sky-950 hover:bg-sky-500/10 border border-sky-500/20 text-sky-300 hover:text-white px-2 py-1 rounded transition-colors cursor-pointer"
            >
              {name}
            </button>
          ))}
        </div>

        <form onSubmit={handleAriseSummon} className="relative font-mono">
          <input
            type="text"
            value={shadowQuery}
            onChange={(e) => setShadowQuery(e.target.value)}
            placeholder="Type Shadow Soldier name to awaken..."
            className="w-full bg-slate-950 border border-indigo-500/30 rounded px-3 py-2.5 pr-28 text-xs text-indigo-200 focus:outline-none focus:border-indigo-500 font-mono"
          />
          <button
            type="submit"
            disabled={isSummoning || !shadowQuery.trim()}
            className="absolute right-1 top-1 py-1.5 px-3 bg-indigo-900/30 hover:bg-indigo-850 border border-indigo-500/50 rounded text-[10px] font-bold font-display uppercase tracking-widest text-indigo-300 disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1"
          >
            {isSummoning ? 'ARISE...' : 'ARISE Command'}
          </button>
        </form>

        {/* Display live shadow AI comment popup */}
        <AnimatePresence>
          {summonedShadow && ariseResponse && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="bg-indigo-950/15 border border-indigo-500/20 p-3 rounded flex items-start gap-2.5 scanline-bg relative shadow-sm"
            >
              <div className="text-[18px] leading-none animate-pulse flex-shrink-0">👾</div>
              <div>
                <p className="text-[9px] font-black font-mono uppercase tracking-widest text-indigo-400 border-b border-indigo-950/60 pb-1 mb-1.5 flex items-center justify-between">
                  <span>[SHADOW SUMMON SUCCESSIONED: {summonedShadow}]</span>
                  <span className="text-slate-500 lowercase font-normal italic">reaches alignment</span>
                </p>
                <p className="text-xs leading-relaxed font-mono text-indigo-100 whitespace-pre-line italic">
                  {ariseResponse}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
