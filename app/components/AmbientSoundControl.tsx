'use client';

import { useRef, useState, useEffect } from 'react';
import { useAmbientSound, type AmbientSound } from '../hooks/useAmbientSound';

const SOUNDS: { id: AmbientSound; label: string }[] = [
  { id: 'rain', label: 'rain' },
  { id: 'white-noise', label: 'white noise' },
  { id: 'lofi', label: 'lo-fi' },
];

export function AmbientSoundControl() {
  const { active, toggle } = useAmbientSound();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 flex items-center justify-center rounded-md transition-opacity duration-200 hover:opacity-70 cursor-pointer"
        style={{ color: active ? 'var(--text)' : 'var(--accent)' }}
        aria-label={active ? `ambient sound: ${active}` : 'ambient sound off'}
      >
        {active ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 rounded-md overflow-hidden text-xs font-medium"
          style={{
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg)',
            minWidth: '120px',
            zIndex: 60,
          }}
        >
          {SOUNDS.map(({ id, label }, i) => (
            <button
              key={id}
              onClick={() => toggle(id)}
              className="w-full text-left px-3 py-2 transition-opacity duration-150 cursor-pointer hover:opacity-70 flex items-center justify-between gap-4"
              style={{
                color: 'var(--accent)',
                borderTop: i > 0 ? '1px solid var(--border)' : undefined,
              }}
            >
              <span>{label}</span>
              {active === id && (
                <span style={{ opacity: 0.5, fontSize: '10px' }}>playing</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SpeakerOnIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function SpeakerOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}
