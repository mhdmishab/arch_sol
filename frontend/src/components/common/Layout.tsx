import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileCode, Cpu, HelpCircle, Layers } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'New Project', href: '/projects/new', icon: FileCode },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#080c14] text-gray-100">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#0d1321] border-r border-white/5 flex flex-col shrink-0">
        {/* Brand */}
        <div className="h-16 px-6 border-b border-white/5 flex items-center gap-3">
          <Layers className="h-6 w-6 text-violet-500 animate-pulse" />
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-400 via-indigo-200 to-white bg-clip-text text-transparent">
            ArchitectAI
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-violet-600/10 border border-violet-500/20 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.05)]'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 transition-transform group-hover:scale-105 ${
                  isActive ? 'text-violet-400' : 'text-gray-400 group-hover:text-gray-200'
                }`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer/Mode Info */}
        <div className="p-4 border-t border-white/5 bg-black/10">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 border border-white/5">
            <Cpu className="h-4.5 w-4.5 text-emerald-400" />
            <div>
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">MVP mode</p>
              <p className="text-[10px] text-gray-500">Requirement Analyzer v1.0</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 px-8 border-b border-white/5 bg-[#0d1321]/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-lg font-semibold text-gray-200">
            {location.pathname === '/' ? 'Solution Design Center' : 
             location.pathname === '/projects/new' ? 'Create Architecture Project' : 
             'Architecture Workspace'}
          </h1>
          <div className="flex items-center gap-4">
            <a 
              href="https://learn.microsoft.com/en-us/azure/architecture/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1.5"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Azure Architecture Center
            </a>
          </div>
        </header>

        {/* Content Panel */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
