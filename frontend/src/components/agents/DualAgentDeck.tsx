import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  Zap,
  Terminal,
  Activity,
  Lock,
  Unlock,
  Eye,
  Radio,
  Server,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Smartphone,
  Laptop,
  Skull,
  KeyRound,
  XCircle,
  Flame,
  Check
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

interface LockedDevice {
  device_key: string;
  client_ip: string;
  device_type: string;
  user_agent: string;
  locked_at: string;
  target_port: number;
  attack_vector: string;
  mitre_id: string;
  fingerprint_hash: string;
  trace_path: string;
  demo_content: string;
  is_locked: boolean;
  status: string;
  warning?: string;
  released_at?: string;
}

export const DualAgentDeck: React.FC = () => {
  const [blackStatus, setBlackStatus] = useState<any>(null);
  const [darkStatus, setDarkStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Dark Code Authentication Modal State
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [pendingAction, setPendingAction] = useState<'toggle' | 'release_all' | null>(null);

  // Dark Code stored for current session
  const [darkCodeVerified, setDarkCodeVerified] = useState(false);

  const fetchAgentStatus = async () => {
    try {
      const res = await api.get<any>('/agents/status');
      setBlackStatus(res.black_agent);
      setDarkStatus(res.dark_agent || res.red_agent);
    } catch (err) {
      console.error('Failed to load dual agent status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentStatus();
    const interval = setInterval(fetchAgentStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Toggle Dark Agent (Requires Dark Code: Mani02)
  const handleToggleDarkAgent = async (codeToUse?: string) => {
    const code = codeToUse || (darkCodeVerified ? 'Mani02' : '');
    if (!code) {
      setPendingAction('toggle');
      setShowCodeModal(true);
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.post<any>('/agents/dark/toggle', {
        code,
        activate: !darkStatus?.is_active
      });

      setDarkCodeVerified(true);
      showToast('success', res.message || 'Dark Agent state updated.');
      await fetchAgentStatus();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid Dark Code or operation failed.';
      showToast('error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Release a specific locked device
  const handleReleaseDevice = async (deviceKey: string) => {
    try {
      setActionLoading(true);
      const res = await api.post<any>('/agents/dark/release-device', {
        device_key: deviceKey,
        code: 'Mani02'
      });
      showToast('success', res.message || `Device ${deviceKey} released!`);
      await fetchAgentStatus();
    } catch (err: any) {
      showToast('error', err.response?.data?.detail || 'Failed to release device.');
    } finally {
      setActionLoading(false);
    }
  };

  // Release all locked devices
  const handleReleaseAll = async () => {
    try {
      setActionLoading(true);
      const res = await api.post<any>('/agents/dark/release-device', {
        release_all: true,
        code: 'Mani02'
      });
      showToast('success', res.message || 'All devices released from Dark Control!');
      await fetchAgentStatus();
    } catch (err: any) {
      showToast('error', err.response?.data?.detail || 'Failed to release all devices.');
    } finally {
      setActionLoading(false);
    }
  };

  // Trigger manual Dark Lock test
  const handleTestDarkLock = async () => {
    try {
      setActionLoading(true);
      const res = await api.post<any>('/agents/dark/counter-strike');
      showToast('info', 'Mini-Attack Dispatched: Attacker device browser locked!');
      await fetchAgentStatus();
    } catch (err: any) {
      showToast('error', 'Failed to test Dark Lock.');
    } finally {
      setActionLoading(false);
    }
  };

  // Verify modal code input
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (codeInput.trim() !== 'Mani02') {
      setCodeError('Access Denied: Invalid authorization passcode.');
      return;
    }

    setCodeError('');
    setShowCodeModal(false);
    setDarkCodeVerified(true);

    if (pendingAction === 'toggle') {
      await handleToggleDarkAgent('Mani02');
    } else if (pendingAction === 'release_all') {
      await handleReleaseAll();
    }
    setCodeInput('');
    setPendingAction(null);
  };

  const isDarkActive = darkStatus?.is_active ?? false;
  const activeLockedDevices: LockedDevice[] = (darkStatus?.locked_devices || []).filter((d: LockedDevice) => d.is_locked);

  return (
    <div className="space-y-4">
      {/* Deck Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#2B2B2B]">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${isDarkActive ? 'bg-purple-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F5F5F2] font-mono">
            Autonomous Dual-Agent Operations Center
          </h2>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#171717] border border-[#2B2B2B] text-[#A8A8A3]">
            SECTION 1: BLACK AGENT (DEFENSE) | SECTION 2: DARK AGENT (DECEPTION & LOCK)
          </span>
        </div>
        <div className="text-[11px] font-mono text-[#A8A8A3] flex items-center gap-3">
          <span className={isDarkActive ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
            Perimeter Shield: {isDarkActive ? 'STANDBY (DARK TRAP ENGAGED)' : 'ACTIVE (DROP ALL)'}
          </span>
          <span className={isDarkActive ? 'text-purple-400 font-bold' : 'text-[#777]'}>
            Dark Agent: {isDarkActive ? 'ACTIVE (RESTRICTED)' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3 rounded-lg border text-xs font-mono flex items-center justify-between transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-700 text-emerald-200'
              : notification.type === 'error'
              ? 'bg-red-950/90 border-red-700 text-red-200'
              : 'bg-purple-950/90 border-purple-700 text-purple-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 animate-spin" />
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs hover:underline ml-3">
            Dismiss
          </button>
        </div>
      )}

      {/* Dual Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ============================================================== */}
        {/* SECTION 1: AGENT 1 - BLACK AGENT (THE AUTONOMOUS SHIELD) */}
        {/* ============================================================== */}
        <div className={`bg-[#111111] border rounded-xl p-4 flex flex-col justify-between transition-all shadow-lg relative overflow-hidden ${
          isDarkActive ? 'border-amber-900/60 opacity-90' : 'border-[#2B2B2B] hover:border-[#3E3E3E]'
        }`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${
                  isDarkActive ? 'bg-amber-950/50 border-amber-800 text-amber-400' : 'bg-[#1A1A1A] border-[#2B2B2B] text-emerald-400'
                }`}>
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#F5F5F2] tracking-wide font-mono">
                      AGENT 1: BLACK AGENT
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold border ${
                      isDarkActive
                        ? 'bg-amber-950/70 text-amber-300 border-amber-800'
                        : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                    }`}>
                      {isDarkActive ? 'STANDBY / SUPPRESSED' : 'AUTONOMOUS SHIELD'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A8A8A3]">
                    Only Protect All & Continuous Monitoring of All Details
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

            {/* Mode Banner */}
            {isDarkActive ? (
              <div className="mt-3 p-2 rounded-lg bg-amber-950/40 border border-amber-800/60 text-[11px] font-mono text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Black Agent Defenses Paused:</strong> Dark Agent is active. Attacks are diverted to honey decoy trap so attacker receives demo data.
                </span>
              </div>
            ) : (
              <div className="mt-3 p-2 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-[11px] font-mono text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Full Shield Active:</strong> Gateway firewall drop rules enforced on all 9 ports. Zero unauthorized penetration.
                </span>
              </div>
            )}

            {/* Protected Ports Matrix */}
            <div className="mt-3">
              <div className="text-[11px] font-mono text-[#A8A8A3] mb-1.5 flex items-center justify-between">
                <span>Monitored Ports & Perimeter Armor</span>
                <span className={isDarkActive ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                  {isDarkActive ? '9/9 Honey Routing' : '9/9 Secured (Drop All)'}
                </span>
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
                    <span className={`w-1.5 h-1.5 rounded-full ${isDarkActive ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Gateway Firewall Drops */}
            <div className="mt-3 pt-2.5 border-t border-[#222222]">
              <div className="text-[11px] font-mono text-[#A8A8A3] mb-1">
                Recent Gateway Firewall Drops & Audit Log
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
                  Perimeter gateways armed. Monitoring continuous ingress telemetry.
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#222222] flex items-center justify-between text-[11px] font-mono text-[#A8A8A3]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Policy: Continuous Protection & Zero-Trust Verification
            </span>
            <span className="text-emerald-400 font-semibold font-mono">
              {isDarkActive ? 'HONEY_BYPASS' : 'DROP_POLICY_100%'}
            </span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SECTION 2: AGENT 2 - DARK AGENT (DECEPTION & DEVICE LOCK) */}
        {/* ============================================================== */}
        <div className={`bg-[#0D0B12] border rounded-xl p-4 flex flex-col justify-between transition-all shadow-lg relative overflow-hidden ${
          isDarkActive ? 'border-purple-600/80 shadow-purple-950/30' : 'border-[#2B2B2B] hover:border-purple-900/50'
        }`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${
                  isDarkActive ? 'bg-purple-950/80 border-purple-600 text-purple-300' : 'bg-[#1A1A1A] border-[#2B2B2B] text-purple-400'
                }`}>
                  <Skull className={`w-5 h-5 ${isDarkActive ? 'animate-bounce text-purple-300' : 'text-purple-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#F5F5F2] tracking-wide font-mono">
                      AGENT 2: DARK AGENT
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold border ${
                      isDarkActive
                        ? 'bg-purple-950 text-purple-300 border-purple-500 animate-pulse'
                        : 'bg-[#181818] text-[#888] border-[#333]'
                    }`}>
                      {isDarkActive ? 'ACTIVE & CONTROLLING' : 'OFFLINE (STANDBY)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-300/80">
                    Deception Trap, Footprint Tracker & Attacker Device Browser Lock
                  </p>
                </div>
              </div>

              {/* Dark Code Security Indicator */}
              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs font-mono font-bold text-purple-300">
                    STATUS: RESTRICTED
                  </span>
                </div>
                <div className="text-[10px] font-mono text-[#A8A8A3]">
                  Dark Security Clearance
                </div>
              </div>
            </div>

            {/* Dark Agent Activation Controller */}
            <div className="mt-3 p-3 rounded-lg bg-[#140D1F] border border-purple-900/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-purple-200 font-semibold flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-purple-400" />
                  Dark Agent Master Activation Switch:
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isDarkActive ? 'bg-purple-600 text-white' : 'bg-[#222] text-[#888]'
                }`}>
                  {isDarkActive ? 'ON (ACTIVE)' : 'OFF (DORMANT)'}
                </span>
              </div>

              <p className="text-[11px] text-purple-300/70 font-mono leading-relaxed">
                When activated, Black Agent defenses stand down, routing unauthorized traffic to honeypot telemetry and locking the attacker device browser.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleToggleDarkAgent()}
                  disabled={actionLoading}
                  className={`flex-1 py-2 px-3 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                    isDarkActive
                      ? 'bg-amber-600 hover:bg-amber-500 text-black'
                      : 'bg-purple-600 hover:bg-purple-500 text-white'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>
                    {isDarkActive
                      ? 'TURN OFF DARK AGENT (RESUME BLACK AGENT)'
                      : 'ACTIVATE DARK AGENT'}
                  </span>
                </button>
              </div>
            </div>

            {/* Currently Controlled & Locked Attacker Devices */}
            <div className="mt-3 pt-2.5 border-t border-[#222222]">
              <div className="text-[11px] font-mono text-purple-300 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold">
                  <Skull className="w-3.5 h-3.5 text-purple-400" />
                  Captured Attacker Devices ({activeLockedDevices.length} Locked)
                </span>
                {activeLockedDevices.length > 0 && (
                  <button
                    onClick={handleReleaseAll}
                    disabled={actionLoading}
                    className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Unlock className="w-3 h-3" />
                    Release All Devices
                  </button>
                )}
              </div>

              {activeLockedDevices.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {activeLockedDevices.map((dev) => (
                    <div
                      key={dev.device_key}
                      className="p-2.5 rounded-lg bg-[#0F0817] border border-purple-700/80 font-mono text-[11px] space-y-1.5 shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {dev.device_type.includes('Mobile') ? (
                            <Smartphone className="w-4 h-4 text-purple-400" />
                          ) : (
                            <Laptop className="w-4 h-4 text-amber-400" />
                          )}
                          <span className="font-bold text-purple-200">{dev.client_ip}</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                            {dev.device_type}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800/60 animate-pulse">
                          BROWSER LOCKED
                        </span>
                      </div>

                      <div className="text-[10px] text-[#A8A8A3] truncate">
                        Trace: <span className="text-purple-300">{dev.trace_path}</span>
                      </div>

                      <div className="text-[10px] text-purple-300">
                        Ingress Vector: <span className="font-bold">{dev.attack_vector || 'Network Exploit'}</span> (Port :{dev.target_port})
                      </div>

                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[10px] text-[#777]">Locked at {dev.locked_at}</span>
                        <button
                          onClick={() => handleReleaseDevice(dev.device_key)}
                          disabled={actionLoading}
                          className="px-2 py-1 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-[10px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <Unlock className="w-3 h-3" />
                          <span>RELEASE DEVICE (UNLOCK BROWSER)</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-[#0A0710] border border-purple-950 text-[11px] font-mono text-purple-300/60 text-center space-y-1">
                  <div>Zero active attacker devices currently locked.</div>
                  <div className="text-[10px] text-[#777]">
                    When Dark Agent is ON and an attack is fired from mobile phone, the mobile browser will lock here.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#222222] flex items-center justify-between text-[11px] font-mono text-[#A8A8A3]">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              Autonomous Deception & Attacker Browser Lock
            </span>
            <span className="text-purple-400 font-semibold font-mono">
              CLEARANCE: Mani02
            </span>
          </div>
        </div>
      </div>

      {/* Dark Code Authentication Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#120B1C] border-2 border-purple-600 rounded-2xl p-6 font-mono text-purple-200 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-purple-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-purple-400" />
                <span className="font-bold text-sm tracking-wider uppercase text-purple-100">
                  Dark Agent Authorization Required
                </span>
              </div>
              <button
                onClick={() => {
                  setShowCodeModal(false);
                  setCodeError('');
                  setCodeInput('');
                }}
                className="text-purple-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-purple-300/80 my-4 leading-relaxed">
              To activate or manage Dark Agent, you must provide your security clearance passcode.
            </p>

            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-purple-300">
                  ENTER CLEARANCE PASSCODE:
                </label>
                <input
                  type="password"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="Enter passcode..."
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-lg bg-[#0A0512] border border-purple-600 text-purple-100 font-mono text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {codeError && (
                <div className="p-2 rounded bg-red-950/80 border border-red-700 text-red-300 text-xs">
                  {codeError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCodeModal(false);
                    setCodeError('');
                    setCodeInput('');
                  }}
                  className="px-4 py-2 rounded-lg bg-[#222] hover:bg-[#333] text-xs font-bold text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-purple-950"
                >
                  <Check className="w-4 h-4" />
                  <span>Authorize & Execute</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
