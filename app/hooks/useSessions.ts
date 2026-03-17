'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'scribe:sessions';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function loadToday(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const all = JSON.parse(raw) as Record<string, number[]>;
    return (all[todayKey()] ?? []).length;
  } catch {
    return 0;
  }
}

function appendSession(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: Record<string, number[]> = raw ? JSON.parse(raw) : {};
    const key = todayKey();
    if (!all[key]) all[key] = [];
    all[key].push(Date.now());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // storage unavailable
  }
}

export function useSessions() {
  const [completedToday, setCompletedToday] = useState(0);

  useEffect(() => {
    setCompletedToday(loadToday());
  }, []);

  const logSession = useCallback(() => {
    appendSession();
    setCompletedToday((prev) => prev + 1);
  }, []);

  const clearToday = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const all: Record<string, number[]> = raw ? JSON.parse(raw) : {};
      all[todayKey()] = [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
      // storage unavailable
    }
    setCompletedToday(0);
  }, []);

  return { completedToday, logSession, clearToday };
}
