import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Search, Filter, Plus, AlertCircle, Edit2, DownloadCloud, Trash2, RefreshCw } from 'lucide-react';
import { useDataStore } from '../store/data';
import { toast } from 'sonner';
import Modal from '../components/ui/Modal';
import { InventoryItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { getHexFromRal } from '../lib/ralToHex';
import { cn } from '../lib/utils';

import { SwipeAction } from '../components/ui/SwipeAction';

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const { inventory, setInventory, inventoryUsages, setInventoryUsages, addActivityLog } = useDataStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState<number | string>('');
  const [adjustType, setAdjustType] = useState<'add'|'remove'>('add');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(null);
  
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '', sku: '', finish: 'Matte', colorCode: '#000000', weightKg: '' as any, lowStockThreshold: '' as any, supplier: ''
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [filterFinish, setFilterFinish] = useState<string>('All');

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.sku.toLowerCase().includes(searchTerm.toLowerCase()) || item.colorCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterFinish === 'All' || item.finish === filterFinish;
    return matchesSearch && matchesFilter;
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.sku) {
      toast.error('Name and SKU required');
      return;
    }
    const colorHex = getHexFromRal(newItem.colorCode || '') || newItem.colorCode || '#ffffff';
    
    const item: InventoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: newItem.name!,
      sku: newItem.sku!,
      finish: newItem.finish || 'Matte',
      colorCode: newItem.colorCode || '#ffffff',
      weightKg: parseFloat(newItem.weightKg as any) || 0,
      lowStockThreshold: parseFloat(newItem.lowStockThreshold as any) || 50,
      supplier: newItem.supplier || 'Unknown',
      location: newItem.location || 'Warehouse',
      lastUpdated: new Date().toISOString()
    };
    setInventory(prev => [...prev, item]);
    addActivityLog({ action: 'create', module: 'Inventory', details: `Added new stock item: ${item.name}`, userId: 'user1', userName: 'Admin' });
    toast.success(`${item.name} added to inventory`);
    setIsAddModalOpen(false);
    setNewItem({ name: '', sku: '', finish: 'Matte', colorCode: '#000000', weightKg: '' as any, lowStockThreshold: '' as any, supplier: '' });
  };

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeItem && adjustAmount > 0) {
      const amountChange = adjustType === 'add' ? Number(adjustAmount) : -Number(adjustAmount);
      const newWeight = Math.max(0, activeItem.weightKg + amountChange);
      
      setInventory(prev => prev.map(item => 
        item.id === activeItem.id ? { ...item, weightKg: newWeight, lastUpdated: new Date().toISOString() } : item
      ));

      const actionText = adjustType === 'add' ? `Added ${adjustAmount}kg to` : `Removed ${adjustAmount}kg from`;
      const reasonText = adjustReason ? ` (Reason: ${adjustReason})` : '';

      addActivityLog({ 
        action: 'update', 
        module: 'Inventory', 
        details: `${actionText} ${activeItem.name}${reasonText}`, 
        userId: 'user1', 
        userName: 'Admin' 
      });
      if (adjustType === 'remove') {
        const usage = {
          id: Math.random().toString(36).substring(2, 9),
          inventoryId: activeItem.id,
          orderId: adjustReason ? `Manual: ${adjustReason}` : 'Manual Adjustment',
          customerName: '-',
          amountKg: Number(adjustAmount),
          date: new Date().toISOString()
        };
        setInventoryUsages(prev => [...prev, usage]);
      }

      toast.success(`Adjusted stock for ${activeItem.name}`);
    }
    setIsAdjustModalOpen(false);
    setAdjustAmount(0);
    setAdjustReason('');
    setActiveItem(null);
  };

  const openAdjust = (item: InventoryItem) => {
    setActiveItem(item);
    setAdjustAmount(100);
    setAdjustType('add');
    setAdjustReason('');
    setIsAdjustModalOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      setInventory(prev => prev.map(item => item.id === editingItem.id ? editingItem : item));
      toast.success(`${editingItem.name} updated successfully`);
      addActivityLog({ action: 'update', module: 'Inventory', details: `Updated powder item: ${editingItem.name}`, userId: 'user1', userName: 'Admin' });
      setIsEditModalOpen(false);
      setEditingItem(null);
    }
  };


  const handleExportStock = () => {
    let csvContent = "SKU,Name,Finish,Color Code,Stock (Kg),Low Alert (Kg),Supplier\n";
    filteredInventory.forEach(item => {
      csvContent += `${item.sku},${item.name},${item.finish},${item.colorCode},${item.weightKg},${item.lowStockThreshold},${item.supplier}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Inventory stock successfully exported as CSV.');
  };

  const finishes = ['All', 'Matte', 'Gloss', 'Satin', 'Texture', 'Structure', 'Metallic', 'Clear'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto px-4 py-8 md:p-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <label className="text-xs md:text-xs font-semibold text-orange-500">Module</label>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mt-1 text-zinc-900 dark:text-white">Powder Stock</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2 font-medium text-sm">Manage powder inventory, thresholds, and suppliers with ease.</p>
        </div>
        <div className="flex gap-4">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportStock}
            className="inline-flex items-center justify-center bg-white/60 dark:bg-black/40 backdrop-blur-md border border-black/10 dark:border-white/10 px-5 py-3 md:py-4 rounded-xl text-xs font-semibold text-zinc-900 dark:text-white hover:bg-white dark:hover:bg-black transition-all shadow-sm active:scale-95"
          >
            <DownloadCloud className="h-4 w-4 md:mr-2 text-zinc-500" />
            <span className="hidden md:inline">Export</span>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center bg-orange-600 px-5 py-2.5 rounded-lg text-sm font-medium text-white hover:bg-orange-700 transition-colors shadow-sm active:scale-95"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Stock
          </motion.button>
        </div>
      </div>

      <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-[24px] shadow-sm p-6 flex flex-col md:flex-row gap-6 justify-between items-center mb-8">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by name, SKU, or RAL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-500"
              />
            </div>
            
            <div className="flex w-full md:w-auto gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
              {finishes.map(finish => (
                <button
                  key={finish}
                  onClick={() => setFilterFinish(finish)}
                  className={cn(
                    "px-5 py-3 rounded-lg text-xs font-semibold text-zinc-500 whitespace-nowrap transition-all border border-transparent",
                    filterFinish === finish 
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border-black/10 dark:border-white/10" 
                      : "bg-black/5 dark:bg-white/5 text-zinc-500 hover:bg-black/10 dark:hover:bg-white/10 hover:text-zinc-700 dark:hover:text-zinc-300"
                  )}
                >
                  {finish}
                </button>
              ))}
            </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <AnimatePresence>
          {filteredInventory.map((item, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              key={item.id}
              className="group bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-2xl md:rounded-[32px] hover:shadow-xl hover:bg-white/60 dark:hover:bg-black/40 hover:border-orange-500/30 transition-all relative overflow-hidden"
            >
              <div className="hidden md:block p-8">
                <div className="absolute top-0 right-0 p-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                  <button onClick={() => openEdit(item)} className="p-3 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg hover:text-orange-500 shadow-sm transition-colors border border-black/5 dark:border-white/5">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => {
                     if(confirm('Delete this stock item?')) {
                        setInventory(prev => prev.filter(i => i.id !== item.id));
                     }
                  }} className="p-3 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg hover:text-rose-500 shadow-sm transition-colors border border-black/5 dark:border-white/5">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-start gap-5 mb-8">
                  <div 
                    className="w-16 h-16 rounded-xl border-[4px] border-white dark:border-zinc-800 shadow-lg shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-3"
                    style={{ backgroundColor: getHexFromRal(item.colorCode) || item.colorCode }}
                  />
                  <div className="flex-1 pr-20">
                    <h3 className="font-semibold tracking-tight text-xl text-zinc-900 dark:text-white leading-tight mb-2">{item.name}</h3>
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                      <span className="font-mono">{item.sku}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                      <span>{item.colorCode}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white/60 dark:bg-black/40 rounded-xl p-4 border border-black/5 dark:border-white/5 backdrop-blur-md">
                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] mb-1">Finish</div>
                    <div className="font-semibold text-sm text-zinc-900 dark:text-white">{item.finish}</div>
                  </div>
                  <div className="bg-white/60 dark:bg-black/40 rounded-xl p-4 border border-black/5 dark:border-white/5 backdrop-blur-md">
                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] mb-1">Supplier</div>
                    <div className="font-semibold text-sm text-zinc-900 dark:text-white truncate">{item.supplier}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="text-sm font-semibold text-zinc-500 uppercase tracking-[0.2em]">Available Stock</div>
                    <div className={cn(
                      "text-3xl font-semibold tracking-tight",
                      item.weightKg <= item.lowStockThreshold ? 'text-rose-500' : 'text-emerald-500'
                    )}>
                      {item.weightKg.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}<span className="text-sm text-zinc-400 ml-1">kg</span>
                    </div>
                  </div>
                  
                  <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (item.weightKg / (item.lowStockThreshold * 4)) * 100)}%` }}
                      className={cn(
                        "h-full rounded-full",
                        item.weightKg <= item.lowStockThreshold ? 'bg-rose-500' : 'bg-emerald-500'
                      )}
                    />
                  </div>
                  
                  {item.weightKg <= item.lowStockThreshold && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 mt-2">
                      <AlertCircle className="h-4 w-4" /> Low Stock Alert
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => openAdjust(item)}
                  className="w-full mt-8 py-4 px-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/40 hover:bg-white dark:hover:bg-black text-xs font-semibold transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95 text-zinc-900 dark:text-white"
                >
                  <RefreshCw className="h-4 w-4" />
                  Adjust Stock
                </button>
              </div>

              {/* Mobile List View */}
              <div className="md:hidden">
                <SwipeAction 
                  bgClassName="bg-zinc-100/50 dark:bg-zinc-800/50"
                  rightActions={
                    <div className="flex items-center justify-end gap-2 pr-4 pl-2 h-full">
                      <button onClick={() => openEdit(item)} className="w-10 h-10 flex items-center justify-center bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-200 rounded-full hover:bg-black/10 transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => {
                         if(confirm('Delete this stock item?')) {
                            setInventory(prev => prev.filter(i => i.id !== item.id));
                         }
                      }} className="w-10 h-10 flex items-center justify-center bg-rose-500/10 text-rose-600 rounded-full hover:bg-rose-500/20 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  }
                  leftActions={
                    <div className="flex items-center justify-start gap-2 pl-4 pr-2 h-full">
                      <button onClick={() => openAdjust(item)} className="w-10 h-10 flex items-center justify-center bg-emerald-500/10 text-emerald-600 rounded-full hover:bg-emerald-500/20 transition-colors">
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                  }
                  rightActionWidth={110}
                  leftActionWidth={70}
                >
                  <div className={cn(
                    "flex items-center justify-between gap-4 p-5 h-full transition-colors",
                    item.weightKg <= item.lowStockThreshold ? "bg-rose-50 dark:bg-[#2c1418]" : "bg-white dark:bg-[#111]"
                  )}>
                    <div className="relative shrink-0">
                      <div 
                        className="w-14 h-14 rounded-2xl shadow-sm border border-black/5 dark:border-white/5 shrink-0"
                        style={{ backgroundColor: getHexFromRal(item.colorCode) || item.colorCode }}
                      />
                      {item.weightKg <= item.lowStockThreshold && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white dark:border-[#111]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h3 className="font-semibold text-[15px] text-zinc-900 dark:text-white leading-tight truncate tracking-tight">{item.name}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">{item.sku}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                        <span className={cn("text-[13px] font-bold tracking-tight", item.weightKg <= item.lowStockThreshold ? 'text-rose-500' : 'text-emerald-500')}>
                          {item.weightKg.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}kg
                        </span>
                      </div>
                    </div>
                    {/* Visual cue for swipe */}
                    <div className="shrink-0 flex flex-col gap-1 items-center justify-center opacity-20 px-2 py-4">
                      <div className="w-1 h-1 rounded-full bg-black dark:bg-white" />
                      <div className="w-1 h-1 rounded-full bg-black dark:bg-white" />
                      <div className="w-1 h-1 rounded-full bg-black dark:bg-white" />
                    </div>
                  </div>
                </SwipeAction>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredInventory.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-24 h-24 mb-6 rounded-3xl bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-500/20">
            <Search className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">No Powder Stock Found</h3>
          <p className="text-zinc-500 max-w-md mx-auto">We couldn't find any inventory matching your search. Try adjusting your filters or adding new stock.</p>
        </motion.div>
      )}

      {/* Add Stock Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Powder Stock">
        <form onSubmit={handleAddItem} className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl mb-2">
             <div 
                className="w-12 h-12 rounded-lg border-2 border-white shadow-sm transition-colors"
                style={{ backgroundColor: getHexFromRal(newItem.colorCode || '') || newItem.colorCode || '#ffffff' }}
             />
             <div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-orange-400">Color Preview</p>
                <p className="text-xs font-medium text-zinc-500">Enter a RAL code or Hex color to see it here.</p>
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Powder Name</label>
               <input type="text" required value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm" placeholder="e.g. Jet Black" />
             </div>
             <div>
               <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">SKU</label>
               <input type="text" required value={newItem.sku} onChange={e => setNewItem({...newItem, sku: e.target.value})} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm" placeholder="e.g. JB-9005" />
             </div>
          </div>
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Initial Stock (Kg)</label>
               <input type="number" step="0.1" required min="0" value={newItem.weightKg} onFocus={e => e.target.select()} onChange={e => setNewItem({...newItem, weightKg: e.target.value as any})} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm" />
             </div>
             <div>
               <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Low Alert (Kg)</label>
               <input type="number" step="0.1" required min="0" value={newItem.lowStockThreshold} onFocus={e => e.target.select()} onChange={e => setNewItem({...newItem, lowStockThreshold: e.target.value as any})} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm" />
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Finish</label>
               <select value={newItem.finish} onChange={e => setNewItem({...newItem, finish: e.target.value})} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none font-semibold cursor-pointer shadow-sm">
                 {finishes.filter(f => f !== 'All').map(f => <option key={f}>{f}</option>)}
               </select>
             </div>
             <div>
               <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">RAL / Color Code</label>
               <input type="text" value={newItem.colorCode} onChange={e => setNewItem({...newItem, colorCode: e.target.value})} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm" placeholder="RAL 9005 or #000000" />
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Per KG Rate (₹)</label>
              <input type="number" step="0.01" value={newItem.perKgRate || ''} onFocus={e => e.target.select()} onChange={e => setNewItem({...newItem, perKgRate: Number(e.target.value)})} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm" placeholder="e.g. 250" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Supplier (Optional)</label>
              <input type="text" value={newItem.supplier} onChange={e => setNewItem({...newItem, supplier: e.target.value})} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold placeholder:text-zinc-500 shadow-sm" placeholder="e.g. Chemcorp" />
            </div>
          </div>
          <button type="submit" className="w-full bg-orange-500 text-white font-semibold py-5 rounded-xl mt-8 hover:bg-orange-400 transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-[0.98] text-sm">
            Save Powder Item
          </button>
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)} title={`Adjust Stock: ${activeItem?.name || ''}`}>
         <form onSubmit={handleAdjustStock} className="space-y-6">
            <div className="flex bg-black/5 dark:bg-white/5 p-1.5 rounded-lg border border-black/5 dark:border-white/5">
               <button type="button" onClick={() => setAdjustType('add')} className={`flex-1 py-3 text-xs font-semibold text-zinc-500 rounded-lg transition-all ${adjustType==='add' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>+ Receive</button>
               <button type="button" onClick={() => setAdjustType('remove')} className={`flex-1 py-3 text-xs font-semibold text-zinc-500 rounded-lg transition-all ${adjustType==='remove' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>- Consume</button>
            </div>
            <div>
               <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Amount (Kg)</label>
               <input type="number" required min="0.1" step="0.1" value={adjustAmount} onFocus={e => e.target.select()} onChange={e => setAdjustAmount(e.target.value)} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold text-lg shadow-sm" />
             </div>
             <div>
               <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Reason / Reference (Optional)</label>
               <input type="text" value={adjustReason} onChange={e => setAdjustReason(e.target.value)} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm" placeholder="E.g. Spilled, Order #102..." />
             </div>
             <button type="submit" className="w-full bg-orange-500 text-white font-semibold text-sm uppercase tracking-[0.1em] py-5 rounded-xl mt-8 hover:bg-orange-400 transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-95">
               Confirm Adjustment
             </button>
         </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit ${editingItem?.name || ''}`}>
        <div className="space-y-6">
          <form onSubmit={handleEditItem} className="space-y-5">
            <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl mb-2">
               <div 
                  className="w-12 h-12 rounded-lg border-2 border-white dark:border-zinc-800 shadow-sm transition-colors"
                  style={{ backgroundColor: getHexFromRal(editingItem?.colorCode || '') || editingItem?.colorCode || '#ffffff' }}
               />
               <div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white">Color Preview</p>
                  <p className="text-xs font-medium text-zinc-500">Live preview of selected RAL/Hex.</p>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Name</label>
                <input type="text" required value={editingItem?.name || ''} onChange={e => setEditingItem(prev => prev ? {...prev, name: e.target.value} : null)} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">SKU</label>
                <input type="text" required value={editingItem?.sku || ''} onChange={e => setEditingItem(prev => prev ? {...prev, sku: e.target.value} : null)} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Low Alert (Kg)</label>
                 <input type="number" step="0.1" required min="0" value={editingItem?.lowStockThreshold === undefined ? '' : editingItem.lowStockThreshold} onFocus={e => e.target.select()} onChange={e => setEditingItem(prev => prev ? {...prev, lowStockThreshold: Number(e.target.value) || 0} : null)} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm" />
               </div>
               <div>
                 <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Finish</label>
                 <select value={editingItem?.finish || 'Matte'} onChange={e => setEditingItem(prev => prev ? {...prev, finish: e.target.value as any} : null)} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm appearance-none cursor-pointer">
                   {finishes.filter(f => f !== 'All').map(f => <option key={f}>{f}</option>)}
                 </select>
               </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Color Code (RAL or Hex)</label>
              <input type="text" value={editingItem?.colorCode || ''} onChange={e => setEditingItem(prev => prev ? {...prev, colorCode: e.target.value} : null)} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm" placeholder="e.g. #000000 or RAL 9005" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Per KG Rate (₹)</label>
                <input type="number" step="0.01" value={editingItem?.perKgRate || ''} onFocus={e => e.target.select()} onChange={e => setEditingItem(prev => prev ? {...prev, perKgRate: Number(e.target.value)} : null)} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold shadow-sm" placeholder="e.g. 250" />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] block mb-2 px-1">Supplier</label>
                <input type="text" value={editingItem?.supplier || ''} onChange={e => setEditingItem(prev => prev ? {...prev, supplier: e.target.value} : null)} className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#111] backdrop-blur-md text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-semibold placeholder:text-zinc-500 shadow-sm" />
              </div>
            </div>
            <button type="submit" className="w-full bg-orange-500 text-white font-semibold text-sm uppercase tracking-[0.1em] py-5 rounded-xl mt-8 hover:bg-orange-400 transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-95">
              Save Changes
            </button>
          </form>
          
          <div className="pt-6 border-t border-black/10 dark:border-white/10">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.1em] mb-3">Usage History</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {inventoryUsages.filter(u => u.inventoryId === editingItem?.id).length === 0 ? (
                <p className="text-xs font-semibold text-zinc-500 text-zinc-500">No usage recorded yet.</p>
              ) : (
                inventoryUsages.filter(u => u.inventoryId === editingItem?.id).map(usage => (
                  <div key={usage.id} className="bg-white/40 dark:bg-black/20 backdrop-blur-md rounded-xl p-4 flex justify-between items-center border border-black/5 dark:border-white/5">
                     <div>
                       <span className="text-sm font-semibold tracking-tight block text-zinc-900 dark:text-white">{usage.amountKg}kg Consumed</span>
                       <span className="text-xs font-semibold text-zinc-500 tracking-widest mt-0.5 inline-block">Order: {usage.orderId} - {usage.customerName}</span>
                     </div>
                     <div className="text-xs text-zinc-400 font-semibold">
                       {new Date(usage.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                     </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Modal>

    </motion.div>
  );
}

