'use client';

import { useEffect, useRef, useState } from 'react';

export function useSessionStats(currentWords: number) {
  const sessionStart = useRef(Date.now());
  // -1 = baseline not yet set (waiting for localStorage restore)
  const baseline = useRef(-1);
  // Ref tracks current words across renders without causing re-runs
  const currentWordsRef = useRef(currentWords);
  currentWordsRef.current = currentWords;

  const [elapsed, setElapsed] = useState(0);

  // Set baseline after content has had time to restore from localStorage.
  // The localStorage restore runs in a useEffect (after first render), so
  // 700ms gives it ample time to apply before we lock the baseline.
  useEffect(() => {
    const id = setTimeout(() => {
      if (baseline.current === -1) {
        baseline.current = currentWordsRef.current;
      }
    }, 700);
    return () => clearTimeout(id);
  }, []);

  // Tick every second
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStart.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  function reset() {
    sessionStart.current = Date.now();
    baseline.current = currentWordsRef.current;
    setElapsed(0);
  }

  const b = baseline.current === -1 ? currentWords : baseline.current;
  const sessionWords = Math.max(0, currentWords - b);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const elapsedStr = h > 0
    ? `${h}h ${String(m).padStart(2, '0')}m`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  return { sessionWords, elapsed: elapsedStr, reset };
}
