import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Search, Filter, Plus, AlertCircle, Edit2 } from 'lucide-react';
import { mockInventory } from '../store/mockData';
import { toast } from 'sonner';
import Modal from '../components/ui/Modal';
import { InventoryItem } from '../types';

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory);
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
      supplier: newItem.supplier || 'Unknown'
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
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <label className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-500">Module</label>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mt-1 text-white">Powder Inventory</h1>
          <p className="text-zinc-400 mt-2 font-medium">Manage powder stock, thresholds, and suppliers.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center bg-orange-500 px-6 py-3 text-sm font-bold uppercase tracking-widest text-black hover:bg-orange-600 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Stock Element
        </button>
      </div>

      <Card>
        <CardContent className="p-6 border-b border-white/10">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search SKU or Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-white/20 bg-black text-white focus:outline-none focus:border-white transition-colors"
              />
            </div>
            <button 
              onClick={() => toast.info('Advanced filtering options simulated.')}
              className="w-full sm:w-auto inline-flex items-center justify-center border border-white/20 bg-transparent px-6 py-3 text-sm font-bold uppercase tracking-widest text-white hover:bg-white hover:text-black transition-colors"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter Options
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
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
        <form onSubmit={handleAddItem} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Name</label>
               <input type="text" required value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full px-4 py-3 border border-white/20 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">SKU</label>
               <input type="text" required value={newItem.sku} onChange={e => setNewItem({...newItem, sku: e.target.value})} className="w-full px-4 py-3 border border-white/20 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors" />
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Initial Stock (Kg)</label>
               <input type="number" required min="0" value={newItem.weightKg} onChange={e => setNewItem({...newItem, weightKg: Number(e.target.value)})} className="w-full px-4 py-3 border border-white/20 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Low Alert (Kg)</label>
               <input type="number" required min="0" value={newItem.lowStockThreshold} onChange={e => setNewItem({...newItem, lowStockThreshold: Number(e.target.value)})} className="w-full px-4 py-3 border border-white/20 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors" />
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Finish</label>
               <select value={newItem.finish} onChange={e => setNewItem({...newItem, finish: e.target.value})} className="w-full px-4 py-3 border border-white/20 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none">
                 <option>Matte</option><option>Gloss</option><option>Satin</option><option>Texture</option>
               </select>
             </div>
             <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Color Code (Hex)</label>
               <input type="text" value={newItem.colorCode} onChange={e => setNewItem({...newItem, colorCode: e.target.value})} className="w-full px-4 py-3 border border-white/20 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors" />
             </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Supplier</label>
            <input type="text" value={newItem.supplier} onChange={e => setNewItem({...newItem, supplier: e.target.value})} className="w-full px-4 py-3 border border-white/20 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors" />
          </div>
          <button type="submit" className="w-full bg-orange-500 text-black font-black uppercase tracking-widest py-4 mt-6 hover:bg-orange-600 transition-colors">
            Add Element
          </button>
        </form>
      </Modal>

      <Modal isOpen={isRestockModalOpen} onClose={() => setIsRestockModalOpen(false)} title={`Restock ${activeItem?.name || ''}`}>
         <form onSubmit={handleRestock} className="space-y-4">
            <div>
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Amount to Add (Kg)</label>
               <input type="number" required min="1" value={restockAmount} onChange={e => setRestockAmount(Number(e.target.value))} className="w-full px-4 py-3 border border-white/20 bg-black text-white focus:outline-none focus:border-orange-500 transition-colors" />
             </div>
             <button type="submit" className="w-full border border-white/20 bg-white text-black font-black uppercase tracking-widest py-4 mt-6 hover:bg-zinc-200 transition-colors">
               Confirm Restock
             </button>
         </form>
      </Modal>

    </div>
  );
}
