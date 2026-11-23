import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldAlert,
  Server,
  Cpu,
  Layers,
  Bot,
  Clock,
  Sparkles,
  Terminal,
  Activity
} from 'lucide-react';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { ShapWaterfall } from '../components/charts/ShapWaterfall';
import { RiskGauge } from '../components/charts/RiskGauge';
import { api } from '../services/api';

export const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const data = await api.get<any>(`/events/${id}`);
        setEvent(data);
      } catch (err) {
        console.error('Failed to load event details:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs font-mono text-slate-500 dark:text-slate-400">
        Loading event telemetry and SHAP explainability analysis...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-20 text-center text-xs text-red-600 dark:text-red-400 font-mono">
        Event ID not found in database.
      </div>
    );
  }

  const det = event.detection || {};
  const xai = det.xai_explanation || {};

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back button & Action Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2B2B2B]">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Events Explorer
        </button>

        <button
          onClick={() => navigate(`/ai-analyst?context_type=event&context_id=${event.id}`)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs transition-colors"
        >
          <Bot className="w-4 h-4" />
          <span>Ask AI Analyst to Explain</span>
        </button>
      </div>

      {/* Main Title & Key Identifiers */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold">
              EVENT #{event.id.slice(0, 12)}
            </span>
            <SeverityBadge severity={event.severity} />
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-700 dark:text-slate-300">
              {event.event_category}
            </span>
            {event.is_simulated && (
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                Simulated Telemetry
              </span>
            )}
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {det.layer3_class || 'Security Telemetry Alert'}
          </h2>
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Captured {new Date(event.timestamp).toUTCString()} &bull; Hash: {event.event_hash.slice(0, 24)}...
          </p>
        </div>

        {/* Risk Gauge */}
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] p-4 rounded-xl shrink-0">
          <RiskGauge score={det.final_risk_score || 0} size={110} />
          <div className="space-y-1 text-xs">
            <div className="font-semibold text-slate-800 dark:text-slate-200">AMTIE Calibrated Risk</div>
            <div className="text-slate-500 dark:text-slate-400 text-[11px]">
              Severity: <span className="text-blue-600 dark:text-blue-400 font-semibold">{det.severity}</span>
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-[11px]">
              Class: <span className="text-amber-600 dark:text-amber-400 font-semibold">{det.layer3_class}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Layer AMTIE Detection Architecture Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          5-Layer AMTIE Detection Breakdown
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Layer 1: Rules */}
          <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] p-3.5 rounded-lg space-y-1.5">
            <span className="text-[10px] font-mono font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Layer 1: Rules
            </span>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {det.layer1_rule_hits?.length || 0} Matches
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
              {det.layer1_rule_hits?.[0] || 'No heuristic violations'}
            </div>
          </div>

          {/* Layer 2: Isolation Forest */}
          <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] p-3.5 rounded-lg space-y-1.5">
            <span className="text-[10px] font-mono font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              Layer 2: Anomaly
            </span>
            <div className="text-xs font-semibold font-mono text-purple-700 dark:text-purple-300">
              Score: {det.layer2_anomaly_score !== undefined ? det.layer2_anomaly_score.toFixed(3) : '0.000'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Isolation Forest baseline deviation
            </div>
          </div>

          {/* Layer 3: XGBoost */}
          <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] p-3.5 rounded-lg space-y-1.5">
            <span className="text-[10px] font-mono font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Layer 3: Supervised
            </span>
            <div className="text-xs font-semibold text-amber-700 dark:text-amber-300">
              {det.layer3_class || 'Benign'}
            </div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              Confidence: {((det.layer3_confidence || 0) * 100).toFixed(1)}%
            </div>
          </div>

          {/* Layer 4: Correlation */}
          <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] p-3.5 rounded-lg space-y-1.5">
            <span className="text-[10px] font-mono font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Layer 4: Correlation
            </span>
            <div className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 truncate">
              ID: {det.layer4_correlation_id || 'Cluster N/A'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              15min sliding entity window
            </div>
          </div>

          {/* Layer 5: Risk Intelligence */}
          <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] p-3.5 rounded-lg space-y-1.5">
            <span className="text-[10px] font-mono font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
              Layer 5: Risk Intel
            </span>
            <div className="text-xs font-semibold font-mono text-red-600 dark:text-red-400">
              {det.final_risk_score?.toFixed(1) || '0.0'} / 100
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Multi-signal calibrated
            </div>
          </div>
        </div>
      </div>

      {/* SHAP Explainability Section */}
      {xai.all_features && xai.all_features.length > 0 && (
        <ShapWaterfall
          features={xai.all_features}
          predictedClass={det.layer3_class}
          confidence={det.layer3_confidence}
        />
      )}

      {/* Raw Log Evidence & Extracted Features Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Raw Log Telemetry */}
        <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Original Raw Log Telemetry Evidence
            </h4>
            <span className="text-[11px] font-mono text-slate-400">Format: {event.source_type}</span>
          </div>

          <pre className="p-4 rounded-lg bg-slate-50 dark:bg-[#0A0A0A] border border-slate-200 dark:border-[#2B2B2B] text-xs font-mono text-slate-800 dark:text-blue-300 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
            {event.raw_log}
          </pre>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-100 dark:border-[#2B2B2B]">
            <div><span className="text-slate-400">Source IP:</span> <span className="text-slate-700 dark:text-slate-200 font-semibold">{event.source_ip || 'N/A'}</span></div>
            <div><span className="text-slate-400">Target IP:</span> <span className="text-slate-700 dark:text-slate-200 font-semibold">{event.destination_ip || 'N/A'}</span></div>
            <div><span className="text-slate-400">Source Port:</span> <span className="text-slate-700 dark:text-slate-200 font-semibold">{event.source_port || 'N/A'}</span></div>
            <div><span className="text-slate-400">Target Port:</span> <span className="text-slate-700 dark:text-slate-200 font-semibold">{event.destination_port || 'N/A'}</span></div>
          </div>
        </div>

        {/* Normalized Extracted Features */}
        <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-xl p-5 space-y-3 shadow-xs">
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Normalized Extracted Features
          </h4>

          <pre className="p-4 rounded-lg bg-slate-50 dark:bg-[#0A0A0A] border border-slate-200 dark:border-[#2B2B2B] text-xs font-mono text-emerald-700 dark:text-emerald-400 overflow-x-auto max-h-60 leading-relaxed">
            {JSON.stringify(event.features || event.normalized_payload, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
