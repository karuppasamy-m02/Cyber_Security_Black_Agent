import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Server,
  Lock,
  Radio,
  RotateCcw,
  RefreshCw,
  Terminal,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { api } from '../services/api';

interface BlockedEvent {
  id: string;
  timestamp: string;
  target_port: number;
  blocked_ip: string;
  attack_type: string;
  mitre_id: string;
  action: string;
  firewall_rule: string;
  defense_layer?: string;
}

export const BlackAgent: React.FC = () => {
  const [blackStatus, setBlackStatus] = useState<any>(null);
  const [darkStatus, setDarkStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await api.get<any>('/agents/status');
      setBlackStatus(res.black_agent);
      setDarkStatus(res.dark_agent || res.red_agent);
    } catch (err) {
      console.error('Failed to load Black Agent status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleShield = async () => {
    try {
      setActionLoading(true);
      const currentActive = blackStatus?.is_active ?? true;
      await api.post<any>('/agents/black/toggle', { activate: !currentActive });
      await fetchStatus();
    } catch (err) {
      console.error('Failed to toggle Black Agent shield:', err);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const isShieldActive = blackStatus?.is_active ?? true;
  const isDarkActive = darkStatus?.is_active ?? false;
  const isSuppressed = blackStatus?.is_suppressed ?? isDarkActive;
  const totalBlocked = blackStatus?.total_blocked ?? 0;
  const protectedPorts = blackStatus?.protected_ports || [
    { port: 22, service: 'SSH / Remote Mgmt', status: 'SECURED', policy: 'DROP_UNAUTH' },
    { port: 80, service: 'HTTP Web Traffic', status: 'SECURED', policy: 'WAF_INSPECT' },
    { port: 443, service: 'HTTPS Secure Gateway', status: 'SECURED', policy: 'TLS_ZERO_TRUST' },
    { port: 8000, service: 'Core API Gateway', status: 'SECURED', policy: 'RATE_LIMIT_STRICT' },
    { port: 5173, service: 'SOC Command Console', status: 'SECURED', policy: 'RBAC_ENFORCED' },
    { port: 3306, service: 'MySQL Database', status: 'SECURED', policy: 'INTERNAL_VLAN_ONLY' },
    { port: 5432, service: 'PostgreSQL Analytics', status: 'SECURED', policy: 'LOCAL_SOCKET_ONLY' },
    { port: 8080, service: 'Internal Proxy Gateway', status: 'SECURED', policy: 'ANOMALY_FILTER' },
    { port: 53, service: 'DNS Threat Shield', status: 'SECURED', policy: 'DNS_SINKHOLE_ACTIVE' }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2B2B2B]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className={`w-3 h-3 rounded-full ${isSuppressed ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
            <h1 className="text-xl font-bold tracking-tight text-[#F5F5F2] font-mono uppercase">
              AGENT 01: BLACK AGENT
            </h1>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold border ${
              isSuppressed
                ? 'bg-amber-950/70 text-amber-300 border-amber-800'
                : 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
            }`}>
              {isSuppressed ? 'STANDBY (BYPASS ACTIVE)' : 'ARMED & SHIELDING'}
            </span>
          </div>
          <p className="text-xs text-[#A8A8A3] font-mono">
            Autonomous Perimeter Gateway Armor & Continuous Ingress Telemetry Defense
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStatus}
            className="p-2 rounded-lg bg-[#141414] border border-[#2B2B2B] text-[#A8A8A3] hover:text-[#F5F5F2] hover:border-[#3E3E3E] transition-all"
            title="Refresh Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Master Perimeter Shield Switch */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs transition-all ${
        !isShieldActive
          ? 'bg-[#180C0C] border-red-800 shadow-lg shadow-red-950/30'
          : 'bg-[#0E1511] border-emerald-800/80'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className={`w-4 h-4 ${!isShieldActive ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`} />
            <span className="font-bold text-[#F5F5F2] text-sm">
              PERIMETER SHIELD GATEWAY STATUS: {!isShieldActive ? 'OFF (PERIMETER DOWN)' : 'ON (ARMORED)'}
            </span>
          </div>
          <p className="text-[11px] text-[#A8A8A3]">
            {!isShieldActive
              ? 'Black Agent shield is manually deactivated. All attack payloads will succeed into the system and demo data will be served to the attacker.'
              : 'Black Agent shield is active. Ingress attacks are dropped at perimeter gateways (TCP RST/DROP).'}
          </p>
        </div>

        <button
          onClick={handleToggleShield}
          disabled={actionLoading}
          className={`py-2 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
            !isShieldActive
              ? 'bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold'
              : 'bg-red-950 hover:bg-red-900 border border-red-700 text-red-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>
            {!isShieldActive ? 'ACTIVATE SHIELD (ON)' : 'SWITCH SHIELD OFF'}
          </span>
        </button>
      </div>

      {/* Operational Mode Alert if Dark Agent has overridden */}
      {isSuppressed ? (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-700/60 text-amber-300 font-mono text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold">DEFENSIVE SHIELD ON STANDBY:</span>
              <span className="text-amber-200/90 ml-1.5">
                Dark Agent has been engaged. Perimeter drop policies are temporarily rerouted to the honeypot deception core.
              </span>
            </div>
          </div>
          <span className="text-[10px] bg-amber-900/60 border border-amber-700 px-2 py-0.5 rounded font-bold uppercase">
            HONEY_ROUTING
          </span>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 font-mono text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold">FULL PERIMETER LOCKDOWN ACTIVE:</span>
              <span className="text-emerald-200/90 ml-1.5">
                All 9 gateway ports protected. 100% of unauthorized ingress payloads are dropped.
              </span>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-900/60 border border-emerald-700 px-2 py-0.5 rounded font-bold uppercase">
            DROP_POLICY_100%
          </span>
        </div>
      )}

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        <div className="p-4 rounded-xl bg-[#111111] border border-[#2B2B2B] space-y-1">
          <div className="text-[11px] text-[#A8A8A3] flex items-center justify-between">
            <span>Attacks Neutralized</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-[#F5F5F2]">
            {totalBlocked}
          </div>
          <div className="text-[10px] text-[#777]">
            Firewall Dropped Exploits
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111111] border border-[#2B2B2B] space-y-1">
          <div className="text-[11px] text-[#A8A8A3] flex items-center justify-between">
            <span>Protected Ports</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            9 / 9
          </div>
          <div className="text-[10px] text-[#777]">
            Active Monitored Gateways
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111111] border border-[#2B2B2B] space-y-1">
          <div className="text-[11px] text-[#A8A8A3] flex items-center justify-between">
            <span>Perimeter Armor</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-[#F5F5F2] pt-1">
            ZERO-TRUST
          </div>
          <div className="text-[10px] text-emerald-400">
            Realtime IPTables Active
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111111] border border-[#2B2B2B] space-y-1">
          <div className="text-[11px] text-[#A8A8A3] flex items-center justify-between">
            <span>Inspection Engine</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-[#F5F5F2] pt-1">
            AMTIE 5-LAYER
          </div>
          <div className="text-[10px] text-[#777]">
            Sub-millisecond Triage
          </div>
        </div>
      </div>

      {/* 3. Protected Ports Matrix */}
      <div className="bg-[#111111] border border-[#2B2B2B] rounded-xl p-5 space-y-4 shadow-lg font-mono">
        <div className="flex items-center justify-between border-b border-[#222222] pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-[#F5F5F2] uppercase tracking-wider">
              Perimeter Gateway Armor Matrix (9 Ports)
            </h2>
          </div>
          <span className="text-xs text-emerald-400 font-bold">
            9/9 SECURED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {protectedPorts.map((p: any) => (
            <div
              key={p.port}
              className="p-3 rounded-lg bg-[#161616] border border-[#262626] flex items-center justify-between hover:border-[#383838] transition-all"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#F5F5F2]">:{p.port}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#0A0A0A] border border-[#333] text-emerald-400 font-semibold">
                    {p.status}
                  </span>
                </div>
                <div className="text-[11px] text-[#A8A8A3]">{p.service}</div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-[#777] block">{p.policy}</span>
                <span className={`inline-block w-2 h-2 rounded-full mt-1 ${isSuppressed ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Live Gateway Defense Logs Table */}
      <div className="bg-[#111111] border border-[#2B2B2B] rounded-xl p-5 space-y-4 shadow-lg font-mono">
        <div className="flex items-center justify-between border-b border-[#222222] pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-[#F5F5F2] uppercase tracking-wider">
              Live Gateway Firewall Drops & Defense Audit Log
            </h2>
          </div>
          <span className="text-[11px] text-[#777]">
            Auto-refreshing live telemetry
          </span>
        </div>

        {blackStatus?.recent_blocks && blackStatus.recent_blocks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#222] text-[#777] text-[11px]">
                  <th className="pb-2">TIME</th>
                  <th className="pb-2">ACTION</th>
                  <th className="pb-2">ORIGIN IP</th>
                  <th className="pb-2">PORT</th>
                  <th className="pb-2">VECTOR</th>
                  <th className="pb-2">MITRE</th>
                  <th className="pb-2">FIREWALL RULE ENFORCED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D1D1D] text-[#A8A8A3]">
                {blackStatus.recent_blocks.map((b: BlockedEvent) => (
                  <tr key={b.id} className="hover:bg-[#161616] transition-colors">
                    <td className="py-2.5 font-bold text-[#F5F5F2]">{b.timestamp}</td>
                    <td className="py-2.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800 font-bold">
                        {b.action}
                      </span>
                    </td>
                    <td className="py-2.5 text-amber-300 font-bold">{b.blocked_ip}</td>
                    <td className="py-2.5 font-bold text-[#F5F5F2]">:{b.target_port}</td>
                    <td className="py-2.5 text-white">{b.attack_type}</td>
                    <td className="py-2.5 text-amber-400 font-bold">{b.mitre_id}</td>
                    <td className="py-2.5 font-mono text-[10px] text-emerald-400 truncate max-w-xs">
                      {b.firewall_rule}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-[#777] border border-dashed border-[#222] rounded-lg">
            Zero active perimeter drops recorded in current session. Gateways actively shielded.
          </div>
        )}
      </div>
    </div>
  );
};
export default BlackAgent;
