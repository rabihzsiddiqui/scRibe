'use client';

import { useMode } from './ModeProvider';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { isZen } = useMode();

  return (
    <main
      className="w-full"
      style={{
        height: isZen ? '100vh' : 'calc(100vh - 48px)',
        marginTop: isZen ? '0' : '48px',
        transition: 'height 250ms ease, margin-top 250ms ease',
      }}
    >
      {children}
    </main>
  );
}
