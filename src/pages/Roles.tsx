import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { useDataStore } from '../store/data';
import { useRoleAccess } from '../hooks/useRoleAccess';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Role, Action, Subject, Permission } from '../types';
import Modal from '../components/ui/Modal';
import { toast } from 'sonner';

const allActions: Action[] = ['create', 'read', 'update', 'delete', 'manage'];
const allSubjects: Subject[] = ['inventory', 'orders', 'reports', 'employees', 'crm', 'quality', 'tasks', 'settings'];

export default function Roles() {
  const { roles, setRoles } = useDataStore();
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
          <Shield className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Access Denied</h2>
          <p className="text-zinc-600 dark:text-zinc-400">You do not have permission to manage roles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Role Management</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Configure access control levels</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-emerald-600 hover:bg-emerald-500 text-zinc-900 dark:text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors w-full sm:w-auto justify-center"
        >
          <Plus size={20} />
          Create Custom Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map(role => (
          <Card key={role.id} className="bg-[#f4f4f5] dark:bg-[#111] border-black/5 dark:border-white/5 flex flex-col h-full hover:border-black/5 dark:border-white/10 transition-colors">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl text-emerald-500">
                  <Shield size={24} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenModal(role)} className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white transition-colors">
                    <Edit2 size={16} />
                  </button>
                  {!role.isSystem && (
                    <button onClick={() => handleDelete(role.id, role.isSystem)} className="p-2 text-red-400 hover:text-red-300 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{role.name}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 flex-grow">{role.description}</p>
              
              <div className="space-y-2 mt-auto">
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Key Permissions</div>
                <div className="flex flex-wrap gap-2">
                  {role.permissions.slice(0, 3).map((p, i) => (
                    <span key={i} className="text-xs bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 px-2 py-1 rounded-md">
                      {p.action} {p.subject}
                    </span>
                  ))}
                  {role.permissions.length > 3 && (
                    <span className="text-xs bg-black/5 dark:bg-white/5 text-zinc-500 px-2 py-1 rounded-md">
                      +{role.permissions.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRole ? 'Edit Role' : 'Create Role'} size="xl">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Role Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white dark:bg-black border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="e.g. Senior Technician"
                />
             </div>
             <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-white dark:bg-black border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Brief description of this role"
                />
             </div>
          </div>

          <div>
             <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-4 px-1">Permissions Matrix</label>
             <div className="bg-white dark:bg-black/50 rounded-xl border border-black/5 dark:border-white/10 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400">
                    <tr>
                      <th className="px-4 py-3 font-medium rounded-tl-xl">Module</th>
                      {allActions.map(action => (
                         <th key={action} className="px-4 py-3 font-medium text-center capitalize">{action}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {allSubjects.map(subject => (
                      <tr key={subject}>
                        <td className="px-4 py-3 text-zinc-900 dark:text-white font-medium capitalize">{subject}</td>
                        {allActions.map(action => (
                          <td key={action} className="px-4 py-3 text-center">
                            <button
                               onClick={() => togglePermission(action, subject)}
                               className={`w-6 h-6 rounded flex items-center justify-center mx-auto transition-colors ${
                                 hasPerm(action, subject) ? 'bg-emerald-500/20 text-emerald-500' : 'bg-black/5 dark:bg-white/5 text-zinc-600 hover:bg-black/10 dark:bg-white/10'
                               }`}
                            >
                               {hasPerm(action, subject) ? <CheckCircle size={14} /> : <XCircle size={14} />}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-black/5 dark:border-white/10">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2.5 rounded-xl font-medium text-zinc-900 dark:text-white hover:bg-black/5 dark:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-500 text-zinc-900 dark:text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
            >
              Save Role
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
