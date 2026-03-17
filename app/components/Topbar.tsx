'use client';

import { useTheme } from './ThemeProvider';
import { useMode } from './ModeProvider';

export function Topbar() {
  const { theme, toggle } = useTheme();
  const { mode, toggle: toggleMode } = useMode();

  return (
    <header
      className="fixed top-0 inset-x-0 h-12 flex items-center justify-between px-6 z-50"
      style={{
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--bg)',
      }}
    >
      <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
        scRibe
      </span>

      <div className="flex items-center gap-2">
        <div
          className="flex items-center rounded-md overflow-hidden text-xs font-medium"
          style={{ border: '1px solid var(--border)' }}
        >
          <button
            onClick={() => mode !== 'write' && toggleMode()}
            className="px-3 py-1.5 transition-colors duration-150 cursor-pointer"
            style={{
              backgroundColor: mode === 'write' ? 'var(--accent)' : 'transparent',
              color: mode === 'write' ? 'var(--bg)' : 'var(--accent)',
            }}
            aria-pressed={mode === 'write'}
            aria-label="write mode"
          >
            write
          </button>
          <button
            onClick={() => mode !== 'preview' && toggleMode()}
            className="px-3 py-1.5 transition-colors duration-150 cursor-pointer"
            style={{
              backgroundColor: mode === 'preview' ? 'var(--accent)' : 'transparent',
              color: mode === 'preview' ? 'var(--bg)' : 'var(--accent)',
            }}
            aria-pressed={mode === 'preview'}
            aria-label="preview mode"
          >
            preview
          </button>
        </div>

        <button
          onClick={toggle}
          aria-label={theme === 'dark' ? 'switch to light mode' : 'switch to dark mode'}
          className="w-8 h-8 flex items-center justify-center rounded-md transition-opacity duration-200 hover:opacity-70 cursor-pointer"
          style={{ color: 'var(--accent)' }}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </header>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
