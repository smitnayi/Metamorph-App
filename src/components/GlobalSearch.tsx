import React, { useState, useEffect } from 'react';
import { Search, Command, ClipboardList, Users, Package, LayoutList, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../store/data';
import { cn } from '../lib/utils';
import Modal from './ui/Modal';

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'Active' | 'History'>('Active');
  const navigate = useNavigate();
  const { orders, customers, inventory, tasks } = useDataStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    const customOpen = () => setIsOpen(true);
    document.addEventListener('keydown', down);
    document.addEventListener('open-global-search', customOpen);
    return () => {
      document.removeEventListener('keydown', down);
      document.removeEventListener('open-global-search', customOpen);
    };
  }, []);

  const handleSelect = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  const searchResults = () => {
    if (!query) return [];
    
    const results = [];
    const q = query.toLowerCase();
    
    orders.filter(o => o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q)).forEach(o => {
      const isCompleted = o.status === 'Completed' || o.status === 'Shipped';
      if ((searchMode === 'Active' && !isCompleted) || (searchMode === 'History' && isCompleted)) {
        results.push({ id: o.id, type: 'Order', label: `${o.orderNumber} - ${o.customerName} (${o.status})`, icon: LayoutList, path: '/orders' });
      }
    });
    
    customers.filter(c => c.companyName.toLowerCase().includes(q) || c.contactName.toLowerCase().includes(q)).forEach(c => {
      const isInactive = c.status === 'Inactive';
      if ((searchMode === 'Active' && !isInactive) || (searchMode === 'History' && isInactive)) {
        results.push({ id: c.id, type: 'Customer', label: `${c.companyName} (${c.status})`, icon: Users, path: '/customers' });
      }
    });
    
    inventory.filter(i => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)).forEach(i => {
      // Inventory doesn't have an active/inactive status yet, so just include it in both or only Active
      results.push({ id: i.id, type: 'Inventory', label: `${i.sku} - ${i.name}`, icon: Package, path: '/inventory' });
    });

    tasks.filter(t => t.title.toLowerCase().includes(q)).forEach(t => {
      const isCompleted = t.status === 'Done';
      if ((searchMode === 'Active' && !isCompleted) || (searchMode === 'History' && isCompleted)) {
         results.push({ id: t.id, type: 'Task', label: `${t.title} (${t.status})`, icon: CheckSquare, path: '/tasks' });
      }
    });

    return results.slice(0, 15);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Global Search">
        <div className="flex flex-col h-[60dvh] max-h-[600px]">
                <div className="flex items-center px-4 py-4 sm:py-5 border-b border-black/5 dark:border-white/5 bg-white/40 dark:bg-black/20 backdrop-blur-xl">
                   <Search className="h-5 w-5 text-zinc-400 shrink-0" />
                   <input
                     autoFocus
                     type="text"
                     placeholder="Search orders, customers, inventory, tasks..."
                     className="flex-1 bg-transparent border-none outline-none px-4 text-base sm:text-lg font-semibold text-zinc-900 dark:text-white placeholder:text-zinc-500"
                     value={query}
                     onChange={e => setQuery(e.target.value)}
                   />
                   <div className="hidden sm:flex text-xs font-semibold tracking-[0.1em] text-zinc-500 bg-black/5 dark:bg-white/5 px-2 py-1 rounded">ESC</div>
                </div>
                <div className="flex p-2 bg-black/5 dark:bg-white/5 gap-1 mb-2 mx-2 mt-4 rounded-xl">
                  <button 
                    onClick={() => setSearchMode('Active')} 
                    className={cn("flex-1 py-3 text-xs font-semibold text-zinc-500 rounded-lg transition-all", searchMode === 'Active' ? 'bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5')}
                  >
                    Active
                  </button>
                  <button 
                    onClick={() => setSearchMode('History')} 
                    className={cn("flex-1 py-3 text-xs font-semibold text-zinc-500 rounded-lg transition-all", searchMode === 'History' ? 'bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5')}
                  >
                    History
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                   {query === '' ? (
                     <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4">
                       <div className="w-16 h-16 rounded-[24px] bg-black/5 dark:bg-white/5 flex items-center justify-center">
                         <Command className="h-6 w-6 opacity-40" />
                       </div>
                       <span className="text-xs font-semibold text-zinc-500">Type to search {searchMode} items</span>
                     </div>
                   ) : searchResults().length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4">
                       <span className="text-xs font-semibold text-zinc-500">No {searchMode} results found</span>
                     </div>
                   ) : (
                     <div className="flex flex-col gap-2">
                       {searchResults().map((res, i) => (
                         <div 
                           key={`${res.type}-${res.id}`}
                           onClick={() => handleSelect(res.path)}
                           className="flex items-center gap-4 p-4 rounded-[20px] bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/5 hover:border-orange-500/30 hover:bg-orange-500/5 cursor-pointer transition-all group"
                         >
                           <div className="h-12 w-12 bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/5 text-zinc-500 group-hover:text-orange-500 group-hover:bg-orange-500/10 rounded-xl flex justify-center items-center shrink-0 transition-colors">
                              <res.icon className="h-5 w-5" />
                           </div>
                           <div className="flex flex-col">
                              <span className="text-xs font-semibold text-zinc-500 text-zinc-500 mb-1">{res.type}</span>
                              <span className="text-sm font-semibold text-zinc-900 dark:text-white capitalize group-hover:text-orange-500 transition-colors">{res.label}</span>
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
            </div>
          </div>
        </Modal>
    </>
  );
}
