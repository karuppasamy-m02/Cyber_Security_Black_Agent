import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crosshair,
  Zap,
  Terminal,
  Activity,
  AlertOctagon,
  Flame,
  CheckCircle2,
  RotateCw,
  LogOut,
  ChevronDown,
  Play,
  Shield,
  Smartphone,
  Wifi,
  Eye,
  Lock,
  Unlock,
  Radio,
  Server,
  Skull,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

interface AttackScenario {
  id: string;
  title: string;
  severity: string;
  category: string;
  mitre_id: string;
  mitre_technique: string;
  mitre_tactic: string;
  target_asset: string;
  source_ip: string;
  destination_ip: string;
  port: number;
  protocol: string;
  is_core: boolean;
  description: string;
  kill_chain_stage: string;
  raw_log_template: string;
  normalized_payload: Record<string, any>;
}

interface AttackLog {
  id: string;
  timestamp: string;
  scenarioId: string;
  name: string;
  status: 'PENDING' | 'TRANSMITTING' | 'INTERCEPTED' | 'FAILED';
  target: string;
  technique: string;
  riskScore?: number;
  attackClass?: string;
  blackAgentDefense?: string;
  redAgentDeception?: string;
  dummyData?: any;
}

export const AttackScenarios: React.FC = () => {
  const navigate = useNavigate();
  const [operator, setOperator] = useState<string>('RED-OPERATOR-01');
  const [scenarios, setScenarios] = useState<AttackScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [batchSimulating, setBatchSimulating] = useState(false);
  const [logs, setLogs] = useState<AttackLog[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'CORE' | 'AUTH' | 'NET' | 'PRIV' | 'EXFIL'>('ALL');
  const [mobileIp, setMobileIp] = useState<string>('Detecting...');
  
  // Red Agent Screen Takeover Modal State
  const [takeoverActive, setTakeoverActive] = useState(false);
  const [takeoverData, setTakeoverData] = useState<any>(null);
  const [counterTerminalLines, setCounterTerminalLines] = useState<string[]>([]);

  const logTerminalRef = useRef<HTMLDivElement>(null);

  const fetchScenarios = async () => {
    try {
      setLoading(true);
      const data = await api.get<AttackScenario[]>('/attacks/scenarios');
      setScenarios(data);
    } catch (err) {
      console.error('Failed to load attack scenarios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isAuth = sessionStorage.getItem('cs_redteam_authenticated');
    if (!isAuth) {
      navigate('/attacks/login');
      return;
    }
    const op = sessionStorage.getItem('cs_redteam_operator');
    if (op) setOperator(op);
    fetchScenarios();

    // Auto-detect client host from window
    const host = window.location.hostname;
    setMobileIp(host === 'localhost' || host === '127.0.0.1' ? '192.168.1.8 (Local LAN)' : host);
  }, [navigate]);

  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [logs]);

  const handleDisconnect = () => {
    sessionStorage.removeItem('cs_redteam_authenticated');
    sessionStorage.removeItem('cs_redteam_operator');
    navigate('/attacks/login');
  };

  // Launch single attack
  const executeAttack = async (scenario: AttackScenario, triggerTakeover = true) => {
    const logId = Math.random().toString(36).substring(7);
    const now = new Date().toLocaleTimeString();

    setActiveScenarioId(scenario.id);
    setLogs((prev) => [
      ...prev,
      {
        id: logId,
        timestamp: now,
        scenarioId: scenario.id,
        name: scenario.title,
        status: 'TRANSMITTING',
        target: `${scenario.destination_ip}:${scenario.port}`,
        technique: scenario.mitre_id,
      },
    ]);

    try {
      const res = await api.post<any>(`/attacks/simulate/${scenario.id}`);
      
      const blackDefense = res.black_agent?.firewall_rule || `IPTABLES DROP port ${scenario.port}`;
      const redDeception = res.red_agent?.dummy_data?.fake_response || 'Deception payload injected';
      const dummyObj = res.red_agent?.dummy_data;

      setLogs((prev) =>
        prev.map((l) =>
          l.id === logId
            ? {
                ...l,
                status: 'INTERCEPTED',
                riskScore: res.detection_result?.risk_score || res.risk_score || 85.0,
                attackClass: res.attack_class || scenario.category,
                blackAgentDefense: blackDefense,
                redAgentDeception: redDeception,
                dummyData: dummyObj
              }
            : l
        )
      );

      // Trigger Red Agent Counter-Strike Screen Takeover on mobile
      if (triggerTakeover) {
        triggerSimulatedScreenTakeover(scenario, res);
      }

    } catch (err: any) {
      setLogs((prev) =>
        prev.map((l) =>
          l.id === logId
            ? {
                ...l,
                status: 'FAILED',
              }
            : l
        )
      );
    } finally {
      setActiveScenarioId(null);
    }
  };

  // Fire simulated screen takeover
  const triggerSimulatedScreenTakeover = (scenario: AttackScenario, apiResponse?: any) => {
    const targetIp = apiResponse?.red_agent?.footprint?.attacker_ip || mobileIp;
    const fakeToken = apiResponse?.red_agent?.dummy_data?.fake_response || 'Fake Admin Credentials Injected';
    const port = scenario.port;

    setTakeoverData({
      scenarioTitle: scenario.title,
      mitreId: scenario.mitre_id,
      targetPort: port,
      attackerIp: targetIp,
      device: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile Device (ARM/Android/iOS)' : 'Offensive Terminal Workstation',
      dummyResponse: fakeToken,
      fingerprint: apiResponse?.red_agent?.footprint?.fingerprint_hash || 'FP-RED-9921-TRACED'
    });

    setTakeoverActive(true);

    // Dynamic typewriter lines for the hacker takeover terminal
    setCounterTerminalLines([
      `[!] ALERT: Perimeter defenses breached honeypot threshold.`,
      `[BLACK AGENT] Gateway port :${port} locked down. Firewall drop rule enforced.`,
      `[RED AGENT] Intercepted payload from origin IP: ${targetIp}`,
      `[RED AGENT] Feigned breach success: Injected 500 fake decoy records into attacker socket.`,
      `[RED AGENT] Attacker footprint pinned: ${navigator.userAgent.slice(0, 45)}...`,
      `[RED AGENT] INITIATING AUTONOMOUS REVERSE COUNTER-STRIKE (T1059.004)...`,
      `[RED AGENT] Reverse payload mirrored back to origin port 54321.`,
      `[RED AGENT] Mobile viewport override established. Screen locked by Sentinel Defense.`
    ]);
  };

  // Execute Core 4 batch
  const handleExecuteCoreBatch = async () => {
    setBatchSimulating(true);
    const core = scenarios.filter((s) => s.is_core);
    for (let i = 0; i < core.length; i++) {
      const scenario = core[i];
      // Only trigger takeover on the final attack of the batch
      await executeAttack(scenario, i === core.length - 1);
      await new Promise((r) => setTimeout(r, 600));
    }
    setBatchSimulating(false);
  };

  // Execute All vectors
  const handleExecuteAllBatch = async () => {
    setBatchSimulating(true);
    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];
      await executeAttack(scenario, i === scenarios.length - 1);
      await new Promise((r) => setTimeout(r, 500));
    }
    setBatchSimulating(false);
  };

  const filteredScenarios = scenarios.filter((s) => {
    if (categoryFilter === 'CORE') return s.is_core;
    if (categoryFilter === 'AUTH') return s.category === 'Authentication';
    if (categoryFilter === 'NET') return s.category === 'Network';
    if (categoryFilter === 'PRIV') return s.category === 'Privilege';
    if (categoryFilter === 'EXFIL') return s.mitre_tactic === 'Exfiltration';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#050505] text-[#EF4444] font-mono selection:bg-red-900 selection:text-white pb-28">
      {/* 1. Mobile Terminal Header */}
      <header className="sticky top-0 z-40 bg-[#0A0000]/95 backdrop-blur border-b border-red-900/60 px-4 py-3 shadow-lg shadow-red-950/20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-950/80 border border-red-700/60 flex items-center justify-center shadow-inner">
              <Crosshair className="w-5 h-5 text-red-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-widest text-red-100 uppercase">
                  RED C2 STRIKER
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950 border border-red-700 text-red-400 font-bold animate-pulse">
                  OFFENSIVE
                </span>
              </div>
              <div className="text-[11px] text-red-400/80 flex items-center gap-2">
                <span>OP: {operator}</span>
                <span>•</span>
                <span className="text-amber-400 flex items-center gap-1">
                  <Smartphone className="w-3 h-3" /> {mobileIp}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTakeoverActive(true)}
              className="px-2.5 py-1.5 rounded bg-red-950/80 border border-red-700/70 text-red-200 text-xs font-bold hover:bg-red-900 transition-colors flex items-center gap-1.5"
            >
              <Skull className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">DEMO TAKEOVER</span>
            </button>
            <button
              onClick={handleDisconnect}
              className="p-1.5 rounded bg-[#1A0505] border border-red-900/50 text-red-400 hover:text-red-200 hover:border-red-700 transition-colors"
              title="Disconnect"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        {/* Dual-Agent Target Status Banner */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-[#1A0505] to-[#120000] border border-red-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-red-300 font-bold">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>TARGET DEFENSES: BLACK AGENT (PORTS SHIELDED) + RED AGENT (HONEYPOT)</span>
            </div>
            <p className="text-[11px] text-red-400/70">
              Every exploit fired here will be trapped by Black Agent & counter-hacked by Red Agent.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleExecuteCoreBatch}
              disabled={batchSimulating}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Zap className={`w-3.5 h-3.5 ${batchSimulating ? 'animate-bounce' : ''}`} />
              <span>{batchSimulating ? 'TRANSMITTING...' : '⚡ 1-TAP CORE 4'}</span>
            </button>
            <button
              onClick={handleExecuteAllBatch}
              disabled={batchSimulating}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-[#2A0808] hover:bg-red-950 border border-red-700/80 text-red-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Flame className="w-3.5 h-3.5 text-red-400" />
              <span>ALL 12 VECTORS</span>
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {[
            { id: 'ALL', label: 'ALL TOOLS (12)' },
            { id: 'CORE', label: 'CORE ATTACKS (4)' },
            { id: 'AUTH', label: 'AUTH / SSH' },
            { id: 'NET', label: 'PORT SCANS / NET' },
            { id: 'PRIV', label: 'SUDO ESCALATION' },
            { id: 'EXFIL', label: 'DATA EXFILTRATION' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id as any)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-bold transition-all ${
                categoryFilter === cat.id
                  ? 'bg-red-600 text-black border border-red-500 shadow-sm'
                  : 'bg-[#120000] text-red-400 border border-red-950 hover:border-red-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 3. Live Terminal Output Display */}
        <div className="rounded-xl bg-[#080202] border border-red-900/60 overflow-hidden shadow-2xl">
          <div className="bg-[#120000] px-3 py-2 border-b border-red-900/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-red-400" />
              <span className="font-bold text-red-200">LIVE C2 TELEMETRY CONSOLE</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-red-400/80">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>SOCKET ACTIVE: 192.168.1.8</span>
              <button
                onClick={() => setLogs([])}
                className="hover:text-red-200 ml-2 underline"
              >
                Clear
              </button>
            </div>
          </div>

          <div
            ref={logTerminalRef}
            className="p-3 font-mono text-xs max-h-48 overflow-y-auto space-y-2 bg-[#050101]"
          >
            {logs.length === 0 ? (
              <div className="text-red-700 text-center py-6">
                &gt; READY. Select any offensive tool below to deploy payload from mobile.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="border-l-2 border-red-700/60 pl-2.5 py-0.5 space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-red-300 font-bold">&gt; [{log.timestamp}] {log.name}</span>
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                        log.status === 'INTERCEPTED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : log.status === 'TRANSMITTING'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                          : 'bg-red-950 text-red-400'
                      }`}
                    >
                      {log.status === 'INTERCEPTED' ? 'TRAPPED BY AGENTS' : log.status}
                    </span>
                  </div>

                  <div className="text-[10px] text-red-400/80">
                    TARGET: <span className="text-red-200">{log.target}</span> | TECHNIQUE: <span className="text-amber-300">{log.technique}</span>
                  </div>

                  {log.blackAgentDefense && (
                    <div className="text-[10px] text-emerald-400">
                      🛡️ <span className="font-bold">BLACK AGENT SHIELD:</span> {log.blackAgentDefense}
                    </div>
                  )}

                  {log.redAgentDeception && (
                    <div className="text-[10px] text-red-300">
                      🚨 <span className="font-bold">RED AGENT DECEPTION:</span> {log.redAgentDeception}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 4. Offensive Attack Tools Grid */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-red-300 flex items-center justify-between px-1">
            <span>OFFENSIVE ARSENAL MATRIX ({filteredScenarios.length} TOOLS)</span>
            <span className="text-[11px] text-red-400/70 font-normal">Tap to strike instantly</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredScenarios.map((scenario) => {
              const isFired = activeScenarioId === scenario.id;
              return (
                <div
                  key={scenario.id}
                  className="bg-[#0D0202] border border-red-900/50 rounded-xl p-3.5 flex flex-col justify-between hover:border-red-700/80 transition-all shadow-md relative group"
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-red-100 group-hover:text-red-300 transition-colors">
                            {scenario.title}
                          </span>
                          {scenario.is_core && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-bold">
                              CORE
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-red-400/80">
                          {scenario.mitre_tactic} • <span className="text-amber-400">{scenario.mitre_id}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1A0303] border border-red-900/60 text-red-300">
                          Port {scenario.port}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-red-300/80 line-clamp-2 mb-3">
                      {scenario.description}
                    </p>

                    {/* Target & Payload Details */}
                    <div className="p-2 rounded bg-[#050101] border border-red-950 font-mono text-[10px] text-red-400/90 mb-3 space-y-0.5 truncate">
                      <div>TARGET: {scenario.destination_ip}:{scenario.port} ({scenario.protocol})</div>
                      <div className="truncate text-red-300/70 font-mono">&gt; {scenario.raw_log_template}</div>
                    </div>
                  </div>

                  {/* Tactile Fire Button */}
                  <button
                    onClick={() => executeAttack(scenario)}
                    disabled={isFired || batchSimulating}
                    className="w-full py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-500 active:bg-red-700 text-black font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-950/40 active:scale-[0.98]"
                  >
                    <Zap className={`w-4 h-4 ${isFired ? 'animate-spin' : ''}`} />
                    <span>{isFired ? 'TRANSMITTING EXPLOIT...' : '⚡ FIRE EXPLOIT PAYLOAD'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* 5. Sticky Bottom Action Bar for Mobile Phones */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#0A0000]/95 backdrop-blur border-t border-red-900/60 p-3 shadow-2xl">
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          <button
            onClick={handleExecuteCoreBatch}
            disabled={batchSimulating}
            className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <Zap className={`w-4 h-4 ${batchSimulating ? 'animate-spin' : ''}`} />
            <span>{batchSimulating ? 'FIRING VECTORS...' : '⚡ 1-TAP ALL 4 CORE ATTACKS'}</span>
          </button>

          <button
            onClick={() => setTakeoverActive(true)}
            className="py-3 px-4 rounded-xl bg-[#2A0505] hover:bg-red-950 border border-red-700 text-red-200 font-bold text-xs flex items-center justify-center gap-1.5"
            title="Simulate Takeover"
          >
            <Skull className="w-4 h-4 text-red-400" />
            <span className="hidden sm:inline">COUNTER-HACK DEMO</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 6. RED AGENT COUNTER-HACK SCREEN TAKEOVER OVERLAY (CINEMATIC) */}
      {/* ============================================================== */}
      {takeoverActive && (
        <div className="fixed inset-0 z-50 bg-[#050000] text-red-400 flex flex-col justify-between p-4 sm:p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Pulsing red scanline effect */}
          <div className="absolute inset-0 bg-red-950/20 pointer-events-none animate-pulse" />
          <div className="absolute inset-0 bg-[radial-gradient(#EF4444_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

          {/* Takeover Header */}
          <div className="relative z-10 border-b-2 border-red-600 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950 border-2 border-red-500 flex items-center justify-center shadow-lg shadow-red-600/30">
                <Skull className="w-6 h-6 text-red-500 animate-bounce" />
              </div>
              <div>
                <div className="text-base sm:text-lg font-black tracking-widest text-red-100 uppercase animate-pulse">
                  ⚠️ ACTIVE DEFENSE: RED AGENT REVERSE OVERRIDE
                </div>
                <div className="text-xs text-red-300 font-mono">
                  TARGET DEFENSES HAVE TRACED & REVERSE-COMPROMISED THIS SESSION
                </div>
              </div>
            </div>

            <button
              onClick={() => setTakeoverActive(false)}
              className="px-3 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 border border-red-600 text-red-100 text-xs font-bold font-mono flex items-center gap-1.5 transition-colors shadow-md"
            >
              <Unlock className="w-4 h-4 text-emerald-400" />
              <span>DISENGAGE</span>
            </button>
          </div>

          {/* Attacker Footprint Pinpoint Grid */}
          <div className="relative z-10 my-4 grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-[#120000] border border-red-800 space-y-1">
              <div className="text-red-400/80 text-[10px]">ORIGIN ATTACKER NODE</div>
              <div className="text-sm font-bold text-red-100 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-red-400" />
                {takeoverData?.attackerIp || mobileIp}
              </div>
              <div className="text-[10px] text-amber-400">
                {takeoverData?.device || 'Mobile Device Client'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#120000] border border-red-800 space-y-1">
              <div className="text-red-400/80 text-[10px]">BLACK AGENT SHIELD</div>
              <div className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                PORT :{takeoverData?.targetPort || 22} DEFENDED
              </div>
              <div className="text-[10px] text-emerald-300">
                Perimeter Gateway Drop Rule Active
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#120000] border border-red-800 space-y-1">
              <div className="text-red-400/80 text-[10px]">RED AGENT DECEPTION</div>
              <div className="text-sm font-bold text-red-300 flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-red-500" />
                DUMMY DATA INJECTED
              </div>
              <div className="text-[10px] text-red-400 truncate">
                Canary Token: {takeoverData?.fingerprint || 'FP-CANARY-TRIPPED'}
              </div>
            </div>
          </div>

          {/* Interactive Reverse Hack Terminal */}
          <div className="relative z-10 flex-1 bg-[#0A0000] border-2 border-red-700/80 rounded-xl p-4 font-mono text-xs overflow-y-auto space-y-2 shadow-2xl">
            <div className="text-red-500 font-bold border-b border-red-900 pb-1 flex items-center justify-between">
              <span>// RED_AGENT_REVERSE_PAYLOAD_EXECUTION_STREAM</span>
              <span className="text-[10px] text-emerald-400">ECHO PORT: 54321</span>
            </div>

            <div className="space-y-1 text-red-200">
              {counterTerminalLines.map((line, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-red-500 select-none">&gt;&gt;</span>
                  <span className={line.includes('BLACK AGENT') ? 'text-emerald-400 font-semibold' : line.includes('RED AGENT') ? 'text-red-300' : 'text-red-100'}>
                    {line}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-2.5 rounded bg-[#180000] border border-red-800 text-[11px] text-amber-300 mt-4">
              <div className="font-bold text-red-200 mb-1">[!] DECEPTIVE HONEYPOT RESPONSE DELIVERED TO YOUR MOBILE:</div>
              <div className="text-[10px] text-red-400 font-mono">
                {takeoverData?.dummyResponse || 'Decoy credential token delivered. Attacker telemetry redirected to sinkhole.'}
              </div>
            </div>
          </div>

          {/* Takeover Footer with Disengage */}
          <div className="relative z-10 mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-[11px] text-red-400/80 font-mono text-center sm:text-left">
              Safe demonstration: Reverse socket simulation complete. No local mobile filesystem harmed.
            </div>

            <button
              onClick={() => setTakeoverActive(false)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all active:scale-95"
            >
              <Unlock className="w-5 h-5" />
              <span>DISENGAGE COUNTER-HACK & RESTORE</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
