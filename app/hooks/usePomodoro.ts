'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_LONG_BREAK_MINUTES,
  DEFAULT_SHORT_BREAK_MINUTES,
  DEFAULT_WORK_MINUTES,
  PHASES,
  SESSIONS_BEFORE_LONG_BREAK,
  type Phase,
} from '../lib/pomodoro';

export interface PomodoroConfig {
  workMinutes?: number;
  shortBreakMinutes?: number;
  longBreakMinutes?: number;
  sessionsBeforeLongBreak?: number;
}

export interface PomodoroState {
  mode: Phase;
  timeRemaining: number; // seconds
  isRunning: boolean;
  completedSessions: number;
}

export interface PomodoroControls {
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  skip: () => void;
}

function resolveCfg(config?: PomodoroConfig): Required<PomodoroConfig> {
  return {
    workMinutes: config?.workMinutes ?? DEFAULT_WORK_MINUTES,
    shortBreakMinutes: config?.shortBreakMinutes ?? DEFAULT_SHORT_BREAK_MINUTES,
    longBreakMinutes: config?.longBreakMinutes ?? DEFAULT_LONG_BREAK_MINUTES,
    sessionsBeforeLongBreak: config?.sessionsBeforeLongBreak ?? SESSIONS_BEFORE_LONG_BREAK,
  };
}

function getDuration(mode: Phase, cfg: Required<PomodoroConfig>): number {
  if (mode === PHASES.WORK) return cfg.workMinutes * 60;
  if (mode === PHASES.SHORT_BREAK) return cfg.shortBreakMinutes * 60;
  return cfg.longBreakMinutes * 60;
}

function nextMode(current: Phase, completedAfter: number, sessionsBeforeLongBreak: number): Phase {
  if (current !== PHASES.WORK) return PHASES.WORK;
  return completedAfter % sessionsBeforeLongBreak === 0
    ? PHASES.LONG_BREAK
    : PHASES.SHORT_BREAK;
}

export function usePomodoro(config?: PomodoroConfig): PomodoroState & PomodoroControls {
  const cfgRef = useRef(resolveCfg(config));

  useEffect(() => {
    cfgRef.current = resolveCfg(config);
  });

  const [mode, setMode] = useState<Phase>(PHASES.WORK);
  const [timeRemaining, setTimeRemaining] = useState<number>(
    getDuration(PHASES.WORK, resolveCfg(config)),
  );
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeRef = useRef(timeRemaining);
  const modeRef = useRef<Phase>(PHASES.WORK);
  const completedRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const transition = useCallback(() => {
    const current = modeRef.current;
    let newCompleted = completedRef.current;

    if (current === PHASES.WORK) {
      newCompleted = completedRef.current + 1;
      completedRef.current = newCompleted;
      setCompletedSessions(newCompleted);
    }

    const next = nextMode(current, newCompleted, cfgRef.current.sessionsBeforeLongBreak);
    const duration = getDuration(next, cfgRef.current);

    modeRef.current = next;
    timeRef.current = duration;
    setMode(next);
    setTimeRemaining(duration);
  }, []);

  const startInterval = useCallback(() => {
    intervalRef.current = setInterval(() => {
      if (timeRef.current <= 1) {
        clearTimer();
        setIsRunning(false);
        transition();
        return;
      }
      timeRef.current -= 1;
      setTimeRemaining(timeRef.current);
    }, 1000);
  }, [clearTimer, transition]);

  const start = useCallback(() => {
    if (intervalRef.current !== null) return;
    setIsRunning(true);
    startInterval();
  }, [startInterval]);

  const pause = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const resume = useCallback(() => {
    if (intervalRef.current !== null) return;
    setIsRunning(true);
    startInterval();
  }, [startInterval]);

  const reset = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    const duration = getDuration(modeRef.current, cfgRef.current);
    timeRef.current = duration;
    setTimeRemaining(duration);
  }, [clearTimer]);

  const skip = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    transition();
  }, [clearTimer, transition]);

  useEffect(() => clearTimer, [clearTimer]);

  return { mode, timeRemaining, isRunning, completedSessions, start, pause, resume, reset, skip };
}
