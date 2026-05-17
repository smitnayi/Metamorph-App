import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { mockUsers } from '../store/mockData';

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/analytics', label: 'Analytics' },
  { path: '/inventory', label: 'Inventory' },
  { path: '/orders', label: 'Orders' },
  { path: '/tasks', label: 'Tasks' },
  { path: '/quality', label: 'Quality' },
  { path: '/customers', label: 'CRM' },
  { path: '/employees', label: 'Staff' },
];

export default function Layout() {
  const location = useLocation();
  const currentUser = mockUsers[0];

  return (
    <div className="h-screen w-full bg-[#111] text-white flex flex-col font-sans overflow-hidden">
      <nav className="h-20 border-b border-white/20 flex items-center justify-between px-4 md:px-8 bg-black shrink-0">
        <div className="flex items-center gap-12 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-orange-500" />
            <h1 className="text-xl sm:text-3xl font-black tracking-tighter uppercase italic whitespace-nowrap">METAMORPH METAL</h1>
          </div>
          <div className="hidden md:flex gap-8 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
            {navItems.map(item => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "transition-colors pb-1 whitespace-nowrap",
                    isActive ? "text-white border-b-2 border-white" : "hover:text-zinc-300"
                  )}
                >
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0 ml-4">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Operator</div>
            <div className="text-sm font-bold uppercase">{currentUser.name.replace(' ', '_')}</div>
          </div>
          <div className="h-10 w-10 bg-white flex items-center justify-center text-black font-black">
            {currentUser.name.charAt(0)}
          </div>
        </div>
      </nav>

      <div className="md:hidden flex overflow-x-auto gap-6 px-4 py-3 bg-black border-b border-white/10 text-[10px] font-bold uppercase tracking-widest text-zinc-500 scrollbar-hide">
         {navItems.map(item => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "transition-colors pb-1 whitespace-nowrap",
                  isActive ? "text-white border-b-2 border-white" : "hover:text-zinc-300"
                )}
              >
                {item.label}
              </NavLink>
            );
          })}
      </div>

      <main className="flex-1 overflow-auto">
        <div className="h-full">
          <Outlet />
        </div>
      </main>

      <footer className="h-12 border-t border-white/20 bg-black flex items-center px-8 justify-between shrink-0 hidden sm:flex">
        <div className="flex gap-6 items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase text-emerald-500 tracking-wider">System Online</span>
          </div>
          <div className="h-4 w-px bg-white/20"></div>
          <span className="text-[10px] font-bold uppercase text-zinc-500">Sync Latency: 4ms</span>
        </div>
        <div className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">v4.22.1 - Robust Session</div>
      </footer>
    </div>
  );
}
