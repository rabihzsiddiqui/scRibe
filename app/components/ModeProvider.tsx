'use client';

import { createContext, useContext, useState } from 'react';

type Mode = 'write' | 'preview';

const ModeContext = createContext<{
  mode: Mode;
  toggle: () => void;
  isZen: boolean;
  toggleZen: () => void;
} | null>(null);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>('write');
  const [isZen, setIsZen] = useState(false);

  function toggle() {
    setMode((prev) => (prev === 'write' ? 'preview' : 'write'));
  }

  function toggleZen() {
    setIsZen((prev) => !prev);
  }

  return (
    <ModeContext.Provider value={{ mode, toggle, isZen, toggleZen }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useMode must be used inside ModeProvider');
  return ctx;
}
