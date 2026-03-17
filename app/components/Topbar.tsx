'use client';

import { useRef, useState, useEffect } from 'react';
import { useTheme } from './ThemeProvider';
import { useMode, type Mode } from './ModeProvider';
import { useContent } from './ContentProvider';
import { PomodoroWidget } from './PomodoroWidget';
import { AmbientSoundControl } from './AmbientSoundControl';
import { getFilename } from '../lib/utils';

function triggerDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const MODES: { id: Mode; label: string }[] = [
  { id: 'write', label: 'write' },
  { id: 'preview', label: 'preview' },
  { id: 'read', label: 'read' },
];

export function Topbar() {
  const { theme, toggle } = useTheme();
  const { mode, setMode, isZen } = useMode();
  const { text } = useContent();
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    if (exportOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [exportOpen]);

  function exportAs(ext: 'md' | 'txt') {
    triggerDownload(text, getFilename(text, ext));
    setExportOpen(false);
  }

  return (
    <header
      className="fixed top-0 inset-x-0 h-12 z-50"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      {/* main content: fades out in zen mode */}
      <div
        className="h-full flex items-center justify-between px-6"
        style={{
          borderBottom: '1px solid var(--border)',
          opacity: isZen ? 0 : 1,
          pointerEvents: isZen ? 'none' : undefined,
          transition: 'opacity 250ms ease',
        }}
      >
        <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
          scRibe
        </span>

        <div className="flex items-center gap-2">
          {/* 3-way mode toggle */}
          <div
            className="flex items-center rounded-md overflow-hidden text-xs font-medium"
            style={{ border: '1px solid var(--border)' }}
          >
            {MODES.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className="px-3 py-1.5 transition-colors duration-150 cursor-pointer"
                style={{
                  backgroundColor: mode === id ? 'var(--accent)' : 'transparent',
                  color: mode === id ? 'var(--bg)' : 'var(--accent)',
                }}
                aria-pressed={mode === id}
                aria-label={`${label} mode`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* export */}
          <div ref={exportRef} className="relative">
            <button
              onClick={() => setExportOpen((v) => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-md transition-opacity duration-200 hover:opacity-70 cursor-pointer"
              style={{ color: 'var(--accent)' }}
              aria-label="export"
            >
              <ExportIcon />
            </button>
            {exportOpen && (
              <div
                className="absolute right-0 top-full mt-1 rounded-md overflow-hidden text-xs font-medium"
                style={{
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  minWidth: '120px',
                }}
              >
                <button
                  onClick={() => exportAs('md')}
                  className="w-full text-left px-3 py-2 transition-colors duration-150 cursor-pointer hover:opacity-70"
                  style={{ color: 'var(--accent)' }}
                >
                  export as .md
                </button>
                <button
                  onClick={() => exportAs('txt')}
                  className="w-full text-left px-3 py-2 transition-colors duration-150 cursor-pointer hover:opacity-70"
                  style={{
                    color: 'var(--accent)',
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  export as .txt
                </button>
              </div>
            )}
          </div>

          <AmbientSoundControl />

          <PomodoroWidget />

          <button
            onClick={toggle}
            aria-label={theme === 'dark' ? 'switch to light mode' : 'switch to dark mode'}
            className="w-8 h-8 flex items-center justify-center rounded-md transition-opacity duration-200 hover:opacity-70 cursor-pointer"
            style={{ color: 'var(--accent)' }}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </header>
  );
}

function ExportIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
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
