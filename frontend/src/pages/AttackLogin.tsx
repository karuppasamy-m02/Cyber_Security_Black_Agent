import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crosshair, Lock, Terminal, ShieldAlert, Zap } from 'lucide-react';

export const AttackLogin: React.FC = () => {
  const navigate = useNavigate();
  const [operatorId, setOperatorId] = useState('RED-OPERATOR-01');
  const [accessKey, setAccessKey] = useState('ADVERSARY-SIM-2026');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorId.trim()) {
      setError('Operator handle required.');
      return;
    }
    sessionStorage.setItem('cs_redteam_authenticated', 'true');
    sessionStorage.setItem('cs_redteam_operator', operatorId);
    navigate('/attacks');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F2] flex flex-col justify-center items-center p-4 relative font-mono selection:bg-red-600 selection:text-white">
      {/* Red Terminal Background Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(220,38,38,0.22),transparent_75%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="w-full max-w-sm bg-[#0B0B0B] border-2 border-red-900/60 rounded-xl shadow-[0_0_35px_rgba(220,38,38,0.25)] p-6 relative z-10 space-y-5">
        {/* Hacker C2 Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 rounded-xl bg-[#050505] border-2 border-red-600/70 flex items-center justify-center p-2 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
            <img
              src="/logo.png"
              alt="CYBER BLACK"
              className="w-10 h-10 object-contain mix-blend-screen filter brightness-125 contrast-125 drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]"
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-950/80 border border-red-700/60 text-red-400 text-[10px] font-bold tracking-widest uppercase">
              <Zap className="w-3 h-3 text-red-400 animate-pulse" />
              <span>OFFENSIVE C2 TERMINAL</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white mt-2">
              CYBER BLACK <span className="text-red-500">EXPLOIT LAB</span>
            </h1>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Targeted Attack Payload Generation & Live Penetration Engine
            </p>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded bg-red-950/90 border border-red-700 text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold text-red-400 mb-1 uppercase tracking-wider">
              Operator Callsign
            </label>
            <div className="relative">
              <Terminal className="w-4 h-4 text-red-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                required
                placeholder="RED-OPERATOR-01"
                className="w-full bg-[#050505] border border-red-900/80 rounded-md pl-9 pr-3 py-2 text-xs text-red-100 placeholder-neutral-600 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-red-400 mb-1 uppercase tracking-wider">
              Clearance Key
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-red-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="password"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="ADVERSARY-SIM-2026"
                className="w-full bg-[#050505] border border-red-900/80 rounded-md pl-9 pr-3 py-2 text-xs text-red-100 placeholder-neutral-600 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          <div className="p-2.5 rounded bg-[#050505] border border-red-950 text-[10.5px] text-neutral-400 space-y-1">
            <div className="flex justify-between items-center text-neutral-300">
              <span>TARGET SOC:</span>
              <span className="text-red-400 font-bold">192.168.1.8 (ARMED)</span>
            </div>
            <div className="flex justify-between items-center">
              <span>EXPLOIT VECTORS:</span>
              <span className="text-white">12 SCENARIOS READY</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-md bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(220,38,38,0.5)] mt-4 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>ENTER ATTACK CONSOLE</span>
          </button>
        </form>

        <div className="pt-2 text-center text-[10px] text-neutral-500 uppercase tracking-widest">
          Mobile Adversary Node &bull; Authorized Penetration Testing Only
        </div>
      </div>
    </div>
  );
};
