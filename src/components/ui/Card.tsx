import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return <div className={cn("bg-black border border-white/10 overflow-hidden", className)} {...props} />;
}

export function CardHeader({ className, ...props }: CardProps) {
  return <div className={cn("p-6 flex flex-col space-y-1.5 border-b border-white/10", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-xl font-black uppercase tracking-tight text-white", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-[10px] font-bold uppercase tracking-widest text-zinc-500", className)} {...props} />;
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn("p-6 pt-6", className)} {...props} />;
}

export function CardFooter({ className, ...props }: CardProps) {
  return <div className={cn("p-6 pt-0 border-t border-white/10 flex items-center", className)} {...props} />;
}
