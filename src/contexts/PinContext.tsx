import React, { createContext, useContext, useState, ReactNode } from 'react';
import Modal from '../components/ui/Modal';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';

interface PinContextType {
  requirePin: (onSuccess: () => void, message?: string) => void;
}

const PinContext = createContext<PinContextType | null>(null);

export function usePin() {
  const context = useContext(PinContext);
  if (!context) {
    throw new Error('usePin must be used within a PinProvider');
  }
  return context;
}

export function PinProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [onSuccessCb, setOnSuccessCb] = useState<(() => void) | null>(null);

  const requirePin = (onSuccess: () => void, customMessage?: string) => {
    setOnSuccessCb(() => onSuccess);
    setMessage(customMessage || 'Enter Admin PIN to authorize this action');
    setPin('');
    setIsOpen(true);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '0000') {
      setIsOpen(false);
      setPin('');
      if (onSuccessCb) {
        onSuccessCb();
      }
    } else {
      toast.error('Incorrect PIN');
      setPin('');
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setPin('');
    setOnSuccessCb(null);
  };

  return (
    <PinContext.Provider value={{ requirePin }}>
      {children}
      <Modal isOpen={isOpen} onClose={handleCancel} title="Admin Authorization">
        <form onSubmit={handleVerify} className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4 mb-4">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 font-medium">{message}</p>
          </div>
          
          <div>
            <label className="text-xs font-semibold text-zinc-500 mb-2 block uppercase tracking-wider text-center">Enter PIN</label>
            <input
              type="password"
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full text-center text-2xl tracking-[0.5em] font-mono bg-white/60 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="••••"
              maxLength={4}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-3 px-4 rounded-xl font-semibold text-zinc-600 bg-black/5 hover:bg-black/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-colors"
            >
              Verify
            </button>
          </div>
        </form>
      </Modal>
    </PinContext.Provider>
  );
}
