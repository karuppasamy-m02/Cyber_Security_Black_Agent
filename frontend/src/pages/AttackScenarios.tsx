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
  Play
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
  status: 'PENDING' | 'TRANSMITTING' | 'IMPACTED' | 'FAILED';
  target: string;
  technique: string;
  riskScore?: number;
  attackClass?: string;
}

export const AttackScenarios: React.FC = () => {
  const navigate = useNavigate();
  const [operator, setOperator] = useState<string>('RED-OPERATOR-01');
  const [scenarios, setScenarios] = useState<AttackScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [batchSimulating, setBatchSimulating] = useState(false);
  const [logs, setLogs] = useState<AttackLog[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'CORE'>('ALL');
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

  const executeAttack = async (scenario: AttackScenario) => {
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
      setLogs((prev) =>
        prev.map((l) =>
          l.id === logId
            ? {
                ...l,
                status: 'IMPACTED',
                riskScore: res.detection_result?.risk_score || res.risk_score || 85.0,
                attackClass: res.attack_class || scenario.category,
              }
            : l
        )
      );
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

  const handleExecuteCoreBatch = async () => {
    setBatchSimulating(true);
    const core = scenarios.filter((s) => s.is_core);
    for (const scenario of core) {
      await executeAttack(scenario);
      await new Promise((r) => setTimeout(r, 600));
    }
    setBatchSimulating(false);
  };

  const handleExecuteAllBatch = async () => {
    setBatchSimulating(true);
    for (const scenario of scenarios) {
      await executeAttack(scenario);
      await new Promise((r) => setTimeout(r, 450));
    }
    setBatchSimulating(false);
  };

  const displayedScenarios = categoryFilter === 'CORE'
    ? scenarios.filter((s) => s.is_core)
    : scenarios;

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F2] font-mono selection:bg-red-600 selection:text-white flex flex-col">
      {/* 1. Tactical Red Top Header */}
      <header className="h-14 border-b-2 border-red-900/80 bg-[#0B0B0B] px-4 flex items-center justify-between sticky top-0 z-40 shadow-[0_4px_20px_rgba(220,38,38,0.25)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#050505] border border-red-600 flex items-center justify-center p-1 shadow-[0_0_10px_rgba(239,68,68,0.4)]">
            <img
              src="/logo.png"
              alt="CYBER BLACK"
              className="w-6 h-6 object-contain mix-blend-screen filter brightness-125 contrast-125"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-sm text-white tracking-wide">
                CYBER BLACK <span className="text-red-500">EXPLOIT C2</span>
              </span>
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-800">
                ARMED
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              TARGET: <span className="text-red-400 font-bold">192.168.1.8 (SOC CORE)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-1 rounded bg-[#050505] border border-red-900 text-red-300">
            {operator}
          </span>
          <button
            onClick={handleDisconnect}
            className="p-1.5 rounded bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-300 transition-colors"
            title="Terminate C2 Session"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Main Attack Dashboard Container */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-5 space-y-4">
        {/* Rapid Multi-Attack Command Strip */}
        <div className="bg-[#0B0B0B] border-2 border-red-900/80 rounded-xl p-3.5 sm:p-4 shadow-[0_0_20px_rgba(220,38,38,0.2)] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-950 pb-2">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500 animate-pulse" />
              <span className="text-xs font-bold uppercase text-white tracking-wider">
                RAPID ATTACK CAMPAIGN LAUNCHERS
              </span>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setCategoryFilter('ALL')}
                className={`text-[10px] px-2.5 py-0.5 rounded uppercase font-bold transition-colors ${
                  categoryFilter === 'ALL'
                    ? 'bg-red-600 text-white'
                    : 'bg-[#151515] text-neutral-400 hover:text-white'
                }`}
              >
                All 12 Attacks
              </button>
              <button
                onClick={() => setCategoryFilter('CORE')}
                className={`text-[10px] px-2.5 py-0.5 rounded uppercase font-bold transition-colors ${
                  categoryFilter === 'CORE'
                    ? 'bg-red-600 text-white'
                    : 'bg-[#151515] text-neutral-400 hover:text-white'
                }`}
              >
                4 Core Only
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={handleExecuteCoreBatch}
              disabled={batchSimulating}
              className="py-3 px-4 rounded-lg bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all disabled:opacity-50 cursor-pointer min-h-[44px]"
            >
              <Zap className="w-4 h-4 animate-bounce" />
              <span>{batchSimulating ? 'TRANSMITTING EXPLOITS...' : '⚡ FIRE 4 CORE ATTACKS (1-CLICK)'}</span>
            </button>

            <button
              onClick={handleExecuteAllBatch}
              disabled={batchSimulating}
              className="py-3 px-4 rounded-lg bg-[#181818] hover:bg-red-950/80 active:bg-red-900 border border-red-800 text-red-400 hover:text-white font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer min-h-[44px]"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>{batchSimulating ? 'TRANSMITTING...' : '🚀 LAUNCH ALL 12 ATTACK VECTORS'}</span>
            </button>
          </div>
        </div>

        {/* Real-Time Offensive Terminal Feed */}
        <div className="bg-[#050505] border border-red-950 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-neutral-400 border-b border-red-950/60 pb-1.5">
            <div className="flex items-center gap-1.5 text-red-400 font-bold">
              <Terminal className="w-3.5 h-3.5" />
              <span>OFFENSIVE C2 STDOUT LOG</span>
            </div>
            <span className="text-[10px] text-neutral-500">
              {logs.length} EXPLOITS FIRED
            </span>
          </div>

          <div
            ref={logTerminalRef}
            className="h-28 overflow-y-auto font-mono text-[11px] space-y-1 pr-1 scrollbar-thin"
          >
            {logs.length === 0 ? (
              <div className="text-neutral-600 text-center py-8">
                &gt; C2 channel connected to 192.168.1.8. Select any attack below to fire directly.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between gap-2 p-1.5 rounded bg-[#0A0A0A] border border-red-950/80 text-[10.5px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-neutral-500 shrink-0">{log.timestamp}</span>
                    <span className="text-red-400 font-bold shrink-0">[{log.technique}]</span>
                    <span className="text-white truncate">{log.name}</span>
                    <span className="text-neutral-400 shrink-0 hidden sm:inline">&rarr; {log.target}</span>
                  </div>
                  <div className="shrink-0">
                    {log.status === 'TRANSMITTING' && (
                      <span className="text-amber-400 font-bold animate-pulse">TRANSMITTING...</span>
                    )}
                    {log.status === 'IMPACTED' && (
                      <span className="text-red-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-red-500" />
                        <span>IMPACTED (RISK {log.riskScore})</span>
                      </span>
                    )}
                    {log.status === 'FAILED' && (
                      <span className="text-red-600 font-bold">FAILED</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. Attack Scenarios Grid (Direct Exploit Triggers) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              TARGET EXPLOITATION MATRIX ({displayedScenarios.length} PAYLOADS)
            </span>
            <span className="text-[10px] text-neutral-500">
              TAP BUTTON TO ATTACK
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayedScenarios.map((s, idx) => {
              const isExecuting = activeScenarioId === s.id;
              const hasExecuted = logs.some((l) => l.scenarioId === s.id && l.status === 'IMPACTED');

              return (
                <div
                  key={s.id}
                  className={`bg-[#0B0B0B] border-2 rounded-xl p-3.5 space-y-3 transition-all ${
                    isExecuting
                      ? 'border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.4)]'
                      : hasExecuted
                      ? 'border-red-900/90 shadow-[0_0_15px_rgba(220,38,38,0.15)]'
                      : 'border-[#1C1C1C] hover:border-red-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-800">
                          {s.mitre_id}
                        </span>
                        <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-[#161616] text-neutral-300 border border-neutral-800">
                          {s.kill_chain_stage}
                        </span>
                        {s.is_core && (
                          <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-red-600 text-white">
                            CORE
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs font-bold text-white pt-1">
                        {s.title}
                      </h3>
                    </div>

                    <span
                      className={`text-[9.5px] font-bold px-2 py-0.5 rounded uppercase ${
                        s.severity === 'Critical'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {s.severity}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-400 line-clamp-2">
                    {s.description}
                  </p>

                  <div className="p-2 rounded bg-[#050505] border border-red-950/70 text-[10.5px] space-y-1">
                    <div className="flex justify-between items-center text-neutral-400">
                      <span>TARGET VECTOR:</span>
                      <span className="text-white font-bold">{s.target_asset} ({s.protocol}/{s.port})</span>
                    </div>
                    <div className="flex justify-between items-center text-neutral-400">
                      <span>SOURCE SPOOF:</span>
                      <span className="text-red-400">{s.source_ip}</span>
                    </div>
                  </div>

                  {/* Direct Tactile Attack Trigger Button */}
                  <button
                    onClick={() => executeAttack(s)}
                    disabled={isExecuting || batchSimulating}
                    className={`w-full py-2.5 px-3 rounded-lg font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all min-h-[42px] cursor-pointer ${
                      isExecuting
                        ? 'bg-amber-600 text-white animate-pulse'
                        : hasExecuted
                        ? 'bg-red-950 hover:bg-red-900 border border-red-700 text-red-200'
                        : 'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white shadow-[0_0_15px_rgba(220,38,38,0.35)]'
                    }`}
                  >
                    {isExecuting ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>INJECTING PAYLOAD...</span>
                      </>
                    ) : hasExecuted ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-red-400" />
                        <span>RE-FIRE ATTACK</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>FIRE EXPLOIT</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
