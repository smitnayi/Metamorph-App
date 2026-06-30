import React, { useRef, useState } from 'react';
import { motion, useAnimation, useMotionValue, PanInfo } from 'framer-motion';
import { cn } from '../../lib/utils';

interface SwipeActionProps {
  children: React.ReactNode;
  rightActions?: React.ReactNode;
  leftActions?: React.ReactNode;
  rightActionWidth?: number;
  leftActionWidth?: number;
  className?: string;
  bgClassName?: string;
}

export function SwipeAction({
  children,
  rightActions,
  leftActions,
  rightActionWidth = 120,
  leftActionWidth = 120,
  className,
  bgClassName
}: SwipeActionProps) {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const [isOpen, setIsOpen] = useState<'left' | 'right' | null>(null);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    // Swipe left (reveal right actions)
    if (offset < -40 || velocity < -300) {
      if (rightActions) {
        controls.start({ x: -rightActionWidth });
        setIsOpen('right');
      } else {
        controls.start({ x: 0 });
        setIsOpen(null);
      }
    } 
    // Swipe right (reveal left actions)
    else if (offset > 40 || velocity > 300) {
      if (leftActions) {
        controls.start({ x: leftActionWidth });
        setIsOpen('left');
      } else {
        controls.start({ x: 0 });
        setIsOpen(null);
      }
    } 
    // Reset
    else {
      controls.start({ x: 0 });
      setIsOpen(null);
    }
  };

  return (
    <div className={cn("relative overflow-hidden touch-pan-y w-full", className)}>
      {/* Background Action Container */}
      <div className={cn("absolute inset-0 flex items-center justify-between", bgClassName)}>
        <div className="flex-1 flex justify-start h-full">
          {leftActions && (
            <div style={{ width: leftActionWidth }} className="h-full">
              {leftActions}
            </div>
          )}
        </div>
        <div className="flex-1 flex justify-end h-full">
          {rightActions && (
            <div style={{ width: rightActionWidth }} className="h-full">
              {rightActions}
            </div>
          )}
        </div>
      </div>
      
      {/* Draggable Foreground Content */}
      <motion.div
        drag="x"
        dragConstraints={{ 
          left: rightActions ? -rightActionWidth : 0, 
          right: leftActions ? leftActionWidth : 0 
        }}
        dragElastic={0.1}
        dragDirectionLock
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x }}
        className="relative z-10 w-full h-full bg-transparent"
        whileTap={{ cursor: 'grabbing' }}
      >
        {children}
      </motion.div>
    </div>
  );
}
