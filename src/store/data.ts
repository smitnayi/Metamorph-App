import { useLocalStorage } from '../hooks/useLocalStorage';
import { InventoryItem, Order, Customer, Task, User, QualityCheck, Role } from '../types';

export const defaultRoles: Role[] = [
  {
    id: 'role-admin',
    name: 'Admin',
    description: 'Full system access',
    isSystem: true,
    permissions: [{ action: 'manage', subject: 'all' }]
  },
  {
    id: 'role-manager',
    name: 'Manager',
    description: 'Can manage most aspects except settings',
    isSystem: true,
    permissions: [
      { action: 'manage', subject: 'inventory' },
      { action: 'manage', subject: 'orders' },
      { action: 'manage', subject: 'reports' },
      { action: 'manage', subject: 'crm' },
      { action: 'manage', subject: 'quality' },
      { action: 'manage', subject: 'tasks' }
    ]
  },
  {
    id: 'role-employee',
    name: 'Employee',
    description: 'General employee access',
    isSystem: true,
    permissions: [
      { action: 'read', subject: 'inventory' },
      { action: 'read', subject: 'orders' },
      { action: 'update', subject: 'orders' },
      { action: 'read', subject: 'quality' },
      { action: 'update', subject: 'quality' },
      { action: 'manage', subject: 'tasks' }
    ]
  },
  {
    id: 'role-sales',
    name: 'Sales',
    description: 'Sales and CRM focused',
    isSystem: true,
    permissions: [
      { action: 'manage', subject: 'crm' },
      { action: 'manage', subject: 'orders' },
      { action: 'read', subject: 'inventory' }
    ]
  }
];

export function useDataStore() {
  const [users, setUsers] = useLocalStorage<User[]>('app_users', []);
  const [roles, setRoles] = useLocalStorage<Role[]>('app_roles', defaultRoles);
  const [inventory, setInventory] = useLocalStorage<InventoryItem[]>('app_inventory', []);
  const [orders, setOrders] = useLocalStorage<Order[]>('app_orders', []);
  const [customers, setCustomers] = useLocalStorage<Customer[]>('app_customers', []);
  const [tasks, setTasks] = useLocalStorage<Task[]>('app_tasks', []);
  const [qualityChecks, setQualityChecks] = useLocalStorage<QualityCheck[]>('app_qualityChecks', []);

  // Initialize default roles if empty
  if (roles.length === 0) {
    setRoles(defaultRoles);
  }

  return {
    users, setUsers,
    roles, setRoles,
    inventory, setInventory,
    orders, setOrders,
    customers, setCustomers,
    tasks, setTasks,
    qualityChecks, setQualityChecks
  };
}
