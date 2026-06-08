import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';

interface Props {
  value: string; // HH:mm format
  onChange: (time: string) => void;
}

export default function TimeWheelPicker({ value, onChange }: Props) {
  // Graceful handling of empty or invalid time
  const safeValue = value || '00:00';
  const [hours, minutes] = safeValue.split(':');
  
  const handleHourChange = (newHour: string) => {
    onChange(`${newHour.padStart(2, '0')}:${minutes || '00'}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    onChange(`${hours || '00'}:${newMinute.padStart(2, '0')}`);
  };

  return (
    <div className="flex items-center justify-center gap-2 bg-white dark:bg-black rounded-[24px] py-4 px-2 shadow-sm border border-black/5 dark:border-white/10 relative overflow-hidden h-[180px] w-full max-w-[280px]">
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white dark:from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white dark:from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-14 bg-orange-500/10 dark:bg-orange-500/20 rounded-2xl pointer-events-none border border-orange-500/20" />
      
      <WheelScroll 
        items={Array.from({length: 24}, (_, i) => i.toString().padStart(2, '0'))}
        value={hours || '00'}
        onChange={handleHourChange}
      />
      <span className="text-3xl font-black text-orange-500 pb-1 z-10 animate-pulse">:</span>
      <WheelScroll 
        items={Array.from({length: 60}, (_, i) => i.toString().padStart(2, '0'))}
        value={minutes || '00'}
        onChange={handleMinuteChange}
      />
    </div>
  );
}

function WheelScroll({ items, value, onChange }: { items: string[], value: string, onChange: (val: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const itemHeight = 56; // h-14 = 56px

  // Auto-scroll logic when controlled value changes OR component mounts
  useEffect(() => {
    if (!isScrolling && containerRef.current) {
      const targetIndex = items.indexOf(value);
      if (targetIndex !== -1) {
        containerRef.current.scrollTop = targetIndex * itemHeight;
      }
    }
  }, [value, isScrolling, items]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolling(true);
    const target = e.target as HTMLDivElement;
    
    // Debounce to detect scroll end
    if ((target as any).scrollTimeout) {
      clearTimeout((target as any).scrollTimeout);
    }
    
    (target as any).scrollTimeout = setTimeout(() => {
      setIsScrolling(false);
      const index = Math.round(target.scrollTop / itemHeight);
      if (items[index] && items[index] !== value) {
        onChange(items[index]);
      } else if (items[index]) {
        // Snap back to exact position if slightly offset
        target.scrollTop = index * itemHeight;
      }
    }, 150);
  };

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide flex-1 relative z-20 px-2 select-none touch-pan-y"
      style={{ scrollBehavior: isScrolling ? 'auto' : 'smooth' }}
    >
      <div style={{ height: `calc(50% - ${itemHeight / 2}px)` }} />
      {items.map(item => (
        <div 
          key={item} 
          className={cn(
            "h-14 flex items-center justify-center text-4xl sm:text-5xl font-black snap-center transition-all duration-300 cursor-pointer",
            item === value 
               ? "text-zinc-900 dark:text-white scale-110" 
               : "text-zinc-300 dark:text-zinc-700 scale-90 opacity-50 hover:opacity-100 hover:scale-100"
          )}
          onClick={() => onChange(item)}
        >
          {item}
        </div>
      ))}
      <div style={{ height: `calc(50% - ${itemHeight / 2}px)` }} />
    </div>
  );
}
