import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-[90vw]'
};

export default function Modal({ isOpen, onClose, title, children, className, size = 'md' }: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const onCloseRef = React.useRef(onClose);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Push history state to intercept Android back button
      window.history.pushState({ isModalOpen: true }, '');

      const handlePopState = () => {
        onCloseRef.current();
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('popstate', handlePopState);
        // If modal was closed via 'X' or submit, pop the extra history state
        if (window.history.state?.isModalOpen) {
          window.history.back();
        }
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-white/50 dark:bg-black/60 backdrop-blur-sm print:hidden"
          />
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none print:hidden">
            <motion.div 
              style={{ maxHeight: '90dvh' }}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.5}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) {
                  onClose();
                }
              }}
              className={cn("bg-[#f4f4f5] dark:bg-[#111] border border-black/5 dark:border-white/10 w-full shadow-2xl flex flex-col rounded-t-[32px] sm:rounded-2xl pointer-events-auto", sizeClasses[size], className)}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-full flex justify-center pt-3 pb-2 sm:hidden cursor-grab active:cursor-grabbing">
                 <div className="w-12 h-1.5 bg-black/10 dark:bg-white/10 rounded-full shrink-0" />
              </div>
              <div className="flex items-center justify-between px-5 pb-3 pt-1 sm:pt-5 border-b border-black/5 dark:border-white/5 shrink-0">
                <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">{title}</h2>
                <button 
                  onClick={onClose} 
                  className="text-zinc-500 hover:text-zinc-900 dark:text-white transition-colors p-3 sm:p-2 -mr-3 sm:-mr-2 bg-black/5 dark:bg-white/5 rounded-full"
                >
                  <X className="h-5 w-5 sm:h-4 sm:w-4" />
                </button>
              </div>
              <div 
                className="p-4 sm:p-5 flex-1 w-full overflow-y-auto overscroll-contain pb-inset-bottom"
                onPointerDownCapture={e => e.stopPropagation()}
              >
                {children}
              </div>
            </motion.div>
          </div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;

  return createPortal(modalContent, document.body);
}
