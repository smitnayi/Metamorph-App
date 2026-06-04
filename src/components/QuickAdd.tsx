import React, { useState } from 'react';
import { Plus, LayoutList, Users, CheckSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function QuickAdd() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const actions = [
    { label: 'New Order', icon: LayoutList, path: '/orders', color: 'bg-blue-500' },
    { label: 'New Customer', icon: Users, path: '/customers', color: 'bg-emerald-500' },
    { label: 'New Task', icon: CheckSquare, path: '/tasks', color: 'bg-amber-500' }
  ];

  const handleAction = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  const toggleOpen = () => {
    if ('vibrate' in navigator) navigator.vibrate(50);
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-50 flex flex-col-reverse items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10, transition: { duration: 0.15 } }}
            className="flex flex-col gap-3 mb-2"
          >
            {actions.map((action, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0, transition: { delay: idx * 0.05 } }}
                onClick={() => {
                  if ('vibrate' in navigator) navigator.vibrate(20);
                  handleAction(action.path)
                }}
                className="flex items-center gap-3 bg-white dark:bg-[#111] border border-black/5 dark:border-white/10 px-4 py-3 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-left"
              >
                <span className="text-sm font-bold capitalize text-zinc-900 dark:text-white whitespace-nowrap">{action.label}</span>
                <div className={`h-8 w-8 rounded-full ${action.color} text-white flex items-center justify-center shrink-0`}>
                  <action.icon className="h-4 w-4" />
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button 
        onClick={toggleOpen}
        className="h-14 w-14 rounded-full bg-orange-500 text-white shadow-[0_8px_32px_rgba(234,88,12,0.4)] flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-10"
      >
        <motion.div animate={{ rotate: isOpen ? 135 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <Plus className="h-7 w-7" />
        </motion.div>
      </button>
    </div>
  );
}
