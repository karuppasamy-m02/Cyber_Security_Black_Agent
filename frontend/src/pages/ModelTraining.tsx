import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cpu,
  Play,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
  RefreshCw,
  Terminal
} from 'lucide-react';
import { api } from '../services/api';

export const ModelTraining: React.FC = () => {
  const navigate = useNavigate();

  const [modelType, setModelType] = useState('autoencoder');
  const [epochs, setEpochs] = useState(50);
  const [learningRate, setLearningRate] = useState(0.005);
  const [contamination, setContamination] = useState(0.05);

  const [training, setTraining] = useState(false);
  const [trainingLogs, setTrainingLogs] = useState<string[]>([]);
  const [trainingResult, setTrainingResult] = useState<any>(null);

  const handleStartTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    setTraining(true);
    setTrainingResult(null);
    setTrainingLogs([
      `[INIT] Preparing training telemetry dataset...`,
      `[LOAD] Feature extraction: 8-dimensional normalized telemetry vectors`,
      `[ARCH] Model Architecture: ${modelType.toUpperCase()} selected`,
      `[TRAIN] Executing model optimization and cross-validation...`
    ]);

    try {
      const res = await api.post<any>('/models/train', {
        model_type: modelType,
        epochs,
        learning_rate: learningRate,
        contamination
      });

      setTrainingLogs((prev) => [
        ...prev,
        `[EVAL] Model training complete! Version: ${res.version}`,
        `[METRICS] F1-Score: ${res.metrics?.f1_score} | ROC-AUC: ${res.metrics?.roc_auc}`,
        `[METRICS] Latency: ${res.metrics?.latency_ms} ms/sample`,
        `[SAVE] Serialized model weights to ml-engine/models/ successfully!`
      ]);
      setTrainingResult(res);
    } catch (err: any) {
      setTrainingLogs((prev) => [...prev, `[ERROR] Training failed: ${err.message}`]);
    } finally {
      setTraining(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2B2B2B]">
        <button
          onClick={() => navigate('/model-lab')}
          className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Model Lab
        </button>

        <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
          ML Engine Studio v2.0
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Training Configuration Panel */}
        <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-xl p-5 space-y-4 shadow-xs">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Model Hyperparameters
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure architecture parameters and optimization objectives
            </p>
          </div>

          <form onSubmit={handleStartTraining} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Architecture</label>
              <select
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value="autoencoder">Deep Bottleneck Autoencoder (Unsupervised Reconstruction)</option>
                <option value="xgboost">XGBoost Multi-Class Classifier (Supervised)</option>
                <option value="isolation_forest">Isolation Forest (Anomaly Ensemble)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Max Epochs / Iterations</label>
                <input
                  type="number"
                  min="10"
                  max="200"
                  value={epochs}
                  onChange={(e) => setEpochs(parseInt(e.target.value) || 50)}
                  className="w-full bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Learning Rate</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.0001"
                  max="0.1"
                  value={learningRate}
                  onChange={(e) => setLearningRate(parseFloat(e.target.value) || 0.005)}
                  className="w-full bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Target Anomaly Contamination Ratio</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="0.25"
                value={contamination}
                onChange={(e) => setContamination(parseFloat(e.target.value) || 0.05)}
                className="w-full bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">Default: 0.05 (5% estimated baseline anomalies)</span>
            </div>

            <button
              type="submit"
              disabled={training}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs tracking-wide flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-4 shadow-xs"
            >
              {training ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Training Neural Weights...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> Execute Training Run
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Training Console Log */}
        <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-xl p-5 flex flex-col space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2B2B2B] pb-3">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Live Training Execution Console
            </h3>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              {training ? 'RUNNING' : 'IDLE'}
            </span>
          </div>

          <div className="flex-1 min-h-[220px] bg-slate-50 dark:bg-[#0A0A0A] border border-slate-200 dark:border-[#2B2B2B] rounded-lg p-3.5 font-mono text-xs overflow-y-auto space-y-1.5 text-slate-800 dark:text-blue-300">
            {trainingLogs.length === 0 ? (
              <span className="text-slate-400 italic">Select architecture and press 'Execute Training Run' to start.</span>
            ) : (
              trainingLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  {log}
                </div>
              ))
            )}
          </div>

          {trainingResult && (
            <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs space-y-1 animate-in fade-in">
              <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Model Registered: {trainingResult.name} ({trainingResult.version})</span>
              </div>
              <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-slate-600 dark:text-slate-300 pt-1">
                <div>F1-Score: <strong className="text-blue-600 dark:text-blue-400">{trainingResult.metrics?.f1_score}</strong></div>
                <div>ROC-AUC: <strong className="text-blue-600 dark:text-blue-400">{trainingResult.metrics?.roc_auc}</strong></div>
                <div>Latency: <strong className="text-blue-600 dark:text-blue-400">{trainingResult.metrics?.latency_ms}ms</strong></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
