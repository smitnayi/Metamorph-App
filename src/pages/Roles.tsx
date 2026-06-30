import React, { useState } from 'react';
import { useDataStore } from '../store/data';
import { useRoleAccess } from '../hooks/useRoleAccess';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Role, Action, Subject, Permission } from '../types';
import Modal from '../components/ui/Modal';
import { toast } from 'sonner';

const allActions: Action[] = ['create', 'read', 'update', 'delete', 'manage'];
const allSubjects: Subject[] = ['inventory', 'orders', 'reports', 'employees', 'crm', 'quality', 'tasks', 'settings', 'labors'];

export default function Roles() {
  const { roles, setRoles, users, labors } = useDataStore();
  const { currentUser } = useAuth();
  const { hasPermission } = useRoleAccess();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<Partial<Role>>({
    name: '',
    description: '',
    permissions: []
  });

  const canManageRoles = hasPermission(currentUser as any, 'manage', 'settings');

  const handleOpenModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData(role);
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        description: '',
        permissions: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) {
      toast.error('Role name is required');
      return;
    }

    if (editingRole) {
      setRoles(roles.map(r => r.id === editingRole.id ? { ...editingRole, ...formData } as Role : r));
      toast.success('Role updated successfully');
    } else {
      const newRole: Role = {
        id: `role-${Date.now()}`,
        name: formData.name as string,
        description: formData.description || '',
        permissions: formData.permissions || [],
      };
      setRoles([...roles, newRole]);
      toast.success('Role created successfully');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, isSystem?: boolean) => {
    if (isSystem) {
      toast.error('Cannot delete system roles');
      return;
    }
    if (window.confirm('Are you sure you want to delete this role?')) {
      setRoles(roles.filter(r => r.id !== id));
      toast.success('Role deleted');
    }
  };

  const togglePermission = (action: Action, subject: Subject) => {
    const currentPerms = formData.permissions || [];
    const exists = currentPerms.some(p => p.action === action && p.subject === subject);
    
    if (exists) {
      setFormData({
        ...formData,
        permissions: currentPerms.filter(p => !(p.action === action && p.subject === subject))
      });
    } else {
      setFormData({
        ...formData,
        permissions: [...currentPerms, { action, subject }]
      });
    }
  };

  const hasPerm = (action: Action, subject: Subject) => {
    // If has 'manage all', then yes
    if (formData.permissions?.some(p => p.action === 'manage' && p.subject === 'all')) return true;
    // If has 'manage [subject]', then yes
    if (formData.permissions?.some(p => p.action === 'manage' && p.subject === subject)) return true;
    
    return formData.permissions?.some(p => p.action === action && p.subject === subject);
  };

  if (!canManageRoles) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-rose-500 mx-auto" />
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white uppercase tracking-tight">Access Denied</h2>
          <p className="text-zinc-600 dark:text-zinc-400 font-medium">You do not have permission to manage roles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-4">
        <div>
          <label className="text-xs md:text-xs font-semibold text-orange-500">Security & Access</label>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mt-1 text-zinc-900 dark:text-white">Role Management</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2 font-medium text-sm">Configure access control levels across the organization.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto inline-flex items-center justify-center gap-2 shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Create Custom Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map(role => (
          <div key={role.id} className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-[32px] p-8 shadow-sm flex flex-col h-full hover:shadow-xl hover:bg-white/60 dark:hover:bg-black/40 hover:border-orange-500/30 transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-orange-500/10 rounded-xl text-orange-500 border border-orange-500/20">
                  <Shield size={24} />
                </div>
                <div className="flex gap-2 bg-white/60 dark:bg-black/40 backdrop-blur-md p-1.5 rounded-lg border border-black/10 dark:border-white/10 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(role)} className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors rounded-md hover:bg-black/5 dark:hover:bg-white/5">
                    <Edit2 size={16} />
                  </button>
                  {!role.isSystem && (
                    <button onClick={() => handleDelete(role.id, role.isSystem)} className="p-2 text-rose-500 hover:text-rose-600 transition-colors rounded-md hover:bg-rose-500/10">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              
              <h3 className="text-xl font-semibold uppercase tracking-tight text-zinc-900 dark:text-white mb-2">{role.name}</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 flex-grow font-medium leading-relaxed">{role.description}</p>
              
              <div className="flex gap-6 mb-8 pb-8 border-b border-black/5 dark:border-white/5">
                <div>
                   <div className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] mb-1">Staff Members</div>
                   <div className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">{users.filter(u => u.roleId === role.id).length}</div>
                </div>
              </div>

              <div className="space-y-4 mt-auto">
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em]">Key Permissions</div>
                <div className="flex flex-wrap gap-2">
                  {role.permissions.slice(0, 3).map((p, i) => (
                    <span key={i} className="text-xs font-semibold bg-white/60 dark:bg-white/10 border border-black/5 dark:border-white/5 text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded-md uppercase tracking-[0.1em]">
                      {p.action} {p.subject}
                    </span>
                  ))}
                  {role.permissions.length > 3 && (
                    <span className="text-xs font-semibold bg-black/5 dark:bg-black/40 text-zinc-500 px-3 py-1.5 rounded-md uppercase tracking-[0.1em]">
                      +{role.permissions.length - 3} more
                    </span>
                  )}
                </div>
              </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRole ? 'Edit Role' : 'Create Role'} size="xl">
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-3 px-1">Role Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white/60 dark:bg-black/40 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-xl px-5 py-4 text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-500"
                  placeholder="e.g. Senior Technician"
                />
             </div>
             <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-3 px-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-white/60 dark:bg-black/40 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-xl px-5 py-4 text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-500"
                  placeholder="Brief description of this role"
                />
             </div>
          </div>

          <div>
             <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-4 px-1">Permissions Matrix</label>
             <div className="bg-white/60 dark:bg-black/40 backdrop-blur-md rounded-[24px] border border-black/10 dark:border-white/10 overflow-x-auto w-full custom-scrollbar">
                <table className="w-full text-sm text-left whitespace-nowrap min-w-[700px]">
                  <thead className="bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-xs rounded-tl-[24px]">Module</th>
                      {allActions.map(action => (
                         <th key={action} className="px-6 py-4 font-semibold text-xs text-center">{action}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {allSubjects.map(subject => (
                      <tr key={subject} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-zinc-900 dark:text-white font-semibold text-sm">{subject}</td>
                        {allActions.map(action => (
                          <td key={action} className="px-6 py-4 text-center">
                            <button
                               onClick={() => togglePermission(action, subject)}
                               className={`w-8 h-8 rounded-[10px] flex items-center justify-center mx-auto transition-all active:scale-90 ${
                                 hasPerm(action, subject) ? 'bg-orange-500 text-white shadow-sm' : 'bg-black/5 dark:bg-white/5 text-zinc-400 hover:bg-black/10 dark:hover:bg-white/10'
                               }`}
                            >
                               {hasPerm(action, subject) ? <CheckCircle className="w-4 h-4 stroke-[3]" /> : <XCircle className="w-4 h-4 stroke-[3]" />}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-black/5 dark:border-white/10">
            <button
              onClick={() => setIsModalOpen(false)}
              className="bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-900 dark:text-white px-8 py-4 rounded-xl text-xs font-semibold transition-all w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 rounded-xl text-xs font-semibold transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] w-full sm:w-auto active:scale-95"
            >
              Save Role
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
