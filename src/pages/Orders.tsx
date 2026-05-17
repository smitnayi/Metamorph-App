import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Search, Plus } from 'lucide-react';
import { mockOrders } from '../store/mockData';
import { Order } from '../types';
import { toast } from 'sonner';

const STAGES = ['Quoted', 'In Progress', 'Quality Check', 'Shipped', 'Completed'] as const;
type Stage = typeof STAGES[number];

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<Order[]>(mockOrders);

  const filteredOrders = orders.filter(order => 
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('orderId', id);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, stage: Stage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('orderId');
    if (id) {
      setOrders(orders.map(order => order.id === id ? { ...order, status: stage } : order));
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 flex-shrink-0">
        <div>
          <label className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-500">Workflow</label>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mt-1 text-white">Job Orders</h1>
          <p className="text-zinc-400 mt-2 font-medium">Drag and drop or use the dropdown to manage production stages.</p>
        </div>
        <button 
          onClick={() => toast.success('Order creation flow simulated for Metamorph Metal.')}
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
            <div 
              key={stage} 
              className="flex-shrink-0 w-80 flex flex-col bg-[#111] border border-white/10 snap-center"
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, stage)}
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">{stage}</h3>
                <span className="text-[10px] font-black bg-white/10 px-2 py-0.5 text-white">{stageOrders.length}</span>
              </div>
              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                 {stageOrders.map(order => (
                    <div 
                      key={order.id} 
                      draggable
                      onDragStart={(e) => onDragStart(e, order.id)}
                      className="bg-black border border-white/20 p-4 cursor-grab active:cursor-grabbing hover:border-orange-500/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="text-[10px] font-bold text-orange-500">{order.orderNumber}</div>
                        <div className="text-[10px] font-mono text-zinc-500">{order.items} pcs</div>
                      </div>
                      <div className="font-bold text-white uppercase text-sm mb-1 line-clamp-1">{order.customerName}</div>
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
                 ))}
                 {stageOrders.length === 0 && (
                   <div className="text-center p-8 border border-dashed border-white/10 text-zinc-600 text-xs font-bold uppercase tracking-widest">
                     Drop Here
                   </div>
                 )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
