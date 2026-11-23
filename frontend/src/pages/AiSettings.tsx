import React, { useState, useEffect } from 'react';
import { Bot, RefreshCw, CheckCircle2, AlertTriangle, Save } from 'lucide-react';
import { api } from '../services/api';

export const AiSettings: React.FC = () => {
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [selectedModel, setSelectedModel] = useState('qwen2.5:7b');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>('/ai/status');
      setAiStatus(res);
      if (res.selected_model) {
        setSelectedModel(res.selected_model);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await api.patch('/system/settings/default_model', { setting_value: selectedModel });
      await api.patch('/system/settings/ollama_url', { setting_value: ollamaUrl });
      setSaveSuccess(true);
      fetchStatus();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Box */}
      <div className="bg-[#121212] border border-[#2B2B2B] rounded-xl p-5 space-y-3 shadow-subtle">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bot className="w-5 h-5 text-[#F5F5F2]" />
            <h3 className="text-sm font-semibold text-[#F5F5F2]">
              Local Ollama Service Connectivity
            </h3>
          </div>
          <button
            onClick={fetchStatus}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#161616] border border-[#2B2B2B] text-xs text-[#A8A8A3] hover:text-[#F5F5F2] hover:bg-[#1C1C1C] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Check Connection
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium border ${
              aiStatus?.is_running
                ? 'bg-[#161616] text-emerald-400 border-[#2B2B2B]'
                : 'bg-[#161616] text-amber-400 border-[#2B2B2B]'
            }`}
          >
            {aiStatus?.is_running ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" /> Ollama Daemon Online (v{aiStatus?.version || '0.1'})
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5" /> Service Offline
              </>
            )}
          </span>
          <span className="text-xs font-mono text-[#A8A8A3]">Endpoint: {ollamaUrl}</span>
        </div>

        {!aiStatus?.is_running && (
          <div className="p-3 rounded-lg bg-[#161616] border border-[#2B2B2B] text-xs text-[#A8A8A3] space-y-1">
            <span className="font-semibold text-[#F5F5F2]">Quick Start Instructions:</span>
            <p className="text-[11px] text-[#A8A8A3] leading-relaxed font-mono">
              1. Download Ollama from official site:{' '}
              <a href="https://ollama.com" target="_blank" rel="noreferrer" className="text-[#F5F5F2] underline">
                https://ollama.com
              </a><br />
              2. Launch daemon in terminal: <code className="text-[#F5F5F2]">ollama serve</code><br />
              3. Pull cyber intelligence weights: <code className="text-[#F5F5F2]">ollama pull qwen2.5:7b</code>
            </p>
          </div>
        )}
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-[#121212] border border-[#2B2B2B] rounded-xl p-5 space-y-4 shadow-subtle">
        <h3 className="text-sm font-semibold text-[#F5F5F2]">Local AI Inference Parameters</h3>

        <div>
          <label className="block text-xs font-mono text-[#A8A8A3] mb-1">Ollama Daemon Base URL</label>
          <input
            type="text"
            value={ollamaUrl}
            onChange={(e) => setOllamaUrl(e.target.value)}
            required
            className="w-full bg-[#161616] border border-[#2B2B2B] rounded-md px-3 py-2 text-xs text-[#F5F5F2] font-mono focus:outline-none focus:border-[#F5F5F2]"
          />
          <span className="text-[11px] text-[#767672] font-mono mt-0.5 block">Default local endpoint: http://localhost:11434</span>
        </div>

        <div>
          <label className="block text-xs font-mono text-[#A8A8A3] mb-1">Active Reasoning Model</label>
          {aiStatus?.available_models && aiStatus.available_models.length > 0 ? (
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-[#161616] border border-[#2B2B2B] rounded-md px-3 py-2 text-xs text-[#F5F5F2] font-mono focus:outline-none focus:border-[#F5F5F2]"
            >
              {aiStatus.available_models.map((m: string) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-[#161616] border border-[#2B2B2B] rounded-md px-3 py-2 text-xs text-[#F5F5F2] font-mono focus:outline-none focus:border-[#F5F5F2]"
            />
          )}
          <span className="text-[11px] text-[#767672] font-mono mt-0.5 block">Recommended models: qwen2.5:7b, llama3.1:8b</span>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-md bg-[#F5F5F2] hover:bg-[#E5E5E0] text-[#0A0A0A] font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving Parameters...' : 'Save AI Configuration'}
          </button>
          {saveSuccess && (
            <span className="text-xs font-mono text-emerald-400">Settings saved successfully</span>
          )}
        </div>
      </form>
    </div>
  );
};
