'use client';

import { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import { useMode } from './ModeProvider';
import { useContent } from './ContentProvider';

const STORAGE_KEY = 'scribe-content';

function getStats(text: string) {
  const chars = text.length;
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(words / 200));
  return { words, chars, readTime };
}

type FormatType = 'bold' | 'italic' | 'link' | 'heading';

function applyFormatting(
  textarea: HTMLTextAreaElement,
  type: FormatType,
  setText: (t: string) => void
) {
  const { value, selectionStart, selectionEnd } = textarea;

  if (type === 'heading') {
    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const newText = value.slice(0, lineStart) + '# ' + value.slice(lineStart);
    setText(newText);
    requestAnimationFrame(() => {
      textarea.selectionStart = selectionStart + 2;
      textarea.selectionEnd = selectionEnd + 2;
    });
    return;
  }

  const selected = value.slice(selectionStart, selectionEnd);
  let prefix: string, suffix: string, placeholder: string;
  if (type === 'bold') { prefix = '**'; suffix = '**'; placeholder = 'text'; }
  else if (type === 'italic') { prefix = '*'; suffix = '*'; placeholder = 'text'; }
  else { prefix = '['; suffix = '](url)'; placeholder = 'text'; }

  const insertion = prefix + (selected || placeholder) + suffix;
  const newText = value.slice(0, selectionStart) + insertion + value.slice(selectionEnd);
  setText(newText);
  requestAnimationFrame(() => {
    if (selected) {
      textarea.selectionStart = selectionStart;
      textarea.selectionEnd = selectionStart + insertion.length;
    } else {
      textarea.selectionStart = selectionStart + prefix.length;
      textarea.selectionEnd = selectionStart + prefix.length + placeholder.length;
    }
  });
}

const SHORTCUTS = [
  { keys: '⌘ B', label: 'bold' },
  { keys: '⌘ I', label: 'italic' },
  { keys: '⌘ K', label: 'link' },
  { keys: '⌘ ⇧ H', label: 'heading' },
  { keys: '⌘ P', label: 'toggle preview' },
  { keys: '⌘ ⇧ F', label: 'focus mode' },
  { keys: '⌘ /', label: 'show shortcuts' },
  { keys: 'Esc', label: 'exit focus mode' },
];

export function Editor() {
  const { text, setText } = useContent();
  const [savedVisible, setSavedVisible] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);
  const { words, chars, readTime } = getStats(text);
  const { mode, toggle: toggleMode, isZen, toggleZen } = useMode();
  const initialized = useRef(false);

  // restore from localStorage on mount
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) setText(saved);
    }
  }, [setText]);

  // debounced save
  useEffect(() => {
    if (!initialized.current) return;
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, text);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      setSavedVisible(true);
      savedTimerRef.current = setTimeout(() => setSavedVisible(false), 1500);
    }, 500);
    return () => clearTimeout(timer);
  }, [text]);

  useEffect(() => {
    if (mode === 'write') {
      ref.current?.focus();
    }
  }, [mode]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === 'p') {
        e.preventDefault();
        toggleMode();
        return;
      }

      if (mod && e.key === '/') {
        e.preventDefault();
        setShortcutsOpen((v) => !v);
        return;
      }

      if (mod && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        toggleZen();
        return;
      }

      if (e.key === 'Escape') {
        if (shortcutsOpen) {
          setShortcutsOpen(false);
          return;
        }
        if (isZen) {
          toggleZen();
          return;
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMode, toggleZen, isZen, shortcutsOpen]);

  function handleTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod || !ref.current) return;

    if (e.key === 'b') {
      e.preventDefault();
      applyFormatting(ref.current, 'bold', setText);
    } else if (e.key === 'i') {
      e.preventDefault();
      applyFormatting(ref.current, 'italic', setText);
    } else if (e.key === 'k') {
      e.preventDefault();
      applyFormatting(ref.current, 'link', setText);
    } else if (e.shiftKey && e.key === 'H') {
      e.preventDefault();
      applyFormatting(ref.current, 'heading', setText);
    }
  }

  const html = marked.parse(text) as string;

  return (
    <>
      <div className="w-full h-full overflow-y-auto">
        <div
          className="max-w-3xl mx-auto px-6 pb-20"
          style={{ paddingTop: isZen ? '10vh' : '40px', transition: 'padding-top 250ms ease' }}
        >
          {mode === 'write' ? (
            <textarea
              ref={ref}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
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

      {/* status bar */}
      <div
        className="fixed bottom-0 inset-x-0 h-9 flex items-center justify-center gap-3 text-xs"
        style={{
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--bg)',
          color: 'var(--accent)',
          opacity: isZen ? 0 : 0.7,
          transform: isZen ? 'translateY(100%)' : 'translateY(0)',
          transition: 'opacity 250ms ease, transform 250ms ease',
          pointerEvents: isZen ? 'none' : undefined,
        }}
      >
        <span>{words} {words === 1 ? 'word' : 'words'}</span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span>{chars} {chars === 1 ? 'char' : 'chars'}</span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span>{readTime} min read</span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span
          style={{
            opacity: savedVisible ? 0.6 : 0,
            transition: 'opacity 0.4s ease',
          }}
        >
          saved
        </span>
      </div>

      {/* zen mode hint */}
      {isZen && (
        <div
          className="fixed bottom-5 right-6 text-xs pointer-events-none select-none"
          style={{
            color: 'var(--accent)',
            opacity: 0.25,
          }}
        >
          esc to exit
        </div>
      )}

      {/* shortcuts overlay */}
      {shortcutsOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onMouseDown={() => setShortcutsOpen(false)}
        >
          <div
            className="rounded-xl px-6 py-5 min-w-[280px]"
            style={{
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--border)',
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-semibold mb-4" style={{ color: 'var(--accent)', opacity: 0.5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              shortcuts
            </p>
            <div className="flex flex-col gap-2.5">
              {SHORTCUTS.map(({ keys, label }) => (
                <div key={label} className="flex items-center justify-between gap-8">
                  <span className="text-sm" style={{ color: 'var(--text)', opacity: 0.7 }}>{label}</span>
                  <kbd
                    className="text-xs px-2 py-0.5 rounded-md font-mono"
                    style={{
                      backgroundColor: 'var(--code-bg)',
                      color: 'var(--accent)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
