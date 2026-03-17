'use client';

import { createContext, useContext, useState } from 'react';

export type Mode = 'write' | 'preview' | 'read';

const ModeContext = createContext<{
  mode: Mode;
  setMode: (mode: Mode) => void;
  toggle: () => void;
  isZen: boolean;
  toggleZen: () => void;
} | null>(null);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>('write');
  const [isZen, setIsZen] = useState(false);

  // Cycles write → preview → read → write
  function toggle() {
    setMode((prev) => {
      if (prev === 'write') return 'preview';
      if (prev === 'preview') return 'read';
      return 'write';
    });
  }

  function toggleZen() {
    setIsZen((prev) => !prev);
  }

  return (
    <ModeContext.Provider value={{ mode, setMode, toggle, isZen, toggleZen }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useMode must be used inside ModeProvider');
  return ctx;
}
