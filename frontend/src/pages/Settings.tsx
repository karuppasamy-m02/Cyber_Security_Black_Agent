import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Settings as SettingsIcon, Bot, Server } from 'lucide-react';

export const Settings: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/settings', label: 'General & Database Administration', icon: Server, exact: true },
    { path: '/settings/ai', label: 'Local Ollama AI Parameters', icon: Bot },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-[#2B2B2B]">
        <div className="flex items-center gap-2.5">
          <SettingsIcon className="w-5 h-5 text-[#F5F5F2]" />
          <h1 className="text-xl font-semibold text-[#F5F5F2] tracking-tight">
            CYBER BLACK Platform Administration
          </h1>
        </div>
        <p className="text-xs text-[#A8A8A3] mt-1 font-mono">
          Manage system health, database state truncation, and local Ollama neural model parameters
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2B2B2B] gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? location.pathname === '/settings' || location.pathname === '/settings/system'
            : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all font-mono ${
                isActive
                  ? 'border-[#F5F5F2] text-[#F5F5F2] bg-[#161616]'
                  : 'border-transparent text-[#A8A8A3] hover:text-[#F5F5F2] hover:bg-[#121212]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          );
        })}
      </div>

      {/* Sub-view Content */}
      <Outlet />
    </div>
  );
};
