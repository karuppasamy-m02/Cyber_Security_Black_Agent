import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  Pause,
  Play,
  Trash2,
  Search,
  ArrowUpRight,
  Activity,
  Layers,
  Shield,
  Wifi,
  WifiOff,
  Crosshair
} from 'lucide-react';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { DualAgentDeck } from '../components/agents/DualAgentDeck';
import { api } from '../services/api';

interface LiveEvent {
  id: string;
  timestamp: string;
  source_ip: string;
  destination_ip: string;
  category: string;
  severity: string;
  raw_log: string;
  risk_score: number;
  attack_class: string;
  is_simulated: boolean;
}

export const Monitoring: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const wsRef = useRef<WebSocket | null>(null);

  // Initial load of latest events from REST
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await api.get<any>('/events?page_size=30');
        const formatted: LiveEvent[] = res.items.map((e: any) => ({
          id: e.id,
          timestamp: e.timestamp,
          source_ip: e.source_ip || '0.0.0.0',
          destination_ip: e.destination_ip || '0.0.0.0',
          category: e.event_category,
          severity: e.severity,
          raw_log: e.raw_log,
          risk_score: e.risk_score || 0,
          attack_class: e.layer3_class || 'Benign',
          is_simulated: e.is_simulated
        }));
        setEvents(formatted);
      } catch (err) {
        console.error('Failed to load initial events:', err);
      }
    };
    fetchLatest();
  }, []);

  // WebSocket Live Stream with auto-reconnection
  useEffect(() => {
    let reconnectTimeout: any;

    const connectWs = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/events`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        if (isPaused) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'NEW_SECURITY_EVENT') {
            setEvents((prev) => [payload.event, ...prev.slice(0, 99)]);
          }
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connectWs, 3000);
      };

      ws.onerror = () => {
        setIsConnected(false);
        ws.close();
      };
    };

    connectWs();

    return () => {
      clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
    };
  }, [isPaused]);

  // Filtered events
  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      search === '' ||
      e.source_ip.toLowerCase().includes(search.toLowerCase()) ||
      e.destination_ip.toLowerCase().includes(search.toLowerCase()) ||
      e.raw_log.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase()) ||
      e.attack_class.toLowerCase().includes(search.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || e.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2B2B2B]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-[#F5F5F2] tracking-tight">
              Real-Time Telemetry Stream
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${isConnected
                ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/40'
                : 'bg-red-950/50 text-red-400 border-red-800/40'
                }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
                  }`}
              />
              {isConnected ? 'WebSocket Active' : 'Disconnected (Reconnecting...)'}
            </span>
          </div>
          <p className="text-xs text-[#A8A8A3] mt-1">
            Live wire-speed security event stream broadcast directly from the AMTIE ingestion pipeline &amp; Dual-Agent network
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${isPaused
              ? 'bg-amber-950/40 border-amber-700/60 text-amber-400'
              : 'bg-[#111111] border-[#2B2B2B] text-[#F5F5F2] hover:bg-[#1A1A1A]'
              }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {isPaused ? 'Resume Stream' : 'Pause Stream'}
          </button>

          <button
            onClick={() => setEvents([])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111111] border border-[#2B2B2B] hover:border-red-800 text-xs font-medium text-[#A8A8A3] hover:text-red-400 transition-all"
            title="Clear Stream Buffer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Buffer
          </button>
        </div>
      </div>

      {/* Autonomous Dual-Agent Operations Deck */}
      <DualAgentDeck />

      {/* Control Bar: Search & Severity Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#A8A8A3] absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter stream by IP, event category, or payload..."
            className="w-full bg-[#111111] border border-[#2B2B2B] rounded-lg pl-9 pr-4 py-2 text-xs text-[#F5F5F2] placeholder-[#A8A8A3]/60 focus:outline-none focus:border-[#F5F5F2] font-mono transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#171717] border border-[#2B2B2B] p-1 rounded-lg">
          {['ALL', 'Critical', 'High', 'Medium', 'Low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${severityFilter === sev
                ? 'bg-[#2B2B2B] text-[#F5F5F2] shadow-sm border border-[#3E3E3E]'
                : 'text-[#A8A8A3] hover:text-[#F5F5F2]'
                }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Live Stream Table */}
      <div className="bg-[#111111] border border-[#2B2B2B] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#2B2B2B] bg-[#171717]/80 text-[#A8A8A3] font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-medium">Timestamp (UTC)</th>
                <th className="py-3 px-4 font-medium">Severity</th>
                <th className="py-3 px-4 font-medium">Risk Score</th>
                <th className="py-3 px-4 font-medium">Category</th>
                <th className="py-3 px-4 font-medium">Source IP</th>
                <th className="py-3 px-4 font-medium">Destination IP</th>
                <th className="py-3 px-4 font-medium">Predicted Class</th>
                <th className="py-3 px-4 font-medium">Raw Telemetry Snippet</th>
                <th className="py-3 px-4 text-right font-medium">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E1E1E]">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-[#A8A8A3] font-mono text-xs">
                    {search || severityFilter !== 'ALL'
                      ? 'No live events matching the active filter criteria.'
                      : 'Listening for incoming security telemetry on /ws/events...'}
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev, idx) => (
                  <tr
                    key={ev.id || idx}
                    className="hover:bg-[#171717] transition-colors group cursor-pointer"
                    onClick={() => navigate(`/events/${ev.id}`)}
                  >
                    <td className="py-3 px-4 font-mono text-[#A8A8A3] whitespace-nowrap">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <SeverityBadge severity={ev.severity} />
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold whitespace-nowrap">
                      <span
                        className={
                          ev.risk_score >= 80
                            ? 'text-red-400'
                            : ev.risk_score >= 60
                              ? 'text-orange-400'
                              : ev.risk_score >= 35
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                        }
                      >
                        {ev.risk_score.toFixed(1)}/100
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-[#F5F5F2] whitespace-nowrap">
                      {ev.category}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#F5F5F2] whitespace-nowrap">
                      {ev.source_ip}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#A8A8A3] whitespace-nowrap">
                      {ev.destination_ip}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-[#1A1A1A] border border-[#2B2B2B] text-[#F5F5F2] font-mono text-[11px]">
                        {ev.attack_class}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-[#A8A8A3] font-mono">
                      {ev.raw_log}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/events/${ev.id}`);
                        }}
                        className="p-1 rounded hover:bg-[#222222] text-[#A8A8A3] hover:text-[#F5F5F2] transition-colors"
                        title="View Full Drilldown"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
