import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  User,
  Shield,
  Clock,
  RefreshCw,
  Download
} from 'lucide-react';
import { api } from '../services/api';
import { AuditLog } from '../types';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let query = '/system/audit-logs?page_size=50';
      if (categoryFilter) query += `&category=${categoryFilter}`;
      const res = await api.get<any>(query);
      setLogs(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [categoryFilter]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#2B2B2B]">
        <div>
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              Tamper-Evident Security Audit Trail
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Immutable log of operator actions, policy updates, AI investigations & response approvals
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 rounded-lg bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Action Categories</option>
          <option value="AUTH">Authentication (AUTH)</option>
          <option value="RESPONSE">Response & Containment (RESPONSE)</option>
          <option value="INCIDENT">Incident Triage (INCIDENT)</option>
          <option value="SYSTEM">System Administration (SYSTEM)</option>
        </select>
      </div>

      {/* Audit Table */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#2B2B2B] bg-slate-50 dark:bg-[#181818]/60 text-slate-500 dark:text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-medium">Timestamp (UTC)</th>
                <th className="py-3 px-4 font-medium">Actor</th>
                <th className="py-3 px-4 font-medium">Category</th>
                <th className="py-3 px-4 font-medium">Action Details</th>
                <th className="py-3 px-4 font-medium">Source IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2B2B2B]/60">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-slate-400 font-mono text-xs">
                    {loading ? 'Fetching audit records...' : 'No audit records found.'}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        {log.actor_username}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400">
                        {log.action_category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {log.action_details}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
