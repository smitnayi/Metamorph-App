import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Search, Plus, Settings, Calculator, Package, Calendar, History, ArrowRight, AlertTriangle, FileText, Inbox, Wrench, Paintbrush, ShieldCheck, Truck } from 'lucide-react';
import { useDataStore } from '../store/data';
import { Order, OrderCostEstimation } from '../types';
import { toast } from 'sonner';
import { DndContext, useDraggable, useDroppable, DragEndEvent, DragOverlay, closestCorners, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import Modal from '../components/ui/Modal';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { getHexFromRal } from '../lib/ralToHex';

const STAGES = ['Quoted', 'Received At Company', 'Preprocessing', 'Powder Coating', 'Quality Check', 'Ready to Ship', 'Shipped', 'Completed'] as const;
type Stage = typeof STAGES[number];

interface DroppableStageProps {
  id: Stage;
  stageOrders: Order[];
  orders: Order[];
  onStatusChange: (order: Order, newStatus: Stage) => void;
  onOpenPowderLog: (order: Order) => void;
  onOpenHistory: (order: Order) => void;
  onUpdateOrder: (order: Order, updates: Partial<Order>) => void;
}

const DroppableStage: React.FC<DroppableStageProps> = ({ id, stageOrders, orders, onStatusChange, onOpenPowderLog, onOpenHistory, onUpdateOrder }) => {
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
              <DraggableOrder order={order} orders={orders} onStatusChange={onStatusChange} onOpenPowderLog={onOpenPowderLog} onOpenHistory={onOpenHistory} onUpdateOrder={onUpdateOrder} />
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
  onStatusChange: (order: Order, newStatus: Stage) => void;
  onOpenPowderLog: (order: Order) => void;
  onOpenHistory: (order: Order) => void;
  onUpdateOrder: (order: Order, updates: Partial<Order>) => void;
}

const DraggableOrder: React.FC<DraggableOrderProps> = ({ order, orders, onStatusChange, onOpenPowderLog, onOpenHistory, onUpdateOrder }) => {
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
        className="cursor-grab active:cursor-grabbing mb-4 relative z-10"
      >
        <div className="flex justify-between items-start mb-3">
          <div className="text-xs font-semibold tracking-widest bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-md border border-orange-500/20 uppercase">{order.orderNumber}</div>
          <div className="text-xs font-semibold text-zinc-500 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-md border border-black/5 dark:border-white/5">{order.items} pcs</div>
        </div>
        <div className="font-bold tracking-tight text-zinc-900 dark:text-white text-lg leading-tight group-hover:text-orange-500 transition-colors mb-1">{order.customerName}</div>
        {order.projectName && <div className="text-sm font-medium text-zinc-500 mb-3">{order.projectName}</div>}
        {order.hasDamage && (
           <div className="text-[10px] font-bold tracking-widest text-white bg-red-500 px-3 py-1.5 rounded-md mb-3 flex items-center gap-1.5 uppercase inline-flex">
              <AlertTriangle className="w-3 h-3" />
              Damage Reported
           </div>
        )}
      </div>
      
      {order.shadeName && (
        <div className="mb-4 relative z-10">
          <div className="flex items-center gap-3 p-3 rounded-xl border border-black/10 dark:border-white/10 bg-gradient-to-r from-black/5 to-transparent dark:from-white/5">
             <div className="w-10 h-10 shrink-0 rounded-full shadow-sm border-2 border-white dark:border-[#111]" style={{ backgroundColor: order.shadeColorHex || '#ddd' }}></div>
             <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-0.5">Shade</span>
                <span className="text-base font-black text-zinc-900 dark:text-white leading-tight">{order.shadeName}</span>
             </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-4 cursor-default relative z-10 pt-4 border-t border-black/5 dark:border-white/5">
        <div className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-2.5 py-1.5 rounded-md">
          <Calendar className="w-3 h-3" />
          {new Date(order.dueDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
        </div>
      </div>
      
      {/* Metrics Section */}
      {(order.receivedData || order.preprocessingData || order.powderCoatingData || order.qualityCheckData) && (
        <div className="mb-4 space-y-2 cursor-default">
          {order.receivedData && (
             <div className="text-xs flex flex-wrap gap-2 text-zinc-600 dark:text-zinc-400 bg-black/5 dark:bg-white/5 p-2 rounded-lg border border-black/5 dark:border-white/5">
                <span className="font-semibold text-zinc-900 dark:text-white">Received:</span> 
                <span>{order.receivedData.piecesCount || 0} pcs</span>
                {order.receivedData.bundlesCount ? <span>• {order.receivedData.bundlesCount} bundles</span> : null}
                {order.receivedData.damagedPieces ? <span className="text-red-500">• {order.receivedData.damagedPieces} damaged</span> : null}
             </div>
          )}
          {order.preprocessingData?.processingTimeHours && (
             <div className="text-xs text-zinc-600 dark:text-zinc-400 bg-black/5 dark:bg-white/5 p-2 rounded-lg border border-black/5 dark:border-white/5">
                <span className="font-semibold text-zinc-900 dark:text-white">Preprocess Time:</span> {order.preprocessingData.processingTimeHours}h
             </div>
          )}
          {order.qualityCheckData && (
             <div className="text-xs flex gap-2 text-zinc-600 dark:text-zinc-400 bg-black/5 dark:bg-white/5 p-2 rounded-lg border border-black/5 dark:border-white/5">
                <span className="font-semibold text-zinc-900 dark:text-white">QC:</span>
                <span className={order.qualityCheckData.samplePanelDone ? "text-emerald-500" : "text-amber-500"}>
                  {order.qualityCheckData.samplePanelDone ? 'Panel Done' : 'No Panel'}
                </span>
                {order.qualityCheckData.rejectionsCount !== undefined && (
                   <span className={order.qualityCheckData.rejectionsCount > 0 ? "text-red-500" : "text-zinc-500"}>
                     • {order.qualityCheckData.rejectionsCount} Rejects
                   </span>
                )}
             </div>
          )}
        </div>
      )}
      
      <div className="flex flex-col gap-2 cursor-default relative z-10">
        <div className="flex gap-2">
          <select 
            value={order.status}
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) => onStatusChange(order, e.target.value as Stage)}
            className="flex-1 bg-white/60 dark:bg-black/60 border border-black/10 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white text-xs font-semibold px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none cursor-pointer hover:bg-white dark:hover:bg-black transition-colors"
          >
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          
          <button 
             type="button"
             onPointerDown={(e) => e.stopPropagation()}
             onClick={(e) => {
               e.preventDefault();
               onOpenHistory(order);
             }}
             className="px-3 bg-white/60 dark:bg-black/60 border border-black/10 dark:border-white/10 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-orange-500 hover:border-orange-500/30 transition-colors shadow-sm"
             title="View History"
          >
             <History className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2">
          {STAGES.indexOf(order.status || 'Quoted') < STAGES.length - 1 && (
             <button 
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.preventDefault();
                  onStatusChange(order, STAGES[STAGES.indexOf(order.status || 'Quoted') + 1] as Stage);
                }}
                className="flex-1 px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-semibold hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer shadow-sm active:scale-95 text-center flex items-center justify-center gap-1"
             >
                Next Stage <ArrowRight className="w-3 h-3" />
             </button>
          )}

          {['Quality Check'].includes(order.status) && (
            <button 
               type="button"
               onPointerDown={(e) => e.stopPropagation()}
               onClick={(e) => {
                 e.preventDefault();
                 onOpenPowderLog(order);
               }}
               className="flex-1 px-4 py-2 bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 rounded-lg text-xs font-semibold hover:bg-orange-500 hover:text-white transition-colors cursor-pointer shadow-sm active:scale-95 text-center"
            >
               Log Powder
            </button>
          )}
          
          <button 
             type="button"
             onPointerDown={(e) => e.stopPropagation()}
             onClick={(e) => {
               e.preventDefault();
               onUpdateOrder(order, { hasDamage: !order.hasDamage });
             }}
             className={`flex-1 px-4 py-2 border rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm active:scale-95 text-center flex items-center justify-center gap-1 ${order.hasDamage ? 'bg-red-500 text-white border-red-600 hover:bg-red-600' : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white'}`}
          >
             <AlertTriangle className="w-3 h-3" />
             {order.hasDamage ? 'Damaged' : 'Damage'}
          </button>
        </div>
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

  const [historyOrder, setHistoryOrder] = useState<Order | null>(null);

  const [statusUpdateTarget, setStatusUpdateTarget] = useState<{order: Order, newStatus: Stage} | null>(null);
  const [stageData, setStageData] = useState<any>({});

  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    status: 'Quoted',
    items: 100,
    customerName: '',
    projectName: '',
    shadeName: '',
    shadeColorHex: '#ffffff',
    specialRequirements: '',
    dueDate: new Date().toISOString().split('T')[0]
  });

  const generateOrderId = () => {
    const mmplOrders = orders.filter(o => o.orderNumber?.startsWith('MMPL-JO-'));
    if (mmplOrders.length === 0) return 'MMPL-JO-0001';
    
    let maxId = 0;
    mmplOrders.forEach(o => {
      const numPart = o.orderNumber.split('-')[2];
      if (numPart) {
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > maxId) maxId = num;
      }
    });
    
    return `MMPL-JO-${String(maxId + 1).padStart(4, '0')}`;
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.customerName) {
      toast.error('Customer name is required');
      return;
    }
    
    const order: Order = {
      id: Math.random().toString(36).substr(2, 9),
      orderNumber: generateOrderId(),
      customerName: newOrder.customerName!,
      projectName: newOrder.projectName,
      shadeName: newOrder.shadeName,
      shadeColorHex: newOrder.shadeColorHex,
      specialRequirements: newOrder.specialRequirements,
      items: Number(newOrder.items) || 0,
      status: newOrder.status as any | 'Quoted',
      dueDate: new Date(newOrder.dueDate || new Date()).toISOString(),
      priority: 'Medium',
      customerId: `c${Math.floor(Math.random() * 1000)}`,
      history: [{ stage: newOrder.status as string || 'Quoted', timestamp: new Date().toISOString(), note: 'Order created' }]
    };

    setOrders([...orders, order]);
    setIsCreateModalOpen(false);
    toast.success(`Order ${order.orderNumber} created`);
    setNewOrder({ status: 'Quoted', items: 100, customerName: '', projectName: '', shadeName: '', shadeColorHex: '#ffffff', specialRequirements: '', dueDate: new Date().toISOString().split('T')[0] });
  };

  const handleUpdateOrder = (order: Order, updates: Partial<Order>) => {
    let note = '';
    if (updates.hasDamage !== undefined) {
      note = updates.hasDamage ? 'Marked as damaged' : 'Damage resolved';
    }
    
    const updatedOrder = { ...order, ...updates };
    if (note) {
      const now = new Date();
      updatedOrder.history = [...(order.history || []), { stage: order.status, timestamp: now.toISOString(), note }];
    }
    
    setOrders(orders.map(o => o.id === order.id ? updatedOrder : o));
    if (updates.hasDamage !== undefined) {
      toast.success(updates.hasDamage ? 'Order marked as damaged' : 'Damage mark removed');
    }
  };

  const handleStatusChange = (order: Order, newStatus: Stage) => {
    if (['Received At Company', 'Preprocessing', 'Powder Coating', 'Quality Check', 'Ready to Ship', 'Shipped'].includes(newStatus)) {
       setStatusUpdateTarget({ order, newStatus });
       setStageData({ date: new Date().toISOString().split('T')[0] });
    } else {
       const now = new Date();
       const historyEntry = { stage: newStatus, timestamp: now.toISOString(), note: `Moved to ${newStatus}` };
       setOrders(orders.map(o => o.id === order.id ? {...o, status: newStatus, history: [...(o.history || []), historyEntry]} : o));
    }
  };

  const handleConfirmStatusChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusUpdateTarget) return;
    
    const { order, newStatus } = statusUpdateTarget;
    const now = new Date();
    
    let note = `Moved to ${newStatus}`;
    if (newStatus === 'Received At Company') note += ` (${stageData.piecesCount} pcs received)`;
    if (newStatus === 'Quality Check') note += ` (Rejects: ${stageData.rejectionsCount || 0})`;
    
    const historyEntry = { stage: newStatus, timestamp: now.toISOString(), note };
    
    const updatedOrder = { 
      ...order, 
      status: newStatus,
      history: [...(order.history || []), historyEntry]
    };
    
    if (newStatus === 'Received At Company') updatedOrder.receivedData = { ...order.receivedData, ...stageData };
    if (newStatus === 'Preprocessing') updatedOrder.preprocessingData = { ...order.preprocessingData, ...stageData };
    if (newStatus === 'Powder Coating') updatedOrder.powderCoatingData = { ...order.powderCoatingData, ...stageData };
    if (newStatus === 'Quality Check') updatedOrder.qualityCheckData = { ...order.qualityCheckData, ...stageData };
    if (newStatus === 'Ready to Ship') updatedOrder.readyToShipData = { ...order.readyToShipData, ...stageData };
    if (newStatus === 'Shipped') updatedOrder.shippedData = { ...order.shippedData, ...stageData };

    setOrders(orders.map(o => o.id === order.id ? updatedOrder : o));
    setStatusUpdateTarget(null);
    toast.success(`Order moved to ${newStatus}`);
  };

  const [showArchived, setShowArchived] = useState(false);

  const filteredOrders = orders.filter(order => {
    let match = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (order.projectName && order.projectName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (order.shadeName && order.shadeName.toLowerCase().includes(searchTerm.toLowerCase()));
    
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
      const order = orders.find(o => o.id === active.id);
      if (order && order.status !== over.id) {
        handleStatusChange(order, over.id as Stage);
      }
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
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by ID, Customer, Project or Shade..."
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

        <div className="flex justify-between items-start bg-white/60 dark:bg-black/20 backdrop-blur-md border border-black/5 dark:border-white/5 rounded-2xl p-3 sm:p-5 shrink-0 mb-4 shadow-sm w-full gap-1 sm:gap-2">
          {STAGES.filter(s => s !== 'Completed').map((stage, index, array) => {
            const count = orders.filter(o => o.status === stage).length;
            
            let avgTime = null;
            if (stage === 'Preprocessing') {
               const preOrders = orders.filter(o => o.status === stage && o.preprocessingData?.processingTimeHours);
               if (preOrders.length > 0) {
                 avgTime = (preOrders.reduce((acc, o) => acc + (o.preprocessingData?.processingTimeHours || 0), 0) / preOrders.length).toFixed(1) + 'h';
               }
            }
            if (stage === 'Powder Coating') {
               const pcOrders = orders.filter(o => o.status === stage && o.powderCoatingData?.runningTimeHours);
               if (pcOrders.length > 0) {
                 avgTime = (pcOrders.reduce((acc, o) => acc + (o.powderCoatingData?.runningTimeHours || 0), 0) / pcOrders.length).toFixed(1) + 'h';
               }
            }

            const StageIcon = 
              stage === 'Quoted' ? FileText :
              stage === 'Received At Company' ? Inbox :
              stage === 'Preprocessing' ? Wrench :
              stage === 'Powder Coating' ? Paintbrush :
              stage === 'Quality Check' ? ShieldCheck :
              stage === 'Ready to Ship' ? Package : Truck;

            return (
              <React.Fragment key={stage}>
                <div className="flex flex-col items-center justify-start flex-1 group cursor-default relative min-w-0" title={stage}>
                  <div className="flex flex-col items-center justify-center h-10 sm:h-12 w-full relative">
                    <StageIcon className={`w-4 h-4 sm:w-5 sm:h-5 mb-1 transition-colors ${count > 0 ? 'text-orange-500' : 'text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}`} />
                    <div className={`text-sm sm:text-base font-black tracking-tight leading-none ${count > 0 ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-600'}`}>
                      {count}
                    </div>
                    {avgTime && (
                      <div className="absolute -top-1 -right-2 sm:-top-2 sm:-right-2 text-[8px] font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/40 px-1 py-0.5 rounded whitespace-nowrap scale-75 origin-bottom">
                        {avgTime}
                      </div>
                    )}
                  </div>
                  <div className={`hidden sm:block text-[10px] font-bold uppercase tracking-wider text-center leading-tight mt-2 px-0.5 break-words w-full ${count > 0 ? 'text-zinc-800 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-600'}`}>
                    {stage}
                  </div>
                </div>
                {index < array.length - 1 && (
                  <div className="hidden sm:block w-4 h-[1px] bg-black/10 dark:bg-white/10 shrink-0 self-center -mt-6"></div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="flex-1 flex flex-col xl:flex-row gap-6 xl:overflow-x-auto pb-12 pt-2 snap-x snap-mandatory custom-scrollbar">
          {STAGES.map(stage => {
            const stageOrders = filteredOrders.filter(o => o.status === stage);
            
            return (
              <div key={stage} className="snap-center shrink-0">
                <DroppableStage id={stage} stageOrders={stageOrders} orders={orders} onStatusChange={handleStatusChange} onUpdateOrder={handleUpdateOrder} onOpenHistory={setHistoryOrder} onOpenPowderLog={(order) => {
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
               <div className="font-bold text-zinc-900 dark:text-white text-base leading-tight mb-1">{activeOrder.customerName}</div>
               {activeOrder.projectName && <div className="text-sm font-medium text-zinc-500 mb-3">{activeOrder.projectName}</div>}
               
               {activeOrder.shadeName && (
                 <div className="flex items-center gap-3 p-3 rounded-xl border border-black/10 dark:border-white/10 bg-gradient-to-r from-black/5 to-transparent dark:from-white/5">
                    <div className="w-10 h-10 shrink-0 rounded-full shadow-sm border-2 border-white dark:border-[#111]" style={{ backgroundColor: activeOrder.shadeColorHex || '#ddd' }}></div>
                    <div className="flex flex-col">
                       <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-0.5">Shade</span>
                       <span className="text-base font-black text-zinc-900 dark:text-white leading-tight">{activeOrder.shadeName}</span>
                    </div>
                 </div>
               )}
             </div>
             <div className="flex justify-between items-end mt-4 pt-4 border-t border-black/5 dark:border-white/5">
               <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md">
                 <Calendar className="w-3 h-3" />
                 {new Date(activeOrder.dueDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
               </div>
             </div>
           </div>
        ) : null}
      </DragOverlay>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Order">
        <form onSubmit={handleCreateOrder} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Project Name</label>
              <input 
                type="text" 
                value={newOrder.projectName}
                onChange={e => setNewOrder({...newOrder, projectName: e.target.value})}
                className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold shadow-sm placeholder:text-zinc-500 transition-colors"
                placeholder="e.g. Building A"
              />
            </div>
          </div>
          
          <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-black/10 dark:border-white/10 space-y-4">
             <div className="flex gap-4">
               <div className="flex-1">
                 <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Shade Name</label>
                 <input 
                   type="text" 
                   required
                   value={newOrder.shadeName}
                   onChange={e => {
                     const val = e.target.value;
                     let hex = newOrder.shadeColorHex;
                     if (val.startsWith('#') && (val.length === 4 || val.length === 7)) {
                        hex = val;
                     } else {
                        const ralHex = getHexFromRal(val);
                        if (ralHex) {
                           hex = ralHex;
                        }
                     }
                     setNewOrder({...newOrder, shadeName: val, shadeColorHex: hex})
                   }}
                   className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold shadow-sm placeholder:text-zinc-500 transition-colors"
                   placeholder="e.g. RAL 7035"
                 />
               </div>
               <div className="w-24">
                 <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Color</label>
                 <input 
                   type="color"
                   value={newOrder.shadeColorHex}
                   onChange={e => setNewOrder({...newOrder, shadeColorHex: e.target.value})}
                   className="w-full h-[54px] rounded-xl cursor-pointer border-0 p-1 bg-white dark:bg-black shadow-sm block"
                 />
               </div>
             </div>
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
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Due Date</label>
              <input 
                type="date"
                required
                value={newOrder.dueDate}
                onChange={e => setNewOrder({...newOrder, dueDate: e.target.value})}
                className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold shadow-sm transition-colors"
              />
            </div>
          </div>
          
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Special Requirements</label>
            <textarea 
              value={newOrder.specialRequirements}
              onChange={e => setNewOrder({...newOrder, specialRequirements: e.target.value})}
              className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold shadow-sm placeholder:text-zinc-500 transition-colors h-24 resize-none"
              placeholder="Any special handling, packing instructions..."
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-orange-500 text-white font-semibold py-5 rounded-xl mt-8 hover:bg-orange-400 transition-colors shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-95 text-sm"
          >
            Create Order
          </button>
        </form>
      </Modal>

      {/* Stage Update Modal */}
      <Modal isOpen={!!statusUpdateTarget} onClose={() => setStatusUpdateTarget(null)} title={`Move to ${statusUpdateTarget?.newStatus}`}>
         {statusUpdateTarget && (
           <form onSubmit={handleConfirmStatusChange} className="space-y-6">
             <div className="bg-orange-500/10 text-orange-600 dark:text-orange-400 p-4 rounded-xl text-sm font-semibold mb-6 flex items-start gap-3">
                <Package className="w-5 h-5 shrink-0" />
                <div>
                  Confirming stage update for <span className="font-bold">{statusUpdateTarget.order.orderNumber}</span>. Please fill in the required details below.
                </div>
             </div>

             {/* Dynamic Fields based on stage */}
             {['Received At Company', 'Preprocessing', 'Powder Coating', 'Ready to Ship', 'Shipped'].includes(statusUpdateTarget.newStatus) && (
               <div>
                 <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Date</label>
                 <input 
                   type="date" required
                   value={stageData.date || ''}
                   onChange={e => setStageData({...stageData, date: e.target.value})}
                   className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold"
                 />
               </div>
             )}

             {statusUpdateTarget.newStatus === 'Received At Company' && (
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Total Pieces</label>
                   <input type="number" required min="1" value={stageData.piecesCount || ''} onChange={e => setStageData({...stageData, piecesCount: Number(e.target.value)})} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold" />
                 </div>
                 <div>
                   <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Bundles</label>
                   <input type="number" min="0" value={stageData.bundlesCount || ''} onChange={e => setStageData({...stageData, bundlesCount: Number(e.target.value)})} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold" />
                 </div>
                 <div>
                   <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Weight (KGs)</label>
                   <input type="number" required min="1" value={stageData.totalKgs || ''} onChange={e => setStageData({...stageData, totalKgs: Number(e.target.value)})} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold" />
                 </div>
                 <div>
                   <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Damaged Pieces</label>
                   <input type="number" min="0" value={stageData.damagedPieces || 0} onChange={e => setStageData({...stageData, damagedPieces: Number(e.target.value)})} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold" />
                 </div>
               </div>
             )}

             {statusUpdateTarget.newStatus === 'Preprocessing' && (
               <div>
                 <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Total Processing Time (Hours)</label>
                 <input type="number" step="0.5" min="0" required value={stageData.processingTimeHours || ''} onChange={e => setStageData({...stageData, processingTimeHours: Number(e.target.value)})} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold" />
               </div>
             )}

             {statusUpdateTarget.newStatus === 'Powder Coating' && (
               <div>
                 <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Total Running Time (Hours)</label>
                 <input type="number" step="0.5" min="0" required value={stageData.runningTimeHours || ''} onChange={e => setStageData({...stageData, runningTimeHours: Number(e.target.value)})} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold" />
               </div>
             )}

             {statusUpdateTarget.newStatus === 'Quality Check' && (
               <div className="space-y-4">
                 <label className="flex items-center gap-3 text-sm font-semibold text-zinc-900 dark:text-white cursor-pointer bg-white/60 dark:bg-black/40 p-4 rounded-xl border border-black/10 dark:border-white/10">
                   <input type="checkbox" checked={stageData.samplePanelDone || false} onChange={e => setStageData({...stageData, samplePanelDone: e.target.checked})} className="w-5 h-5 accent-orange-500 rounded border-zinc-300" />
                   Sample Panel Done
                 </label>
                 <div>
                   <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Number of Rejections</label>
                   <input type="number" min="0" required value={stageData.rejectionsCount !== undefined ? stageData.rejectionsCount : ''} onChange={e => setStageData({...stageData, rejectionsCount: Number(e.target.value)})} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold" />
                 </div>
               </div>
             )}

             <button type="submit" className="w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold py-5 rounded-xl transition-colors shadow-[0_0_20px_rgba(249,115,22,0.3)] text-sm">
               Confirm & Update Stage
             </button>
           </form>
         )}
      </Modal>

      {/* History Modal */}
      <Modal isOpen={!!historyOrder} onClose={() => setHistoryOrder(null)} title="Order History">
         {historyOrder && (
           <div className="space-y-6">
              <div className="bg-orange-500/10 text-orange-600 dark:text-orange-400 p-4 rounded-xl text-sm font-semibold flex items-start gap-3">
                 <Package className="w-5 h-5 shrink-0" />
                 <div>
                   Audit trail for <span className="font-bold">{historyOrder.orderNumber}</span>
                 </div>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                 {historyOrder.history && historyOrder.history.length > 0 ? (
                    historyOrder.history.map((h, i) => (
                       <div key={i} className="flex gap-4 relative">
                          <div className="flex flex-col items-center">
                             <div className="w-3 h-3 rounded-full bg-orange-500 shrink-0 mt-1"></div>
                             {i < historyOrder.history!.length - 1 && <div className="w-0.5 h-full bg-orange-500/20 my-1"></div>}
                          </div>
                          <div className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl p-4 flex-1">
                             <div className="flex justify-between items-start mb-2">
                                <span className="font-semibold text-zinc-900 dark:text-white">{h.stage}</span>
                                <span className="text-xs font-semibold text-zinc-500">{new Date(h.timestamp).toLocaleString()}</span>
                             </div>
                             {h.note && <div className="text-sm text-zinc-600 dark:text-zinc-400">{h.note}</div>}
                          </div>
                       </div>
                    ))
                 ) : (
                    <div className="text-center p-8 text-zinc-500 font-medium">No history available for this order.</div>
                 )}
              </div>
           </div>
         )}
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
               <input required type="number" min="0.001" step="0.001" value={powderAmountKg || ''} onChange={e => setPowderAmountKg(Number(e.target.value))} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold shadow-sm transition-colors" />
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
