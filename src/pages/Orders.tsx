import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Search, Plus } from 'lucide-react';
import { mockOrders } from '../store/mockData';
import { Order } from '../types';
import { toast } from 'sonner';
import { DndContext, useDraggable, useDroppable, DragEndEvent, DragOverlay, closestCorners, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import Modal from '../components/ui/Modal';

const STAGES = ['Quoted', 'In Progress', 'Quality Check', 'Shipped', 'Completed'] as const;
type Stage = typeof STAGES[number];

function DroppableStage({ id, stageOrders, orders, setOrders }: { id: Stage, stageOrders: Order[], orders: Order[], setOrders: any }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex-shrink-0 w-80 flex flex-col bg-[#111] border transition-colors snap-center ${isOver ? 'border-orange-500 bg-black' : 'border-white/10'}`}
    >
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">{id}</h3>
        <span className="text-[10px] font-black bg-white/10 px-2 py-0.5 text-white">{stageOrders.length}</span>
      </div>
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {stageOrders.map(order => (
             <DraggableOrder key={order.id} order={order} setOrders={setOrders} orders={orders} />
          ))}
          {stageOrders.length === 0 && (
            <div className="text-center p-8 border border-dashed border-white/10 text-zinc-600 text-xs font-bold uppercase tracking-widest">
              Drop Here
            </div>
          )}
      </div>
    </div>
  );
}

function DraggableOrder({ order, setOrders, orders }: { order: Order, setOrders: any, orders: Order[] }) {
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
      className={`bg-black border p-4 hover:border-orange-500/50 transition-colors ${isDragging ? 'border-orange-500 shadow-2xl scale-105' : 'border-white/20'}`}
    >
      <div 
        {...listeners} 
        {...attributes}
        className="cursor-grab active:cursor-grabbing mb-3"
      >
        <div className="flex justify-between items-start mb-1">
          <div className="text-[10px] font-bold text-orange-500">{order.orderNumber}</div>
          <div className="text-[10px] font-mono text-zinc-500">{order.items} pcs</div>
        </div>
        <div className="font-bold text-white uppercase text-sm mb-1 line-clamp-1">{order.customerName}</div>
      </div>
      <div className="flex justify-between items-end mt-4 mb-3">
        <div className="text-xs font-bold text-zinc-400 border border-white/10 px-2 py-0.5 uppercase tracking-wider">
          Due: {new Date(order.dueDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
        </div>
        <div className="text-sm font-black text-emerald-400">
            ${order.totalValue.toLocaleString()}
        </div>
      </div>
      
      <div className="pt-3 border-t border-white/10">
        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Move to Stage</label>
        <select 
          value={order.status}
          onChange={(e) => setOrders(orders.map(o => o.id === order.id ? {...o, status: e.target.value as Stage} : o))}
          className="w-full bg-[#111] border border-white/20 text-white text-xs font-medium p-2 focus:outline-none focus:border-orange-500"
        >
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );
}

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
      machineAssignment: 'Unassigned',
      originalOwnerId: 'uid'
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
      <div className="h-full flex flex-col space-y-6 max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 flex-shrink-0">
          <div>
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-500">Workflow</label>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mt-1 text-white">Job Orders</h1>
            <p className="text-zinc-400 mt-2 font-medium">Drag and drop or use the dropdown to manage production stages.</p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center bg-orange-500 px-6 py-3 text-sm font-bold uppercase tracking-widest text-black hover:bg-orange-600 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Order
          </button>
        </div>

        <div className="flex-shrink-0 flex items-center mb-4">
           <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search by ID or Customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-white/20 bg-black text-white focus:outline-none focus:border-white transition-colors"
              />
            </div>
        </div>

        <div className="flex-1 flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x">
          {STAGES.map(stage => {
            const stageOrders = filteredOrders.filter(o => o.status === stage);
            return (
              <DroppableStage key={stage} id={stage} stageOrders={stageOrders} orders={orders} setOrders={setOrders} />
            );
          })}
        </div>
      </div>
      
      <DragOverlay>
        {activeOrder ? (
           <div className="w-80 bg-black border border-orange-500 shadow-2xl p-4 rotate-3">
             <div className="flex justify-between items-start mb-3">
               <div className="text-[10px] font-bold text-orange-500">{activeOrder.orderNumber}</div>
               <div className="text-[10px] font-mono text-zinc-500">{activeOrder.items} pcs</div>
             </div>
             <div className="font-bold text-white uppercase text-sm mb-1 line-clamp-1">{activeOrder.customerName}</div>
           </div>
        ) : null}
      </DragOverlay>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Order">
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Customer Name</label>
            <input 
              type="text" 
              required
              value={newOrder.customerName}
              onChange={e => setNewOrder({...newOrder, customerName: e.target.value})}
              className="w-full px-4 py-3 border border-white/20 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Items (Pcs)</label>
              <input 
                type="number" 
                required
                min="1"
                value={newOrder.items}
                onChange={e => setNewOrder({...newOrder, items: Number(e.target.value)})}
                className="w-full px-4 py-3 border border-white/20 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Total Value ($)</label>
              <input 
                type="number" 
                required
                min="0"
                value={newOrder.totalValue}
                onChange={e => setNewOrder({...newOrder, totalValue: Number(e.target.value)})}
                className="w-full px-4 py-3 border border-white/20 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Due Date</label>
              <input 
                type="date"
                required
                value={newOrder.dueDate}
                onChange={e => setNewOrder({...newOrder, dueDate: e.target.value})}
                className="w-full px-4 py-3 border border-white/20 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Initial Stage</label>
              <select 
                value={newOrder.status}
                onChange={e => setNewOrder({...newOrder, status: e.target.value as Stage})}
                className="w-full px-4 py-3 border border-white/20 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none"
              >
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <button 
            type="submit"
            className="w-full bg-orange-500 text-black font-black uppercase tracking-widest py-4 mt-6 hover:bg-orange-600 transition-colors"
          >
            Create Order
          </button>
        </form>
      </Modal>
    </DndContext>
  );
}
