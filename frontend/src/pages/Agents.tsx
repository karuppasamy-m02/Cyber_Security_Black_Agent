import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  Skull,
  KeyRound,
  Zap,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { DualAgentDeck } from '../components/agents/DualAgentDeck';
import { api } from '../services/api';

export const Agents: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await api.get<any>('/agents/status');
      setStatus(res);
    } catch (err) {
      console.error('Failed to load agents status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const isDarkActive = status?.dark_agent?.is_active ?? false;
  const lockedCount = status?.dark_agent?.active_locked_count ?? 0;
  const attacksBlocked = status?.black_agent?.total_blocked ?? 0;

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2B2B2B]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className={`w-3 h-3 rounded-full ${isDarkActive ? 'bg-purple-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
            <h1 className="text-xl font-bold tracking-tight text-[#F5F5F2] font-mono uppercase">
              Autonomous Agents Operations Center
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#171717] border border-[#2B2B2B] text-purple-400 font-semibold">
              BLACK & DARK AGENTS
            </span>
          </div>
          <p className="text-xs text-[#A8A8A3] mt-1 font-mono">
            Two distinct autonomous agent tiers: Section 1 protects and monitors all perimeter details; Section 2 deceptive honey-net traps & locks attacker devices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/attacks"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg bg-[#1A0A0A] hover:bg-[#2A0F0F] border border-red-900/60 text-red-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5 text-red-400" />
            <span>Open Attacker Mobile View</span>
            <ExternalLink className="w-3 h-3 ml-0.5 text-red-400" />
          </a>
        </div>
      </div>

      {/* 2. Top Executive Metric Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        {/* Metric 1 */}
        <div className="p-3.5 rounded-xl bg-[#111111] border border-[#2B2B2B] space-y-1">
          <div className="text-[11px] text-[#A8A8A3] flex items-center justify-between">
            <span>Agent 1 (Black Agent)</span>
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className={`text-base font-bold ${isDarkActive ? 'text-amber-400' : 'text-emerald-400'}`}>
            {isDarkActive ? 'STANDBY (BYPASS)' : 'ACTIVE SHIELD'}
          </div>
          <div className="text-[10px] text-[#777]">
            {isDarkActive ? 'Honey Decoy Ingress Open' : '9/9 Ports Armor Enforced'}
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-3.5 rounded-xl bg-[#111111] border border-[#2B2B2B] space-y-1">
          <div className="text-[11px] text-[#A8A8A3] flex items-center justify-between">
            <span>Agent 2 (Dark Agent)</span>
            <Skull className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className={`text-base font-bold ${isDarkActive ? 'text-purple-300' : 'text-[#888]'}`}>
            {isDarkActive ? 'ARMED & CONTROLLING' : 'OFFLINE (STANDBY)'}
          </div>
          <div className="text-[10px] text-purple-400/80">
            Security Code: <span className="font-bold text-purple-300">Mani02</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-3.5 rounded-xl bg-[#111111] border border-[#2B2B2B] space-y-1">
          <div className="text-[11px] text-[#A8A8A3] flex items-center justify-between">
            <span>Locked Attacker Devices</span>
            <Smartphone className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="text-base font-bold text-red-400">
            {lockedCount} Device{lockedCount === 1 ? '' : 's'} Locked
          </div>
          <div className="text-[10px] text-[#777]">
            Controlled via Dark Takeover
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-3.5 rounded-xl bg-[#111111] border border-[#2B2B2B] space-y-1">
          <div className="text-[11px] text-[#A8A8A3] flex items-center justify-between">
            <span>Perimeter Armor</span>
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-base font-bold text-[#F5F5F2]">
            9 / 9 Ports
          </div>
          <div className="text-[10px] text-emerald-400">
            Zero-Trust Gateway Guard
          </div>
        </div>
      </div>

      {/* 3. The Autonomous Dual Agent Deck (Section 1 Black Agent + Section 2 Dark Agent) */}
      <DualAgentDeck />
    </div>
  );
};
export default Agents;
