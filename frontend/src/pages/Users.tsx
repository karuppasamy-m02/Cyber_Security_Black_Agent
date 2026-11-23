import React, { useState, useEffect } from 'react';
import {
  Users as UsersIcon,
  UserCheck,
  Shield,
  Key,
  Plus,
  RefreshCw,
  Mail,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.get<User[]>('/system/users');
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#2B2B2B]">
        <div>
          <div className="flex items-center gap-2.5">
            <UsersIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              Access Control & User Directory
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Role-Based Access Control (RBAC): Administrator, Security Analyst & Viewer permissions
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="p-2 rounded-lg bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Role Descriptions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#121212] border border-purple-200 dark:border-purple-800/40 rounded-xl p-4 space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-semibold text-xs uppercase tracking-wider">
            <Shield className="w-4 h-4" /> Administrator
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Full root privileges. Manages detection rules, executes model training, configures AI endpoints, and triggers backups.
          </p>
        </div>

        <div className="bg-white dark:bg-[#121212] border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-4 space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wider">
            <UserCheck className="w-4 h-4" /> Security Analyst
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Tier-3 incident triage, AI-assisted investigation, IoC additions, and containment response authorizations.
          </p>
        </div>

        <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
            <Key className="w-4 h-4" /> Viewer / Auditor
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Read-only access to executive dashboards, historical event telemetry, and compliance audit trail logs.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#2B2B2B] bg-slate-50 dark:bg-[#181818]/60 text-slate-500 dark:text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-medium">Username</th>
                <th className="py-3 px-4 font-medium">Full Name</th>
                <th className="py-3 px-4 font-medium">Email</th>
                <th className="py-3 px-4 font-medium">Assigned Role</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Provisioned Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2B2B2B]/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                    {u.username}
                  </td>
                  <td className="py-3.5 px-4 text-slate-900 dark:text-slate-100 whitespace-nowrap font-medium">
                    {u.full_name || 'N/A'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    <span className="flex items-center gap-1.5 font-mono text-[11px]">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {u.email}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${u.role === 'Administrator'
                        ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60'
                        : u.role === 'Security Analyst'
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
