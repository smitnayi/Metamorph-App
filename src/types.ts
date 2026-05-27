export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage';
export type Subject = 'inventory' | 'orders' | 'reports' | 'employees' | 'crm' | 'quality' | 'tasks' | 'settings' | 'all';

export interface Permission {
  action: Action;
  subject: Subject;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem?: boolean; // System roles cannot be deleted
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
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
  totalValue: number; // This is the Revenue
  priority?: 'High' | 'Medium' | 'Low';
  costEstimation?: OrderCostEstimation;
}

export interface OrderCostEstimation {
  powderKg: number;
  materialKg: number;

  labourAllocation: number;
  officeStaffAllocation: number;
  rentAllocation: number;
  
  electricityUsage: number; 
  gasUsage: number;
  
  transportCost: number;
  miscCost: number;

  calculatedPowderRate?: number;
  calculatedElectricityCost?: number;
  calculatedGasCost?: number;
  calculatedProcessCharge?: number;
  calculatedTotalCost?: number;
  calculatedProfit?: number;
}

export interface CostSettings {
  electricityRate: number; 
  gasRate: number; 
  processChargeRate: number; 
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
  lastOrderDate?: string;
  notes?: string;
  communicationHistory?: { date: string, type: 'Call' | 'Email' | 'Meeting', summary: string }[];
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
  photos?: string[];
}
