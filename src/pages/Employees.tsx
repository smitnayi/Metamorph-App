import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { mockUsers } from '../store/mockData';
import { Shield, ShieldAlert, ShieldCheck, UserPlus, MoreVertical, Edit2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import Modal from '../components/ui/Modal';
import { User } from '../types';

const roleConfig = {
  'Admin': { icon: ShieldAlert, color: 'text-rose-600 bg-rose-50' },
  'Manager': { icon: ShieldCheck, color: 'text-orange-500 bg-orange-500/10' },
  'Worker': { icon: Shield, color: 'text-emerald-600 bg-emerald-50' },
  'Operator': { icon: Shield, color: 'text-emerald-600 bg-emerald-50' },
};

export default function Employees() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '', email: '', role: 'Operator', department: 'Production', status: 'Active'
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;
    const user: User = {
      id: Math.random().toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role as any,
      department: newUser.department!,
      status: newUser.status as any
    };
    setUsers([...users, user]);
    toast.success(`Invitation sent to ${user.email}`);
    setIsInviteModalOpen(false);
    setNewUser({ name: '', email: '', role: 'Operator', department: 'Production', status: 'Active' });
  };

  const toggleStatus = (id: string, currentStatus: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: currentStatus === 'Active' ? 'Offline' : 'Active' } : u));
    toast.success('User status updated');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <label className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-500">Personnel</label>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mt-1 text-white">Staff Directory</h1>
          <p className="text-zinc-400 mt-2 font-medium">Manage employee access, roles, and departmental assignment.</p>
        </div>
        <button 
          onClick={() => setIsInviteModalOpen(true)}
          className="inline-flex items-center justify-center bg-white px-6 py-3 text-sm font-bold uppercase tracking-widest text-black hover:bg-zinc-200 transition-colors"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Invite Staff
        </button>
      </div>

      <div className="border border-white/20 bg-[#111]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-black text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Role / Access Level</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {users.map((user) => {
                const configItem = roleConfig[user.role as keyof typeof roleConfig] || roleConfig['Operator'];
                const RoleIcon = configItem.icon;
                const roleColor = configItem.color;

                return (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-white/10 flex items-center justify-center font-black text-white">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white uppercase text-sm mb-0.5">{user.name}</div>
                          <div className="text-zinc-500 text-[10px] font-bold tracking-widest">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest gap-1.5", roleColor)}>
                        <RoleIcon className="h-3.5 w-3.5" />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-300 font-bold uppercase text-[11px] tracking-wider">
                      {user.department}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                        user.status === 'Active' ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-white/10 border-white/20 text-zinc-400"
                      )}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => toggleStatus(user.id, user.status)}
                        className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                      >
                        Toggle Status
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-[#111] border border-orange-500/30 p-6 flex gap-4 text-sm mt-6">
        <ShieldAlert className="h-6 w-6 text-orange-500 flex-shrink-0" />
        <div>
          <p className="font-bold tracking-widest text-[11px] uppercase text-orange-500 mb-1">Security & Permissions Notice</p>
          <p className="text-zinc-400 font-medium">Admins have full access to system configuration and metrics. Managers can adjust inventory and assign tasks. Operators have restricted access to task boards and QA logging only.</p>
        </div>
      </div>

      <Modal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} title="Invite Staff Member">
         <form onSubmit={handleInvite} className="space-y-4">
           <div>
             <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Full Name</label>
             <input type="text" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full px-4 py-3 border border-white/20 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors" />
           </div>
           <div>
             <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Email Address</label>
             <input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full px-4 py-3 border border-white/20 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors" />
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Role</label>
               <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})} className="w-full px-4 py-3 border border-white/20 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none">
                 <option value="Operator">Operator</option>
                 <option value="Manager">Manager</option>
                 <option value="Admin">Admin</option>
               </select>
             </div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Department</label>
               <input type="text" value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})} className="w-full px-4 py-3 border border-white/20 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors" />
             </div>
           </div>
           <button type="submit" className="w-full bg-white text-black font-black uppercase tracking-widest py-4 mt-6 hover:bg-zinc-200 transition-colors">
             Send Invitation
           </button>
         </form>
      </Modal>
    </div>
  );
}
