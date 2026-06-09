import { InventoryItem, Order, Customer, Task, User, QualityCheck } from '../types';

export const mockUsers: User[] = [
  { id: 'u1', name: 'John Doe', email: 'john@powderos.com', roleId: 'role-admin', department: 'Management', status: 'Active' },
  { id: 'u2', name: 'Sarah Smith', email: 'sarah@powderos.com', roleId: 'role-manager', department: 'Production', status: 'Active' },
  { id: 'u3', name: 'Mike Johnson', email: 'mike@powderos.com', roleId: 'role-employee', department: 'Coating', status: 'Active' },
];

export const mockInventory: InventoryItem[] = [
  { id: 'inv1', sku: 'PDR-BLK-G', name: 'Standard Black', colorCode: '#000000', finish: 'Gloss', weightKg: 250, lowStockThreshold: 50, supplier: 'CoatingsInc', location: 'A-12', lastUpdated: '2026-05-10T10:00:00Z' },
  { id: 'inv2', sku: 'PDR-WHT-M', name: 'Appliance White', colorCode: '#FFFFFF', finish: 'Matte', weightKg: 40, lowStockThreshold: 100, supplier: 'CoatingsInc', location: 'A-13', lastUpdated: '2026-05-11T14:30:00Z' },
  { id: 'inv3', sku: 'PDR-SLV-T', name: 'Industrial Silver', colorCode: '#C0C0C0', finish: 'Texture', weightKg: 120, lowStockThreshold: 50, supplier: 'MetalPowders', location: 'B-04', lastUpdated: '2026-05-12T08:15:00Z' },
  { id: 'inv4', sku: 'PDR-RED-S', name: 'Safety Red', colorCode: '#FF0000', finish: 'Satin', weightKg: 15, lowStockThreshold: 20, supplier: 'SpecialtyPwr', location: 'C-01', lastUpdated: '2026-05-09T16:45:00Z' },
];

export const mockOrders: Order[] = [
  { id: 'ord1', orderNumber: 'ORD-2026-1042', customerId: 'c1', customerName: 'Apex Machinery', status: 'Preprocessing', items: 450, dueDate: '2026-05-15', totalValue: 3450.00 },
  { id: 'ord2', orderNumber: 'ORD-2026-1043', customerId: 'c2', customerName: 'Urban Bikes', status: 'Quality Check', items: 120, dueDate: '2026-05-13', totalValue: 1250.50 },
  { id: 'ord3', orderNumber: 'ORD-2026-1044', customerId: 'c1', customerName: 'Apex Machinery', status: 'Quoted', items: 200, dueDate: '2026-05-20', totalValue: 1800.00 },
  { id: 'ord4', orderNumber: 'ORD-2026-1045', customerId: 'c3', customerName: 'Structor Fencing', status: 'Powder Coating', items: 85, dueDate: '2026-05-14', totalValue: 980.00 },
];

export const mockCustomers: Customer[] = [
  { id: 'c1', companyName: 'Apex Machinery', contactName: 'David Chen', email: 'david@apex.com', phone: '555-0123', totalOrders: 14, lifetimeValue: 45000, status: 'Active' },
  { id: 'c2', companyName: 'Urban Bikes', contactName: 'Lena Gomez', email: 'lena@urbanbikes.com', phone: '555-0456', totalOrders: 6, lifetimeValue: 8500, status: 'Active' },
  { id: 'c3', companyName: 'Structor Fencing', contactName: 'Tom Hardy', email: 'tom@structor.com', phone: '555-0789', totalOrders: 2, lifetimeValue: 2400, status: 'Active' },
];

export const mockTasks: Task[] = [
  { id: 't1', title: 'Prep Order 1044', description: 'Sandblast and chemical wash parts', assigneeId: 'u3', status: 'In Progress', priority: 'High', dueDate: '2026-05-12' },
  { id: 't2', title: 'Restock Station B', description: 'Move Appliance White from warehouse', assigneeId: 'u2', status: 'To Do', priority: 'Medium', dueDate: '2026-05-12' },
  { id: 't3', title: 'Maintain Oven 2', description: 'Monthly filter replacement', assigneeId: 'u1', status: 'To Do', priority: 'Low', dueDate: '2026-05-15' },
];

export const mockQualityChecks: QualityCheck[] = [
  { id: 'qa1', orderId: 'ord2', inspectorId: 'u2', date: '2026-05-12T09:30:00Z', adhesionScore: 9, thicknessMils: 2.5, cureStatus: 'Pass', visualDefects: [], overallResult: 'Pass', notes: 'Excellent finish' },
  { id: 'qa2', orderId: 'ord1', inspectorId: 'u2', date: '2026-05-11T16:00:00Z', adhesionScore: 5, thicknessMils: 1.8, cureStatus: 'Fail', visualDefects: ['Pinholing', 'Orange Peel'], overallResult: 'Rework', notes: 'Spray gun pressure was too high. Required sanding and recoating.' },
];
