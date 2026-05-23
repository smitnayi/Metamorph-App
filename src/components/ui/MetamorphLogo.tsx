import React from 'react';
import { cn } from '../../lib/utils';

export const MetamorphLogo = ({ className }: { className?: string }) => (
  <img 
    src="/logo.png" 
    alt="METAMORPH Logo" 
    className={cn("object-contain", className)} 
  />
);

