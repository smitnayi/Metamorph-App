import { create } from 'zustand';
import { InventoryItem, Order, Customer, Task, User, QualityCheck, Role } from '../types';
import { db } from '../lib/firebase';
import { collection, onSnapshot, writeBatch, doc } from 'firebase/firestore';

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

interface AppState {
  users: User[];
  roles: Role[];
  inventory: InventoryItem[];
  orders: Order[];
  customers: Customer[];
  tasks: Task[];
  qualityChecks: QualityCheck[];
  setUsers: (val: User[] | ((prev: User[]) => User[])) => void;
  setRoles: (val: Role[] | ((prev: Role[]) => Role[])) => void;
  setInventory: (val: InventoryItem[] | ((prev: InventoryItem[]) => InventoryItem[])) => void;
  setOrders: (val: Order[] | ((prev: Order[]) => Order[])) => void;
  setCustomers: (val: Customer[] | ((prev: Customer[]) => Customer[])) => void;
  setTasks: (val: Task[] | ((prev: Task[]) => Task[])) => void;
  setQualityChecks: (val: QualityCheck[] | ((prev: QualityCheck[]) => QualityCheck[])) => void;
}

const syncToFirebase = async <T extends { id: string }>(collectionName: string, currentItems: T[], nextItems: T[]) => {
  const batch = writeBatch(db);
  const currentMap = new Map(currentItems.map(i => [i.id, JSON.stringify(i)]));
  const nextIds = new Set(nextItems.map(i => i.id));
  
  nextItems.forEach(item => {
    if (currentMap.get(item.id) !== JSON.stringify(item)) {
       batch.set(doc(db, collectionName, item.id), item);
    }
  });

  currentItems.forEach(item => {
    if (!nextIds.has(item.id)) {
       batch.delete(doc(db, collectionName, item.id));
    }
  });
  
  try {
    await batch.commit();
  } catch (e) {
    console.error(`Sync error on ${collectionName}:`, e);
  }
};

export const useDataStore = create<AppState>((set, get) => ({
  users: [],
  roles: defaultRoles,
  inventory: [],
  orders: [],
  customers: [],
  tasks: [],
  qualityChecks: [],
  
  setUsers: (val) => {
    const next = typeof val === 'function' ? val(get().users) : val;
    syncToFirebase('users', get().users, next);
    set({ users: next });
  },
  setRoles: (val) => {
    const next = typeof val === 'function' ? val(get().roles) : val;
    syncToFirebase('roles', get().roles, next);
    set({ roles: next });
  },
  setInventory: (val) => {
    const next = typeof val === 'function' ? val(get().inventory) : val;
    syncToFirebase('inventory', get().inventory, next);
    set({ inventory: next });
  },
  setOrders: (val) => {
    const next = typeof val === 'function' ? val(get().orders) : val;
    syncToFirebase('orders', get().orders, next);
    set({ orders: next });
  },
  setCustomers: (val) => {
    const next = typeof val === 'function' ? val(get().customers) : val;
    syncToFirebase('customers', get().customers, next);
    set({ customers: next });
  },
  setTasks: (val) => {
    const next = typeof val === 'function' ? val(get().tasks) : val;
    syncToFirebase('tasks', get().tasks, next);
    set({ tasks: next });
  },
  setQualityChecks: (val) => {
    const next = typeof val === 'function' ? val(get().qualityChecks) : val;
    syncToFirebase('qualityChecks', get().qualityChecks, next);
    set({ qualityChecks: next });
  }
}));

let unsubscribers: (() => void)[] = [];

export function initStoreSync() {
  if (unsubscribers.length > 0) return;

  const collections = ['users', 'roles', 'inventory', 'orders', 'customers', 'tasks', 'qualityChecks'];
  
  unsubscribers = collections.map(col => {
     return onSnapshot(collection(db, col), (snap) => {
        const data = snap.docs.map(d => d.data() as any);
        useDataStore.setState(prev => ({ ...prev, [col]: data }));
     }, (error) => {
        console.error(`Snapshot listener error for ${col}:`, error);
     });
  });
}

export function cleanupStoreSync() {
  unsubscribers.forEach(unsub => unsub());
  unsubscribers = [];
}
