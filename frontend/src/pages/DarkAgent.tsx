import React, { useState, useEffect } from 'react';
import {
  Skull,
  Activity,
  KeyRound,
  Zap,
  Lock,
  Unlock,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Terminal,
  Flame,
  Check,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';

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
  released_at?: string;
}

export const DarkAgent: React.FC = () => {
  const [darkStatus, setDarkStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Dark Code modal state
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [pendingAction, setPendingAction] = useState<'toggle' | 'release_all' | null>(null);
  const [darkCodeVerified, setDarkCodeVerified] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await api.get<any>('/agents/status');
      setDarkStatus(res.dark_agent || res.red_agent);
    } catch (err) {
      console.error('Failed to load Dark Agent status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Toggle Dark Agent ON/OFF (Protected by Dark Code: Mani02)
  const handleToggle = async (codeToUse?: string) => {
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
      await fetchStatus();
    } catch (err: any) {
      showToast('error', err.response?.data?.detail || 'Invalid Dark Code or operation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Remote release for specific attacker device
  const handleReleaseDevice = async (deviceKey: string) => {
    try {
      setActionLoading(true);
      const res = await api.post<any>('/agents/dark/release-device', {
        device_key: deviceKey,
        code: 'Mani02'
      });
      showToast('success', res.message || `Device ${deviceKey} released!`);
      await fetchStatus();
    } catch (err: any) {
      showToast('error', err.response?.data?.detail || 'Failed to release device.');
    } finally {
      setActionLoading(false);
    }
  };

  // Remote release all devices
  const handleReleaseAll = async () => {
    try {
      setActionLoading(true);
      const res = await api.post<any>('/agents/dark/release-device', {
        release_all: true,
        code: 'Mani02'
      });
      showToast('success', res.message || 'All devices released from Dark Control!');
      await fetchStatus();
    } catch (err: any) {
      showToast('error', err.response?.data?.detail || 'Failed to release devices.');
    } finally {
      setActionLoading(false);
    }
  };

  // Code form submit
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
      await handleToggle('Mani02');
    } else if (pendingAction === 'release_all') {
      await handleReleaseAll();
    }
    setCodeInput('');
    setPendingAction(null);
  };

  const isDarkActive = darkStatus?.is_active ?? false;
  const activeLockedDevices: LockedDevice[] = (darkStatus?.locked_devices || []).filter((d: LockedDevice) => d.is_locked);
  const totalLocked = activeLockedDevices.length;
  const totalStrikes = darkStatus?.total_counter_strikes ?? 0;

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2B2B2B]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className={`w-3 h-3 rounded-full ${isDarkActive ? 'bg-purple-500 animate-ping' : 'bg-[#555]'}`} />
            <h1 className="text-xl font-bold tracking-tight text-[#F5F5F2] font-mono uppercase">
              AGENT 02: DARK AGENT
            </h1>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold border ${
              isDarkActive
                ? 'bg-purple-950 text-purple-300 border-purple-600 animate-pulse'
                : 'bg-[#181818] text-[#888] border-[#333]'
            }`}>
              {isDarkActive ? 'ACTIVE & CONTROLLING' : 'OFFLINE & DORMANT'}
            </span>
          </div>
          <p className="text-xs text-[#A8A8A3] font-mono">
            Autonomous Deception Honey-Net, Hardware Footprint Pinpointer & Attacker Device Remote Lock
          </p>
        </div>

        {/* Security Clearance Tag */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-[#140B1D] border border-purple-800/80 font-mono text-xs flex items-center gap-2 text-purple-300">
            <KeyRound className="w-3.5 h-3.5 text-purple-400" />
            <span>SECURITY CLEARANCE: <strong className="text-white">PROTECTED</strong></span>
          </div>
          <button
            onClick={fetchStatus}
            className="p-2 rounded-lg bg-[#141414] border border-[#2B2B2B] text-[#A8A8A3] hover:text-[#F5F5F2] hover:border-[#3E3E3E] transition-all"
            title="Refresh Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
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

      {/* 2. Master Activation Switch Strip */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs transition-all ${
        isDarkActive
          ? 'bg-[#150B20] border-purple-600 shadow-lg shadow-purple-950/30'
          : 'bg-[#111111] border-[#2B2B2B]'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Skull className={`w-4 h-4 ${isDarkActive ? 'text-purple-400 animate-bounce' : 'text-[#777]'}`} />
            <span className="font-bold text-[#F5F5F2] text-sm">
              DARK AGENT OPERATIONAL CONTROL: {isDarkActive ? 'ENGAGED' : 'STANDBY'}
            </span>
          </div>
          <p className="text-[11px] text-[#A8A8A3]">
            {isDarkActive
              ? 'Black Agent defenses are paused. Ingress is open to decoy honeypot. Attacker device browsers are locked under remote control.'
              : 'Dark Agent is dormant. Black Agent perimeter shield is fully armed.'}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleToggle()}
            disabled={actionLoading}
            className={`flex-1 sm:flex-initial py-2.5 px-5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
              isDarkActive
                ? 'bg-amber-600 hover:bg-amber-500 text-black font-extrabold'
                : 'bg-purple-600 hover:bg-purple-500 text-white font-extrabold'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>
              {isDarkActive ? 'SWITCH OFF DARK AGENT' : 'ACTIVATE DARK AGENT'}
            </span>
          </button>
        </div>
      </div>

      {/* 3. High-Level Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        <div className="p-4 rounded-xl bg-[#111111] border border-[#2B2B2B] space-y-1">
          <div className="text-[11px] text-[#A8A8A3] flex items-center justify-between">
            <span>Operating State</span>
            <Skull className="w-4 h-4 text-purple-400" />
          </div>
          <div className={`text-xl font-bold ${isDarkActive ? 'text-purple-300' : 'text-[#777]'}`}>
            {isDarkActive ? 'ACTIVE' : 'DORMANT'}
          </div>
          <div className="text-[10px] text-[#777]">
            {isDarkActive ? 'Decoy Ingress Open' : 'Defenses Armored'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111111] border border-[#2B2B2B] space-y-1">
          <div className="text-[11px] text-[#A8A8A3] flex items-center justify-between">
            <span>Locked Devices</span>
            <Smartphone className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">
            {totalLocked}
          </div>
          <div className="text-[10px] text-[#777]">
            Controlled Attacker Browsers
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111111] border border-[#2B2B2B] space-y-1">
          <div className="text-[11px] text-[#A8A8A3] flex items-center justify-between">
            <span>Counter-Strikes Fired</span>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-[#F5F5F2]">
            {totalStrikes}
          </div>
          <div className="text-[10px] text-purple-400">
            Takeover Mini-Attacks
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111111] border border-[#2B2B2B] space-y-1">
          <div className="text-[11px] text-[#A8A8A3] flex items-center justify-between">
            <span>Clearance Level</span>
            <KeyRound className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-purple-300">
            RESTRICTED
          </div>
          <div className="text-[10px] text-emerald-400">
            RBAC Verified
          </div>
        </div>
      </div>

      {/* 4. Captured Attacker Devices (Remote Device Lock Manager) */}
      <div className="bg-[#111111] border border-[#2B2B2B] rounded-xl p-5 space-y-4 shadow-lg font-mono">
        <div className="flex items-center justify-between border-b border-[#222222] pb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-red-400" />
            <h2 className="text-sm font-bold text-[#F5F5F2] uppercase tracking-wider">
              Captured Attacker Devices ({totalLocked} Active Locks)
            </h2>
          </div>
          {totalLocked > 0 && (
            <button
              onClick={handleReleaseAll}
              disabled={actionLoading}
              className="px-3 py-1 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>RELEASE ALL DEVICES</span>
            </button>
          )}
        </div>

        {totalLocked > 0 ? (
          <div className="space-y-2.5">
            {activeLockedDevices.map((dev) => (
              <div
                key={dev.device_key}
                className="p-3 rounded-lg bg-[#140B1D] border border-purple-700/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {dev.device_type.includes('Mobile') ? (
                      <Smartphone className="w-4 h-4 text-purple-400" />
                    ) : (
                      <Laptop className="w-4 h-4 text-amber-400" />
                    )}
                    <span className="font-bold text-white text-sm">{dev.client_ip}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                      {dev.device_type}
                    </span>
                    <span className="text-[10px] font-bold text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800 animate-pulse">
                      BROWSER LOCKED
                    </span>
                  </div>

                  <div className="text-[11px] text-[#A8A8A3] truncate max-w-xl">
                    Path: <span className="text-purple-300">{dev.trace_path}</span>
                  </div>

                  <div className="text-[10px] text-[#777]">
                    Fingerprint: <span className="text-purple-400">{dev.fingerprint_hash}</span> • Locked at: {dev.locked_at}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReleaseDevice(dev.device_key)}
                    disabled={actionLoading}
                    className="w-full md:w-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>RELEASE DEVICE</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-[#777] border border-dashed border-[#222] rounded-lg">
            Zero attacker devices currently locked. When Dark Agent is active and attacks are deployed from mobile, the device will appear here.
          </div>
        )}
      </div>

      {/* 5. Attacker Footprint & Ingress Trace Stream */}
      <div className="bg-[#111111] border border-[#2B2B2B] rounded-xl p-5 space-y-4 shadow-lg font-mono">
        <div className="flex items-center justify-between border-b border-[#222222] pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-[#F5F5F2] uppercase tracking-wider">
              Attacker Footprint Pinpoint & Ingress Trace Feed
            </h2>
          </div>
          <span className="text-[11px] text-[#777]">
            Realtime telemetry stream
          </span>
        </div>

        {darkStatus?.recent_footprints && darkStatus.recent_footprints.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#222] text-[#777] text-[11px]">
                  <th className="pb-2">TIME</th>
                  <th className="pb-2">ORIGIN IP</th>
                  <th className="pb-2">DEVICE TYPE</th>
                  <th className="pb-2">PORT</th>
                  <th className="pb-2">VECTOR</th>
                  <th className="pb-2">FINGERPRINT</th>
                  <th className="pb-2">TRACE STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D1D1D] text-[#A8A8A3]">
                {darkStatus.recent_footprints.map((fp: any) => (
                  <tr key={fp.id} className="hover:bg-[#161616] transition-colors">
                    <td className="py-2.5 font-bold text-[#F5F5F2]">{fp.timestamp}</td>
                    <td className="py-2.5 text-purple-300 font-bold">{fp.attacker_ip}</td>
                    <td className="py-2.5 text-amber-300">{fp.device_type}</td>
                    <td className="py-2.5 font-bold text-[#F5F5F2]">:{fp.target_port}</td>
                    <td className="py-2.5 text-white">{fp.attack_vector}</td>
                    <td className="py-2.5 text-purple-400 font-mono text-[11px]">{fp.fingerprint_hash}</td>
                    <td className="py-2.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                        {fp.trace_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-[#777] border border-dashed border-[#222] rounded-lg">
            Honeypot armed. Awaiting adversary ingress traffic.
          </div>
        )}
      </div>

      {/* Dark Code Authentication Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
          <div className="w-full max-w-md bg-[#120B1C] border-2 border-purple-600 rounded-2xl p-6 text-purple-200 shadow-2xl relative animate-in fade-in zoom-in-95">
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
              Enter security clearance passcode to authorize operational control:
            </p>

            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="Enter clearance passcode..."
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
                  <span>Authorize</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default DarkAgent;
