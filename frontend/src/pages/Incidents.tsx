import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  User,
  CheckCircle2,
  RefreshCw,
  X
} from 'lucide-react';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { StatusPill } from '../components/ui/StatusPill';
import { api } from '../services/api';
import { Incident } from '../types';

export const Incidents: React.FC = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [search, setSearch] = useState('');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSev, setNewSev] = useState('High');
  const [newAsset, setNewAsset] = useState('10.0.0.10');
  const [creating, setCreating] = useState(false);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      let query = '/incidents?page_size=50';
      if (statusFilter) query += `&status=${statusFilter}`;
      if (severityFilter) query += `&severity=${severityFilter}`;
      const res = await api.get<any>(query);
      setIncidents(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter, severityFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);

    try {
      await api.post('/incidents', {
        title: newTitle,
        description: newDesc,
        severity: newSev,
        affected_asset: newAsset,
        mitre_tactics: ['Initial Access', 'Discovery']
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      fetchIncidents();
    } catch (err: any) {
      alert(`Error creating incident: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const filteredIncidents = incidents.filter(
    (inc) =>
      search === '' ||
      inc.title.toLowerCase().includes(search.toLowerCase()) ||
      inc.incident_code.toLowerCase().includes(search.toLowerCase()) ||
      (inc.affected_asset && inc.affected_asset.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#2B2B2B]">
        <div>
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              Incident Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Managed triage, containment workflow, evidence preservation & MITRE ATT&CK correlation
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Raise Incident
          </button>
          <button
            onClick={fetchIncidents}
            className="p-2 rounded-lg bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search incident title, code, or affected asset..."
            className="w-full bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono transition-colors"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="New">New</option>
          <option value="Investigating">Investigating</option>
          <option value="Contained">Contained</option>
          <option value="Resolved">Resolved</option>
          <option value="False Positive">False Positive</option>
        </select>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* Incidents Table */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#2B2B2B] bg-slate-50 dark:bg-[#181818]/60 text-slate-500 dark:text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-medium">Code</th>
                <th className="py-3 px-4 font-medium">Severity</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Incident Title</th>
                <th className="py-3 px-4 font-medium">Affected Asset</th>
                <th className="py-3 px-4 font-medium">Analyst</th>
                <th className="py-3 px-4 font-medium">Events</th>
                <th className="py-3 px-4 font-medium">Created (UTC)</th>
                <th className="py-3 px-4 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2B2B2B]/60">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400 font-mono text-xs">
                    {loading ? 'Fetching incidents...' : 'No security incidents found.'}
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc) => (
                  <tr
                    key={inc.id}
                    onClick={() => navigate(`/incidents/${inc.id}`)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {inc.incident_code}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <SeverityBadge severity={inc.severity} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusPill status={inc.status} />
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100 max-w-sm truncate">
                      {inc.title}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {inc.affected_asset || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {inc.assigned_to_name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                        {inc.event_count}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(inc.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/incidents/${inc.id}`);
                        }}
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Incident Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Raise Security Incident
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Manually escalate a threat campaign into an active SOC investigation.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Incident Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  placeholder="e.g. Unauthorized Credential Access on Core Domain Controller"
                  className="w-full bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Severity
                  </label>
                  <select
                    value={newSev}
                    onChange={(e) => setNewSev(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Critical">Critical (Immediate Containment)</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Affected Asset
                  </label>
                  <input
                    type="text"
                    value={newAsset}
                    onChange={(e) => setNewAsset(e.target.value)}
                    placeholder="10.0.0.10 or DC-CORP-01"
                    className="w-full bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Incident Scope & Evidence Summary
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  placeholder="Detail observations, initial indicators of compromise, and affected systems..."
                  className="w-full bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] rounded-lg p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating Incident...' : 'Raise Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
