'use client';

import { type LucideIcon } from 'lucide-react';
import { useState, useEffect, type ComponentProps } from 'react';

interface ClientIconProps extends Omit<ComponentProps<LucideIcon>, 'ref'> {
  icon: LucideIcon;
}

export function ClientIcon({ icon: Icon, ...props }: ClientIconProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <span className={props.className} style={{ display: 'inline-block', width: '1em', height: '1em' }} />;
  }
  
  return <Icon {...props} />;
}
