import React, { useState, useEffect } from 'react';
import { X, Download, Share, PlusSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Capacitor } from '@capacitor/core';

export default function InstallPwaPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Avoid prompting in Capacitor/Native app
    if (Capacitor.isNativePlatform()) return;

    // Avoid prompting if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Detect iOS
    const isIosDevice = /iphone|ipad|ipod/.test(
      window.navigator.userAgent.toLowerCase()
    );
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Wait a bit before showing to not bombard user immediately
      const timer = setTimeout(() => setShowPrompt(true), 5000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // For iOS, there is no beforeinstallprompt, so we just show the guide
    if (isIosDevice && !window.matchMedia('(display-mode: standalone)').matches) {
       const timer = setTimeout(() => setShowPrompt(true), 5000);
       return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Optionally save to localStorage to not prompt again for a week
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/10 rounded-2xl p-4 shadow-2xl z-[100]"
        >
          <div className="flex items-start justify-between">
            <div className="flex gap-3 items-center">
              <div className="bg-orange-500/10 text-orange-600 dark:text-orange-400 p-2 rounded-xl">
                 <Download className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Install App</h3>
            </div>
             <button onClick={handleDismiss} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
               <X className="h-4 w-4" />
             </button>
          </div>
          
          <div className="mt-3 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
             {isIOS ? (
               <p>
                 To install this app on your iOS device, tap the <Share className="inline h-3 w-3 mx-1" /> share button below entirely and select <strong className="text-zinc-900 dark:text-white inline-flex items-center gap-1 mx-1">Add to Home Screen <PlusSquare className="inline h-3 w-3" /></strong>.
               </p>
             ) : (
               <p>
                 Install Metamorph Metrics to your home screen for quick and easy access when you're on the go.
               </p>
             )}
          </div>
          
          {!isIOS && (
            <button 
              onClick={handleInstallClick}
              className="mt-4 w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold uppercase tracking-widest text-[10px] py-3 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-lg active:scale-95"
            >
              Add to Home Screen
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
