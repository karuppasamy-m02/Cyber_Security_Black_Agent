import React from 'react';
import { NavLink } from 'react-router-dom';
import {
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
  ChevronLeft,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import { Logo } from '../ui/Logo';
import { useAuthStore } from '../../stores/authStore';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: 'live' | 'accent' | 'default';
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { user } = useAuthStore();

  const navGroups: NavGroup[] = [
    {
      title: 'OVERVIEW',
      items: [
        { path: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
      ],
    },
    {
      title: 'MONITORING',
      items: [
        { path: '/monitoring', label: 'Live Monitoring', icon: Activity, badge: 'LIVE', badgeVariant: 'live' },
        { path: '/events', label: 'Security Events', icon: FileText },
      ],
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { path: '/threat-intelligence', label: 'Threat Intelligence', icon: Globe2 },
        { path: '/incidents', label: 'Incident Center', icon: AlertTriangle },
      ],
    },
    {
      title: 'AI & MODELS',
      items: [
        { path: '/ai-analyst', label: 'AI Security Analyst', icon: Bot, badge: 'Ollama', badgeVariant: 'accent' },
        { path: '/model-lab', label: 'Model Laboratory', icon: Cpu },
        { path: '/model-lab/evaluation', label: 'Model Evaluation', icon: Sliders },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { path: '/response-center', label: 'Response Center', icon: ShieldCheck },
        { path: '/audit-logs', label: 'Audit Logs', icon: History },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { path: '/users', label: 'User Management', icon: Users },
        { path: '/settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-200 select-none flex flex-col bg-[#0A0A0A] border-r border-[#2B2B2B] ${
        isOpen ? 'w-64' : 'w-16'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-3.5 border-b border-[#2B2B2B]">
        <Logo variant="sidebar" isCollapsed={!isOpen} />
        <button
          onClick={onToggle}
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className="p-1 rounded-md text-[#A8A8A3] hover:text-[#F5F5F2] hover:bg-[#1F1F1F] transition-colors"
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-0.5">
            {isOpen && (
              <div className="px-2.5 pb-1.5 text-[10px] font-mono font-semibold tracking-wider text-[#A8A8A3] uppercase">
                {group.title}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={!isOpen ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all group relative ${
                        isActive
                          ? 'bg-[#181818] text-[#F5F5F2] border border-[#2B2B2B]'
                          : 'text-[#A8A8A3] hover:bg-[#141414] hover:text-[#F5F5F2]'
                      } ${!isOpen ? 'justify-center px-0' : ''}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Active left indicator bar */}
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#F5F5F2] rounded-r" />
                        )}
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive
                              ? 'text-[#F5F5F2]'
                              : 'text-[#A8A8A3] group-hover:text-[#F5F5F2]'
                          }`}
                        />
                        {isOpen && (
                          <div className="flex-1 flex items-center justify-between min-w-0">
                            <span className="truncate">{item.label}</span>
                            {item.badge && (
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold tracking-wide ${
                                  item.badgeVariant === 'live'
                                    ? 'bg-[#121212] text-[#F5F5F2] border border-[#2B2B2B] flex items-center gap-1'
                                    : 'bg-[#151515] text-[#A8A8A3] border border-[#2B2B2B]'
                                }`}
                              >
                                {item.badgeVariant === 'live' && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                )}
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Profile Footer */}
      <div className="p-2.5 border-t border-[#2B2B2B]">
        <div
          className={`flex items-center gap-2.5 p-2 rounded-lg bg-[#121212] border border-[#2B2B2B] ${
            !isOpen ? 'justify-center p-1.5' : ''
          }`}
        >
          <div className="w-7 h-7 rounded-md bg-[#2B2B2B] border border-[#3D3D3D] flex items-center justify-center text-[#F5F5F2] text-xs font-semibold shrink-0">
            {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
          </div>
          {isOpen && (
            <div className="flex flex-col min-w-0 flex-1 leading-tight">
              <span className="text-xs font-semibold text-[#F5F5F2] truncate">
                {user?.full_name || user?.username || 'Operator'}
              </span>
              <span className="text-[10px] text-[#A8A8A3] font-mono truncate">
                {user?.role || 'Security Analyst'}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
