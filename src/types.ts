export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage';
export type Subject = 'inventory' | 'orders' | 'reports' | 'employees' | 'crm' | 'quality' | 'tasks' | 'settings' | 'labors' | 'all';

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
  status: 'Quoted' | 'Received at Company' | 'Preprocessing' | 'Powder Coating' | 'Quality Check' | 'Shipped' | 'Completed';
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

export interface Labor {
  id: string;
  name: string;
  roleId?: string;
  dailySalary: number;
  phone?: string;
  status: 'Active' | 'Inactive';
  joinDate: string;
  gender: 'Male' | 'Female';
}

export interface LaborAttendance {
  id: string;
  laborId: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Half-Day';
  overtimeHours: number; // For example 4
  notes?: string;
  clockIn?: string;
  clockOut?: string;
  manualHours?: number;
  manualMinutes?: number;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
}

export interface InventoryUsage {
  id: string;
  inventoryId: string;
  orderId: string;
  customerName?: string;
  amountKg: number;
  date: string;
}

export interface LabRoutineCheck {
  id: string;
  date: string;
  degreaseAlkali: number;
  degreaseTime: number;
  rinse1Alkali: number;
  rinse1Time: number;
  desmutAcid: number;
  desmutTime: number;
  rinse2Acid: number;
  rinse2Time: number;
  alCoatingAcid: number;
  alCoatingFreeAcid: number;
  alCoatingTime: number;
  rinse3Acid: number;
  rinse3Time: number;
  rinse4pH: number;
  rinse4Cond: number;
  rinse4Time: number;
  inspectorName: string;
  signature?: string;
  notes?: string;
}

export interface LabSpecialMeasure {
  id: string;
  date: string;
  measureType: 'Etch Rate' | 'Oil Content' | 'Chrome Weight';
  value: number;
  inspectorName: string;
  notes?: string;
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
