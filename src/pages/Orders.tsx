import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Search, Plus, Settings, Calculator } from 'lucide-react';
import { useDataStore } from '../store/data';
import { Order, OrderCostEstimation } from '../types';
import { toast } from 'sonner';
import { DndContext, useDraggable, useDroppable, DragEndEvent, DragOverlay, closestCorners, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import Modal from '../components/ui/Modal';

const STAGES = ['Quoted', 'Received at Company', 'Preprocessing', 'Powder Coating', 'Quality Check', 'Shipped', 'Completed'] as const;
type Stage = typeof STAGES[number];

interface DroppableStageProps {
  id: Stage;
  stageOrders: Order[];
  orders: Order[];
  setOrders: any;
  onOpenPowderLog: (order: Order) => void;
}

const DroppableStage: React.FC<DroppableStageProps> = ({ id, stageOrders, orders, setOrders, onOpenPowderLog }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex-shrink-0 w-full xl:w-[320px] flex flex-col bg-white/40 dark:bg-black/20 border rounded-[24px] overflow-hidden transition-colors ${isOver ? 'border-orange-500 bg-white/80 dark:bg-black/60 shadow-orange-500/10' : 'border-black/[0.04] dark:border-white/[0.06]'}`}
    >
      <div className="p-4 border-b border-black/[0.04] dark:border-white/[0.04] flex justify-between items-center bg-black/[0.02] dark:bg-white/[0.02]">
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">{id}</h3>
        <span className="text-[10px] font-black bg-black/5 dark:bg-white/10 px-2.5 py-1 rounded-full text-zinc-900 dark:text-white shadow-inner">{stageOrders.length}</span>
      </div>
      <div className={`p-4 ${stageOrders.length > 0 ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1 gap-4' : 'flex-1 min-h-[150px]'}`}>
        {stageOrders.map(order => (
          <DraggableOrder key={order.id} order={order} setOrders={setOrders} orders={orders} onOpenPowderLog={onOpenPowderLog} />
        ))}
        {stageOrders.length === 0 && (
          <div className="h-full w-full flex items-center justify-center p-8 border border-dashed border-black/5 dark:border-white/5 rounded-xl text-zinc-600 text-xs font-bold uppercase tracking-widest shadow-inner bg-black/[0.01] dark:bg-white/[0.01]">
            Drop Here
          </div>
        )}
      </div>
    </div>
  );
}

interface DraggableOrderProps {
  order: Order;
  orders: Order[];
  setOrders: any;
  onOpenPowderLog: (order: Order) => void;
}

const DraggableOrder: React.FC<DraggableOrderProps> = ({ order, orders, setOrders, onOpenPowderLog }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: order.id,
    data: { order }
  });
  
  const style = isDragging ? {
    opacity: 0.2, // Ghost style
  } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`bg-white/80 dark:bg-[#111]/80 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-sm rounded-[16px] p-4 hover:border-orange-500/50 hover:shadow-xl transition-all touch-none select-none ${isDragging ? 'border-dashed border-zinc-400 bg-transparent dark:bg-transparent shadow-none' : ''}`}
    >
      <div 
        {...listeners} 
        {...attributes}
        className="cursor-grab active:cursor-grabbing mb-3"
      >
        <div className="flex justify-between items-start mb-2">
          <div className="text-[10px] font-bold tracking-widest bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-sm">{order.orderNumber}</div>
          <div className="text-[10px] font-mono font-bold text-zinc-500 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-sm">{order.items} pcs</div>
        </div>
        <div className="font-bold text-zinc-900 dark:text-white uppercase text-base sm:text-sm mb-1 leading-tight">{order.customerName}</div>
      </div>
      <div className="flex justify-between items-end mt-4 mb-3 cursor-default">
        <div className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
          {new Date(order.dueDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
        </div>
        <div className="text-sm font-black text-emerald-400">
            ₹{order.totalValue.toLocaleString()}
        </div>
      </div>
      
      <div className="pt-3 border-t border-black/5 dark:border-white/5 flex gap-2 cursor-default">
        <select 
          value={order.status}
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => setOrders(orders.map(o => o.id === order.id ? {...o, status: e.target.value as Stage} : o))}
          className="flex-1 bg-[#1a1a1a] border border-black/5 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white text-xs font-bold p-2.5 focus:outline-none focus:border-orange-500 appearance-none cursor-pointer"
        >
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {['Quality Check'].includes(order.status) && (
          <button 
             type="button"
             onPointerDown={(e) => e.stopPropagation()}
             onClick={(e) => {
               e.preventDefault();
               onOpenPowderLog(order);
             }}
             className="px-3 py-1.5 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-orange-500 hover:text-black transition-colors cursor-pointer whitespace-nowrap"
          >
             Log Powder
          </button>
        )}
      </div>
    </div>
  );
}

export default function Orders() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { orders, setOrders, costSettings, setCostSettings, inventory, addActivityLog, inventoryUsages, setInventoryUsages, setInventory } = useDataStore();
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCostConfigOpen, setIsCostConfigOpen] = useState(false);
  const [powderLogOrder, setPowderLogOrder] = useState<Order | null>(null);
  const [selectedPowderId, setSelectedPowderId] = useState<string>('');
  const [powderAmountKg, setPowderAmountKg] = useState<number>(0);

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

  const [showArchived, setShowArchived] = useState(false);

  const filteredOrders = orders.filter(order => {
    let match = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Hide completed older than 7 days
    if (order.status === 'Completed' && !showArchived) {
      if (order.dueDate) {
         const orderDate = new Date(order.dueDate).getTime();
         const now = Date.now();
         const daysDiff = (now - orderDate) / (1000 * 3600 * 24);
         if (daysDiff > 7) {
           match = false;
         }
      }
    }
    
    return match;
  });

  const handleExportOrders = () => {
    let csvContent = "Order ID,Order Number,Customer,Items(pcs),Value,Status,Due Date\n";
    orders.forEach(o => {
      csvContent += `${o.id},${o.orderNumber},${o.customerName},${o.items},${o.totalValue},${o.status},${new Date(o.dueDate).toLocaleDateString()}\n`;
    });
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Orders exported successfully');
  };

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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100, // Small delay allows scrolling on handle accidentally but is fast enough
        tolerance: 8,
      },
    })
  );

  const handleSavePowderLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!powderLogOrder) return;
    
    if (selectedPowderId && powderAmountKg > 0) {
      const usage = {
        id: Math.random().toString(36).substring(2, 9),
        inventoryId: selectedPowderId,
        orderId: powderLogOrder.orderNumber,
        customerName: powderLogOrder.customerName,
        amountKg: powderAmountKg,
        date: new Date().toISOString()
      };
      setInventoryUsages(prev => [...prev, usage]);
      
      const powderItem = inventory.find(i => i.id === selectedPowderId);
      if (powderItem) {
        setInventory(prev => prev.map(i => i.id === selectedPowderId ? { ...i, weightKg: Math.max(0, i.weightKg - powderAmountKg) } : i));
        addActivityLog({ action: 'process', module: 'Inventory', details: `${powderAmountKg}kg of ${powderItem.name} used in order ${powderLogOrder.orderNumber}`, userId: 'user1', userName: 'Admin' });
      }
    }

    setPowderLogOrder(null);
    setSelectedPowderId('');
    setPowderAmountKg(0);
    toast.success('Material usage logged successfully');
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
      <div className="h-full flex flex-col space-y-4 md:space-y-6 max-w-[1600px] mx-auto px-4 py-8 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 flex-shrink-0">
          <div>
            <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-orange-500">Workflow</label>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mt-1 text-zinc-900 dark:text-white">Job Orders</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2 font-medium text-sm">Manage production stages cleanly and efficiently.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="flex gap-2 w-full">
              <button 
                onClick={handleExportOrders}
                className="flex-1 inline-flex items-center justify-center bg-white dark:bg-[#111] border border-black/5 dark:border-white/10 px-4 py-3 md:py-4 rounded-xl text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white hover:border-orange-500 transition-colors shadow-lg active:scale-95"
              >
                Export
              </button>
            </div>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center bg-orange-500 px-6 py-3 md:py-4 rounded-xl text-sm font-black uppercase tracking-widest text-black hover:bg-orange-600 transition-colors shadow-lg active:scale-95"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create
            </button>
          </div>
        </div>

        <div className="flex-shrink-0 flex sm:flex-row flex-col items-start sm:items-center justify-between mb-4 gap-4">
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
            <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 cursor-pointer">
              <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="accent-orange-500 w-4 h-4 rounded" />
              Show older than 7d
            </label>
        </div>

        <div className="flex-1 flex flex-col xl:flex-row gap-4 xl:gap-6 xl:overflow-x-auto pb-12">
          {STAGES.map(stage => {
            const stageOrders = filteredOrders.filter(o => o.status === stage);
            
            return (
              <DroppableStage key={stage} id={stage} stageOrders={stageOrders} orders={orders} setOrders={setOrders} onOpenPowderLog={(order) => {
                setPowderLogOrder(order);
                setSelectedPowderId('');
                setPowderAmountKg(0);
              }} />
            );
          })}
        </div>
      </div>
      
      <DragOverlay modifiers={[]}>
        {activeOrder ? (
           <div className="w-80 bg-white dark:bg-[#111] border border-orange-500/50 shadow-2xl p-4 rotate-3 rounded-[16px]">
             <div className="mb-3">
               <div className="flex justify-between items-start mb-2">
                 <div className="text-[10px] font-bold tracking-widest bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-sm">{activeOrder.orderNumber}</div>
                 <div className="text-[10px] font-mono font-bold text-zinc-500 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-sm">{activeOrder.items} pcs</div>
               </div>
               <div className="font-bold text-zinc-900 dark:text-white uppercase text-base sm:text-sm mb-1 leading-tight">{activeOrder.customerName}</div>
             </div>
             <div className="flex justify-between items-end mt-4">
               <div className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                 <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                 {new Date(activeOrder.dueDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
               </div>
               <div className="text-sm font-black text-emerald-400">
                   ₹{activeOrder.totalValue.toLocaleString()}
               </div>
             </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <Modal isOpen={!!powderLogOrder} onClose={() => setPowderLogOrder(null)} size="md" title={`Log Material Usage: ${powderLogOrder?.orderNumber}`}>
        <form onSubmit={handleSavePowderLog} className="space-y-6">
          <div className="space-y-4">
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Select Powder Used</label>
               <select required value={selectedPowderId} onChange={e => setSelectedPowderId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/10 bg-[#f4f4f5] dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none appearance-none font-medium">
                 <option value="">Select Powder...</option>
                 {inventory.map(p => <option key={p.id} value={p.id}>{p.name} ({p.weightKg}kg left)</option>)}
               </select>
             </div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Powder Amount (kg)</label>
               <input required type="number" min="0.1" step="0.1" value={powderAmountKg || ''} onChange={e => setPowderAmountKg(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/10 bg-[#f4f4f5] dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none" />
             </div>
          </div>
          
          <button type="submit" disabled={!selectedPowderId || powderAmountKg <= 0} className="w-full bg-orange-500 text-black font-black uppercase tracking-widest py-4 rounded-xl hover:bg-orange-600 transition-colors shadow-lg active:scale-[0.98] disabled:opacity-50">
            Log Usage
          </button>
        </form>
      </Modal>
    </DndContext>
  );
}
