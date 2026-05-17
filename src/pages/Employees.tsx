import React from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { mockUsers } from '../store/mockData';
import { Shield, ShieldAlert, ShieldCheck, UserPlus, MoreVertical } from 'lucide-react';
import { cn } from '../lib/utils';

const roleConfig = {
  'Admin': { icon: ShieldAlert, color: 'text-rose-600 bg-rose-50' },
  'Manager': { icon: ShieldCheck, color: 'text-orange-500 bg-orange-500/10' },
  'Worker': { icon: Shield, color: 'text-emerald-600 bg-emerald-50' },
};

export default function Employees() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight tracking-tight text-white">Staff Directory</h1>
          <p className="text-zinc-500">Manage employee access, roles, and departmental assignment.</p>
        </div>
        <button className="inline-flex items-center justify-center rounded-none-none bg-orange-500 text-black border border-orange-500 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-black shadow-none hover:bg-orange-500/10 transition-colors">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Staff
        </button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-black text-zinc-500 font-medium">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Role / Access Level</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {mockUsers.map((user) => {
                const RoleIcon = roleConfig[user.role as keyof typeof roleConfig].icon;
                const roleColor = roleConfig[user.role as keyof typeof roleConfig].color;

                return (
                  <tr key={user.id} className="hover:bg-black transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-none-none bg-black/10 flex items-center justify-center font-bold text-zinc-400">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{user.name}</div>
                          <div className="text-zinc-500 text-xs">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex items-center px-2.5 py-1 rounded-none-none text-xs font-bold gap-1.5", roleColor)}>
                        <RoleIcon className="h-3.5 w-3.5" />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white font-medium">
                      {user.department}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 text-emerald-400">
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-zinc-600 hover:text-white transition-colors rounded-none-none hover:bg-[#222]">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
      
      <div className="bg-blue-50 border border-blue-200 rounded-none-none p-4 flex gap-3 text-sm text-blue-400">
        <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Security & Permissions Notice</p>
          <p className="mt-1 opacity-90">Admins have full access to system configuration and metrics. Managers can adjust inventory and assign tasks. Workers have restricted access to task boards and QA logging only.</p>
        </div>
      </div>
    </div>
  );
}
