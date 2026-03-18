'use client';

import { createContext, useContext, useState } from 'react';

export type Mode = 'write' | 'read';

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

  // Toggles write ↔ read
  function toggle() {
    setMode((prev) => (prev === 'write' ? 'read' : 'write'));
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
