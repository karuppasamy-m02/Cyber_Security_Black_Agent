import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  Activity,
  Cpu,
  Bot,
  ArrowUpRight,
  RefreshCw,
  Server,
  Radio,
  Layers,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { StatusPill } from '../components/ui/StatusPill';
import { EventTrendChart } from '../components/charts/EventTrendChart';
import { CategoryPieChart } from '../components/charts/CategoryPieChart';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [ovData, trData] = await Promise.all([
        api.get<any>('/dashboard/overview'),
        api.get<any>('/dashboard/trends'),
      ]);
      setOverview(ovData);
      setTrends(trData);
    } catch (err) {
      console.error('Failed to load dashboard telemetry:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
        <p className="text-xs font-mono text-slate-500 dark:text-slate-400">Loading security telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-200">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Security Overview
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              Active Defense Mode
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitor security operations, active threat intelligence, and detection engine performance in real time.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263449] hover:bg-slate-50 dark:hover:bg-[#172033] text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors shadow-subtle"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => navigate('/ai-analyst')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-subtle"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Analyst</span>
          </button>
        </div>
      </div>

      {/* 2. Primary KPI Metric Strip (6 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Events */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263449] rounded-lg p-3.5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-subtle">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span className="font-medium">Total Events</span>
            <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {overview?.total_events || 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
            <span>Ingestion Rate</span>
            <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
              {overview?.event_processing_rate_eps} EPS
            </span>
          </div>
        </div>

        {/* Active Incidents */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263449] rounded-lg p-3.5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-subtle">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span className="font-medium">Active Incidents</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
            {overview?.active_incidents || 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
            <span>Status</span>
            <span className="font-mono text-amber-600 dark:text-amber-400">Triage Active</span>
          </div>
        </div>

        {/* Critical Threats */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263449] rounded-lg p-3.5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-subtle">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span className="font-medium">Critical Threats</span>
            <ShieldAlert className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-red-600 dark:text-red-400">
            {overview?.critical_threats || 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
            <span>Score Threshold</span>
            <span className="font-mono text-red-600 dark:text-red-400">&ge; 80.0</span>
          </div>
        </div>

        {/* High-Risk Events */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263449] rounded-lg p-3.5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-subtle">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span className="font-medium">High-Risk Events</span>
            <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-orange-600 dark:text-orange-400">
            {overview?.high_risk_events || 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
            <span>Score Range</span>
            <span className="font-mono text-orange-600 dark:text-orange-400">60 - 79.9</span>
          </div>
        </div>

        {/* ML Behavioral Anomalies */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263449] rounded-lg p-3.5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-subtle">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span className="font-medium">ML Anomalies</span>
            <Cpu className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {overview?.anomalies_detected || 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
            <span>Detector</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400">Isolation Forest</span>
          </div>
        </div>

        {/* Model Pipeline Health */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263449] rounded-lg p-3.5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-subtle">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span className="font-medium">Model Health</span>
            <Server className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>{overview?.detection_model_health?.status || 'Active'}</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
            <span>Active Ensembles</span>
            <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
              {overview?.detection_model_health?.active_models || 3} Loaded
            </span>
          </div>
        </div>
      </div>

      {/* 3. AMTIE 5-Layer Threat Detection Pipeline Visualizer */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263449] rounded-lg p-4 shadow-subtle">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-[#1E293B] pb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-mono">
              AMTIE 5-Layer Detection Pipeline Status
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Deterministic &bull; Unsupervised &bull; Supervised &bull; Correlated &bull; Calibrated
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="p-2.5 rounded-md bg-slate-50 dark:bg-[#172033] border border-slate-200/70 dark:border-[#263449]/70">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Layer 1</div>
            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-0.5">Rule Engine</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Brute force & sudo signatures</div>
            <div className="mt-2 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">● 4 Rules Active</div>
          </div>

          <div className="p-2.5 rounded-md bg-slate-50 dark:bg-[#172033] border border-slate-200/70 dark:border-[#263449]/70">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Layer 2</div>
            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-0.5">Isolation Forest</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Unsupervised baseline deviation</div>
            <div className="mt-2 text-[10px] font-mono text-blue-600 dark:text-blue-400 font-medium">● AUC 0.9911</div>
          </div>

          <div className="p-2.5 rounded-md bg-slate-50 dark:bg-[#172033] border border-slate-200/70 dark:border-[#263449]/70">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Layer 3</div>
            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-0.5">XGBoost Classifier</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Multi-class attack taxonomy</div>
            <div className="mt-2 text-[10px] font-mono text-blue-600 dark:text-blue-400 font-medium">● Latency: 1.2ms</div>
          </div>

          <div className="p-2.5 rounded-md bg-slate-50 dark:bg-[#172033] border border-slate-200/70 dark:border-[#263449]/70">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Layer 4</div>
            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-0.5">Entity Correlation</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">15-min sliding cluster window</div>
            <div className="mt-2 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">● Sliding Active</div>
          </div>

          <div className="p-2.5 rounded-md bg-slate-50 dark:bg-[#172033] border border-slate-200/70 dark:border-[#263449]/70">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Layer 5</div>
            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-0.5">Risk Intelligence</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Anti-double-counting 0–100</div>
            <div className="mt-2 text-[10px] font-mono text-amber-600 dark:text-amber-400 font-medium">● Auto-Escalation &ge; 70</div>
          </div>
        </div>
      </div>

      {/* 4. Visualizations: Telemetry Trend + Threat Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263449] rounded-lg p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Telemetry Volume & Severity Trends
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Hourly security event rate broken down by Critical, High, and Medium signals
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-[#172033] border border-slate-200 dark:border-[#263449]">
              24h Window
            </span>
          </div>
          <EventTrendChart data={trends?.timeline || []} />
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263449] rounded-lg p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Threat Distribution
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Events classified by telemetry source
              </p>
            </div>
          </div>
          <CategoryPieChart data={overview?.threat_categories || {}} />
        </div>
      </div>

      {/* 5. Ollama Local AI Security Brain Banner */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263449] rounded-lg p-4 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Local Ollama AI Security Analyst
              </h3>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${overview?.ai_engine_status?.is_connected
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
              >
                {overview?.ai_engine_status?.is_connected ? 'Service Online' : 'Offline / Standby'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              100% on-premise execution &bull; Configured model:{' '}
              <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                {overview?.ai_engine_status?.suggested_model || 'qwen3:8b'}
              </span>{' '}
              &bull; Prompt-injection protected with local RAG playbooks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/settings')}
            className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-[#172033] dark:hover:bg-[#1E293B] border border-slate-200 dark:border-[#263449] text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
          >
            AI Settings
          </button>
          <button
            onClick={() => navigate('/ai-analyst')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> Launch Analyst
          </button>
        </div>
      </div>

      {/* 6. Lower Tables: Recent Incidents & Security Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Managed Incidents */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263449] rounded-lg p-4 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Recent Managed Incidents
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Auto-escalated threat clusters from AMTIE engine
                </p>
              </div>
              <button
                onClick={() => navigate('/incidents')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-[#1E293B]">
              {overview?.recent_incidents?.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  No active security incidents.
                </div>
              ) : (
                overview?.recent_incidents?.map((inc: any) => (
                  <div
                    key={inc.id}
                    onClick={() => navigate(`/incidents/${inc.id}`)}
                    className="py-3 px-2 rounded-md hover:bg-slate-50 dark:hover:bg-[#172033] cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                          {inc.code}
                        </span>
                        <SeverityBadge severity={inc.severity} size="sm" />
                        <StatusPill status={inc.status} size="sm" />
                      </div>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                        {inc.title}
                      </p>
                      <span className="text-[11px] font-mono text-slate-400">
                        Target Asset: {inc.affected_asset || 'N/A'}
                      </span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Live Security Audit Trail */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263449] rounded-lg p-4 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Security Audit Activity
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tamper-evident trail of user actions, responses & authorizations
                </p>
              </div>
              <button
                onClick={() => navigate('/audit-logs')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                Full Trail <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-[#1E293B]">
              {overview?.recent_activities?.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  No recent audit activity records.
                </div>
              ) : (
                overview?.recent_activities?.map((act: any) => (
                  <div key={act.id} className="py-2.5 px-1 flex items-start gap-2.5 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {act.actor}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {new Date(act.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 truncate">
                        {act.details}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
