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
  const navigate = useNavigate();
  const { orders, customers, inventory, tasks } = useDataStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
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
      results.push({ id: o.id, type: 'Order', label: `${o.orderNumber} - ${o.customerName}`, icon: LayoutList, path: '/orders' });
    });
    
    customers.filter(c => c.companyName.toLowerCase().includes(q) || c.contactName.toLowerCase().includes(q)).forEach(c => {
      results.push({ id: c.id, type: 'Customer', label: c.companyName, icon: Users, path: '/customers' });
    });
    
    inventory.filter(i => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)).forEach(i => {
      results.push({ id: i.id, type: 'Inventory', label: `${i.sku} - ${i.name}`, icon: Package, path: '/inventory' });
    });

    tasks.filter(t => t.title.toLowerCase().includes(q)).forEach(t => {
      results.push({ id: t.id, type: 'Task', label: t.title, icon: CheckSquare, path: '/tasks' });
    });

    return results.slice(0, 10);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Global Search">
             <div className="flex flex-col h-[50dvh] max-h-[500px]">
                <div className="flex items-center px-4 py-3 sm:py-4 border-b border-black/5 dark:border-white/5">
                   <Search className="h-5 w-5 text-zinc-400 shrink-0" />
                   <input
                     autoFocus
                     type="text"
                     placeholder="Search orders, customers, inventory, tasks..."
                     className="flex-1 bg-transparent border-none outline-none px-4 text-base sm:text-lg font-medium text-zinc-900 dark:text-white placeholder:text-zinc-500"
                     value={query}
                     onChange={e => setQuery(e.target.value)}
                   />
                   <div className="hidden sm:flex text-[10px] font-bold text-zinc-500 bg-black/5 dark:bg-white/5 px-2 py-1 rounded">ESC</div>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                   {query === '' ? (
                     <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2">
                       <Command className="h-8 w-8 opacity-20" />
                       <span className="text-sm font-bold uppercase tracking-widest">Type to search</span>
                     </div>
                   ) : searchResults().length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2">
                       <span className="text-sm font-bold uppercase tracking-widest">No results found</span>
                     </div>
                   ) : (
                     <div className="flex flex-col gap-1">
                       {searchResults().map((res, i) => (
                         <div 
                           key={`${res.type}-${res.id}`}
                           onClick={() => handleSelect(res.path)}
                           className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                         >
                           <div className="h-10 w-10 bg-orange-500/10 text-orange-500 rounded-lg flex justify-center items-center shrink-0">
                              <res.icon className="h-5 w-5" />
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{res.type}</span>
                              <span className="text-sm font-medium text-zinc-900 dark:text-white capitalize">{res.label}</span>
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                </div>
             </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}
