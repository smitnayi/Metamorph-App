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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 overflow-hidden pt-12 sm:pt-4">
      <div 
        className={cn("bg-[#111] border border-white/10 w-full max-w-md shadow-2xl flex flex-col rounded-t-3xl sm:rounded-2xl max-h-full transition-transform", className)}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 sm:p-5 border-b border-white/5 shrink-0">
          <h2 className="text-sm font-black uppercase tracking-widest text-white">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-zinc-500 hover:text-white transition-colors p-2 -mr-2 bg-white/5 rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 sm:p-5 flex-1 w-full overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
