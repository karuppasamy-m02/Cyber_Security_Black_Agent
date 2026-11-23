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
  ShieldCheck,
  Shield,
  Crosshair
} from 'lucide-react';
import { api } from '../services/api';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { StatusPill } from '../components/ui/StatusPill';
import { EventTrendChart } from '../components/charts/EventTrendChart';
import { CategoryPieChart } from '../components/charts/CategoryPieChart';
import { DualAgentDeck } from '../components/agents/DualAgentDeck';

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
        <RefreshCw className="w-6 h-6 text-[#F5F5F2] animate-spin" />
        <p className="text-xs font-mono text-[#A8A8A3]">Loading security telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-200">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2B2B2B]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-[#F5F5F2]">
              Security Overview
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-900/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active Defense Mode
            </span>
          </div>
          <p className="text-xs text-[#A8A8A3] mt-1">
            CYBER BLACK: Autonomous Black Agent (Gateway Defense) &amp; Red Agent (Deception &amp; Counter-Strike)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#111111] border border-[#2B2B2B] hover:bg-[#1A1A1A] text-xs font-medium text-[#F5F5F2] transition-colors shadow-subtle"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#A8A8A3] ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => navigate('/ai-analyst')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#F5F5F2] hover:bg-white text-[#0A0A0A] font-semibold text-xs transition-colors shadow-subtle"
          >
            <Bot className="w-3.5 h-3.5 text-[#0A0A0A]" />
            <span>AI Analyst</span>
          </button>
        </div>
      </div>

      {/* 2. Autonomous Dual-Agent Deck (Black Agent Shield + Red Agent Honeypot) */}
      <DualAgentDeck />

      {/* 3. Primary KPI Metric Strip (6 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Events */}
        <div className="bg-[#111111] border border-[#2B2B2B] rounded-lg p-3.5 flex flex-col justify-between hover:border-[#3E3E3E] transition-colors shadow-subtle">
          <div className="flex items-center justify-between text-[#A8A8A3] text-xs mb-2">
            <span className="font-medium">Total Events</span>
            <Activity className="w-3.5 h-3.5 text-[#F5F5F2]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#F5F5F2]">
            {overview?.total_events || 0}
          </div>
          <div className="text-[11px] text-[#A8A8A3] mt-2 flex items-center justify-between">
            <span>Ingestion Rate</span>
            <span className="font-mono font-medium text-emerald-400">
              {overview?.event_processing_rate_eps} EPS
            </span>
          </div>
        </div>

        {/* Active Incidents */}
        <div className="bg-[#111111] border border-[#2B2B2B] rounded-lg p-3.5 flex flex-col justify-between hover:border-[#3E3E3E] transition-colors shadow-subtle">
          <div className="flex items-center justify-between text-[#A8A8A3] text-xs mb-2">
            <span className="font-medium">Active Incidents</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-400">
            {overview?.active_incidents || 0}
          </div>
          <div className="text-[11px] text-[#A8A8A3] mt-2 flex items-center justify-between">
            <span>Status</span>
            <span className="font-mono text-amber-400">Triage Active</span>
          </div>
        </div>

        {/* Critical Threats */}
        <div className="bg-[#111111] border border-[#2B2B2B] rounded-lg p-3.5 flex flex-col justify-between hover:border-[#3E3E3E] transition-colors shadow-subtle">
          <div className="flex items-center justify-between text-[#A8A8A3] text-xs mb-2">
            <span className="font-medium">Critical Threats</span>
            <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-red-400">
            {overview?.critical_threats || 0}
          </div>
          <div className="text-[11px] text-[#A8A8A3] mt-2 flex items-center justify-between">
            <span>Score Threshold</span>
            <span className="font-mono text-red-400">&ge; 80.0</span>
          </div>
        </div>

        {/* High-Risk Events */}
        <div className="bg-[#111111] border border-[#2B2B2B] rounded-lg p-3.5 flex flex-col justify-between hover:border-[#3E3E3E] transition-colors shadow-subtle">
          <div className="flex items-center justify-between text-[#A8A8A3] text-xs mb-2">
            <span className="font-medium">High-Risk Events</span>
            <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-orange-400">
            {overview?.high_risk_events || 0}
          </div>
          <div className="text-[11px] text-[#A8A8A3] mt-2 flex items-center justify-between">
            <span>Score Range</span>
            <span className="font-mono text-orange-400">60 - 79.9</span>
          </div>
        </div>

        {/* ML Behavioral Anomalies */}
        <div className="bg-[#111111] border border-[#2B2B2B] rounded-lg p-3.5 flex flex-col justify-between hover:border-[#3E3E3E] transition-colors shadow-subtle">
          <div className="flex items-center justify-between text-[#A8A8A3] text-xs mb-2">
            <span className="font-medium">ML Anomalies</span>
            <Cpu className="w-3.5 h-3.5 text-[#F5F5F2]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#F5F5F2]">
            {overview?.anomalies_detected || 0}
          </div>
          <div className="text-[11px] text-[#A8A8A3] mt-2 flex items-center justify-between">
            <span>Detector</span>
            <span className="font-mono text-[#F5F5F2]">Isolation Forest</span>
          </div>
        </div>

        {/* Model Pipeline Health */}
        <div className="bg-[#111111] border border-[#2B2B2B] rounded-lg p-3.5 flex flex-col justify-between hover:border-[#3E3E3E] transition-colors shadow-subtle">
          <div className="flex items-center justify-between text-[#A8A8A3] text-xs mb-2">
            <span className="font-medium">Model Health</span>
            <Server className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-base font-bold font-mono text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>{overview?.detection_model_health?.status || 'Active'}</span>
          </div>
          <div className="text-[11px] text-[#A8A8A3] mt-2 flex items-center justify-between">
            <span>Active Ensembles</span>
            <span className="font-mono font-medium text-[#F5F5F2]">
              {overview?.detection_model_health?.active_models || 3} Loaded
            </span>
          </div>
        </div>
      </div>

      {/* 4. AMTIE 5-Layer Threat Detection Pipeline Visualizer */}
      <div className="bg-[#111111] border border-[#2B2B2B] rounded-lg p-4 shadow-subtle">
        <div className="flex items-center justify-between mb-3 border-b border-[#1E1E1E] pb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#F5F5F2]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F5F5F2] font-mono">
              AMTIE 5-Layer Detection Pipeline Status
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#A8A8A3]">
            Deterministic &bull; Unsupervised &bull; Supervised &bull; Correlated &bull; Calibrated
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="p-2.5 rounded-md bg-[#171717] border border-[#2B2B2B]">
            <div className="text-[10px] font-mono text-[#A8A8A3] uppercase">Layer 1</div>
            <div className="text-xs font-semibold text-[#F5F5F2] mt-0.5">Rule Engine</div>
            <div className="text-[11px] text-[#A8A8A3] mt-1">Brute force &amp; sudo signatures</div>
            <div className="mt-2 text-[10px] font-mono text-emerald-400 font-medium">● 4 Rules Active</div>
          </div>

          <div className="p-2.5 rounded-md bg-[#171717] border border-[#2B2B2B]">
            <div className="text-[10px] font-mono text-[#A8A8A3] uppercase">Layer 2</div>
            <div className="text-xs font-semibold text-[#F5F5F2] mt-0.5">Isolation Forest</div>
            <div className="text-[11px] text-[#A8A8A3] mt-1">Unsupervised baseline deviation</div>
            <div className="mt-2 text-[10px] font-mono text-[#F5F5F2] font-medium">● AUC 0.9911</div>
          </div>

          <div className="p-2.5 rounded-md bg-[#171717] border border-[#2B2B2B]">
            <div className="text-[10px] font-mono text-[#A8A8A3] uppercase">Layer 3</div>
            <div className="text-xs font-semibold text-[#F5F5F2] mt-0.5">XGBoost Classifier</div>
            <div className="text-[11px] text-[#A8A8A3] mt-1">Multi-class attack taxonomy</div>
            <div className="mt-2 text-[10px] font-mono text-[#F5F5F2] font-medium">● Latency: 1.2ms</div>
          </div>

          <div className="p-2.5 rounded-md bg-[#171717] border border-[#2B2B2B]">
            <div className="text-[10px] font-mono text-[#A8A8A3] uppercase">Layer 4</div>
            <div className="text-xs font-semibold text-[#F5F5F2] mt-0.5">Entity Correlation</div>
            <div className="text-[11px] text-[#A8A8A3] mt-1">15-min sliding cluster window</div>
            <div className="mt-2 text-[10px] font-mono text-emerald-400 font-medium">● Sliding Active</div>
          </div>

          <div className="p-2.5 rounded-md bg-[#171717] border border-[#2B2B2B]">
            <div className="text-[10px] font-mono text-[#A8A8A3] uppercase">Layer 5</div>
            <div className="text-xs font-semibold text-[#F5F5F2] mt-0.5">Risk Intelligence</div>
            <div className="text-[11px] text-[#A8A8A3] mt-1">Anti-double-counting 0–100</div>
            <div className="mt-2 text-[10px] font-mono text-amber-400 font-medium">● Auto-Escalation &ge; 70</div>
          </div>
        </div>
      </div>

      {/* 5. Visualizations: Telemetry Trend + Threat Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-[#111111] border border-[#2B2B2B] rounded-lg p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#F5F5F2]">
                Telemetry Volume &amp; Severity Trends
              </h3>
              <p className="text-xs text-[#A8A8A3] mt-0.5">
                Hourly security event rate broken down by Critical, High, and Medium signals
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#F5F5F2] font-medium px-2 py-0.5 rounded bg-[#171717] border border-[#2B2B2B]">
              24h Window
            </span>
          </div>
          <EventTrendChart data={trends?.timeline || []} />
        </div>

        <div className="bg-[#111111] border border-[#2B2B2B] rounded-lg p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#F5F5F2]">
                Threat Distribution
              </h3>
              <p className="text-xs text-[#A8A8A3] mt-0.5">
                Events classified by telemetry source
              </p>
            </div>
          </div>
          <CategoryPieChart data={overview?.threat_categories || {}} />
        </div>
      </div>

      {/* 6. Ollama Local AI Security Brain Banner */}
      <div className="bg-[#111111] border border-[#2B2B2B] rounded-lg p-4 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1A1A1A] border border-[#2B2B2B] flex items-center justify-center text-[#F5F5F2] shrink-0">
            <Bot className="w-5 h-5 text-[#F5F5F2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#F5F5F2]">
                Local Ollama AI Security Analyst
              </h3>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${overview?.ai_engine_status?.is_connected
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50'
                  : 'bg-[#1A1A1A] text-[#A8A8A3] border-[#2B2B2B]'
                  }`}
              >
                {overview?.ai_engine_status?.is_connected ? 'Service Online' : 'Offline / Standby'}
              </span>
            </div>
            <p className="text-xs text-[#A8A8A3] mt-0.5">
              100% on-premise execution &bull; Configured model:{' '}
              <span className="font-mono font-medium text-[#F5F5F2]">
                {overview?.ai_engine_status?.suggested_model || 'qwen3:8b'}
              </span>{' '}
              &bull; Prompt-injection protected with local RAG playbooks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/settings')}
            className="px-3 py-1.5 rounded-md bg-[#171717] hover:bg-[#222222] border border-[#2B2B2B] text-xs font-medium text-[#F5F5F2] transition-colors"
          >
            AI Settings
          </button>
          <button
            onClick={() => navigate('/ai-analyst')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#F5F5F2] hover:bg-white text-[#0A0A0A] font-semibold text-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0A0A0A]" /> Launch Analyst
          </button>
        </div>
      </div>

      {/* 7. Lower Tables: Recent Incidents & Security Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Managed Incidents */}
        <div className="bg-[#111111] border border-[#2B2B2B] rounded-lg p-4 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-[#F5F5F2]">
                  Recent Managed Incidents
                </h3>
                <p className="text-xs text-[#A8A8A3]">
                  Auto-escalated threat clusters from AMTIE engine
                </p>
              </div>
              <button
                onClick={() => navigate('/incidents')}
                className="text-xs text-[#F5F5F2] hover:underline flex items-center gap-1 font-medium"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-[#1E1E1E]">
              {overview?.recent_incidents?.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#A8A8A3]">
                  No active security incidents.
                </div>
              ) : (
                overview?.recent_incidents?.map((inc: any) => (
                  <div
                    key={inc.id}
                    onClick={() => navigate(`/incidents/${inc.id}`)}
                    className="py-3 px-2 rounded-md hover:bg-[#171717] cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#F5F5F2]">
                          {inc.code}
                        </span>
                        <SeverityBadge severity={inc.severity} size="sm" />
                        <StatusPill status={inc.status} size="sm" />
                      </div>
                      <p className="text-xs font-medium text-[#F5F5F2] truncate">
                        {inc.title}
                      </p>
                      <span className="text-[11px] font-mono text-[#A8A8A3]">
                        Target Asset: {inc.affected_asset || 'N/A'}
                      </span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#A8A8A3] group-hover:text-[#F5F5F2] shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Live Security Audit Trail */}
        <div className="bg-[#111111] border border-[#2B2B2B] rounded-lg p-4 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-[#F5F5F2]">
                  Security Audit Activity
                </h3>
                <p className="text-xs text-[#A8A8A3]">
                  Tamper-evident trail of user actions, responses &amp; authorizations
                </p>
              </div>
              <button
                onClick={() => navigate('/audit-logs')}
                className="text-xs text-[#F5F5F2] hover:underline flex items-center gap-1 font-medium"
              >
                Full Trail <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-[#1E1E1E]">
              {overview?.recent_activities?.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#A8A8A3]">
                  No recent audit activity records.
                </div>
              ) : (
                overview?.recent_activities?.map((act: any) => (
                  <div key={act.id} className="py-2.5 px-1 flex items-start gap-2.5 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#F5F5F2] truncate">
                          {act.actor}
                        </span>
                        <span className="text-[10px] text-[#A8A8A3] font-mono shrink-0">
                          {new Date(act.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-[#A8A8A3] text-xs mt-0.5 truncate">
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
