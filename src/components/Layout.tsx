import React from "react";
import { NavLink, Outlet, useLocation, useNavigate, useResolvedPath, useMatch } from "react-router-dom";
import { ShieldCheck, LogOut, Home, BarChart2, Package, LayoutList, Shield, Users, Briefcase } from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/analytics", label: "Stats", icon: BarChart2 },
  { path: "/inventory", label: "Stock", icon: Package },
  { path: "/orders", label: "Jobs", icon: LayoutList },
  { path: "/quality", label: "QA", icon: Shield },
  { path: "/customers", label: "CRM", icon: Users },
  { path: "/employees", label: "Staff", icon: Briefcase },
];

function NavItemLink({ item, mobile = false }: { item: any; mobile?: boolean }) {
  const resolved = useResolvedPath(item.path);
  const match = useMatch({ path: resolved.pathname, end: item.path === "/" });
  const isActive = match !== null;

  if (mobile) {
    return (
      <NavLink
        to={item.path}
        className={cn(
          "flex flex-col items-center justify-center min-w-[56px] px-1 py-1 transition-colors rounded-xl",
          isActive ? "text-orange-500 pointer-events-none" : "text-zinc-500 hover:text-zinc-300 active:bg-white/5"
        )}
      >
        <div className={cn(
          "flex items-center justify-center h-8 w-8 rounded-full mb-1 transition-all",
          isActive ? "bg-orange-500/20" : "bg-transparent"
        )}>
          <item.icon className={cn("h-5 w-5", isActive ? "fill-orange-500/20" : "")} />
        </div>
        <span className="text-[9px] font-bold tracking-wide">{item.label}</span>
      </NavLink>
    );
  }

  return (
    <NavLink
      to={item.path}
      className={cn(
        "transition-colors pb-1 flex items-center gap-2 whitespace-nowrap border-b-2",
        isActive ? "text-orange-500 border-orange-500" : "border-transparent hover:text-white"
      )}
    >
      <item.icon className="h-4 w-4" />
      {item.label}
    </NavLink>
  );
}

export default function Layout() {

  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!currentUser) return null;

  return (
    <div className="h-[100dvh] w-full bg-[#111] text-white flex flex-col font-sans overflow-hidden">
      <nav className="h-16 md:h-20 border-b border-white/10 flex items-center px-4 md:px-8 bg-black shrink-0 relative z-50">
        <div className="flex items-center gap-4 md:gap-12 w-full justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-orange-500" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tighter uppercase italic whitespace-nowrap">
              METAMORPH
            </h1>
          </div>
          
          <div className="hidden md:flex gap-6 text-[11px] font-bold uppercase tracking-widest text-zinc-500 overflow-x-auto scrollbar-hide flex-1 pl-4">
            {navItems.map(item => (
              <NavItemLink key={item.path} item={item} />
            ))}
          </div>

          <div className="flex items-center gap-4 shrink-0 md:ml-auto group relative">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">{currentUser.role}</div>
              <div className="text-sm font-bold uppercase truncate max-w-[150px]">{currentUser.name.replace(" ", "_")}</div>
            </div>
            <div className="h-8 w-8 md:h-10 md:w-10 bg-white flex items-center justify-center text-black font-black cursor-pointer peer rounded-full md:rounded-none">
              {currentUser.name.charAt(0)}
            </div>
            
            <div className="absolute top-12 right-0 bg-black border border-white/10 p-2 hidden group-hover:block peer-hover:block hover:block w-48 shadow-2xl rounded-lg md:rounded-none z-50">
               <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-2 pt-1 truncate">{currentUser.email}</div>
               <button onClick={handleLogout} className="w-full text-left px-2 py-2 flex items-center text-sm font-bold text-white hover:bg-orange-500 hover:text-black transition-colors uppercase tracking-widest rounded md:rounded-none">
                 <LogOut className="h-4 w-4 mr-2" /> Logout
               </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-auto relative z-0 pb-[72px] md:pb-0 bg-[#0a0a0a]">
        <div className="h-full">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-black border-t border-white/10 flex items-center justify-around px-1 pb-safe z-50 overflow-x-auto scrollbar-hide pt-1 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
        {navItems.map(item => (
          <NavItemLink key={item.path} item={item} mobile />
        ))}
      </div>

      <footer className="hidden md:flex h-8 bg-black border-t border-white/10 items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase text-emerald-500 tracking-wider">System Online</span>
          </div>
          <div className="h-4 w-px bg-white/20"></div>
          <span className="text-[10px] font-bold uppercase text-zinc-500">Db: Mocked Layer</span>
        </div>
        <div className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">v4.22.1 - Authenticated</div>
      </footer>
    </div>
  );
}
