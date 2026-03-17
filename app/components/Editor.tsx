'use client';

import { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import { useMode } from './ModeProvider';

function getStats(text: string) {
  const chars = text.length;
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(words / 200));
  return { words, chars, readTime };
}

export function Editor() {
  const [text, setText] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  const { words, chars, readTime } = getStats(text);
  const { mode, toggle: toggleMode } = useMode();

  useEffect(() => {
    if (mode === 'write') {
      ref.current?.focus();
    }
  }, [mode]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        toggleMode();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMode]);

  const html = marked.parse(text) as string;

  return (
    <>
      <div className="w-full h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 pt-10 pb-20">
          {mode === 'write' ? (
            <textarea
              ref={ref}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="start writing..."
              className="w-full min-h-[calc(100vh-12rem)] resize-none outline-none bg-transparent placeholder:opacity-30"
              style={{
                fontSize: '17px',
                lineHeight: '1.75',
                color: 'var(--text)',
                caretColor: 'var(--accent)',
              }}
            />
          ) : (
            <div
              className="md-preview min-h-[calc(100vh-12rem)]"
              dangerouslySetInnerHTML={{ __html: html || '<p class="md-empty">nothing to preview yet.</p>' }}
            />
          )}
        </div>
      </div>

      <div
        className="fixed bottom-0 inset-x-0 h-9 flex items-center justify-center gap-3 text-xs"
        style={{
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--bg)',
          color: 'var(--accent)',
          opacity: 0.7,
        }}
      >
        <span>{words} {words === 1 ? 'word' : 'words'}</span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span>{chars} {chars === 1 ? 'char' : 'chars'}</span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span>{readTime} min read</span>
      </div>
    </>
  );
}
