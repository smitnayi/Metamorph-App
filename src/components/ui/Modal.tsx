import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className={cn("bg-[#111] border border-white/20 w-full max-w-md my-8 shadow-2xl flex flex-col", className)}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <h2 className="text-sm font-black uppercase tracking-widest text-white">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 flex-1 w-full overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
