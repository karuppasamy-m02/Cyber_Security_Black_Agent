import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useThemeStore } from '../../stores/themeStore';

export const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { theme } = useThemeStore();

  useEffect(() => {
    // Ensure document root has proper theme class on mount
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F2] flex selection:bg-[#2B2B2B] selection:text-[#F5F5F2] transition-colors">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
          isSidebarOpen ? 'ml-64' : 'ml-16'
        }`}
      >
        <Navbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="flex-1 p-5 md:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
