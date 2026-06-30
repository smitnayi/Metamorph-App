import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { useDataStore } from '../store/data';
import { Shield, ShieldAlert, ShieldCheck, UserPlus, MoreVertical, Edit2, Lock } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import Modal from '../components/ui/Modal';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';

export default function Employees() {
  const { users, setUsers, roles } = useDataStore();
  const { currentUser } = useAuth();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '', email: '', roleId: roles[0]?.id || '', department: 'Production', status: 'Active'
  });

  const isAdmin = currentUser?.roleId === 'role-admin';

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
        <Lock className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mb-6" />
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white uppercase tracking-tight mb-2">Access Denied</h2>
        <p className="text-zinc-500 max-w-md mx-auto">
          You do not have administrative privileges to view or manage the staff directory.
        </p>
      </div>
    );
  }

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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto px-4 py-8 md:p-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <label className="text-xs md:text-xs font-semibold text-orange-500">Personnel</label>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mt-1 text-zinc-900 dark:text-white">Staff Directory</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2 font-medium text-sm">Manage employee access, roles, and departmental assignment.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsInviteModalOpen(true)}
          className="inline-flex items-center justify-center bg-orange-600 px-5 py-2.5 rounded-lg text-sm font-medium text-white hover:bg-orange-700 transition-colors shadow-sm"
        >
          <UserPlus className="h-5 w-5 mr-2 stroke-[2.5]" />
          Invite Staff
        </motion.button>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {users.map((user) => {
          return (
            <div key={user.id} className="bg-[#f4f4f5] dark:bg-[#111] border border-black/5 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center font-semibold text-zinc-900 dark:text-white text-lg">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-zinc-900 dark:text-white uppercase text-sm mb-0.5">{user.name}</div>
                    <div className="text-zinc-500 text-xs font-semibold tracking-widest">{user.email} <span className="opacity-50">|</span> {user.phone || 'No Phone'}</div>
                  </div>
                </div>
                <button 
                  onClick={() => toggleStatus(user.id, user.status)}
                  className={cn(
                    "inline-flex items-center px-2 py-1 rounded-[6px] text-xs font-semibold border",
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
                  className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold rounded-[6px] px-2 py-1 flex-1 focus:outline-none appearance-none max-w-[120px]"
                >
                   {roles.map(r => (
                     <option key={r.id} value={r.id} className="text-zinc-900 bg-white">{r.name}</option>
                   ))}
                </select>
                <span className="text-zinc-700 dark:text-zinc-300 font-semibold uppercase text-xs tracking-wider px-2">
                  {user.department}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block rounded-[32px] border border-black/5 dark:border-white/5 bg-white/40 dark:bg-black/20 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto w-full custom-scrollbar">
          <table className="w-full text-sm text-left whitespace-nowrap min-w-[700px]">
            <thead className="bg-black/5 dark:bg-white/5 text-zinc-500 font-semibold text-xs border-b border-black/5 dark:border-white/5">
              <tr>
                <th className="px-6 py-5">Employee</th>
                <th className="px-6 py-5">Role / Access Level</th>
                <th className="px-6 py-5">Department</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {users.map((user, idx) => {
                return (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={user.id} 
                    className="hover:bg-white/60 dark:hover:bg-white/5 transition-colors cursor-default group"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center font-semibold text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors shrink-0 text-lg">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-white uppercase tracking-tight text-sm mb-0.5">{user.name}</div>
                          <div className="text-zinc-500 text-xs font-semibold tracking-[0.1em]">{user.email} <span className="opacity-50">|</span> {user.phone || 'No Phone'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <select
                          value={user.roleId}
                          disabled={!isAdmin}
                          onChange={(e) => setUsers(users.map(u => u.id === user.id ? { ...u, roleId: e.target.value } : u))}
                          className="bg-white/60 dark:bg-black/40 text-orange-500 border border-black/10 dark:border-white/10 text-xs font-semibold text-zinc-500 rounded-lg px-3 py-2 focus:outline-none appearance-none cursor-pointer disabled:opacity-50 backdrop-blur-md"
                        >
                          {roles.map(r => (
                            <option key={r.id} value={r.id} className="text-zinc-900 bg-white">{r.name}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-zinc-700 dark:text-zinc-300 font-semibold uppercase text-sm tracking-[0.1em]">
                      {user.department}
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold border backdrop-blur-md",
                        user.status === 'Active' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-zinc-600 dark:text-zinc-400"
                      )}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => toggleStatus(user.id, user.status)}
                        className="text-xs font-semibold text-zinc-500 text-zinc-900 dark:text-white hover:text-orange-500 dark:hover:text-orange-500 transition-colors border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-md rounded-lg px-4 py-2 hover:bg-orange-500/10 hover:border-orange-500/30 active:scale-95 shadow-sm"
                      >
                        Toggle Status
                      </button>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-orange-500/5 dark:bg-orange-500/5 backdrop-blur-md rounded-[24px] border border-orange-500/20 p-6 flex flex-col sm:flex-row gap-5 text-sm mt-6 shadow-sm">
        <ShieldAlert className="h-8 w-8 text-orange-500 flex-shrink-0" />
        <div>
          <p className="font-semibold tracking-[0.2em] text-sm uppercase text-orange-500 mb-2">Security & Permissions Notice</p>
          <p className="text-zinc-600 dark:text-zinc-400 font-semibold">Access is determined dynamically based on the role assigned to the employee. Admins can configure these roles in the System Roles page.</p>
        </div>
      </div>

      <Modal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} title="Invite Staff Member">
         <form onSubmit={handleInvite} className="space-y-6 p-2 md:p-6">
           <div>
             <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Full Name</label>
             <input type="text" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full px-4 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold placeholder:text-zinc-500 shadow-sm" placeholder="e.g. John Doe" />
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
               <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Email Address</label>
               <input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full px-4 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold placeholder:text-zinc-500 shadow-sm" placeholder="john@company.com" />
             </div>
             <div>
               <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Phone Number</label>
               <input type="tel" value={newUser.phone || ''} onChange={e => setNewUser({...newUser, phone: e.target.value})} className="w-full px-4 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold placeholder:text-zinc-500 shadow-sm" placeholder="+91..." />
             </div>
           </div>
           <div className="grid grid-cols-2 gap-6">
             <div>
               <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Role</label>
               <select value={newUser.roleId} onChange={e => setNewUser({...newUser, roleId: e.target.value as any})} className="w-full px-4 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none font-semibold shadow-sm">
                 {roles.map(r => (
                   <option key={r.id} value={r.id}>{r.name}</option>
                 ))}
               </select>
             </div>
             <div>
               <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Department</label>
               <input type="text" value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})} className="w-full px-4 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold placeholder:text-zinc-500 shadow-sm" placeholder="e.g. Production" />
             </div>
           </div>
           <button type="submit" className="w-full bg-orange-500 text-white font-semibold py-5 rounded-xl mt-6 hover:bg-orange-400 transition-colors shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-95 text-sm">
             Send Invitation
           </button>
         </form>
      </Modal>
    </motion.div>
  );
}
