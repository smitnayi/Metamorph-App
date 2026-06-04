import React, { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate, useResolvedPath, useMatch } from "react-router-dom";
import { ShieldCheck, LogOut, Home, BarChart2, Package, LayoutList, Shield, Users, Briefcase, CheckSquare, Key, LucideIcon, ShieldAlert, Moon, Sun, Menu, X, PanelLeftClose, PanelLeftOpen, Wifi, WifiOff, RefreshCw, Search } from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";
import { useDataStore } from "../store/data";
import { useRoleAccess } from "../hooks/useRoleAccess";
import { Subject } from "../types";
import { useTheme } from "../store/theme";
import { motion, AnimatePresence } from "motion/react";
import GlobalSearch from "./GlobalSearch";
import QuickAdd from "./QuickAdd";
import InstallPwaPrompt from "./InstallPwaPrompt";

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  subject: Subject | 'all';
}

const ALL_NAV_ITEMS: NavItem[] = [
  { path: "/", label: "Home", icon: Home, subject: "all" },
  { path: "/admin", label: "Admin", icon: ShieldAlert, subject: "all" },
  { path: "/analytics", label: "Stats", icon: BarChart2, subject: "reports" },
  { path: "/inventory", label: "Stock", icon: Package, subject: "inventory" },
  { path: "/orders", label: "Jobs", icon: LayoutList, subject: "orders" },
  { path: "/tasks", label: "Tasks", icon: CheckSquare, subject: "tasks" },
  { path: "/quality", label: "QA", icon: Shield, subject: "quality" },
  { path: "/customers", label: "CRM", icon: Users, subject: "crm" },
  { path: "/employees", label: "Staff", icon: Briefcase, subject: "employees" },
  { path: "/roles", label: "Roles", icon: Key, subject: "settings" },
];

interface NavItemLinkProps {
  item: NavItem;
  mobile?: boolean;
  collapsed?: boolean;
}

const NavItemLink: React.FC<NavItemLinkProps> = ({ item, mobile = false, collapsed = false }) => {
  const resolved = useResolvedPath(item.path);
  const match = useMatch({ path: resolved.pathname, end: item.path === "/" });
  const isActive = match !== null;

  if (mobile) {
    return (
      <NavLink
        to={item.path}
        className={cn(
          "flex flex-col items-center justify-center min-w-[56px] px-1 py-1 transition-colors rounded-xl relative",
          isActive ? "text-orange-600 pointer-events-none" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-300 active:bg-black/5 dark:bg-white/5"
        )}
      >
        <div className="flex items-center justify-center h-8 w-8 rounded-full mb-1 transition-all z-10 w-full relative">
          <motion.div whileTap={{ scale: 0.85 }} className="flex justify-center items-center h-full w-full">
             <item.icon className={cn("h-[22px] w-[22px]", isActive ? "stroke-[2.5px] drop-shadow-md" : "")} />
          </motion.div>
          {isActive && (
            <motion.div layoutId="mobile-nav-bg" transition={{ type: "spring", stiffness: 350, damping: 25 }} className="absolute inset-0 m-auto h-10 w-10 md:h-11 md:w-11 rounded-full bg-orange-100 dark:bg-orange-500/20 z-[-1]" />
          )}
        </div>
      </NavLink>
    );
  }

  return (
    <NavLink
      to={item.path}
      className={cn(
        "transition-colors py-2.5 px-3 rounded-xl flex items-center whitespace-nowrap relative group",
        isActive ? "text-orange-600 dark:text-orange-500" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white",
        collapsed ? "justify-center" : "gap-3"
      )}
      title={collapsed ? item.label : undefined}
    >
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <item.icon className={cn("h-[18px] w-[18px] relative z-10 shrink-0", isActive ? "stroke-[2.5px]" : "stroke-2")} />
      </motion.div>
      <motion.span 
        initial={false}
        animate={{ 
          width: collapsed ? 0 : "auto", 
          opacity: collapsed ? 0 : 1,
          marginLeft: collapsed ? 0 : "12px"
        }}
        className={cn("relative z-10 text-[13px] tracking-wide overflow-hidden whitespace-nowrap", isActive ? "font-bold" : "font-medium")}
      >
        {item.label}
      </motion.span>
      {isActive ? (
        <motion.div layoutId="desktop-nav-bg" transition={{ type: "spring", stiffness: 400, damping: 25 }} className="absolute inset-0 bg-orange-50 dark:bg-orange-500/10 rounded-xl z-0 border border-orange-200/50 dark:border-orange-500/20" />
      ) : (
        <div className="absolute inset-0 bg-black/5 dark:bg-white/5 rounded-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all z-0" />
      )}
    </NavLink>
  );
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { hasPermission } = useRoleAccess();
  const { roles, users, setUsers } = useDataStore();
  const { isDark, toggleTheme } = useTheme();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  React.useEffect(() => {
    if (currentUser) {
      const exists = users.find(u => u.id === currentUser.uid || u.email === currentUser.email);
      if (!exists) {
        setUsers(prev => [
          ...prev, 
          { 
            id: currentUser.uid, 
            name: currentUser.name, 
            email: currentUser.email, 
            roleId: currentUser.roleId, 
            department: 'Unassigned', 
            status: 'Active' 
          }
        ]);
      } else if (exists.name !== currentUser.name || (currentUser.roleId === 'role-admin' && exists.roleId !== 'role-admin')) {
         setUsers(prev => prev.map(u => u.id === currentUser.uid || u.email === currentUser.email ? { ...u, name: currentUser.name, roleId: currentUser.roleId } : u));
      }
    }
  }, [currentUser, users, setUsers]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Showing all Nav Items to ensure visibility of features requested
  const navItems = ALL_NAV_ITEMS;

  if (!currentUser) return null;

  const currentRoleName = roles.find(r => r.id === currentUser.roleId)?.name || 'Unknown Role';

  return (
    <div className="h-[100dvh] w-full bg-transparent text-zinc-900 dark:text-white flex font-sans overflow-hidden transition-colors duration-500">
      
      {/* Desktop Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarCollapsed ? 80 : 256 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="hidden md:flex flex-col border-r border-black/5 dark:border-white/5 bg-white/70 dark:bg-[#0a0a0a]/70 backdrop-blur-2xl shrink-0 z-20 shadow-[0_0_40px_rgba(0,0,0,0.02)] dark:shadow-[0_0_40px_rgba(0,0,0,0.2)] pt-6 whitespace-nowrap overflow-hidden relative"
      >
        <div className={cn("px-6 mb-8 flex flex-col gap-1 items-center md:items-start", isSidebarCollapsed && "items-center px-0")}>
          <div className={cn("flex items-center gap-3", isSidebarCollapsed ? "justify-center w-full" : "")}>
             <div className="h-8 w-8 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
                <img src="/logo.png" alt="Metamorph Logo" className="h-5 w-5 object-cover object-left filter brightness-0 invert" />
             </div>
             {!isSidebarCollapsed && <h1 className="text-xl font-black tracking-tighter uppercase italic">Metamorph</h1>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 flex flex-col gap-1 pb-6 w-full">
           {navItems.map(item => (
             <NavItemLink key={item.path} item={item} collapsed={isSidebarCollapsed} />
           ))}
        </div>

        <div className="p-4 mt-auto border-t border-black/5 dark:border-white/5 flex flex-col gap-4">
           <div className={cn("flex items-center", isSidebarCollapsed ? "justify-center flex-col gap-3" : "justify-between px-2")}>
             <button onClick={toggleTheme} className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0">
               {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4 text-zinc-600" />}
             </button>
             <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0">
               {isSidebarCollapsed ? <PanelLeftOpen className="h-4 w-4 text-zinc-600 dark:text-zinc-400" /> : <PanelLeftClose className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />}
             </button>
             <button onClick={handleLogout} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500 transition-colors shrink-0">
                <LogOut className="h-4 w-4" />
             </button>
           </div>
           
           <div className={cn("flex items-center bg-black/5 dark:bg-white/5 p-3 rounded-xl cursor-default transition-all duration-300", isSidebarCollapsed ? "justify-center px-0 bg-transparent" : "gap-3")}>
             <div className="h-10 w-10 bg-white dark:bg-[#222] shadow-sm rounded-lg flex items-center justify-center text-zinc-900 dark:text-white font-black text-lg border border-black/5 dark:border-transparent shrink-0">
                {currentUser.name.charAt(0)}
             </div>
             {!isSidebarCollapsed && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col truncate pr-2">
                  <span className="text-[10px] font-bold text-orange-600 dark:text-orange-500 uppercase tracking-widest leading-none mb-1">{currentRoleName}</span>
                  <span className="text-sm font-bold truncate leading-none">{currentUser.name}</span>
               </motion.div>
             )}
           </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden bg-transparent">
        
        {/* Sync Status - Desktop Floating or Mobile Header */}
        <div className="absolute top-4 right-4 z-40 hidden md:flex items-center gap-4">
           {/* Global Search Hint */}
           <div className="flex items-center gap-2 bg-white/60 dark:bg-[#111]/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-black/5 dark:border-white/5 shadow-sm text-xs font-medium text-zinc-500">
             <Search className="h-3.5 w-3.5" />
             <span className="hidden lg:inline">Search</span>
             <kbd className="font-sans font-bold bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded text-[10px]">⌘K</kbd>
           </div>
           
           {/* Connectivity Indicator */}
           <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm text-xs font-bold uppercase tracking-widest backdrop-blur-md", 
               isOnline ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
           )}>
             {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
             {isOnline ? <span>Live</span> : <span>Offline</span>}
           </div>
        </div>

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between h-16 px-4 bg-white/80 dark:bg-[#111]/80 backdrop-blur-md border-b border-black/5 dark:border-white/5 z-30 shrink-0">
          <div className="flex items-center gap-2">
             <div className="h-8 w-8 rounded-[10px] bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <img src="/logo.png" alt="Metamorph Logo" className="h-4 w-4 filter brightness-0 invert" />
             </div>
             <h1 className="text-lg font-black tracking-tighter uppercase italic">Metamorph</h1>
          </div>
          <button onClick={toggleTheme} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
             {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px] text-zinc-600" />}
          </button>
        </header>

        <div className="flex-1 overflow-auto relative">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.99 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="min-h-full pb-24 md:pb-0"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 rounded-[20px] bg-white/90 dark:bg-[#1a1a1a]/90 flex items-center justify-between px-2 h-[68px] z-50 shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl border border-white/50 dark:border-white/10">
        {navItems.slice(0, 4).map(item => (
          <NavItemLink key={item.path} item={item} mobile />
        ))}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center min-w-[56px] px-1 py-1 transition-colors rounded-xl text-zinc-500 hover:text-zinc-700 dark:text-zinc-300"
        >
          <div className="flex items-center justify-center h-8 w-8 rounded-full mb-1 transition-all bg-transparent">
            <Menu className="h-[22px] w-[22px] stroke-2" />
          </div>
        </button>
      </div>

      {/* Mobile More Menu Full Screen */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-[60] bg-white/95 dark:bg-[#111]/95 backdrop-blur-xl flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-black/5 dark:border-white/5">
               <span className="font-black text-xl tracking-tighter uppercase italic">Menu</span>
               <button onClick={() => setMobileMenuOpen(false)} className="h-10 w-10 flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-full">
                  <X className="h-5 w-5" />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-2 pb-8">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <NavLink
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) => cn(
                      "flex items-center gap-4 p-4 rounded-2xl transition-all",
                      isActive 
                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                        : "bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 active:scale-95"
                    )}
                  >
                    <item.icon className={cn("h-6 w-6")} />
                    <span className="font-bold tracking-wide text-[15px]">{item.label}</span>
                  </NavLink>
                </motion.div>
              ))}
            </div>
            
            <div className="p-6 pb-12 border-t border-black/5 dark:border-white/5 flex gap-4">
               <div className="flex-1 flex items-center gap-3">
                 <div className="h-12 w-12 bg-black/5 dark:bg-white/5 rounded-xl flex items-center justify-center font-black text-xl">
                    {currentUser.name.charAt(0)}
                 </div>
                 <div className="flex flex-col flex-1 truncate">
                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">{currentRoleName}</span>
                    <span className="text-base font-bold truncate">{currentUser.name}</span>
                 </div>
               </div>
               <button onClick={handleLogout} className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 shrink-0">
                  <LogOut className="h-5 w-5" />
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <GlobalSearch />
      <QuickAdd />
      <InstallPwaPrompt />
    </div>
  );
}
