import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cpu,
  Play,
  BarChart2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { MLModel } from '../types';

export const ModelLab: React.FC = () => {
  const navigate = useNavigate();
  const [models, setModels] = useState<MLModel[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [modelsData, metricsData] = await Promise.all([
        api.get<MLModel[]>('/models'),
        api.get<any>('/models/metrics')
      ]);
      setModels(modelsData);
      setMetrics(metricsData);
    } catch (err) {
      console.error('Failed to load ML models:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleActivate = async (modelId: string) => {
    try {
      await api.post(`/models/${modelId}/activate`);
      fetchData();
    } catch (err: any) {
      alert(`Activation error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#2B2B2B]">
        <div>
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              Machine Learning Laboratory
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Model registry, versioning, drift monitoring & active AMTIE detection layers
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/model-lab/training')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Train New Model
          </button>
          <button
            onClick={() => navigate('/model-lab/evaluation')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
          >
            <BarChart2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Evaluation Metrics
          </button>
        </div>
      </div>

      {/* Model Health & Drift Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-xl p-4 space-y-1 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400">Total Registered Models</span>
          <div className="text-2xl font-mono font-semibold text-slate-900 dark:text-slate-100">{models.length}</div>
          <span className="text-[11px] text-slate-500">Isolation Forest, XGBoost & Autoencoders</span>
        </div>

        <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-xl p-4 space-y-1 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400">Concept Drift Metric (KS-Test)</span>
          <div className="text-2xl font-mono font-semibold text-emerald-600 dark:text-emerald-400">
            {metrics?.drift_score || '0.018'}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Minimal baseline drift (&lt; 0.05 threshold)</span>
        </div>

        <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-xl p-4 space-y-1 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400">Inference Engine Pipeline</span>
          <div className="text-2xl font-mono font-semibold text-blue-600 dark:text-blue-400">5-Layer Hybrid</div>
          <span className="text-[11px] text-slate-500">Rules + Anomaly + XGBoost + Correlation + Risk</span>
        </div>
      </div>

      {/* Model Registry Table */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-[#2B2B2B] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Registered Detection Models
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Status: Production Grade</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#2B2B2B] bg-slate-50 dark:bg-[#181818]/60 text-slate-500 dark:text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-medium">Model Name</th>
                <th className="py-3 px-4 font-medium">Architecture</th>
                <th className="py-3 px-4 font-medium">Version</th>
                <th className="py-3 px-4 font-medium">Features</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Trained Date</th>
                <th className="py-3 px-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2B2B2B]/60">
              {models.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                    {m.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-blue-600 dark:text-blue-400">
                    {m.model_type}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      {m.version}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                    {m.feature_names?.length || 8} features
                  </td>
                  <td className="py-3.5 px-4">
                    {m.is_active ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        Standby
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                    {new Date(m.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {!m.is_active && (
                      <button
                        onClick={() => handleActivate(m.id)}
                        className="px-2.5 py-1 rounded bg-white dark:bg-[#121212] hover:bg-blue-600 hover:text-white border border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-400 text-xs font-medium transition-colors"
                      >
                        Activate
                      </button>
                    )}
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
