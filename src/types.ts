export type Role = 'Admin' | 'Manager' | 'Worker';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  department: string;
  status: 'Active' | 'Inactive';
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  colorCode: string;
  finish: 'Gloss' | 'Matte' | 'Texture' | 'Satin';
  weightKg: number;
  lowStockThreshold: number;
  supplier: string;
  location: string;
  lastUpdated: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: 'Quoted' | 'In Progress' | 'Quality Check' | 'Shipped' | 'Completed';
  items: number;
  dueDate: string;
  totalValue: number;
}

export interface Customer {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  totalOrders: number;
  lifetimeValue: number;
  status: 'Active' | 'Lead' | 'Inactive';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  status: 'To Do' | 'In Progress' | 'Done';
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
}

export interface QualityCheck {
  id: string;
  orderId: string;
  inspectorId: string;
  date: string;
  adhesionScore: number; // 0-10
  thicknessMils: number;
  cureStatus: 'Pass' | 'Fail';
  visualDefects: string[];
  overallResult: 'Pass' | 'Fail' | 'Rework';
  notes: string;
}
