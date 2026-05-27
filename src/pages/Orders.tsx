import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Search, Plus, Settings, Calculator } from 'lucide-react';
import { useDataStore } from '../store/data';
import { Order, OrderCostEstimation } from '../types';
import { toast } from 'sonner';
import { DndContext, useDraggable, useDroppable, DragEndEvent, DragOverlay, closestCorners, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import Modal from '../components/ui/Modal';

const STAGES = ['Quoted', 'In Progress', 'Quality Check', 'Shipped', 'Completed'] as const;
type Stage = typeof STAGES[number];

interface DroppableStageProps {
  id: Stage;
  stageOrders: Order[];
  orders: Order[];
  setOrders: any;
  onOpenCosting: (order: Order) => void;
}

const DroppableStage: React.FC<DroppableStageProps> = ({ id, stageOrders, orders, setOrders, onOpenCosting }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex-shrink-0 w-[85vw] sm:w-80 max-w-[400px] flex flex-col bg-[#f4f4f5] dark:bg-[#111] border rounded-2xl transition-colors snap-center ${isOver ? 'border-orange-500 bg-white dark:bg-black' : 'border-black/5 dark:border-white/10'}`}
    >
      <div className="p-4 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-white dark:bg-black/50 rounded-t-2xl">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300">{id}</h3>
        <span className="text-[10px] font-black bg-black/10 dark:bg-white/10 px-2 py-1 rounded-full text-zinc-900 dark:text-white">{stageOrders.length}</span>
      </div>
      <div className="p-3 sm:p-4 flex-1 overflow-y-auto space-y-3">
          {stageOrders.map(order => (
             <DraggableOrder key={order.id} order={order} setOrders={setOrders} orders={orders} onOpenCosting={onOpenCosting} />
          ))}
          {stageOrders.length === 0 && (
            <div className="text-center p-8 border border-dashed border-black/5 dark:border-white/5 rounded-xl text-zinc-600 text-xs font-bold uppercase tracking-widest">
              Drop Here
            </div>
          )}
      </div>
    </div>
  );
}

interface DraggableOrderProps {
  order: Order;
  setOrders: any;
  orders: Order[];
  onOpenCosting: (order: Order) => void;
}

const DraggableOrder: React.FC<DraggableOrderProps> = ({ order, setOrders, orders, onOpenCosting }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
    data: { order }
  });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`bg-white dark:bg-zinc-950 border rounded-xl p-4 hover:border-orange-500/50 transition-colors select-none ${isDragging ? 'border-orange-500 shadow-[0_20px_40px_rgba(0,0,0,0.5)] scale-[1.02]' : 'border-black/5 dark:border-white/5'}`}
    >
      <div 
        {...listeners} 
        {...attributes}
        className="cursor-grab active:cursor-grabbing mb-3 touch-none select-none"
      >
        <div className="flex justify-between items-start mb-2">
          <div className="text-[10px] font-bold tracking-widest bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-sm">{order.orderNumber}</div>
          <div className="text-[10px] font-mono font-bold text-zinc-500 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-sm">{order.items} pcs</div>
        </div>
        <div className="font-bold text-zinc-900 dark:text-white uppercase text-base sm:text-sm mb-1 leading-tight">{order.customerName}</div>
      </div>
      <div className="flex justify-between items-end mt-4 mb-3">
        <div className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
          {new Date(order.dueDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
        </div>
        <div className="text-sm font-black text-emerald-400">
            ₹{order.totalValue.toLocaleString()}
        </div>
      </div>
      
      <div className="pt-3 border-t border-black/5 dark:border-white/5 flex gap-2">
        <select 
          value={order.status}
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => setOrders(orders.map(o => o.id === order.id ? {...o, status: e.target.value as Stage} : o))}
          className="flex-1 bg-[#1a1a1a] border border-black/5 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white text-xs font-bold p-2.5 focus:outline-none focus:border-orange-500 appearance-none"
        >
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button 
           type="button"
           onPointerDown={(e) => e.stopPropagation()}
           onClick={(e) => {
             e.preventDefault();
             e.stopPropagation();
             onOpenCosting(order);
           }}
           className="px-3 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-lg text-xs font-bold hover:bg-orange-500 hover:text-black transition-colors"
        >
           Costing
        </button>
      </div>
    </div>
  );
}

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState('');
  const { orders, setOrders, costSettings, setCostSettings } = useDataStore();
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCostConfigOpen, setIsCostConfigOpen] = useState(false);
  const [costingOrder, setCostingOrder] = useState<Order | null>(null);
  const [estimationData, setEstimationData] = useState<OrderCostEstimation>({
    powderKg: 0,
    materialKg: 0,
    labourAllocation: 0,
    officeStaffAllocation: 0,
    rentAllocation: 0,
    electricityUsage: 0,
    gasUsage: 0,
    transportCost: 0,
    miscCost: 0
  });

  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    status: 'Quoted',
    items: 100,
    totalValue: 5000,
    customerName: '',
    dueDate: new Date().toISOString().split('T')[0]
  });

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.customerName) {
      toast.error('Customer name is required');
      return;
    }
    
    const order: Order = {
      id: Math.random().toString(36).substr(2, 9),
      orderNumber: `ORD-${Math.floor(Math.random() * 10000)}`,
      customerName: newOrder.customerName!,
      items: Number(newOrder.items) || 0,
      status: newOrder.status as any | 'Quoted',
      dueDate: new Date(newOrder.dueDate || new Date()).toISOString(),
      totalValue: Number(newOrder.totalValue) || 0,
      priority: 'Medium',
      customerId: `c${Math.floor(Math.random() * 1000)}`
    };

    setOrders([...orders, order]);
    setIsCreateModalOpen(false);
    toast.success(`Order ${order.orderNumber} created`);
    setNewOrder({ status: 'Quoted', items: 100, totalValue: 5000, customerName: '', dueDate: new Date().toISOString().split('T')[0] });
  };

  const filteredOrders = orders.filter(order => 
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDragStart = (event: any) => {
    setActiveOrder(event.active.data.current?.order);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveOrder(null);
    const { active, over } = event;
    if (over && over.id) {
      setOrders(orders.map(order => 
        order.id === active.id ? { ...order, status: over.id as Stage } : order
      ));
    }
  };

  const handleSaveCosting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!costingOrder) return;
    
    // Perform calculations
    const powderRate = estimationData.materialKg ? estimationData.powderKg / estimationData.materialKg : 0;
    const electricityCost = estimationData.electricityUsage * costSettings.electricityRate;
    const gasCost = estimationData.gasUsage * costSettings.gasRate;
    const processCharge = estimationData.materialKg * costSettings.processChargeRate;
    
    const totalCost = Number(estimationData.labourAllocation) + 
                      Number(estimationData.officeStaffAllocation) + 
                      Number(estimationData.rentAllocation) + 
                      electricityCost + gasCost + processCharge + 
                      Number(estimationData.transportCost) + 
                      Number(estimationData.miscCost);
                      
    const profit = costingOrder.totalValue - totalCost;

    const finalData = {
      ...estimationData,
      calculatedPowderRate: powderRate,
      calculatedElectricityCost: electricityCost,
      calculatedGasCost: gasCost,
      calculatedProcessCharge: processCharge,
      calculatedTotalCost: totalCost,
      calculatedProfit: profit
    };

    setOrders(orders.map(o => o.id === costingOrder.id ? { ...o, costEstimation: finalData } : o));
    setCostingOrder(null);
    toast.success('Cost estimation saved');
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 0,
        tolerance: 5,
      },
    })
  );

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
      <div className="h-full flex flex-col space-y-4 md:space-y-6 max-w-7xl mx-auto px-4 py-8 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 flex-shrink-0">
          <div>
            <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-orange-500">Workflow</label>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mt-1 text-zinc-900 dark:text-white">Job Orders</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2 font-medium text-sm">Drag and drop or use the dropdown to manage production stages.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsCostConfigOpen(true)}
              className="inline-flex items-center justify-center bg-white dark:bg-[#111] border border-black/5 dark:border-white/10 px-4 py-3 md:py-4 rounded-xl text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white hover:border-orange-500 transition-colors shadow-lg active:scale-95"
            >
              <Settings className="h-5 w-5 mr-2" />
              Rates
            </button>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center bg-orange-500 px-6 py-3 md:py-4 rounded-xl text-sm font-black uppercase tracking-widest text-black hover:bg-orange-600 transition-colors shadow-lg active:scale-95"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create
            </button>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center mb-4">
           <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search by ID or Customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-[#f4f4f5] dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors placeholder:text-zinc-600 font-medium"
              />
            </div>
        </div>

        <div className="flex-1 flex gap-4 md:gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x">
          {STAGES.map(stage => {
            const stageOrders = filteredOrders.filter(o => o.status === stage);
            return (
              <DroppableStage key={stage} id={stage} stageOrders={stageOrders} orders={orders} setOrders={setOrders} onOpenCosting={(order) => {
                setCostingOrder(order);
                setEstimationData(order.costEstimation || {
                  powderKg: 0,
                  materialKg: 0,
                  labourAllocation: 0,
                  officeStaffAllocation: 0,
                  rentAllocation: 0,
                  electricityUsage: 0,
                  gasUsage: 0,
                  transportCost: 0,
                  miscCost: 0
                });
              }} />
            );
          })}
        </div>
      </div>
      
      <DragOverlay>
        {activeOrder ? (
           <div className="w-80 bg-white dark:bg-black border border-orange-500 shadow-2xl p-4 rotate-3">
             <div className="flex justify-between items-start mb-3">
               <div className="text-[10px] font-bold text-orange-500">{activeOrder.orderNumber}</div>
               <div className="text-[10px] font-mono text-zinc-500">{activeOrder.items} pcs</div>
             </div>
             <div className="font-bold text-zinc-900 dark:text-white uppercase text-sm mb-1 line-clamp-1">{activeOrder.customerName}</div>
           </div>
        ) : null}
      </DragOverlay>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Order">
        <form onSubmit={handleCreateOrder} className="space-y-5">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Customer Name</label>
            <input 
              type="text" 
              required
              value={newOrder.customerName}
              onChange={e => setNewOrder({...newOrder, customerName: e.target.value})}
              className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-600"
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Items (Pcs)</label>
              <input 
                type="number" 
                required
                min="1"
                value={newOrder.items}
                onChange={e => setNewOrder({...newOrder, items: Number(e.target.value)})}
                className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Total Value (₹)</label>
              <input 
                type="number" 
                required
                min="0"
                value={newOrder.totalValue}
                onChange={e => setNewOrder({...newOrder, totalValue: Number(e.target.value)})}
                className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Due Date</label>
              <input 
                type="date"
                required
                value={newOrder.dueDate}
                onChange={e => setNewOrder({...newOrder, dueDate: e.target.value})}
                className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Initial Stage</label>
              <select 
                value={newOrder.status}
                onChange={e => setNewOrder({...newOrder, status: e.target.value as Stage})}
                className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none font-medium"
              >
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <button 
            type="submit"
            className="w-full bg-orange-500 text-black font-black uppercase tracking-widest py-4 rounded-xl mt-4 hover:bg-orange-600 transition-colors shadow-lg active:scale-[0.98]"
          >
            Create Order
          </button>
        </form>
      </Modal>

      <Modal isOpen={isCostConfigOpen} onClose={() => setIsCostConfigOpen(false)} title="Global Cost Rates">
        <form onSubmit={(e) => { e.preventDefault(); toast.success('Rates updated'); setIsCostConfigOpen(false); }} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Electricity Rate (₹/unit)</label>
            <input 
              type="number" min="0" step="0.1" value={costSettings.electricityRate || 0}
              onChange={e => setCostSettings({...costSettings, electricityRate: Number(e.target.value)})}
              className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Gas Rate (₹/unit)</label>
            <input 
              type="number" min="0" step="0.1" value={costSettings.gasRate || 0}
              onChange={e => setCostSettings({...costSettings, gasRate: Number(e.target.value)})}
              className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Process Charge Rate (₹/kg)</label>
            <input 
              type="number" min="0" step="0.1" value={costSettings.processChargeRate || 0}
              onChange={e => setCostSettings({...costSettings, processChargeRate: Number(e.target.value)})}
              className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium"
            />
          </div>
          <button type="submit" className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest py-4 rounded-xl mt-4 hover:opacity-90 transition-opacity">
            Save Rates
          </button>
        </form>
      </Modal>

      <Modal isOpen={!!costingOrder} onClose={() => setCostingOrder(null)} size="lg" title={`Costing: ${costingOrder?.orderNumber}`}>
        <form onSubmit={handleSaveCosting} className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Powder (kg)</label>
               <input type="number" min="0" step="0.1" value={estimationData.powderKg || ''} onChange={e => setEstimationData({...estimationData, powderKg: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/10 bg-[#f4f4f5] dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Material (kg)</label>
               <input type="number" min="0" step="0.1" value={estimationData.materialKg || ''} onChange={e => setEstimationData({...estimationData, materialKg: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/10 bg-[#f4f4f5] dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Labour (₹)</label>
               <input type="number" min="0" step="0.1" value={estimationData.labourAllocation || ''} onChange={e => setEstimationData({...estimationData, labourAllocation: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/10 bg-[#f4f4f5] dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Office Staff (₹)</label>
               <input type="number" min="0" step="0.1" value={estimationData.officeStaffAllocation || ''} onChange={e => setEstimationData({...estimationData, officeStaffAllocation: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/10 bg-[#f4f4f5] dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Rent (₹)</label>
               <input type="number" min="0" step="0.1" value={estimationData.rentAllocation || ''} onChange={e => setEstimationData({...estimationData, rentAllocation: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/10 bg-[#f4f4f5] dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Electricity Uses</label>
               <input type="number" min="0" step="0.1" value={estimationData.electricityUsage || ''} onChange={e => setEstimationData({...estimationData, electricityUsage: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/10 bg-[#f4f4f5] dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Gas Uses</label>
               <input type="number" min="0" step="0.1" value={estimationData.gasUsage || ''} onChange={e => setEstimationData({...estimationData, gasUsage: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/10 bg-[#f4f4f5] dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Transport (₹)</label>
               <input type="number" min="0" step="0.1" value={estimationData.transportCost || ''} onChange={e => setEstimationData({...estimationData, transportCost: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/10 bg-[#f4f4f5] dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Misc (₹)</label>
               <input type="number" min="0" step="0.1" value={estimationData.miscCost || ''} onChange={e => setEstimationData({...estimationData, miscCost: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/10 bg-[#f4f4f5] dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none" />
             </div>
          </div>
          
          <div className="bg-[#f4f4f5] dark:bg-[#111] p-5 rounded-2xl border border-black/5 dark:border-white/5 space-y-3">
             <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2 mb-2">
               <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white flex items-center">
                 <Calculator className="h-4 w-4 mr-2" /> Estimation
               </h3>
               {costingOrder?.costEstimation && (
                 <button type="button" onClick={() => window.open(`/export/${costingOrder.id}`, '_blank')} className="text-xs font-bold text-orange-500 hover:text-orange-600">
                    Export Invoice
                 </button>
               )}
             </div>
             <div className="flex justify-between text-sm"><span className="text-zinc-500">Powder Rate</span><span className="font-bold text-zinc-900 dark:text-white">{estimationData.materialKg ? (estimationData.powderKg / estimationData.materialKg).toFixed(4) : 0}</span></div>
             <div className="flex justify-between text-sm"><span className="text-zinc-500">Electricity (₹{costSettings.electricityRate})</span><span className="font-bold text-zinc-900 dark:text-white">₹{((estimationData.electricityUsage || 0) * costSettings.electricityRate).toFixed(0)}</span></div>
             <div className="flex justify-between text-sm"><span className="text-zinc-500">Gas (₹{costSettings.gasRate})</span><span className="font-bold text-zinc-900 dark:text-white">₹{((estimationData.gasUsage || 0) * costSettings.gasRate).toFixed(0)}</span></div>
             <div className="flex justify-between text-sm"><span className="text-zinc-500">Process Charge</span><span className="font-bold text-zinc-900 dark:text-white">₹{((estimationData.materialKg || 0) * costSettings.processChargeRate).toFixed(0)}</span></div>
             <div className="flex justify-between text-sm"><span className="text-zinc-500">Revenue (Buyer Cost)</span><span className="font-bold text-emerald-500">₹{costingOrder?.totalValue.toLocaleString()}</span></div>
             
             <div className="pt-3 mt-2 border-t border-black/5 dark:border-white/5 flex justify-between items-end">
               <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Calculated Profit</span>
               <span className={`text-xl font-black ${((costingOrder?.totalValue || 0) - (Number(estimationData.labourAllocation) + Number(estimationData.officeStaffAllocation) + Number(estimationData.rentAllocation) + (estimationData.electricityUsage * costSettings.electricityRate) + (estimationData.gasUsage * costSettings.gasRate) + (estimationData.materialKg * costSettings.processChargeRate) + Number(estimationData.transportCost) + Number(estimationData.miscCost))) > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                 ₹{((costingOrder?.totalValue || 0) - (Number(estimationData.labourAllocation) + Number(estimationData.officeStaffAllocation) + Number(estimationData.rentAllocation) + (estimationData.electricityUsage * costSettings.electricityRate) + (estimationData.gasUsage * costSettings.gasRate) + (estimationData.materialKg * costSettings.processChargeRate) + Number(estimationData.transportCost) + Number(estimationData.miscCost))).toFixed(0)}
               </span>
             </div>
          </div>
          
          <button type="submit" className="w-full bg-orange-500 text-black font-black uppercase tracking-widest py-4 rounded-xl hover:bg-orange-600 transition-colors shadow-lg active:scale-[0.98]">
            Save Estimation
          </button>
        </form>
      </Modal>
    </DndContext>
  );
}
