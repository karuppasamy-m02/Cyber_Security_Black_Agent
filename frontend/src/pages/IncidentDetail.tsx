import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  Bot,
  User,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Save,
  Share2,
  Terminal,
  Activity,
  Layers
} from 'lucide-react';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { StatusPill } from '../components/ui/StatusPill';
import { api } from '../services/api';

export const IncidentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [incident, setIncident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('New');
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Containment Checklist state
  const [checklist, setChecklist] = useState({
    isolateHost: false,
    blockIp: false,
    revokeSession: false,
    rotateCredentials: false,
  });

  const fetchIncident = async () => {
    try {
      setLoading(true);
      const data = await api.get<any>(`/incidents/${id}`);
      setIncident(data);
      setStatus(data.status);
      setNotes(data.resolution_notes || '');
    } catch (err) {
      console.error('Failed to load incident detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchIncident();
  }, [id]);

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await api.patch(`/incidents/${id}`, { status: newStatus });
      setStatus(newStatus);
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      await api.patch(`/incidents/${id}`, { resolution_notes: notes });
      alert('Analyst notes saved successfully.');
    } catch (err: any) {
      alert(`Error saving notes: ${err.message}`);
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs font-mono text-slate-500 dark:text-slate-400">
        Loading incident canvas and correlated attack timeline...
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="py-20 text-center text-xs text-red-600 dark:text-red-400 font-mono">
        Incident not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & AI Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2B2B2B]">
        <button
          onClick={() => navigate('/incidents')}
          className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Incidents
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/ai-analyst?context_type=incident&context_id=${incident.id}`)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs transition-colors"
          >
            <Bot className="w-4 h-4" />
            <span>Investigate Incident with Local AI</span>
          </button>
        </div>
      </div>

      {/* Incident Header Card */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-xl p-6 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-mono text-blue-600 dark:text-blue-400 font-bold">
                {incident.incident_code}
              </span>
              <SeverityBadge severity={incident.severity} />
              <StatusPill status={status} />
            </div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              {incident.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Created: {new Date(incident.created_at).toUTCString()} &bull; Affected Asset:{' '}
              <span className="text-blue-600 dark:text-blue-400 font-semibold">{incident.affected_asset || 'None'}</span>
            </p>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Lifecycle Status:</span>
            <select
              value={status}
              onChange={(e) => handleUpdateStatus(e.target.value)}
              className="bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="New">New</option>
              <option value="Investigating">Investigating</option>
              <option value="Contained">Contained</option>
              <option value="Resolved">Resolved</option>
              <option value="False Positive">False Positive</option>
            </select>
          </div>
        </div>

        {/* Description */}
        {incident.description && (
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
            {incident.description}
          </div>
        )}

        {/* MITRE ATT&CK Tactics */}
        {incident.mitre_tactics && incident.mitre_tactics.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#2B2B2B]">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Observed MITRE Tactics:</span>
            <div className="flex flex-wrap gap-1.5">
              {incident.mitre_tactics.map((tactic: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60"
                >
                  {tactic}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Investigation Canvas: Timeline & Containment Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chronological Attack Timeline (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Correlated Attack Kill-Chain Timeline
            </h3>
            <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold">
              {incident.events?.length || 0} Linked Telemetry Events
            </span>
          </div>

          <div className="space-y-4 relative pl-4 before:content-[''] before:absolute before:left-1 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-[#2B2B2B]">
            {incident.timeline?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No timeline events recorded.</p>
            ) : (
              incident.timeline.map((item: any, idx: number) => (
                <div key={idx} className="relative space-y-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 absolute -left-[19px] top-1 border-2 border-white dark:border-[#121212]" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{item.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{item.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Containment Checklist & Actions (1 col) */}
        <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-xl p-5 space-y-4 shadow-xs">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Response & Containment Checklist
          </h3>

          <div className="space-y-3 text-xs">
            <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
              <input
                type="checkbox"
                checked={checklist.isolateHost}
                onChange={(e) => setChecklist({ ...checklist, isolateHost: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 dark:border-[#2B2B2B] text-blue-600 focus:ring-0"
              />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Isolate Endpoint from Network</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Quarantine host switch port & agent connection</p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
              <input
                type="checkbox"
                checked={checklist.blockIp}
                onChange={(e) => setChecklist({ ...checklist, blockIp: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 dark:border-[#2B2B2B] text-blue-600 focus:ring-0"
              />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Block Adversary Ingress IP</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Apply edge perimeter firewall drop rule</p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
              <input
                type="checkbox"
                checked={checklist.revokeSession}
                onChange={(e) => setChecklist({ ...checklist, revokeSession: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 dark:border-[#2B2B2B] text-blue-600 focus:ring-0"
              />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Revoke OAuth & Kerberos Tokens</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Force session termination across SSO and DC</p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
              <input
                type="checkbox"
                checked={checklist.rotateCredentials}
                onChange={(e) => setChecklist({ ...checklist, rotateCredentials: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 dark:border-[#2B2B2B] text-blue-600 focus:ring-0"
              />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Enforce Credential Rotation</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Flag targeted user accounts for password reset</p>
              </div>
            </label>
          </div>

          <button
            onClick={() => navigate('/response-center')}
            className="w-full py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
          >
            Manage Response Approvals &rarr;
          </button>
        </div>
      </div>

      {/* Linked Telemetry Evidence List */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-xl p-5 space-y-3 shadow-xs">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Linked Telemetry Log Evidence
        </h3>

        <div className="space-y-2">
          {incident.events?.map((ev: any) => (
            <div
              key={ev.id}
              onClick={() => navigate(`/events/${ev.id}`)}
              className="p-3 rounded-lg bg-slate-50 dark:bg-[#181818]/60 border border-slate-200 dark:border-[#2B2B2B] hover:border-blue-400 cursor-pointer transition-colors flex items-center justify-between text-xs font-mono"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={ev.severity} />
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">{ev.source_ip} &rarr; {ev.destination_ip}</span>
                  <span className="text-slate-400">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] truncate">{ev.raw_log}</p>
              </div>
              <span className="text-blue-600 dark:text-blue-400 text-xs font-semibold">Inspect &rarr;</span>
            </div>
          ))}
        </div>
      </div>

      {/* Analyst Resolution Notes */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-xl p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Save className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Analyst Investigation Notes & Root Cause Analysis
          </h3>
          <button
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors"
          >
            {savingNotes ? 'Saving...' : 'Save Notes'}
          </button>
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Document root cause findings, forensic artifacts, containment steps taken, and lessons learned..."
          className="w-full bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] rounded-lg p-3 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
};
