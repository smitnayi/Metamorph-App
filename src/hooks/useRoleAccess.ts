import { useDataStore } from '../store/data';
import { Action, Subject, User } from '../types';

export function useRoleAccess() {
  const { roles } = useDataStore();

  const hasPermission = (user: User | null | undefined, action: Action, subject: Subject): boolean => {
    if (!user) return false;
    
    const userRole = roles.find(r => r.id === user.roleId);
    if (!userRole) return false;

    // Check for 'all' permission
    const hasAdminAccess = userRole.permissions.some(p => p.action === 'manage' && p.subject === 'all');
    if (hasAdminAccess) return true;

    // Direct match
    const hasDirectMatch = userRole.permissions.some(p => p.action === action && p.subject === subject);
    if (hasDirectMatch) return true;

    // Manage permission on subject covers other actions
    const hasManageMatch = userRole.permissions.some(p => p.action === 'manage' && p.subject === subject);
    if (hasManageMatch) return true;

    return false;
  };

  return { hasPermission };
}
