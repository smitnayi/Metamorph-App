import React, { useState, useRef, useEffect } from 'react';
import { LayoutList, Users, CheckSquare, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function QuickAdd() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const actions = [
    { label: 'Order', icon: LayoutList, path: '/orders' },
    { label: 'Lead', icon: Users, path: '/crm' },
    { label: 'Task', icon: CheckSquare, path: '/tasks' }
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (path: string) => {
    if ('vibrate' in navigator) navigator.vibrate(20);
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 flex flex-col items-end" ref={containerRef}>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="mb-3 bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 shadow-2xl rounded-xl flex flex-col p-1.5 min-w-[160px]"
          >
            {actions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleAction(action.path)}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors text-left group"
              >
                <action.icon className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                <span className="text-xs font-black tracking-widest text-zinc-900 dark:text-white uppercase mt-0.5">{action.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => {
          if ('vibrate' in navigator) navigator.vibrate(50);
          setIsOpen(!isOpen);
        }}
        className={cn(
          "w-12 h-12 md:w-auto md:h-12 flex items-center justify-center md:px-5 rounded-full md:rounded-xl shadow-xl md:shadow-lg transition-all duration-300 border",
          isOpen 
            ? "bg-white dark:bg-[#111] text-zinc-900 dark:text-white border-black/10 dark:border-white/10" 
            : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 md:hover:-translate-y-0.5 border-transparent"
        )}
      >
        <span className="hidden md:inline mr-2 text-xs font-black tracking-widest uppercase pointer-events-none">Create</span>
        <Plus strokeWidth={3} className={cn("w-5 h-5 md:w-4 md:h-4 transition-transform duration-300 pointer-events-none", isOpen && "rotate-45")} />
      </button>
    </div>
  );
}
