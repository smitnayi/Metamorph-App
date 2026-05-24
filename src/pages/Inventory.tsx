import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Search, Filter, Plus, AlertCircle, Edit2 } from 'lucide-react';
import { useDataStore } from '../store/data';
import { toast } from 'sonner';
import Modal from '../components/ui/Modal';
import { InventoryItem } from '../types';

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const { inventory, setInventory } = useDataStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(null);
  
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '', sku: '', finish: 'Matte', colorCode: '#000000', weightKg: 0, lowStockThreshold: 50, supplier: ''
  });
  const [restockAmount, setRestockAmount] = useState<number>(0);

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      weightKg: Number(newItem.weightKg) || 0,
      lowStockThreshold: Number(newItem.lowStockThreshold) || 50,
      supplier: newItem.supplier || 'Unknown',
      location: newItem.location || 'Warehouse',
      lastUpdated: new Date().toISOString()
    };
    setInventory([...inventory, item]);
    toast.success(`${item.name} added to inventory`);
    setIsAddModalOpen(false);
    setNewItem({ name: '', sku: '', finish: 'Matte', colorCode: '#000000', weightKg: 0, lowStockThreshold: 50, supplier: '' });
  };

  const handleRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeItem) {
      setInventory(inventory.map(item => 
        item.id === activeItem.id ? { ...item, weightKg: item.weightKg + Number(restockAmount) } : item
      ));
      toast.success(`Added ${restockAmount}kg to ${activeItem.name}`);
    }
    setIsRestockModalOpen(false);
    setRestockAmount(0);
    setActiveItem(null);
  };

  const openRestock = (item: InventoryItem) => {
    setActiveItem(item);
    setRestockAmount(100);
    setIsRestockModalOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    toast.success('In a real app, this would open a full detail editor. For now, it works.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8 md:p-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-orange-500">Module</label>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mt-1 text-white">Powder Inventory</h1>
          <p className="text-zinc-400 mt-2 font-medium text-sm">Manage powder stock, thresholds, and suppliers.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center bg-orange-500 px-6 py-3 md:py-4 rounded-xl text-sm font-black uppercase tracking-widest text-black hover:bg-orange-600 transition-colors shadow-lg active:scale-95"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Stock
        </button>
      </div>

      <div className="bg-[#111] rounded-2xl border border-white/5 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search SKU or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-white/10 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors placeholder:text-zinc-600 font-medium"
            />
          </div>
          <button 
            onClick={() => toast.info('Advanced filtering options simulated.')}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-white/10 bg-black px-6 py-4 text-sm font-bold uppercase tracking-widest text-white hover:bg-white hover:text-black transition-colors"
          >
            <Filter className="h-4 w-4 mr-2" />
            Options
          </button>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {filteredInventory.map((item) => (
          <div key={item.id} className="bg-[#111] border border-white/5 rounded-2xl p-4 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-base uppercase text-white leading-tight">{item.name}</div>
                <div className="text-zinc-500 text-xs mt-1 font-mono">{item.sku}</div>
              </div>
              <div 
                className="w-8 h-8 rounded-full border-2 border-white/10 shrink-0"
                style={{ backgroundColor: item.colorCode }}
              />
            </div>
            
            <div className="flex justify-between items-center bg-black/50 p-3 rounded-xl border border-white/5">
              <div className="text-xs text-zinc-400 font-bold uppercase tracking-widest">{item.finish}</div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5">
                  {item.weightKg <= item.lowStockThreshold && (
                    <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                  )}
                  <span className={`font-mono text-lg font-black ${item.weightKg <= item.lowStockThreshold ? 'text-rose-500' : 'text-emerald-400'}`}>
                    {item.weightKg.toLocaleString()} <span className="text-[10px] text-zinc-500">KG</span>
                  </span>
                </div>
                <div className="w-full h-1 bg-white/10 mt-1.5 rounded-full overflow-hidden min-w-[60px]">
                  <div className={`h-full ${item.weightKg <= item.lowStockThreshold ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (item.weightKg / (item.lowStockThreshold * 3)) * 100)}%` }}></div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center gap-2 pt-2 border-t border-white/5">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest line-clamp-1">{item.supplier}</div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(item)} className="p-2 lg:p-3 text-zinc-400 hover:text-white bg-white/5 rounded-lg">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => openRestock(item)} className="px-4 py-2 bg-white/10 hover:bg-white text-white hover:text-black rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors">
                  Restock
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredInventory.length === 0 && (
          <div className="p-12 text-center text-zinc-500 font-bold uppercase tracking-widest border border-dashed border-white/10 rounded-2xl">
            No items found
          </div>
        )}
      </div>

      {/* Desktop Table Layout */}
      <Card className="hidden md:block bg-[#111] border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans block  whitespace-nowrap">
            <thead className="bg-[#111] text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-white/20 w-full table">
              <tr>
                <th className="px-6 py-4 w-1/3">SKU / Name</th>
                <th className="px-6 py-4 hidden md:table-cell">Finish</th>
                <th className="px-6 py-4">Color</th>
                <th className="px-6 py-4 text-right">Stock (Kg)</th>
                <th className="px-6 py-4 hidden lg:table-cell">Supplier</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-white w-full table">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-5 w-1/3">
                    <div className="font-bold text-sm uppercase text-white">{item.name}</div>
                    <div className="text-zinc-500 text-xs mt-1 font-mono">{item.sku}</div>
                  </td>
                  <td className="px-6 py-5 hidden md:table-cell">
                    <span className="inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-widest bg-white/10 border border-white/20">
                      {item.finish}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-6 h-6 border border-white/20"
                        style={{ backgroundColor: item.colorCode }}
                      />
                      <span className="font-mono text-xs text-zinc-400">{item.colorCode}</span>
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
                    <div className="w-full h-1 bg-white/10 mt-2 max-w-[100px] ml-auto">
                      <div className={`h-full ${item.weightKg <= item.lowStockThreshold ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (item.weightKg / (item.lowStockThreshold * 3)) * 100)}%` }}></div>
                    </div>
                  </td>
                  <td className="px-6 py-5 hidden lg:table-cell text-zinc-400 font-bold uppercase text-xs tracking-wider">
                    {item.supplier}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                       <button 
                        onClick={() => openEdit(item)}
                        className="text-[10px] font-bold text-zinc-500 hover:text-white transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => openRestock(item)}
                        className="text-[10px] font-bold md:ml-3 text-white border border-white/20 px-3 py-1 uppercase hover:bg-white hover:text-black transition-colors"
                      >
                        Restock
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
               <input type="text" required value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full px-4 py-4 rounded-xl border border-white/10 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-600" placeholder="e.g. Cobalt Blue" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">SKU</label>
               <input type="text" required value={newItem.sku} onChange={e => setNewItem({...newItem, sku: e.target.value})} className="w-full px-4 py-4 rounded-xl border border-white/10 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-600" placeholder="e.g. CBT-101" />
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Initial Stock (Kg)</label>
               <input type="number" required min="0" value={newItem.weightKg} onChange={e => setNewItem({...newItem, weightKg: Number(e.target.value)})} className="w-full px-4 py-4 rounded-xl border border-white/10 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors font-medium" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Low Alert (Kg)</label>
               <input type="number" required min="0" value={newItem.lowStockThreshold} onChange={e => setNewItem({...newItem, lowStockThreshold: Number(e.target.value)})} className="w-full px-4 py-4 rounded-xl border border-white/10 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors font-medium" />
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Finish</label>
               <select value={newItem.finish} onChange={e => setNewItem({...newItem, finish: e.target.value})} className="w-full px-4 py-4 rounded-xl border border-white/10 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none font-medium">
                 <option>Matte</option><option>Gloss</option><option>Satin</option><option>Texture</option>
               </select>
             </div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Color Code (Hex)</label>
               <input type="text" value={newItem.colorCode} onChange={e => setNewItem({...newItem, colorCode: e.target.value})} className="w-full px-4 py-4 rounded-xl border border-white/10 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors font-medium" />
             </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Supplier</label>
            <input type="text" value={newItem.supplier} onChange={e => setNewItem({...newItem, supplier: e.target.value})} className="w-full px-4 py-4 rounded-xl border border-white/10 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-600" placeholder="e.g. Chemcorp" />
          </div>
          <button type="submit" className="w-full bg-orange-500 text-black font-black uppercase tracking-widest py-4 rounded-xl mt-4 hover:bg-orange-600 transition-colors shadow-lg active:scale-[0.98]">
            Add Element
          </button>
        </form>
      </Modal>

      <Modal isOpen={isRestockModalOpen} onClose={() => setIsRestockModalOpen(false)} title={`Restock ${activeItem?.name || ''}`}>
         <form onSubmit={handleRestock} className="space-y-5">
            <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Amount to Add (Kg)</label>
               <input type="number" required min="1" value={restockAmount} onChange={e => setRestockAmount(Number(e.target.value))} className="w-full px-4 py-4 rounded-xl border border-white/10 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors font-medium" />
             </div>
             <button type="submit" className="w-full bg-white text-black font-black uppercase tracking-widest py-4 rounded-xl mt-4 hover:bg-zinc-200 transition-colors shadow-lg active:scale-[0.98]">
               Confirm Restock
             </button>
         </form>
      </Modal>

    </div>
  );
}
