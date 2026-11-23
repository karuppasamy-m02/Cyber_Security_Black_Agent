import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Bot,
  Send,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  Server,
  Terminal,
  Paperclip,
  CheckCircle2,
  Info,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  citations?: Array<{
    type: string;
    id: string;
    title?: string;
    snippet?: string;
  }>;
  created_at?: string;
}

export const AiAnalyst: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const contextTypeParam = searchParams.get('context_type');
  const contextIdParam = searchParams.get('context_id');

  const [contextType, setContextType] = useState<string>(contextTypeParam || 'general');
  const [contextId, setContextId] = useState<string>(contextIdParam || '');

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const [aiStatus, setAiStatus] = useState<any>({
    is_running: false,
    selected_model: 'qwen3:8b',
    available_models: [],
    troubleshooting_tip: null
  });

  const [modelOverride, setModelOverride] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested prompt pills
  const suggestedPrompts = [
    'Why was this threat marked Critical?',
    'Explain the suspicious authentication failure sequence.',
    'Which assets and target hosts are affected?',
    'Summarize the attack timeline and kill-chain stages.',
    'What defensive containment actions should an analyst take?',
    'Explain the model feature contributions for this event.'
  ];

  // Fetch Ollama status
  const fetchStatus = async () => {
    try {
      const res = await api.get<any>('/ai/status');
      setAiStatus(res);
      if (res.available_models.length > 0) {
        setModelOverride(res.selected_model || res.available_models[0]);
      }
    } catch (e) {
      setAiStatus({
        is_running: false,
        selected_model: 'Offline',
        available_models: [],
        troubleshooting_tip: 'Ollama service is unreachable. Run "ollama serve" in terminal.'
      });
    }
  };

  useEffect(() => {
    fetchStatus();
    // Default greeting message
    setMessages([
      {
        id: 'greet',
        role: 'assistant',
        text: (
          "Hello, Analyst. I am CYBER BLACK AI, your local Tier-3 SOC Threat Intelligence Assistant.\n\n" +
          "I operate completely locally via Ollama with zero external cloud dependencies. " +
          "I can inspect active incidents, explain multi-layer AMTIE detections, correlate attack kill-chain sequences, " +
          "and retrieve MITRE ATT&CK defensive playbooks.\n\n" +
          "How can I assist your investigation today?"
        ),
        citations: []
      }
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (msgText?: string) => {
    const textToSend = msgText || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const payload: any = {
        message: textToSend,
        conversation_id: conversationId,
        context_type: contextType !== 'general' ? contextType : undefined,
        context_id: contextId || undefined,
        model_override: modelOverride || undefined
      };

      const res = await api.post<any>('/ai/chat', payload);
      setConversationId(res.conversation_id);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: res.response,
        citations: res.citations || [],
        created_at: new Date().toISOString()
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: `Error interacting with AI brain: ${err.message}`,
        citations: []
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-w-6xl mx-auto space-y-4">
      {/* Top Banner: Local Ollama Status & Model Selection */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Ollama Local AI Security Copilot
              </h2>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  aiStatus.is_running
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                    : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/40'
                }`}
              >
                {aiStatus.is_running ? 'Local Daemon Online' : 'Local Daemon Offline'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Private local reasoning engine &bull; Zero external cloud telemetry exposure
            </p>
          </div>
        </div>

        {/* Model Selector & Context Pill */}
        <div className="flex items-center gap-2.5">
          {aiStatus.available_models && aiStatus.available_models.length > 0 ? (
            <select
              value={modelOverride}
              onChange={(e) => setModelOverride(e.target.value)}
              className="bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
            >
              {aiStatus.available_models.map((m: string) => (
                <option key={m} value={m}>Model: {m}</option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
              Model: {aiStatus.selected_model}
            </span>
          )}

          <button
            onClick={fetchStatus}
            className="p-1.5 rounded-lg bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
            title="Refresh Ollama Connection"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Offline Alert Banner if Ollama is not running */}
      {!aiStatus.is_running && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <span className="font-semibold">Local Ollama Service Unavailable:</span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              The AI Analyst operates in safe offline fallback mode.
              To enable generative AI reasoning: run <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-300 font-mono">ollama serve</code> in your terminal and pull a model: <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-300 font-mono">ollama pull qwen3:8b</code>.
            </p>
          </div>
        </div>
      )}

      {/* Context Grounding Bar */}
      {contextId && (
        <div className="px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 flex items-center justify-between text-xs font-mono text-blue-800 dark:text-blue-300">
          <span className="flex items-center gap-1.5">
            <Paperclip className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Active Investigation Context: <strong>{contextType.toUpperCase()} ({contextId})</strong>
          </span>
          <button
            onClick={() => {
              setContextType('general');
              setContextId('');
            }}
            className="text-[11px] text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
          >
            Clear Context &times;
          </button>
        </div>
      )}

      {/* Chat Messages Container */}
      <div className="flex-1 bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-xl p-4 overflow-y-auto space-y-4 shadow-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-3xl rounded-xl p-4 text-xs leading-relaxed space-y-2 ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 text-[10px] font-mono opacity-70">
                <span>{m.role === 'user' ? 'SOC Analyst' : 'CYBER BLACK Brain'}</span>
                {m.created_at && <span>&bull; {new Date(m.created_at).toLocaleTimeString()}</span>}
              </div>

              <div className="whitespace-pre-wrap font-sans text-xs">
                {m.text}
              </div>

              {/* Evidence Citations Drawer */}
              {m.citations && m.citations.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/60 space-y-1.5">
                  <span className="text-[10px] font-mono font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                    Verified Evidence Citations:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {m.citations.map((cite, cIdx) => (
                      <span
                        key={cIdx}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1"
                        title={cite.snippet || cite.title}
                      >
                        <Terminal className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                        {cite.type}: {cite.id}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2B2B2B] text-xs text-blue-600 dark:text-blue-400 font-mono w-max">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Analyzing telemetry evidence and synthesizing defensive response...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {suggestedPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            className="px-3 py-1 rounded-full text-[11px] font-medium bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] hover:border-blue-400 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 shadow-2xs"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2B2B2B] rounded-xl p-2 shadow-xs"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask CYBER BLACK AI about incidents, attack progression, or MITRE playbooks..."
          className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none font-sans"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || loading}
          className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-colors shrink-0 shadow-xs"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
