import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Activity,
  FileText,
  AlertTriangle,
  Globe2,
  Bot,
  Cpu,
  ShieldCheck,
  History,
  Users,
  Settings,
  ArrowRight,
  X
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickLinks = [
    { label: 'Command Center', path: '/dashboard', icon: LayoutDashboard, category: 'Overview' },
    { label: 'Live Monitoring Telemetry', path: '/monitoring', icon: Activity, category: 'Monitoring' },
    { label: 'Security Events Explorer', path: '/events', icon: FileText, category: 'Monitoring' },
    { label: 'Incident Management Center', path: '/incidents', icon: AlertTriangle, category: 'Intelligence' },
    { label: 'Threat Intelligence & IoCs', path: '/threat-intelligence', icon: Globe2, category: 'Intelligence' },
    { label: 'Ollama AI Security Analyst', path: '/ai-analyst', icon: Bot, category: 'AI & Models' },
    { label: 'Machine Learning Model Lab', path: '/model-lab', icon: Cpu, category: 'AI & Models' },
    { label: 'Response & Automation Actions', path: '/response-center', icon: ShieldCheck, category: 'Operations' },
    { label: 'Audit Activity Logs', path: '/audit-logs', icon: History, category: 'Operations' },
    { label: 'User Access Control', path: '/users', icon: Users, category: 'System' },
    { label: 'Platform & Database Settings', path: '/settings', icon: Settings, category: 'System' },
  ];

  const filteredLinks = query.trim()
    ? quickLinks.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : quickLinks;

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-[#121212] rounded-xl shadow-popover border border-[#2B2B2B] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[#2B2B2B] gap-3 bg-[#0A0A0A]">
          <Search className="w-5 h-5 text-[#A8A8A3] shrink-0" />
          <input
            type="text"
            placeholder="Type a command, page, or destination..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-[#F5F5F2] placeholder:text-[#A8A8A3]/60 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-[#A8A8A3] hover:text-[#F5F5F2] hover:bg-[#1A1A1A] rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          <div className="px-3 pt-2 pb-1 text-[11px] font-mono font-semibold text-[#A8A8A3] uppercase tracking-wider">
            Navigation
          </div>

          {filteredLinks.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-[#A8A8A3]">
              No matching pages found for "{query}".
            </div>
          ) : (
            filteredLinks.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.path}
                  onClick={() => handleSelect(item.path)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-[#F5F5F2] hover:bg-[#1C1C1C] cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-[#A8A8A3] group-hover:text-[#F5F5F2] transition-colors" />
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#A8A8A3] font-mono">
                      {item.category}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#555552] group-hover:text-[#F5F5F2]" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-[#2B2B2B] bg-[#0A0A0A] flex items-center justify-between text-[11px] text-[#A8A8A3] font-mono">
          <span>Use &uarr; &darr; to navigate</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
