import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { useDataStore } from '../store/data';
import { Shield, ShieldAlert, ShieldCheck, UserPlus, MoreVertical, Edit2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import Modal from '../components/ui/Modal';
import { User } from '../types';

export default function Employees() {
  const { users, setUsers, roles } = useDataStore();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '', email: '', roleId: roles[0]?.id || '', department: 'Production', status: 'Active'
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;
    const user: User = {
      id: Math.random().toString(),
      name: newUser.name,
      email: newUser.email,
      roleId: newUser.roleId || roles[0]?.id || '',
      department: newUser.department!,
      status: newUser.status as any
    };
    setUsers([...users, user]);
    toast.success(`Invitation sent to ${user.email}`);
    setIsInviteModalOpen(false);
    setNewUser({ name: '', email: '', roleId: roles[0]?.id || '', department: 'Production', status: 'Active' });
  };

  const toggleStatus = (id: string, currentStatus: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: currentStatus === 'Active' as any ? 'Inactive' as any : 'Active' as any } : u));
    toast.success('User status updated');
  };

  const getRoleName = (roleId: string) => {
    return roles.find(r => r.id === roleId)?.name || 'Unknown Role';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8 md:p-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-orange-500">Personnel</label>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mt-1 text-zinc-900 dark:text-white">Staff Directory</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2 font-medium text-sm">Manage employee access, roles, and departmental assignment.</p>
        </div>
        <button 
          onClick={() => setIsInviteModalOpen(true)}
          className="inline-flex items-center justify-center bg-white px-6 py-3 md:py-4 rounded-xl text-sm font-black uppercase tracking-widest text-black hover:bg-zinc-200 transition-colors shadow-lg active:scale-95"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Invite Staff
        </button>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {users.map((user) => {
          return (
            <div key={user.id} className="bg-[#f4f4f5] dark:bg-[#111] border border-black/5 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center font-black text-zinc-900 dark:text-white text-lg">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-zinc-900 dark:text-white uppercase text-sm mb-0.5">{user.name}</div>
                    <div className="text-zinc-500 text-[10px] font-bold tracking-widest">{user.email}</div>
                  </div>
                </div>
                <button 
                  onClick={() => toggleStatus(user.id, user.status)}
                  className={cn(
                    "inline-flex items-center px-2 py-1 rounded-[6px] text-[9px] font-bold uppercase tracking-wider border",
                    user.status === 'Active' ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-black/10 dark:bg-white/10 border-black/10 dark:border-white/20 text-zinc-600 dark:text-zinc-400"
                  )}
                >
                  {user.status === 'Active' ? 'Active' : 'Inactive'}
                </button>
              </div>

              <div className="flex justify-between items-center bg-white dark:bg-black/50 p-2 rounded-xl border border-black/5 dark:border-white/5 mt-2">
                <select
                  value={user.roleId}
                  onChange={(e) => setUsers(users.map(u => u.id === user.id ? { ...u, roleId: e.target.value } : u))}
                  className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest rounded-[6px] px-2 py-1 flex-1 focus:outline-none appearance-none max-w-[120px]"
                >
                   {roles.map(r => (
                     <option key={r.id} value={r.id} className="text-zinc-900 bg-white">{r.name}</option>
                   ))}
                </select>
                <span className="text-zinc-700 dark:text-zinc-300 font-bold uppercase text-[10px] tracking-wider px-2">
                  {user.department}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block rounded-2xl border border-black/5 dark:border-white/10 bg-[#f4f4f5] dark:bg-[#111] overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left whitespace-nowrap min-w-[700px]">
            <thead className="bg-white dark:bg-black text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
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
                return (
                  <tr key={user.id} className="hover:bg-black/5 dark:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center font-black text-zinc-900 dark:text-white">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-white uppercase text-sm mb-0.5">{user.name}</div>
                          <div className="text-zinc-500 text-[10px] font-bold tracking-widest">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={user.roleId}
                          onChange={(e) => setUsers(users.map(u => u.id === user.id ? { ...u, roleId: e.target.value } : u))}
                          className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest rounded-lg px-2 py-1.5 focus:outline-none appearance-none cursor-pointer"
                        >
                          {roles.map(r => (
                            <option key={r.id} value={r.id} className="text-zinc-900 bg-white">{r.name}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300 font-bold uppercase text-[11px] tracking-wider">
                      {user.department}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase tracking-wider border",
                        user.status === 'Active' ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-black/10 dark:bg-white/10 border-black/10 dark:border-white/20 text-zinc-600 dark:text-zinc-400"
                      )}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => toggleStatus(user.id, user.status)}
                        className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:text-white transition-colors border border-black/5 dark:border-white/10 rounded-lg px-3 py-1.5 hover:bg-black/5 dark:bg-white/5"
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
      
      <div className="bg-[#f4f4f5] dark:bg-[#111] rounded-2xl border border-orange-500/30 p-6 flex flex-col sm:flex-row gap-4 text-sm mt-6">
        <ShieldAlert className="h-8 w-8 text-orange-500 flex-shrink-0" />
        <div>
          <p className="font-bold tracking-widest text-[11px] uppercase text-orange-500 mb-1">Security & Permissions Notice</p>
          <p className="text-zinc-600 dark:text-zinc-400 font-medium">Access is determined dynamically based on the role assigned to the employee. Admins can configure these roles in the System Roles page.</p>
        </div>
      </div>

      <Modal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} title="Invite Staff Member">
         <form onSubmit={handleInvite} className="space-y-5">
           <div>
             <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Full Name</label>
             <input type="text" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-600" placeholder="e.g. John Doe" />
           </div>
           <div>
             <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Email Address</label>
             <input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-600" placeholder="john@company.com" />
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Role</label>
               <select value={newUser.roleId} onChange={e => setNewUser({...newUser, roleId: e.target.value as any})} className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none font-medium">
                 {roles.map(r => (
                   <option key={r.id} value={r.id}>{r.name}</option>
                 ))}
               </select>
             </div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Department</label>
               <input type="text" value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})} className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-600" placeholder="e.g. Production" />
             </div>
           </div>
           <button type="submit" className="w-full bg-white text-black font-black uppercase tracking-widest py-4 rounded-xl mt-4 hover:bg-zinc-200 transition-colors shadow-lg active:scale-[0.98]">
             Send Invitation
           </button>
         </form>
      </Modal>
    </div>
  );
}
