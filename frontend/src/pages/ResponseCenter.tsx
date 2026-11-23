import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Plus,
  AlertTriangle,
  Clock,
  Terminal,
  Server,
  RefreshCw,
  X
} from 'lucide-react';
import { StatusPill } from '../components/ui/StatusPill';
import { api } from '../services/api';
import { ResponseAction } from '../types';

export const ResponseCenter: React.FC = () => {
  const [actions, setActions] = useState<ResponseAction[]>([]);
  const [loading, setLoading] = useState(true);

  // New Action Modal
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState('isolate_host');
  const [targetEntity, setTargetEntity] = useState('10.0.0.10');
  const [submitting, setSubmitting] = useState(false);

  const fetchActions = async () => {
    try {
      setLoading(true);
      const data = await api.get<ResponseAction[]>('/response/actions');
      setActions(data);
    } catch (err) {
      console.error('Failed to load response actions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEntity.trim()) return;
    setSubmitting(true);

    try {
      await api.post('/response/actions', {
        action_type: actionType,
        target_entity: targetEntity.trim(),
        parameters_json: { mode: 'simulation' },
        rollback_instructions: `Restore network connectivity or unblock entity ${targetEntity.trim()}`
      });
      setShowModal(false);
      setTargetEntity('');
      fetchActions();
    } catch (err: any) {
      alert(`Error creating response action: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    const reason = prompt('Enter authorization justification for response execution:') || 'Approved by SOC Analyst';
    try {
      await api.post(`/response/actions/${id}/approve`, { decision: 'approve', reason });
      fetchActions();
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter reason for rejecting response:') || 'Deemed unneeded by analyst';
    try {
      await api.post(`/response/actions/${id}/reject`, { decision: 'reject', reason });
      fetchActions();
    } catch (err: any) {
      alert(`Rejection error: ${err.message}`);
    }
  };

  const handleRollback = async (id: string) => {
    if (!confirm('Are you sure you want to rollback this containment action?')) return;
    try {
      await api.post(`/response/actions/${id}/rollback`);
      fetchActions();
    } catch (err: any) {
      alert(`Rollback error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#2B2B2B]">
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              Response & Automation Center
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Controlled defensive containment actions protected by dual-control analyst approval workflows
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Stage Defense Action
          </button>
          <button
            onClick={fetchActions}
            className="p-2 rounded-lg bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Safety Guard Notice */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#121212] border border-blue-200 dark:border-blue-800/40 flex items-start gap-3 text-xs shadow-xs">
        <Server className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            Dual-Control Defense Safety Architecture
          </span>
          <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
            All AI-recommended response actions (Host Isolation, Ingress IP Drop, Token Revocation) are staged in <strong>safe simulation mode</strong>.
            Actions will NEVER execute arbitrary shell commands directly from an LLM. Explicit analyst sign-off is logged with timestamp, reason, and actor ID into the immutable audit trail.
          </p>
        </div>
      </div>

      {/* Actions Table */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-[#2B2B2B] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Staged & Executed Containment Actions</h3>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{actions.length} Total Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#2B2B2B] bg-slate-50 dark:bg-[#181818]/60 text-slate-500 dark:text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-medium">Action Type</th>
                <th className="py-3 px-4 font-medium">Target Entity</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Origin / Recommender</th>
                <th className="py-3 px-4 font-medium">Rollback Guidance</th>
                <th className="py-3 px-4 font-medium">Created (UTC)</th>
                <th className="py-3 px-4 text-right font-medium">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2B2B2B]/60">
              {actions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400 font-mono text-xs">
                    {loading ? 'Loading actions...' : 'No response actions currently staged.'}
                  </td>
                </tr>
              ) : (
                actions.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {act.action_type.replace('_', ' ').toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {act.target_entity}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusPill status={act.status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {act.recommended_by}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px] max-w-xs truncate">
                      {act.rollback_instructions || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(act.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {act.status === 'pending_approval' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApprove(act.id)}
                            className="px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-medium text-xs flex items-center gap-1 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(act.id)}
                            className="px-2.5 py-1 rounded bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 font-medium text-xs flex items-center gap-1 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      )}

                      {act.status === 'executed' && (
                        <button
                          onClick={() => handleRollback(act.id)}
                          className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1 ml-auto transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Rollback
                        </button>
                      )}

                      {(act.status === 'rejected' || act.status === 'rolled_back') && (
                        <span className="text-slate-400 font-mono text-[11px] italic">Completed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stage Action Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Stage Containment Response</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Stage a response workflow requiring SOC dual-control authorization before execution.
            </p>

            <form onSubmit={handleCreateAction} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Defense Action Protocol</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                >
                  <option value="isolate_host">Isolate Host from Local Subnet (Quarantine)</option>
                  <option value="block_ip">Block External Ingress IP at Perimeter Firewall</option>
                  <option value="revoke_session">Revoke Active Kerberos & OAuth Sessions</option>
                  <option value="reset_password">Force Emergency Account Password Reset</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Target Entity (IP / Hostname / Username)</label>
                <input
                  type="text"
                  value={targetEntity}
                  onChange={(e) => setTargetEntity(e.target.value)}
                  required
                  placeholder="e.g. 10.0.0.10 or WS-FINANCE-07"
                  className="w-full bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Staging Action...' : 'Stage for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
