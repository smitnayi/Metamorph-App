import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Search, Filter, Plus, AlertCircle, Edit2, DownloadCloud, Trash2, RefreshCw } from 'lucide-react';
import { useDataStore } from '../store/data';
import { toast } from 'sonner';
import Modal from '../components/ui/Modal';
import { InventoryItem } from '../types';
import { motion } from 'motion/react';

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
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterFinish === 'All' || item.finish === filterFinish;
    return matchesSearch && matchesFilter;
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.sku) {
      toast.error('Name and SKU required');
      return;
    }
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
          amountKg: adjustAmount,
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8 md:p-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-orange-500">Module</label>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mt-1 text-zinc-900 dark:text-white">Powder Inventory</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2 font-medium text-sm">Manage powder stock, thresholds, and suppliers.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportStock}
            className="inline-flex items-center justify-center bg-white dark:bg-[#111] border border-black/5 dark:border-white/10 px-4 py-3 md:py-4 rounded-xl text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white hover:border-orange-500 transition-colors shadow-lg active:scale-95"
          >
            <DownloadCloud className="h-5 w-5 md:mr-2" />
            <span className="hidden md:inline">Export</span>
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center bg-orange-500 px-6 py-3 md:py-4 rounded-xl text-sm font-black uppercase tracking-widest text-black hover:bg-orange-600 transition-colors shadow-lg active:scale-95"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Stock
          </button>
        </div>
      </div>

      <div className="bg-[#f4f4f5] dark:bg-[#111] rounded-2xl border border-black/5 dark:border-white/5 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search SKU or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors placeholder:text-zinc-600 font-medium"
            />
          </div>
          <select
            value={filterFinish}
            onChange={(e) => setFilterFinish(e.target.value)}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black px-4 py-4 text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-white transition-colors appearance-none focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="All">All Finishes</option>
            <option value="Matte">Matte</option>
            <option value="Gloss">Gloss</option>
            <option value="Texture">Texture</option>
            <option value="Satin">Satin</option>
          </select>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {filteredInventory.map((item) => (
          <div key={item.id} className="relative overflow-hidden rounded-[24px] bg-zinc-800 dark:bg-zinc-800">
             <div className="absolute inset-y-0 left-0 flex items-center pl-6 z-0 pointer-events-none">
               <span className="text-white font-black text-xs uppercase tracking-widest flex items-center"><Edit2 className="h-4 w-4 mr-2"/> Edit</span>
             </div>
             <div className="absolute inset-y-0 right-0 flex items-center pr-6 z-0 pointer-events-none">
               <span className="text-white font-black text-xs uppercase tracking-widest flex items-center"><Trash2 className="h-4 w-4 mr-2"/> Delete</span>
             </div>
             <motion.div 
               drag="x"
               dragConstraints={{ left: 0, right: 0 }}
               dragElastic={0.4}
               onDragEnd={(e, { offset }) => {
                 if (offset.x > 80) openEdit(item);
                 if (offset.x < -80) {
                    if ('vibrate' in navigator) navigator.vibrate([50, 50, 50]);
                    setInventory(prev => prev.filter(i => i.id !== item.id));
                    toast.success('Item deleted');
                 }
               }}
               className="bg-white/60 dark:bg-[#1a1a1a]/80 backdrop-blur-3xl border border-black/[0.04] dark:border-white/[0.06] rounded-[24px] p-4 flex flex-col gap-4 relative z-10 w-full shadow-sm"
             >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-base uppercase text-zinc-900 dark:text-white leading-tight flex items-center gap-2">
                   {item.name}
                   {(item as any)._hasPendingWrites && (
                     <div className="flex animate-pulse text-amber-500" title="Queued for Sync">
                       <RefreshCw className="h-3 w-3" />
                     </div>
                   )}
                </div>
                <div className="text-zinc-500 text-xs mt-1 font-mono">{item.sku}</div>
              </div>
              <div 
                className="w-8 h-8 rounded-full border-2 border-black/5 dark:border-white/10 shrink-0"
                style={{ backgroundColor: item.colorCode }}
              />
            </div>
            
            <div className="flex justify-between items-center bg-white dark:bg-black/50 p-3 rounded-xl border border-black/5 dark:border-white/5">
              <div className="text-xs text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-widest">{item.finish}</div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5">
                  {item.weightKg <= item.lowStockThreshold && (
                    <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                  )}
                  <span className={`font-mono text-lg font-black ${item.weightKg <= item.lowStockThreshold ? 'text-rose-500' : 'text-emerald-400'}`}>
                    {item.weightKg.toLocaleString()} <span className="text-[10px] text-zinc-500">KG</span>
                  </span>
                </div>
                <div className="w-full h-1 bg-black/10 dark:bg-white/10 mt-1.5 rounded-full overflow-hidden min-w-[60px]">
                  <div className={`h-full ${item.weightKg <= item.lowStockThreshold ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (item.weightKg / (item.lowStockThreshold * 3)) * 100)}%` }}></div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center gap-2 pt-2 border-t border-black/5 dark:border-white/5">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest line-clamp-1">{item.supplier}</div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(item)} className="p-2 lg:p-3 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white bg-black/5 dark:bg-white/5 rounded-lg active:scale-95 transition-transform">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => openAdjust(item)} className="px-4 py-2 bg-black/10 dark:bg-white/10 hover:bg-white text-zinc-900 dark:text-white hover:text-black rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors active:scale-95">
                  Restock
                </button>
              </div>
            </div>
           </motion.div>
          </div>
        ))}
        {filteredInventory.length === 0 && (
          <div className="p-12 text-center text-zinc-500 font-bold uppercase tracking-widest border border-dashed border-black/5 dark:border-white/10 rounded-2xl">
            No items found
          </div>
        )}
      </div>

      {/* Desktop Table Layout */}
      <Card className="hidden md:block bg-[#f4f4f5] dark:bg-[#111] border-black/5 dark:border-white/5 rounded-2xl overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left font-sans whitespace-nowrap min-w-[900px]">
            <thead className="bg-[#f4f4f5] dark:bg-[#111] text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-black/10 dark:border-white/20">
              <tr>
                <th className="px-6 py-4 w-1/3">SKU / Name</th>
                <th className="px-6 py-4 hidden md:table-cell">Finish</th>
                <th className="px-6 py-4">Color</th>
                <th className="px-6 py-4 text-right">Stock (Kg)</th>
                <th className="px-6 py-4 hidden lg:table-cell">Supplier</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-zinc-900 dark:text-white">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-black/5 dark:bg-white/5 transition-colors group">
                  <td className="px-6 py-5 w-1/3">
                    <div className="font-bold text-sm uppercase text-zinc-900 dark:text-white">{item.name}</div>
                    <div className="text-zinc-500 text-xs mt-1 font-mono">{item.sku}</div>
                  </td>
                  <td className="px-6 py-5 hidden md:table-cell">
                    <span className="inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-widest bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/20">
                      {item.finish}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-6 h-6 border border-black/10 dark:border-white/20"
                        style={{ backgroundColor: item.colorCode }}
                      />
                      <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">{item.colorCode}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {item.weightKg <= item.lowStockThreshold && (
                        <AlertCircle className="h-4 w-4 text-rose-500" />
                      )}
                      <span className={`font-mono text-lg font-bold ${item.weightKg <= item.lowStockThreshold ? 'text-rose-500' : 'text-emerald-400'}`}>
                        {item.weightKg.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-black/10 dark:bg-white/10 mt-2 max-w-[100px] ml-auto">
                      <div className={`h-full ${item.weightKg <= item.lowStockThreshold ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (item.weightKg / (item.lowStockThreshold * 3)) * 100)}%` }}></div>
                    </div>
                  </td>
                  <td className="px-6 py-5 hidden lg:table-cell text-zinc-600 dark:text-zinc-400 font-bold uppercase text-xs tracking-wider">
                    {item.supplier}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                       <button 
                        onClick={() => openEdit(item)}
                        className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 dark:text-white transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => openAdjust(item)}
                        className="text-[10px] font-bold md:ml-3 text-zinc-900 dark:text-white border border-black/10 dark:border-white/20 px-3 py-1 uppercase hover:bg-white hover:text-black transition-colors"
                      >
                        Adjust
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 font-bold uppercase tracking-widest">
                    No powder stock items found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Stock Element">
        <form onSubmit={handleAddItem} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Name</label>
               <input type="text" required value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-600" placeholder="e.g. Cobalt Blue" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">SKU</label>
               <input type="text" required value={newItem.sku} onChange={e => setNewItem({...newItem, sku: e.target.value})} className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-600" placeholder="e.g. CBT-101" />
             </div>
          </div>
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Initial Stock (Kg)</label>
               <input type="number" step="0.0001" required min="0" value={newItem.weightKg} onFocus={e => e.target.select()} onChange={e => setNewItem({...newItem, weightKg: e.target.value as any})} className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Low Alert (Kg)</label>
               <input type="number" step="0.0001" required min="0" value={newItem.lowStockThreshold} onFocus={e => e.target.select()} onChange={e => setNewItem({...newItem, lowStockThreshold: e.target.value as any})} className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium" />
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Finish</label>
               <select value={newItem.finish} onChange={e => setNewItem({...newItem, finish: e.target.value})} className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none font-medium">
                 <option>Matte</option><option>Gloss</option><option>Satin</option><option>Texture</option>
               </select>
             </div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Color Code (Hex)</label>
               <input type="text" value={newItem.colorCode} onChange={e => setNewItem({...newItem, colorCode: e.target.value})} className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium" />
             </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Supplier</label>
            <input type="text" value={newItem.supplier} onChange={e => setNewItem({...newItem, supplier: e.target.value})} className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-600" placeholder="e.g. Chemcorp" />
          </div>
          <button type="submit" className="w-full bg-orange-500 text-black font-black uppercase tracking-widest py-4 rounded-xl mt-4 hover:bg-orange-600 transition-colors shadow-lg active:scale-[0.98]">
            Add Element
          </button>
        </form>
      </Modal>

      <Modal isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)} title={`Adjust Stock: ${activeItem?.name || ''}`}>
         <form onSubmit={handleAdjustStock} className="space-y-5">
            <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl">
               <button type="button" onClick={() => setAdjustType('add')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${adjustType==='add' ? 'bg-white dark:bg-[#111] shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>Add Stock</button>
               <button type="button" onClick={() => setAdjustType('remove')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${adjustType==='remove' ? 'bg-white dark:bg-[#111] shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>Remove Stock</button>
            </div>
            <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Amount (Kg)</label>
               <input type="number" required min="0.0001" step="0.0001" value={adjustAmount} onFocus={e => e.target.select()} onChange={e => setAdjustAmount(e.target.value)} className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Reason / Order Ref (Optional)</label>
               <input type="text" value={adjustReason} onChange={e => setAdjustReason(e.target.value)} className="w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium" placeholder="E.g. Spilled, Order #102..." />
             </div>
             <button type="submit" className="w-full bg-white text-black font-black uppercase tracking-widest py-4 rounded-xl mt-4 hover:bg-zinc-200 transition-colors shadow-lg active:scale-[0.98]">
               Confirm Adjust
             </button>
         </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit ${editingItem?.name || ''}`}>
        <div className="space-y-6">
          <form onSubmit={handleEditItem} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Name</label>
                <input type="text" required value={editingItem?.name || ''} onChange={e => setEditingItem(prev => prev ? {...prev, name: e.target.value} : null)} className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">SKU</label>
                <input type="text" required value={editingItem?.sku || ''} onChange={e => setEditingItem(prev => prev ? {...prev, sku: e.target.value} : null)} className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Low Alert (Kg)</label>
                 <input type="number" step="0.0001" required min="0" value={editingItem?.lowStockThreshold === undefined ? '' : editingItem.lowStockThreshold} onFocus={e => e.target.select()} onChange={e => setEditingItem(prev => prev ? {...prev, lowStockThreshold: Number(e.target.value) || 0} : null)} className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white" />
               </div>
               <div>
                 <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Finish</label>
                 <select value={editingItem?.finish || 'Matte'} onChange={e => setEditingItem(prev => prev ? {...prev, finish: e.target.value as any} : null)} className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black text-zinc-900 dark:text-white">
                   <option>Matte</option><option>Gloss</option><option>Satin</option><option>Texture</option>
                 </select>
               </div>
            </div>
            <button type="submit" className="w-full bg-white text-black font-black uppercase tracking-widest py-3 rounded-xl mt-2 hover:bg-zinc-200 transition-colors shadow-lg active:scale-[0.98]">
              Save Changes
            </button>
          </form>
          
          <div className="pt-6 border-t border-black/10 dark:border-white/10">
            <h4 className="text-sm font-black uppercase tracking-widest mb-4">Usage History</h4>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
              {inventoryUsages.filter(u => u.inventoryId === editingItem?.id).length === 0 ? (
                <p className="text-xs text-zinc-500 font-medium italic">No usage recorded yet.</p>
              ) : (
                inventoryUsages.filter(u => u.inventoryId === editingItem?.id).map(usage => (
                  <div key={usage.id} className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-3 flex justify-between items-center text-xs border border-white/5">
                     <div>
                       <span className="font-bold block">{usage.amountKg}kg Used</span>
                       <span className="text-zinc-500">Order: {usage.orderId} - {usage.customerName}</span>
                     </div>
                     <div className="text-zinc-400 font-mono">
                       {new Date(usage.date).toLocaleDateString()}
                     </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
}
