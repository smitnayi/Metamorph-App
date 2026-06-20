import React from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { useDataStore } from '../store/data';
import { useAuth } from '../contexts/AuthContext';
import { useRoleAccess } from '../hooks/useRoleAccess';
import { Users, LayoutList, Package, CheckSquare, Shield, ShieldAlert, BarChart2, Briefcase, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const { users, roles, inventory, orders, customers, tasks, qualityChecks } = useDataStore();
  const { currentUser } = useAuth();
  const { hasPermission } = useRoleAccess();

  // Allow only if user has manage all
  const canViewAdmin = hasPermission(currentUser as any, 'manage', 'all');

  if (!canViewAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Admin Access Required</h2>
          <p className="text-zinc-600 dark:text-zinc-400">You must be a system administrator to view this page.</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Users', value: users.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Roles Configured', value: roles.length, icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'Customers', value: customers.length, icon: Briefcase, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { title: 'Inventory Items', value: inventory.length, icon: Package, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { title: 'Active Orders', value: orders.filter(o => o.status !== 'Completed').length, icon: LayoutList, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { title: 'Pending Tasks', value: tasks.filter(t => t.status !== 'Done').length, icon: CheckSquare, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { title: 'Quality Audits', value: qualityChecks.length, icon: Activity, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">System Administration</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Comprehensive overview of system data and user metrics.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="bg-[#f4f4f5] dark:bg-[#111] border-black/5 dark:border-white/5">
            <CardContent className="p-4 md:p-6 flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-3 md:mb-4 shrink-0 ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color}`} />
              </div>
              <div className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white mb-1"><span className="tabular-nums">{stat.value}</span></div>
              <div className="text-[10px] md:text-sm font-bold text-zinc-500 uppercase tracking-widest leading-tight">{stat.title}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-[#f4f4f5] dark:bg-[#111] border-black/5 dark:border-white/5 relative overflow-hidden">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              Registered Users
            </h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {users.map(user => {
                const role = roles.find(r => r.id === user.roleId)?.name || 'Unknown';
                return (
                  <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-black/50 rounded-xl border border-black/5 dark:border-white/5 gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-zinc-900 dark:text-white truncate">{user.name}</div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 truncate">{user.email} <span className="opacity-50 mx-1">|</span> {user.phone || 'No Phone'}</div>
                    </div>
                    <div className="flex flex-row sm:flex-col sm:text-right items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-0 shrink-0">
                      <span className="inline-block px-3 py-1 bg-black/5 dark:bg-white/5 rounded-lg text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        {role}
                      </span>
                      <div className="text-xs text-zinc-500 sm:mt-1 uppercase tracking-wider">{user.department}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#f4f4f5] dark:bg-[#111] border-black/5 dark:border-white/5">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              Role Distribution
            </h2>
            <div className="space-y-4">
              {roles.map(role => {
                const userCount = users.filter(u => u.roleId === role.id).length;
                const percentage = users.length > 0 ? (userCount / users.length) * 100 : 0;
                return (
                  <div key={role.id}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">{role.name}</span>
                      <span className="text-zinc-500">{userCount} users</span>
                    </div>
                    <div className="h-2 w-full bg-white dark:bg-black rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
