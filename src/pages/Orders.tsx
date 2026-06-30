import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Search, Plus, Settings, Calculator, Package, Calendar } from 'lucide-react';
import { useDataStore } from '../store/data';
import { Order, OrderCostEstimation } from '../types';
import { toast } from 'sonner';
import { DndContext, useDraggable, useDroppable, DragEndEvent, DragOverlay, closestCorners, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import Modal from '../components/ui/Modal';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

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
      className={`flex-shrink-0 w-full xl:w-[320px] flex flex-col bg-white/40 dark:bg-black/20 backdrop-blur-xl border rounded-[32px] overflow-hidden transition-all duration-300 ${isOver ? 'border-orange-500 bg-white/60 dark:bg-black/40 shadow-[0_0_40px_rgba(249,115,22,0.15)]' : 'border-black/5 dark:border-white/5'}`}
    >
      <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-white/30 dark:bg-black/30 backdrop-blur-md">
        <h3 className="text-xs font-semibold text-zinc-900 dark:text-white leading-none">{id}</h3>
        <span className="text-xs font-semibold bg-white dark:bg-black border border-black/5 dark:border-white/5 px-3 py-1.5 rounded-full text-zinc-900 dark:text-white shadow-sm">{stageOrders.length}</span>
      </div>
      <div className={`p-5 overflow-y-auto custom-scrollbar ${stageOrders.length > 0 ? 'flex flex-col gap-4' : 'flex-1 min-h-[250px]'}`}>
        <AnimatePresence>
          {stageOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
            >
              <DraggableOrder order={order} setOrders={setOrders} orders={orders} onOpenPowderLog={onOpenPowderLog} />
            </motion.div>
          ))}
        </AnimatePresence>
        {stageOrders.length === 0 && (
          <div className="h-full w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-black/5 dark:border-white/5 rounded-2xl text-zinc-400 dark:text-zinc-600 bg-black/[0.01] dark:bg-white/[0.01]">
             <Package className="w-8 h-8 mb-2 opacity-50" />
             <span className="text-xs font-semibold">Drop Here</span>
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
    opacity: 0.4,
  } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-sm rounded-[24px] p-6 hover:border-orange-500/50 hover:shadow-xl transition-all touch-none select-none group relative overflow-hidden",
        isDragging && "scale-105 shadow-2xl z-50 ring-2 ring-orange-500 ring-offset-2 ring-offset-transparent dark:ring-offset-black"
      )}
    >
      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-orange-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div 
        {...listeners} 
        {...attributes}
        className="cursor-grab active:cursor-grabbing mb-5 relative z-10"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="text-xs font-semibold tracking-widest bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-md border border-orange-500/20 uppercase">{order.orderNumber}</div>
          <div className="text-xs font-semibold text-zinc-500 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-md border border-black/5 dark:border-white/5">{order.items} pcs</div>
        </div>
        <div className="font-semibold tracking-tight text-zinc-900 dark:text-white text-lg leading-tight group-hover:text-orange-500 transition-colors">{order.customerName}</div>
      </div>
      
      <div className="flex justify-between items-end mt-4 mb-5 cursor-default relative z-10 pt-4 border-t border-black/5 dark:border-white/5">
        <div className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-2.5 py-1.5 rounded-md">
          <Calendar className="w-3 h-3" />
          {new Date(order.dueDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
        </div>
        <div className="text-sm font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-md border border-emerald-500/20">
            ₹{order.totalValue.toLocaleString()}
        </div>
      </div>
      
      <div className="flex flex-col gap-2 cursor-default relative z-10">
        <select 
          value={order.status}
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => setOrders(orders.map(o => o.id === order.id ? {...o, status: e.target.value as Stage} : o))}
          className="w-full bg-white/60 dark:bg-black/60 border border-black/10 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white text-xs font-semibold px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none cursor-pointer hover:bg-white dark:hover:bg-black transition-colors"
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
             className="w-full px-4 py-2.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 rounded-lg text-xs font-semibold hover:bg-orange-500 hover:text-white transition-colors cursor-pointer shadow-sm active:scale-95 text-center"
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
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full flex flex-col space-y-6 max-w-7xl mx-auto px-4 py-8 md:p-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 flex-shrink-0 mb-4">
          <div>
            <label className="text-xs md:text-xs font-semibold text-orange-500">Workflow</label>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mt-1 text-zinc-900 dark:text-white">Job Orders</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2 font-medium text-sm">Manage production stages cleanly and efficiently.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportOrders}
              className="w-full sm:w-auto inline-flex items-center justify-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-5 py-2.5 rounded-lg text-sm font-medium text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm active:scale-95"
            >
              Export
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center bg-orange-600 px-5 py-2.5 rounded-lg text-sm font-medium text-white hover:bg-orange-700 transition-colors shadow-sm active:scale-95"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Order
            </motion.button>
          </div>
        </div>

        <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-[24px] shadow-sm shrink-0 mb-2 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by ID or Customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-medium placeholder:text-zinc-500 transition-colors"
              />
            </div>
            <label className="flex items-center gap-3 text-xs font-semibold text-zinc-500 text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors bg-white/60 dark:bg-black/40 backdrop-blur-md px-5 py-4 rounded-xl border border-black/10 dark:border-white/10">
              <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="accent-orange-500 w-4 h-4 rounded border-zinc-300 cursor-pointer" />
              Show older than 7d
            </label>
        </div>

        <div className="flex-1 flex flex-col xl:flex-row gap-6 xl:overflow-x-auto pb-12 pt-2 snap-x snap-mandatory custom-scrollbar">
          {STAGES.map(stage => {
            const stageOrders = filteredOrders.filter(o => o.status === stage);
            
            return (
              <div key={stage} className="snap-center shrink-0">
                <DroppableStage id={stage} stageOrders={stageOrders} orders={orders} setOrders={setOrders} onOpenPowderLog={(order) => {
                  setPowderLogOrder(order);
                  setSelectedPowderId('');
                  setPowderAmountKg(0);
                }} />
              </div>
            );
          })}
        </div>
      </motion.div>
      
      <DragOverlay modifiers={[]}>
        {activeOrder ? (
           <div className="w-80 bg-white/90 dark:bg-[#111]/90 backdrop-blur-2xl border border-orange-500/50 shadow-2xl p-5 rotate-3 rounded-xl scale-105 z-50">
             <div className="mb-4">
               <div className="flex justify-between items-start mb-3">
                 <div className="text-xs font-semibold tracking-widest bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-md border border-orange-500/20">{activeOrder.orderNumber}</div>
                 <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-md border border-black/5 dark:border-white/5">{activeOrder.items} pcs</div>
               </div>
               <div className="font-semibold text-zinc-900 dark:text-white text-base leading-tight">{activeOrder.customerName}</div>
             </div>
             <div className="flex justify-between items-end mt-4 pt-4 border-t border-black/5 dark:border-white/5">
               <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md">
                 <Calendar className="w-3 h-3" />
                 {new Date(activeOrder.dueDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
               </div>
               <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                   ₹{activeOrder.totalValue.toLocaleString()}
               </div>
             </div>
           </div>
        ) : null}
      </DragOverlay>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Order">
        <form onSubmit={handleCreateOrder} className="space-y-6">
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Customer Name</label>
            <input 
              type="text" 
              required
              value={newOrder.customerName}
              onChange={e => setNewOrder({...newOrder, customerName: e.target.value})}
              className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold shadow-sm placeholder:text-zinc-500 transition-colors"
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Items (Pcs)</label>
              <input 
                type="number" 
                required
                min="1"
                value={newOrder.items}
                onChange={e => setNewOrder({...newOrder, items: Number(e.target.value)})}
                className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold shadow-sm transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Total Value (₹)</label>
              <input 
                type="number" 
                required
                min="0"
                value={newOrder.totalValue}
                onChange={e => setNewOrder({...newOrder, totalValue: Number(e.target.value)})}
                className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold shadow-sm transition-colors"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Due Date</label>
              <input 
                type="date"
                required
                value={newOrder.dueDate}
                onChange={e => setNewOrder({...newOrder, dueDate: e.target.value})}
                className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold shadow-sm transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Initial Stage</label>
              <select 
                value={newOrder.status}
                onChange={e => setNewOrder({...newOrder, status: e.target.value as Stage})}
                className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 appearance-none font-semibold shadow-sm cursor-pointer transition-colors"
              >
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <button 
            type="submit"
            className="w-full bg-orange-500 text-white font-semibold py-5 rounded-xl mt-8 hover:bg-orange-400 transition-colors shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-95 text-sm"
          >
            Create Order
          </button>
        </form>
      </Modal>

      <Modal isOpen={isCostConfigOpen} onClose={() => setIsCostConfigOpen(false)} title="Global Cost Rates">
        <form onSubmit={(e) => { e.preventDefault(); toast.success('Rates updated'); setIsCostConfigOpen(false); }} className="space-y-6">
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Electricity Rate (₹/unit)</label>
            <input 
              type="number" min="0" step="0.1" value={costSettings.electricityRate || 0}
              onChange={e => setCostSettings({...costSettings, electricityRate: Number(e.target.value)})}
              className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold shadow-sm transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Gas Rate (₹/unit)</label>
            <input 
              type="number" min="0" step="0.1" value={costSettings.gasRate || 0}
              onChange={e => setCostSettings({...costSettings, gasRate: Number(e.target.value)})}
              className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold shadow-sm transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Process Charge Rate (₹/kg)</label>
            <input 
              type="number" min="0" step="0.1" value={costSettings.processChargeRate || 0}
              onChange={e => setCostSettings({...costSettings, processChargeRate: Number(e.target.value)})}
              className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold shadow-sm transition-colors"
            />
          </div>
          <button type="submit" className="w-full bg-orange-500 text-white font-semibold py-5 rounded-xl mt-8 hover:bg-orange-400 transition-colors shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-95 text-sm">
            Save Rates
          </button>
        </form>
      </Modal>

      <Modal isOpen={!!powderLogOrder} onClose={() => setPowderLogOrder(null)} size="md" title={`Log Material Usage: ${powderLogOrder?.orderNumber}`}>
        <form onSubmit={handleSavePowderLog} className="space-y-6">
          <div className="space-y-4">
             <div>
               <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Select Powder Used</label>
               <select required value={selectedPowderId} onChange={e => setSelectedPowderId(e.target.value)} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold shadow-sm appearance-none cursor-pointer transition-colors">
                 <option value="">Select Powder...</option>
                 {inventory.map(p => <option key={p.id} value={p.id}>{p.name} ({p.weightKg}kg left)</option>)}
               </select>
             </div>
             <div>
               <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Powder Amount (kg)</label>
               <input required type="number" min="0.1" step="0.1" value={powderAmountKg || ''} onChange={e => setPowderAmountKg(Number(e.target.value))} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold shadow-sm transition-colors" />
             </div>
          </div>
          
          <button type="submit" disabled={!selectedPowderId || powderAmountKg <= 0} className="w-full bg-orange-500 text-white font-semibold py-5 rounded-xl mt-8 hover:bg-orange-400 transition-colors shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-95 disabled:opacity-50 disabled:shadow-none text-sm">
            Log Usage
          </button>
        </form>
      </Modal>
    </DndContext>
  );
}
