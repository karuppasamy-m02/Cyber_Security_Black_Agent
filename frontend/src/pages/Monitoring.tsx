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
  WifiOff
} from 'lucide-react';
import { SeverityBadge } from '../components/ui/SeverityBadge';
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#263449]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              Real-Time Telemetry Stream
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${isConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/40'
                }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                  }`}
              />
              {isConnected ? 'WebSocket Active' : 'Disconnected (Reconnecting...)'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Live wire-speed security event stream broadcast directly from the AMTIE ingestion pipeline
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${isPaused
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 text-amber-700 dark:text-amber-400'
              : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-[#263449] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {isPaused ? 'Resume Stream' : 'Pause Stream'}
          </button>

          <button
            onClick={() => setEvents([])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263449] hover:border-red-300 dark:hover:border-red-800 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
            title="Clear Stream Buffer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Buffer
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Severity Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter stream by IP, event category, or payload..."
            className="w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263449] rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#172033] border border-slate-200 dark:border-[#263449] p-1 rounded-lg">
          {['ALL', 'Critical', 'High', 'Medium', 'Low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${severityFilter === sev
                ? 'bg-white dark:bg-[#111827] text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-[#263449]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Live Stream Table */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263449] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#263449] bg-slate-50 dark:bg-[#172033]/60 text-slate-500 dark:text-slate-400 font-mono text-[11px] uppercase tracking-wider">
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
            <tbody className="divide-y divide-slate-100 dark:divide-[#263449]/60">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400 font-mono text-xs">
                    {search || severityFilter !== 'ALL'
                      ? 'No live events matching the active filter criteria.'
                      : 'Listening for incoming security telemetry on /ws/events...'}
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev, idx) => (
                  <tr
                    key={ev.id || idx}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/events/${ev.id}`)}
                  >
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <SeverityBadge severity={ev.severity} />
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold whitespace-nowrap">
                      <span
                        className={
                          ev.risk_score >= 80
                            ? 'text-red-600 dark:text-red-400'
                            : ev.risk_score >= 60
                              ? 'text-amber-600 dark:text-amber-400'
                              : ev.risk_score >= 35
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                        }
                      >
                        {ev.risk_score.toFixed(1)}/100
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {ev.category}
                    </td>
                    <td className="py-3 px-4 font-mono text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {ev.source_ip}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {ev.destination_ip}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                        {ev.attack_class}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-500 dark:text-slate-400 font-mono">
                      {ev.raw_log}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/events/${ev.id}`);
                        }}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
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
