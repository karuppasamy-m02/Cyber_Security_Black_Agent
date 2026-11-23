import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  ArrowUpRight,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Database,
  X
} from 'lucide-react';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { api } from '../services/api';
import { SecurityEvent } from '../types';

export const Events: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [severity, setSeverity] = useState('');
  const [category, setCategory] = useState('');

  // Modals
  const [showInjectModal, setShowInjectModal] = useState(false);
  const [injectType, setInjectType] = useState('linux_auth');
  const [injectRawLog, setInjectRawLog] = useState('');
  const [injecting, setInjecting] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      let query = `/events?page=${page}&page_size=20`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (severity) query += `&severity=${severity}`;
      if (category) query += `&category=${category}`;

      const res = await api.get<any>(query);
      setEvents(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, severity, category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const handleInjectEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!injectRawLog.trim()) return;
    setInjecting(true);
    try {
      await api.post('/events/ingest', {
        source_type: injectType,
        raw_log: injectRawLog,
        is_simulated: true
      });
      setShowInjectModal(false);
      setInjectRawLog('');
      fetchEvents();
    } catch (err: any) {
      alert(`Ingestion error: ${err.message}`);
    } finally {
      setInjecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#2B2B2B]">
        <div>
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              Security Telemetry Explorer
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Normalized event evidence database parsed across Linux auth, Windows EVTX, NetFlow & JSON telemetry
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowInjectModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Ingest Test Event
          </button>
          <button
            onClick={fetchEvents}
            className="p-2 rounded-lg bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <form onSubmit={handleSearchSubmit} className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by IP, event hash, or raw telemetry message..."
            className="w-full bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono transition-colors"
          />
        </form>

        <select
          value={severity}
          onChange={(e) => {
            setSeverity(e.target.value);
            setPage(1);
          }}
          className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Categories</option>
          <option value="Authentication">Authentication</option>
          <option value="Network">Network</option>
          <option value="Privilege">Privilege Escalation</option>
          <option value="System">System</option>
        </select>
      </div>

      {/* Events Table */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#2B2B2B] bg-slate-50 dark:bg-[#181818]/60 text-slate-500 dark:text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-medium">Timestamp</th>
                <th className="py-3 px-4 font-medium">Severity</th>
                <th className="py-3 px-4 font-medium">Risk Score</th>
                <th className="py-3 px-4 font-medium">Category</th>
                <th className="py-3 px-4 font-medium">Source IP</th>
                <th className="py-3 px-4 font-medium">Destination IP</th>
                <th className="py-3 px-4 font-medium">Format</th>
                <th className="py-3 px-4 font-medium">Raw Log Message</th>
                <th className="py-3 px-4 text-right font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2B2B2B]/60">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400 font-mono text-xs">
                    {loading ? 'Querying database...' : 'No security events found matching criteria.'}
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => navigate(`/events/${ev.id}`)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(ev.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <SeverityBadge severity={ev.severity} />
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold whitespace-nowrap text-blue-600 dark:text-blue-400">
                      {ev.risk_score !== undefined ? `${ev.risk_score.toFixed(1)}/100` : 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {ev.event_category}
                    </td>
                    <td className="py-3 px-4 font-mono text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {ev.source_ip || 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {ev.destination_ip || 'N/A'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                        {ev.source_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-500 dark:text-slate-400 font-mono">
                      {ev.raw_log}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/events/${ev.id}`);
                        }}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
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

        {/* Pagination Bar */}
        <div className="p-3 border-t border-slate-200 dark:border-[#2B2B2B] bg-slate-50/50 dark:bg-[#181818]/40 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
          <span>
            Showing {events.length} of {total} events &bull; Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Manual Ingestion Modal */}
      {showInjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Inject Telemetry Event
              </h2>
              <button
                onClick={() => setShowInjectModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Submit a raw log message directly into the AMTIE normalization and detection pipeline.
            </p>

            <form onSubmit={handleInjectEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Source Format
                </label>
                <select
                  value={injectType}
                  onChange={(e) => setInjectType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="linux_auth">Linux Auth / SSHD Log</option>
                  <option value="windows_event">Windows Security Event (XML/String)</option>
                  <option value="network_flow">Network Flow (NetFlow / Suricata)</option>
                  <option value="json">Generic JSON Telemetry</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Raw Log Message
                </label>
                <textarea
                  value={injectRawLog}
                  onChange={(e) => setInjectRawLog(e.target.value)}
                  rows={4}
                  required
                  placeholder="e.g. Failed password for invalid user admin from 192.168.1.100 port 49210 ssh2"
                  className="w-full bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] rounded-lg p-3 text-xs text-slate-900 dark:text-slate-100 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInjectModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={injecting}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors disabled:opacity-50"
                >
                  {injecting ? 'Evaluating AMTIE...' : 'Ingest & Analyze'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
