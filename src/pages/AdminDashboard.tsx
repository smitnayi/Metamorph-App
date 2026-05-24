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
          <h2 className="text-2xl font-bold text-white">Admin Access Required</h2>
          <p className="text-zinc-400">You must be a system administrator to view this page.</p>
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
        <h1 className="text-2xl font-bold text-white mb-2">System Administration</h1>
        <p className="text-zinc-400">Comprehensive overview of system data and user metrics.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="bg-[#111] border-white/5">
            <CardContent className="p-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
              <div className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{stat.title}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-[#111] border-white/5 relative overflow-hidden">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-zinc-400" />
              Registered Users
            </h2>
            <div className="space-y-4">
              {users.slice(0, 5).map(user => {
                const role = roles.find(r => r.id === user.roleId)?.name || 'Unknown';
                return (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-black/50 rounded-xl border border-white/5">
                    <div>
                      <div className="font-bold text-white">{user.name}</div>
                      <div className="text-sm text-zinc-400">{user.email}</div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 bg-white/5 rounded-lg text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        {role}
                      </span>
                      <div className="text-xs text-zinc-500 mt-1 uppercase tracking-wider">{user.department}</div>
                    </div>
                  </div>
                );
              })}
              {users.length > 5 && (
                <div className="text-center pt-2">
                  <span className="text-sm text-zinc-500 font-medium">+{users.length - 5} more users</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-white/5">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-zinc-400" />
              Role Distribution
            </h2>
            <div className="space-y-4">
              {roles.map(role => {
                const userCount = users.filter(u => u.roleId === role.id).length;
                const percentage = users.length > 0 ? (userCount / users.length) * 100 : 0;
                return (
                  <div key={role.id}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-zinc-300">{role.name}</span>
                      <span className="text-zinc-500">{userCount} users</span>
                    </div>
                    <div className="h-2 w-full bg-black rounded-full overflow-hidden">
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
