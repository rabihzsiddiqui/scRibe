'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ContentContextValue {
  text: string;
  setText: (text: string) => void;
}

const ContentContext = createContext<ContentContextValue | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [text, setText] = useState('');
  return (
    <ContentContext.Provider value={{ text, setText }}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent must be used within ContentProvider');
  return ctx;
}
