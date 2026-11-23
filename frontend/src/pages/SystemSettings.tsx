import React, { useState, useEffect } from 'react';
import { Server, Database, Shield, Download, RefreshCw, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export const SystemSettings: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [truncateStatus, setTruncateStatus] = useState<string | null>(null);
  const [confirmTruncate, setConfirmTruncate] = useState(false);
  const [truncating, setTruncating] = useState(false);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const data = await api.get<any>('/system/health');
      setHealth(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleBackup = async () => {
    try {
      setBackupStatus('Creating database snapshot...');
      const res = await api.post<any>('/system/backup');
      setBackupStatus(`Backup snapshot saved successfully: ${res.backup_file}`);
    } catch (err: any) {
      setBackupStatus(`Backup failed: ${err.message}`);
    }
  };

  const handleTruncate = async () => {
    try {
      setTruncating(true);
      setTruncateStatus('Purging all sample telemetry, events, and incidents...');
      const res = await api.post<any>('/system/truncate');
      setTruncateStatus(res.message || 'Database truncated successfully. Zero state active.');
      setConfirmTruncate(false);
      fetchHealth();
    } catch (err: any) {
      setTruncateStatus(`Truncate failed: ${err.message}`);
    } finally {
      setTruncating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="bg-[#121212] border border-[#2B2B2B] rounded-xl p-5 space-y-4 shadow-subtle">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#F5F5F2] flex items-center gap-2">
            <Server className="w-4 h-4 text-[#A8A8A3]" />
            CYBER BLACK Architecture & Health
          </h3>
          <button
            onClick={fetchHealth}
            className="p-1.5 rounded-md bg-[#161616] border border-[#2B2B2B] text-[#A8A8A3] hover:text-[#F5F5F2] hover:bg-[#1C1C1C] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-[#161616] p-3.5 rounded-lg border border-[#2B2B2B]">
            <span className="text-[#A8A8A3] block mb-1">Database Mode</span>
            <span className="text-sm font-semibold text-[#F5F5F2]">
              SQLite (WAL Active)
            </span>
          </div>

          <div className="bg-[#161616] p-3.5 rounded-lg border border-[#2B2B2B]">
            <span className="text-[#A8A8A3] block mb-1">Process Memory</span>
            <span className="text-sm font-semibold text-emerald-400">
              {health?.memory_usage_mb || '45'} MB
            </span>
          </div>

          <div className="bg-[#161616] p-3.5 rounded-lg border border-[#2B2B2B]">
            <span className="text-[#A8A8A3] block mb-1">System Uptime</span>
            <span className="text-sm font-semibold text-[#F5F5F2]">
              {health ? Math.floor(health.uptime_seconds / 60) : 0} mins
            </span>
          </div>

          <div className="bg-[#161616] p-3.5 rounded-lg border border-[#2B2B2B]">
            <span className="text-[#A8A8A3] block mb-1">AMTIE Engine</span>
            <span className="text-sm font-semibold text-[#F5F5F2]">
              5 Detection Layers
            </span>
          </div>
        </div>
      </div>

      {/* Database Maintenance: Truncate All Data */}
      <div className="bg-[#121212] border border-[#2B2B2B] rounded-xl p-5 space-y-4 shadow-subtle">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#F5F5F2] flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-400" />
              Database Telemetry Truncation & Zero State Clean
            </h3>
            <p className="text-xs text-[#A8A8A3] mt-1 font-mono">
              Purges all real-time events, ML features, detection traces, auto-generated incidents, containment actions, and audit logs. Preserves users, roles, detection rules, threat sources, and core platform settings.
            </p>
          </div>
        </div>

        {!confirmTruncate ? (
          <button
            onClick={() => setConfirmTruncate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#181818] hover:bg-red-950/40 border border-[#2B2B2B] hover:border-red-500/50 text-[#F5F5F2] hover:text-red-300 font-medium text-xs transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Truncate All Telemetry & Incidents
          </button>
        ) : (
          <div className="p-4 rounded-lg bg-[#161616] border border-red-500/50 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Confirm Database Telemetry Purge</span>
            </div>
            <p className="text-xs text-[#A8A8A3]">
              Are you sure? This will permanently delete all security events, detection results, and active incidents. The database will return to an initial 0-incident, 0-event baseline.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleTruncate}
                disabled={truncating}
                className="px-3.5 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-medium text-xs transition-colors disabled:opacity-50"
              >
                {truncating ? 'Truncating Database...' : 'Yes, Purge All Data'}
              </button>
              <button
                onClick={() => setConfirmTruncate(false)}
                className="px-3.5 py-1.5 rounded-md bg-[#1F1F1F] hover:bg-[#2B2B2B] border border-[#2B2B2B] text-[#A8A8A3] hover:text-[#F5F5F2] text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {truncateStatus && (
          <div className="p-3 rounded-lg bg-[#161616] border border-[#2B2B2B] text-xs font-mono text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{truncateStatus}</span>
          </div>
        )}
      </div>

      {/* Database Backup & Disaster Recovery */}
      <div className="bg-[#121212] border border-[#2B2B2B] rounded-xl p-5 space-y-4 shadow-subtle">
        <div>
          <h3 className="text-sm font-semibold text-[#F5F5F2] flex items-center gap-2">
            <Database className="w-4 h-4 text-[#A8A8A3]" />
            Database Backup & Disaster Recovery
          </h3>
          <p className="text-xs text-[#A8A8A3] mt-1 font-mono">
            Generate point-in-time timestamped WAL database snapshot preserving all configuration, telemetry, and forensic state
          </p>
        </div>

        <button
          onClick={handleBackup}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#F5F5F2] hover:bg-[#E5E5E0] text-[#0A0A0A] font-semibold text-xs transition-colors shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          Create Immediate Database Backup
        </button>

        {backupStatus && (
          <div className="p-3 rounded-lg bg-[#161616] border border-[#2B2B2B] text-xs font-mono text-[#F5F5F2]">
            {backupStatus}
          </div>
        )}
      </div>
    </div>
  );
};
