'use client';

import { createContext, useContext, useState } from 'react';

type Mode = 'write' | 'preview';

const ModeContext = createContext<{
  mode: Mode;
  toggle: () => void;
} | null>(null);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>('write');

  function toggle() {
    setMode((prev) => (prev === 'write' ? 'preview' : 'write'));
  }

  return (
    <ModeContext.Provider value={{ mode, toggle }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useMode must be used inside ModeProvider');
  return ctx;
}
