import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  Zap,
  Crosshair,
  Terminal,
  Activity,
  Lock,
  Eye,
  Radio,
  Server,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Smartphone,
  Laptop
} from 'lucide-react';
import { api } from '../../services/api';

interface ProtectedPort {
  port: number;
  service: string;
  status: string;
  policy: string;
}

interface BlockedEvent {
  id: string;
  timestamp: string;
  target_port: number;
  blocked_ip: string;
  attack_type: string;
  mitre_id: string;
  action: string;
  firewall_rule: string;
}

interface AttackerFootprint {
  id: string;
  timestamp: string;
  attacker_ip: string;
  target_port: number;
  target_asset: string;
  user_agent: string;
  device_type: string;
  attack_vector: string;
  mitre_id: string;
  trace_status: string;
  fingerprint_hash: string;
}

interface CounterStrike {
  id: string;
  timestamp: string;
  target_attacker_ip: string;
  counter_technique: string;
  counter_vector: string;
  payload_injected: string;
  execution_status: string;
  attacker_device: string;
}

export const DualAgentDeck: React.FC = () => {
  const [blackStatus, setBlackStatus] = useState<any>(null);
  const [redStatus, setRedStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [counterStriking, setCounterStriking] = useState(false);
  const [lastStrikeResult, setLastStrikeResult] = useState<any>(null);

  const fetchAgentStatus = async () => {
    try {
      const res = await api.get<any>('/agents/status');
      setBlackStatus(res.black_agent);
      setRedStatus(res.red_agent);
    } catch (err) {
      console.error('Failed to load dual agent status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentStatus();
    const interval = setInterval(fetchAgentStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const triggerCounterStrikeDemo = async () => {
    try {
      setCounterStriking(true);
      const res = await api.post<any>('/agents/red/counter-strike');
      setLastStrikeResult(res);
      fetchAgentStatus();
      setTimeout(() => setLastStrikeResult(null), 6000);
    } catch (err) {
      console.error('Failed to trigger counter-strike demo:', err);
    } finally {
      setCounterStriking(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Deck Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#2B2B2B]">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F5F5F2] font-mono">
            Autonomous Dual-Agent Operations Center
          </h2>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#171717] border border-[#2B2B2B] text-[#A8A8A3]">
            AGENT 01 (SHIELD) + AGENT 02 (DECEPTION & STRIKE)
          </span>
        </div>
        <div className="text-[11px] font-mono text-[#A8A8A3] flex items-center gap-3">
          <span>Continuous Gateway Inspection: ACTIVE</span>
          <span>Zero-Trust Honey-Net: ONLINE</span>
        </div>
      </div>

      {/* Dual Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ============================================================== */}
        {/* AGENT 1: BLACK AGENT (THE AUTONOMOUS SHIELD) */}
        {/* ============================================================== */}
        <div className="bg-[#111111] border border-[#2B2B2B] rounded-xl p-4 flex flex-col justify-between hover:border-[#3E3E3E] transition-all shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#1A1A1A] border border-[#2B2B2B] flex items-center justify-center text-[#F5F5F2]">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#F5F5F2] tracking-wide font-mono">
                      BLACK AGENT
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-semibold">
                      AUTONOMOUS SHIELD
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A8A8A3]">
                    Perimeter Gateway Fortress & Full Port Armor
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl font-bold font-mono text-[#F5F5F2]">
                  {blackStatus?.total_blocked ?? 0}
                </div>
                <div className="text-[10px] font-mono text-[#A8A8A3]">
                  Attacks Neutralized
                </div>
              </div>
            </div>

            {/* Protected Ports Matrix */}
            <div className="mt-3">
              <div className="text-[11px] font-mono text-[#A8A8A3] mb-1.5 flex items-center justify-between">
                <span>Active Protected Ports & Gateways</span>
                <span className="text-emerald-400 font-semibold">9/9 Secured</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
                {(blackStatus?.protected_ports || [
                  { port: 22, service: 'SSH', status: 'SECURED' },
                  { port: 80, service: 'HTTP', status: 'SECURED' },
                  { port: 443, service: 'HTTPS', status: 'SECURED' },
                  { port: 8000, service: 'API Gate', status: 'SECURED' },
                  { port: 5173, service: 'SOC Console', status: 'SECURED' },
                  { port: 3306, service: 'MySQL', status: 'SECURED' },
                  { port: 5432, service: 'PostgreSQL', status: 'SECURED' },
                  { port: 8080, service: 'Proxy', status: 'SECURED' },
                  { port: 53, service: 'DNS Shield', status: 'SECURED' }
                ]).map((p: any) => (
                  <div
                    key={p.port}
                    className="p-1.5 rounded bg-[#171717] border border-[#262626] flex items-center justify-between"
                  >
                    <span className="text-[#F5F5F2] font-semibold">:{p.port}</span>
                    <span className="text-[10px] text-[#A8A8A3]">{p.service}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* Active Firewall & Rule Status */}
            <div className="mt-3 pt-2.5 border-t border-[#222222]">
              <div className="text-[11px] font-mono text-[#A8A8A3] mb-1">
                Recent Gateway Firewall Drops
              </div>
              {blackStatus?.recent_blocks && blackStatus.recent_blocks.length > 0 ? (
                <div className="space-y-1">
                  {blackStatus.recent_blocks.slice(0, 2).map((blk: BlockedEvent) => (
                    <div
                      key={blk.id}
                      className="p-1.5 rounded bg-[#0A0A0A] border border-[#222222] text-[10px] font-mono text-[#A8A8A3] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-red-400 font-bold">[BLOCKED]</span>
                        <span className="text-[#F5F5F2]">{blk.blocked_ip}</span>
                        <span>➔ Port {blk.target_port}</span>
                      </div>
                      <span className="text-[#A8A8A3]">{blk.timestamp}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2 rounded bg-[#0A0A0A] border border-[#222222] text-[11px] font-mono text-[#A8A8A3] text-center">
                  All 9 perimeter gateways and ports actively shielded. Zero breach.
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#222222] flex items-center justify-between text-[11px] font-mono text-[#A8A8A3]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Full Network & Port Lockdown Enforced
            </span>
            <span className="text-emerald-400 font-semibold">DROP_POLICY_100%</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* AGENT 2: RED AGENT (DECEPTION & REVERSE STRIKE) */}
        {/* ============================================================== */}
        <div className="bg-[#111111] border border-[#2B2B2B] rounded-xl p-4 flex flex-col justify-between hover:border-[#3E3E3E] transition-all shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#1A1A1A] border border-[#2B2B2B] flex items-center justify-center text-[#F5F5F2]">
                  <Crosshair className="w-5 h-5 text-red-500 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#F5F5F2] tracking-wide font-mono">
                      RED AGENT
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-800/40 font-semibold">
                      DECEPTION & COUNTER-STRIKE
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A8A8A3]">
                    Honeypot Decoy Trap, Footprint Tracker & Reverse Strike
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl font-bold font-mono text-red-400">
                  {redStatus?.total_counter_strikes ?? 0}
                </div>
                <div className="text-[10px] font-mono text-[#A8A8A3]">
                  Counter-Strikes Fired
                </div>
              </div>
            </div>

            {/* Deception & Trapping Stats */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded bg-[#171717] border border-[#262626]">
                <div className="text-[#A8A8A3] text-[10px]">Deception Traps Sprung</div>
                <div className="text-sm font-bold text-[#F5F5F2] mt-0.5">
                  {redStatus?.total_deceptions ?? 0} Dummy Feeds
                </div>
                <div className="text-[10px] text-amber-400 mt-1">Canary Tokens Active</div>
              </div>
              <div className="p-2 rounded bg-[#171717] border border-[#262626]">
                <div className="text-[#A8A8A3] text-[10px]">Tracked Attacker Footprints</div>
                <div className="text-sm font-bold text-[#F5F5F2] mt-0.5">
                  {redStatus?.recent_footprints?.length ?? 0} Tracked Nodes
                </div>
                <div className="text-[10px] text-red-400 mt-1">Mobile & Desktop Pinned</div>
              </div>
            </div>

            {/* Latest Attacker Footprint Captured */}
            <div className="mt-3 pt-2.5 border-t border-[#222222]">
              <div className="text-[11px] font-mono text-[#A8A8A3] mb-1 flex items-center justify-between">
                <span>Latest Captured Attacker Footprint</span>
                <span className="text-red-400 font-semibold">100% IDENTIFIED</span>
              </div>
              {redStatus?.recent_footprints && redStatus.recent_footprints.length > 0 ? (
                <div className="p-2 rounded bg-[#0A0A0A] border border-[#222222] text-[11px] font-mono space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[#F5F5F2] font-semibold flex items-center gap-1.5">
                      {redStatus.recent_footprints[0].device_type.includes('Mobile') ? (
                        <Smartphone className="w-3.5 h-3.5 text-red-400" />
                      ) : (
                        <Laptop className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      {redStatus.recent_footprints[0].attacker_ip}
                    </span>
                    <span className="text-[10px] text-red-400 bg-red-950/40 px-1.5 py-0.5 rounded border border-red-900/50">
                      {redStatus.recent_footprints[0].fingerprint_hash}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#A8A8A3] truncate">
                    Vector: {redStatus.recent_footprints[0].attack_vector} ({redStatus.recent_footprints[0].mitre_id})
                  </div>
                  <div className="text-[10px] text-emerald-400">
                    ➔ Red Agent fed dummy data payload & dispatched reverse exploit
                  </div>
                </div>
              ) : (
                <div className="p-2 rounded bg-[#0A0A0A] border border-[#222222] text-[11px] font-mono text-[#A8A8A3] text-center">
                  Honeypot armed. Waiting for attacker to fire payload...
                </div>
              )}
            </div>
          </div>

          {/* Trigger Counter Strike Button */}
          <div className="mt-3 pt-2 border-t border-[#222222] flex items-center justify-between">
            <button
              onClick={triggerCounterStrikeDemo}
              disabled={counterStriking}
              className="w-full py-1.5 px-3 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-200 text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-all shadow-subtle"
            >
              <Zap className={`w-3.5 h-3.5 text-red-400 ${counterStriking ? 'animate-bounce' : ''}`} />
              <span>{counterStriking ? 'DISPATCHING REVERSE STRIKE...' : '⚡ TEST RED AGENT COUNTER-STRIKE'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Counter-Strike Notification Toast */}
      {lastStrikeResult && (
        <div className="p-3 rounded-lg bg-red-950/90 border border-red-700 text-[#F5F5F2] font-mono text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-red-400 animate-spin" />
            <div>
              <span className="font-bold text-red-300">RED AGENT COUNTER-STRIKE DEPLOYED: </span>
              <span>Reverse payload dispatched to {lastStrikeResult.counter_strike?.target_attacker_ip}. Dummy data fed.</span>
            </div>
          </div>
          <span className="text-[10px] text-red-300 border border-red-800 px-2 py-0.5 rounded">
            SCREEN_OVERRIDE_ACTIVE
          </span>
        </div>
      )}
    </div>
  );
};
