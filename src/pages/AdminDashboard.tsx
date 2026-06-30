import React from 'react';
import { useDataStore } from '../store/data';
import { useAuth } from '../contexts/AuthContext';
import { useRoleAccess } from '../hooks/useRoleAccess';
import { usePin } from '../contexts/PinContext';
import { Users, LayoutList, Package, CheckSquare, Shield, ShieldAlert, BarChart2, Briefcase, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { users, roles, inventory, orders, customers, tasks, qualityChecks, clearTransactionalData } = useDataStore();
  const { currentUser } = useAuth();
  const { hasPermission } = useRoleAccess();
  const { requirePin } = usePin();

  // Allow only if user has manage all
  const canViewAdmin = hasPermission(currentUser as any, 'manage', 'all');

  const handleClearData = () => {
    requirePin(() => {
      clearTransactionalData();
      toast.success("Transactional data has been successfully cleared for launch.");
    }, "WARNING: This will permanently delete ALL transactional data. Enter PIN (0000) to confirm.");
  };

  if (!canViewAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto" />
          <h2 className="text-2xl font-semibold uppercase tracking-tight text-zinc-900 dark:text-white">Admin Access Required</h2>
          <p className="text-zinc-600 dark:text-zinc-400 font-medium">You must be a system administrator to view this page.</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Users', value: users.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
    { title: 'Roles Configured', value: roles.length, icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { title: 'Customers', value: customers.length, icon: Briefcase, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20' },
    { title: 'Inventory Items', value: inventory.length, icon: Package, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20' },
    { title: 'Active Orders', value: orders.filter(o => o.status !== 'Completed').length, icon: LayoutList, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20' },
    { title: 'Pending Tasks', value: tasks.filter(t => t.status !== 'Done').length, icon: CheckSquare, color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    { title: 'Quality Audits', value: qualityChecks.length, icon: Activity, color: 'text-cyan-500', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto p-4 md:p-8 space-y-8"
    >
      <div className="flex justify-between items-start">
        <div>
          <label className="text-xs md:text-xs font-semibold text-orange-500">Overview</label>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mt-1 text-zinc-900 dark:text-white">System Administration</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2 font-medium text-sm">Comprehensive overview of system data and user metrics.</p>
        </div>
        <button
          onClick={handleClearData}
          className="px-4 py-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-lg text-sm font-semibold hover:bg-rose-500 hover:text-white transition-colors shadow-sm active:scale-95"
        >
          Clear All Data
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-[32px] p-6 hover:border-orange-500/50 hover:shadow-xl transition-all h-full relative overflow-hidden group hover:scale-[1.02] cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 dark:bg-white/5 rounded-bl-[100px] -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl"></div>
            <div className="flex flex-col items-start relative z-10">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 shrink-0 border ${stat.bg}`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <div className="text-4xl font-semibold text-zinc-900 dark:text-white mb-2 tracking-tight group-hover:text-orange-500 transition-colors"><span className="tabular-nums">{stat.value}</span></div>
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] leading-tight">{stat.title}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-[32px] p-8 relative overflow-hidden">
            <h2 className="text-xs font-semibold text-zinc-900 dark:text-white mb-8 flex items-center gap-3">
              <div className="w-8 h-8 rounded-[10px] bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <Users className="w-4 h-4 text-orange-500" />
              </div>
              Registered Users
            </h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {users.map((user, idx) => {
                const role = roles.find(r => r.id === user.roleId)?.name || 'Unknown';
                return (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={user.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white/60 dark:bg-black/40 backdrop-blur-md rounded-[24px] border border-black/5 dark:border-white/5 gap-4 hover:border-orange-500/30 hover:shadow-md transition-all group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-zinc-900 dark:text-white truncate text-sm group-hover:text-orange-500 transition-colors">{user.name}</div>
                      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate mt-1 flex items-center gap-2">
                        {user.email} <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span> {user.phone || 'No Phone'}
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col sm:text-right items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-1.5 shrink-0">
                      <span className="inline-block px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.1em]">
                        {role}
                      </span>
                      <div className="text-xs font-semibold text-zinc-400 uppercase tracking-[0.1em]">{user.department}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
        </div>

        <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-[32px] p-8">
            <h2 className="text-xs font-semibold text-zinc-900 dark:text-white mb-8 flex items-center gap-3">
              <div className="w-8 h-8 rounded-[10px] bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <Shield className="w-4 h-4 text-orange-500" />
              </div>
              Role Distribution
            </h2>
            <div className="space-y-8">
              {roles.map((role, idx) => {
                const userCount = users.filter(u => u.roleId === role.id).length;
                const percentage = users.length > 0 ? (userCount / users.length) * 100 : 0;
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={role.id}
                  >
                    <div className="flex justify-between items-end mb-3">
                      <span className="font-semibold text-zinc-900 dark:text-white text-sm">{role.name}</span>
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em]">{userCount} users</span>
                    </div>
                    <div className="h-3 w-full bg-black/5 dark:bg-white/5 rounded-[4px] overflow-hidden border border-black/5 dark:border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-orange-500 rounded-[4px]" 
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
        </div>
      </div>
    </motion.div>
  );
}
