import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  Search,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { CommandPalette } from '../ui/CommandPalette';

interface NavbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [aiStatus, setAiStatus] = useState<{ is_running: boolean; model: string }>({
    is_running: false,
    model: 'qwen2.5:7b',
  });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  useEffect(() => {
    const checkAI = async () => {
      try {
        const res = await api.get<any>('/ai/status');
        setAiStatus({
          is_running: res.is_running,
          model: res.selected_model || 'qwen2.5:7b',
        });
      } catch (e) {
        setAiStatus({ is_running: false, model: 'Offline' });
      }
    };
    checkAI();
    const interval = setInterval(checkAI, 25000);
    return () => clearInterval(interval);
  }, []);

  // Compute clean breadcrumb hierarchy
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/dashboard') return [{ label: 'Overview' }, { label: 'Command Center' }];
    if (path === '/monitoring') return [{ label: 'Monitoring' }, { label: 'Live Telemetry' }];
    if (path === '/events') return [{ label: 'Monitoring' }, { label: 'Security Events' }];
    if (path.startsWith('/events/')) return [{ label: 'Monitoring' }, { label: 'Security Events', href: '/events' }, { label: 'Event Details' }];
    if (path === '/incidents') return [{ label: 'Intelligence' }, { label: 'Incident Center' }];
    if (path.startsWith('/incidents/')) return [{ label: 'Intelligence' }, { label: 'Incident Center', href: '/incidents' }, { label: 'Investigation' }];
    if (path === '/attacks') return [{ label: 'Intelligence' }, { label: 'Attack Scenarios Demonstrator' }];
    if (path === '/threat-intelligence') return [{ label: 'Intelligence' }, { label: 'Threat Intelligence' }];
    if (path === '/ai-analyst') return [{ label: 'AI & Models' }, { label: 'Ollama AI Security Analyst' }];
    if (path === '/model-lab') return [{ label: 'AI & Models' }, { label: 'Model Laboratory' }];
    if (path === '/model-lab/training') return [{ label: 'AI & Models' }, { label: 'Autoencoder Training' }];
    if (path === '/model-lab/evaluation') return [{ label: 'AI & Models' }, { label: 'Model Evaluation' }];
    if (path === '/response-center') return [{ label: 'Operations' }, { label: 'Response Center' }];
    if (path === '/audit-logs') return [{ label: 'Operations' }, { label: 'Audit Logs' }];
    if (path === '/users') return [{ label: 'System' }, { label: 'User Management' }];
    if (path.startsWith('/settings')) return [{ label: 'System' }, { label: 'Settings' }];
    return [{ label: 'CYBER BLACK' }, { label: 'SOC' }];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <>
      <header className="h-14 border-b border-[#2B2B2B] bg-[#0A0A0A]/95 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30 transition-colors select-none">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-[#A8A8A3]">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.label}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#555552] shrink-0" />}
              {crumb.href ? (
                <button
                  onClick={() => navigate(crumb.href!)}
                  className="hover:text-[#F5F5F2] transition-colors"
                >
                  {crumb.label}
                </button>
              ) : (
                <span
                  className={
                    idx === breadcrumbs.length - 1
                      ? 'font-medium text-[#F5F5F2]'
                      : ''
                  }
                >
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Center/Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Global Search / Command Palette Trigger */}
          <button
            onClick={() => setIsCommandOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs bg-[#121212] hover:bg-[#181818] border border-[#2B2B2B] text-[#A8A8A3] hover:text-[#F5F5F2] transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-[#A8A8A3]" />
            <span className="hidden sm:inline">Search telemetry, IoCs, actions...</span>
            <span className="sm:hidden">Search...</span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-[#1A1A1A] text-[#A8A8A3] rounded border border-[#2B2B2B]">
              ⌘K
            </kbd>
          </button>

          {/* Local Ollama Status Indicator */}
          <div
            title={`Ollama Local AI Service: ${aiStatus.is_running ? 'Online (' + aiStatus.model + ')' : 'Offline'}`}
            className={`hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md text-xs border font-mono ${
              aiStatus.is_running
                ? 'bg-[#121212] text-[#F5F5F2] border-[#2B2B2B]'
                : 'bg-[#121212] text-[#A8A8A3] border-[#2B2B2B]'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                aiStatus.is_running ? 'bg-emerald-400' : 'bg-[#555552]'
              }`}
            />
            <span className="text-[11px] font-semibold text-[#A8A8A3]">Ollama:</span>
            <span className="text-[11px] text-[#F5F5F2]">
              {aiStatus.is_running ? aiStatus.model : 'Offline'}
            </span>
          </div>

          {/* Notification Center */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 rounded-md text-[#A8A8A3] hover:text-[#F5F5F2] hover:bg-[#161616] border border-[#2B2B2B] relative transition-all"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#F5F5F2]" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-[#121212] border border-[#2B2B2B] rounded-lg shadow-popover py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 pb-2 border-b border-[#2B2B2B] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#F5F5F2]">
                    System Security Feed
                  </span>
                  <span className="text-[10px] text-[#A8A8A3] font-mono">Real-Time</span>
                </div>
                <div className="divide-y divide-[#2B2B2B] text-xs">
                  <div className="p-3 hover:bg-[#181818] cursor-pointer transition-colors">
                    <p className="font-medium text-[#F5F5F2]">
                      AMTIE 5-Layer Engine Online
                    </p>
                    <p className="text-[11px] text-[#A8A8A3] mt-0.5">
                      Deterministic Rules, Isolation Forest, XGBoost active
                    </p>
                    <span className="text-[10px] font-mono text-[#767672] mt-1 block">Active</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-[#2B2B2B]" />

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 pl-2 rounded-md hover:bg-[#161616] border border-[#2B2B2B] transition-all"
            >
              <div className="w-6 h-6 rounded-md bg-[#2B2B2B] border border-[#3D3D3D] flex items-center justify-center text-[#F5F5F2] text-xs font-semibold">
                {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
              </div>
              <span className="text-xs font-medium text-[#F5F5F2] hidden sm:inline">
                {user?.username || 'Operator'}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-[#121212] border border-[#2B2B2B] rounded-lg shadow-popover py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-[#2B2B2B]">
                  <p className="text-xs font-semibold text-[#F5F5F2]">
                    {user?.full_name || user?.username}
                  </p>
                  <p className="text-[11px] text-[#A8A8A3] font-mono truncate">
                    {user?.email || 'admin@cyberblack.local'}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#181818] text-[#F5F5F2] border border-[#2B2B2B]">
                    {user?.role || 'Administrator'}
                  </span>
                </div>
                <div className="py-1 text-xs">
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-[#A8A8A3] hover:text-[#F5F5F2] hover:bg-[#181818] transition-colors"
                  >
                    System Settings
                  </button>
                  <button
                    onClick={() => {
                      navigate('/audit-logs');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-[#A8A8A3] hover:text-[#F5F5F2] hover:bg-[#181818] transition-colors"
                  >
                    Audit Activity
                  </button>
                </div>
                <div className="border-t border-[#2B2B2B] pt-1">
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-950/20 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </>
  );
};
