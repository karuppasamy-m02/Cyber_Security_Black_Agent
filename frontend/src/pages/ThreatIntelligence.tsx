import React, { useState, useEffect } from 'react';
import {
  Globe2,
  Search,
  Plus,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Server,
  Terminal,
  ExternalLink,
  RefreshCw,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { ThreatIndicator } from '../types';

export const ThreatIntelligence: React.FC = () => {
  const [indicators, setIndicators] = useState<ThreatIndicator[]>([]);
  const [loading, setLoading] = useState(true);

  // Search/Investigate
  const [query, setQuery] = useState('');
  const [investigating, setInvestigating] = useState(false);
  const [investigationResult, setInvestigationResult] = useState<any>(null);

  // Add IoC Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newType, setNewType] = useState('ip');
  const [newValue, setNewValue] = useState('');
  const [newScore, setNewScore] = useState(85.0);
  const [newFamily, setNewFamily] = useState('');
  const [newMitre, setNewMitre] = useState('T1071');
  const [newDesc, setNewDesc] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchIndicators = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>('/threat-intel?page_size=50');
      setIndicators(res.items);
    } catch (err) {
      console.error('Failed to load indicators:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndicators();
  }, []);

  const handleInvestigate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setInvestigating(true);
    setInvestigationResult(null);

    try {
      const res = await api.post<any>('/threat-intel/investigate', { query: query.trim() });
      setInvestigationResult(res);
    } catch (err: any) {
      alert(`Investigation error: ${err.message}`);
    } finally {
      setInvestigating(false);
    }
  };

  const handleAddIndicator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;
    setAdding(true);

    try {
      await api.post('/threat-intel/indicators', {
        indicator_type: newType,
        indicator_value: newValue.trim(),
        threat_score: newScore,
        malware_family: newFamily,
        mitre_technique: newMitre,
        description: newDesc,
        confidence: 'High'
      });
      setShowAddModal(false);
      setNewValue('');
      setNewFamily('');
      setNewDesc('');
      fetchIndicators();
    } catch (err: any) {
      alert(`Error creating indicator: ${err.message}`);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#2B2B2B]">
        <div>
          <div className="flex items-center gap-2.5">
            <Globe2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              Threat Intelligence Center
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Offline indicators of compromise (IoC) matching, adversary infrastructure investigation & MITRE ATT&CK mapping
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add IoC Indicator
        </button>
      </div>

      {/* Investigation Search Tool */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-xl p-5 space-y-4 shadow-xs">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Adversary Entity Investigation
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Query suspicious IP, domain, or hash against local threat intelligence databases & historical internal telemetry
          </p>
        </div>

        <form onSubmit={handleInvestigate} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 185.220.101.5 or evil-auth-verification.com"
              className="w-full bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={investigating}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors shrink-0 disabled:opacity-50"
          >
            {investigating ? 'Investigating...' : 'Investigate Entity'}
          </button>
        </form>

        {/* Investigation Results Box */}
        {investigationResult && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2B2B2B] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                  Target: {investigationResult.query}
                </span>
                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${investigationResult.is_malicious
                    ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60'
                    : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                    }`}
                >
                  {investigationResult.is_malicious ? 'MALICIOUS THREAT' : 'BENIGN / UNLISTED'}
                </span>
              </div>
              <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold">
                Reputation Score: {investigationResult.reputation_score}/100
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-white dark:bg-[#121212] p-3 rounded-lg border border-slate-200 dark:border-[#2B2B2B]">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Internal Telemetry Hits</span>
                <span className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400">
                  {investigationResult.related_events_count} Associated Events
                </span>
              </div>

              <div className="bg-white dark:bg-[#121212] p-3 rounded-lg border border-slate-200 dark:border-[#2B2B2B]">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Threat Family / Campaign</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {investigationResult.matched_indicator?.malware_family || 'Not Attributed'}
                </span>
              </div>

              <div className="bg-white dark:bg-[#121212] p-3 rounded-lg border border-slate-200 dark:border-[#2B2B2B]">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">MITRE Technique</span>
                <span className="text-sm font-mono text-purple-600 dark:text-purple-400">
                  {investigationResult.mitre_techniques?.join(', ') || 'N/A'}
                </span>
              </div>
            </div>

            {investigationResult.recommendations?.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-[#2B2B2B] space-y-1">
                <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                  Containment Recommendations:
                </span>
                <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                  {investigationResult.recommendations.map((rec: string, idx: number) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MITRE ATT&CK Matrix Highlights */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          Mapped MITRE ATT&CK Techniques & Defenses
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] p-3.5 rounded-lg space-y-1 shadow-xs">
            <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-semibold">T1110 &bull; Credential Access</span>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Brute Force Authentication</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">Monitors high-frequency auth failures on SSH, RDP & SMB.</p>
          </div>

          <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] p-3.5 rounded-lg space-y-1 shadow-xs">
            <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-semibold">T1046 &bull; Discovery</span>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Network Service Scanning</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">Detects rapid TCP SYN port sweeps and reconnaissance.</p>
          </div>

          <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] p-3.5 rounded-lg space-y-1 shadow-xs">
            <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-semibold">T1078 &bull; Privilege Escalation</span>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Valid Accounts Abuse</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">Identifies unauthorized sudo executions & privilege abuse.</p>
          </div>

          <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] p-3.5 rounded-lg space-y-1 shadow-xs">
            <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-semibold">T1048 &bull; Exfiltration</span>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Exfiltration Over Protocol</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">Flags mass egress volumes to foreign C2 IP addresses.</p>
          </div>
        </div>
      </div>

      {/* Known Threat Indicators Table */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-[#2B2B2B] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Curated Threat Intelligence Feed</h3>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{indicators.length} Active IoC Signatures</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#2B2B2B] bg-slate-50 dark:bg-[#181818]/60 text-slate-500 dark:text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-medium">Type</th>
                <th className="py-3 px-4 font-medium">Indicator Value</th>
                <th className="py-3 px-4 font-medium">Threat Score</th>
                <th className="py-3 px-4 font-medium">Malware Family</th>
                <th className="py-3 px-4 font-medium">MITRE Technique</th>
                <th className="py-3 px-4 font-medium">Confidence</th>
                <th className="py-3 px-4 font-medium">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2B2B2B]/60">
              {indicators.map((ind) => (
                <tr key={ind.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      {ind.indicator_type.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                    {ind.indicator_value}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold whitespace-nowrap">
                    <span className={ind.threat_score >= 80 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}>
                      {ind.threat_score}/100
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {ind.malware_family || 'Generic Adversary'}
                  </td>
                  <td className="py-3 px-4 font-mono text-purple-600 dark:text-purple-400 whitespace-nowrap">
                    {ind.mitre_technique || 'N/A'}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                      {ind.confidence}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
                    {ind.source_name || 'Local Intelligence'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Indicator Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Add Indicator of Compromise
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Register a newly identified malicious IP, domain, or binary hash into the local threat database.
            </p>

            <form onSubmit={handleAddIndicator} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="ip">IPv4 Address</option>
                    <option value="domain">Domain Name</option>
                    <option value="sha256">SHA-256 Hash</option>
                    <option value="md5">MD5 Hash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Threat Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newScore}
                    onChange={(e) => setNewScore(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Indicator Value</label>
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  required
                  placeholder="e.g. 198.51.100.23 or c2-malware-feed.net"
                  className="w-full bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Malware Family</label>
                  <input
                    type="text"
                    value={newFamily}
                    onChange={(e) => setNewFamily(e.target.value)}
                    placeholder="e.g. Cobalt Strike"
                    className="w-full bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">MITRE Technique</label>
                  <input
                    type="text"
                    value={newMitre}
                    onChange={(e) => setNewMitre(e.target.value)}
                    placeholder="e.g. T1071"
                    className="w-full bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description & Threat Intelligence Context</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  placeholder="Context regarding source of indicator, observed behavior, or campaign..."
                  className="w-full bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] rounded-lg p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors disabled:opacity-50"
                >
                  {adding ? 'Adding...' : 'Add Indicator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
