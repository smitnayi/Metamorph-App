import React from 'react';
import { cn } from '../../lib/utils';
import { motion, HTMLMotionProps } from 'motion/react';

export interface CustomCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  key?: React.Key;
}

export function Card({ className, ...props }: CustomCardProps) {
  return (
    <div 
      className={cn(
        "bg-white/60 dark:bg-black/40 backdrop-blur-3xl border border-black/[0.04] dark:border-white/[0.06] rounded-[24px] shadow-[0_8px_40px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_40px_rgb(0,0,0,0.1)] transition-all duration-500 hover:shadow-[0_8px_40px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_8px_40px_rgb(0,0,0,0.2)] hover:border-black/[0.08] dark:hover:border-white/[0.1] relative overflow-hidden", 
        className
      )} 
      {...props} 
    />
  );
}

export function CardHeader({ className, ...props }: CustomCardProps) {
  return <div className={cn("p-6 md:p-8 flex flex-col space-y-2 border-b border-black/5 dark:border-white/5 relative z-10", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-xl md:text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 leading-relaxed", className)} {...props} />;
}

export function CardContent({ className, ...props }: CustomCardProps) {
  return <div className={cn("p-6 md:p-8 relative z-10", className)} {...props} />;
}

export function CardFooter({ className, ...props }: CustomCardProps) {
  return <div className={cn("p-6 md:p-8 pt-0 border-t border-black/5 dark:border-white/5 flex items-center relative z-10", className)} {...props} />;
}

