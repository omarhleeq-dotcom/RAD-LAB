"use client";
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { RAD062_AVAILABLE } from './rad062-availability';

/** Load the completion adapter only after the package is promoted. */
export function Rad062Entry({ children }: { children: ReactNode }) {
 const [Gate, setGate] = useState<ComponentType<{ children: ReactNode }> | null>(null);
 useEffect(() => {
  let cancelled = false;
  async function load() {
   if (RAD062_AVAILABLE) {
    const binding = await import('./Rad062NameGate');
    if (!cancelled) setGate(() => binding.Rad062NameGate);
   }
  }
  void load();
  return () => { cancelled = true; };
 }, []);
 if (!RAD062_AVAILABLE) return children;
 return Gate ? <Gate>{children}</Gate> : null;
}
