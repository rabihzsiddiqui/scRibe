'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePomodoro } from '../hooks/usePomodoro';
import { useChime } from '../hooks/useChime';
import { useSessions } from '../hooks/useSessions';
import { useMode } from './ModeProvider';
import {
  PHASES,
  PHASE_LABELS,
  SESSIONS_BEFORE_LONG_BREAK,
  formatTime,
} from '../lib/pomodoro';

const WORK_MINUTES = 25;
const SHORT_BREAK_MINUTES = 5;
const LONG_BREAK_MINUTES = 15;

const RING_RADIUS = 28;
const RING_STROKE = 4;
const RING_SIZE = (RING_RADIUS + RING_STROKE) * 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function totalForMode(mode: string): number {
  if (mode === PHASES.WORK) return WORK_MINUTES * 60;
  if (mode === PHASES.SHORT_BREAK) return SHORT_BREAK_MINUTES * 60;
  return LONG_BREAK_MINUTES * 60;
}

export function PomodoroWidget() {
  const { isZen } = useMode();
  const [isOpen, setIsOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);

  const {
    mode,
    timeRemaining,
    isRunning,
    completedSessions,
    start,
    pause,
    resume,
    reset,
    skip,
  } = usePomodoro({
    workMinutes: WORK_MINUTES,
    shortBreakMinutes: SHORT_BREAK_MINUTES,
    longBreakMinutes: LONG_BREAK_MINUTES,
  });

  const { completedToday, logSession } = useSessions();
  const { play } = useChime();

  const total = totalForMode(mode);
  const progress = timeRemaining / total;
  const isWork = mode === PHASES.WORK;

  useEffect(() => {
    setMuted(localStorage.getItem('scribe-pomo-muted') === '1');
  }, []);

  // log session + chime when a work session completes
  const prevCompletedRef = useRef(completedSessions);
  useEffect(() => {
    if (completedSessions > prevCompletedRef.current) {
      logSession();
      if (!muted) play();
    }
    prevCompletedRef.current = completedSessions;
  }, [completedSessions, logSession, play, muted]);

  // chime on break → work transition (session completion covers work → break above)
  const prevModeRef = useRef(mode);
  useEffect(() => {
    if (prevModeRef.current !== mode) {
      if (mode === PHASES.WORK && !muted) play();
      prevModeRef.current = mode;
    }
  }, [mode, play, muted]);

  // click outside to close panel
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        pillRef.current &&
        !pillRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen]);

  function handleStartPause() {
    if (isRunning) {
      pause();
    } else if (timeRemaining < total) {
      resume();
    } else {
      start();
    }
  }

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      localStorage.setItem('scribe-pomo-muted', next ? '1' : '0');
      return next;
    });
  }, []);

  // ring math
  const offset = RING_CIRCUMFERENCE * (1 - Math.max(0, Math.min(1, progress)));

  // session dots: how many lit in the current cycle of 4
  const dotsLit =
    completedToday === 0
      ? 0
      : completedToday % SESSIONS_BEFORE_LONG_BREAK || SESSIONS_BEFORE_LONG_BREAK;

  return (
    <div
      className={`relative transition-opacity duration-[250ms] ${isZen ? 'opacity-40 hover:opacity-100' : ''}`}
    >
      {/* pill */}
      <button
        ref={pillRef}
        onClick={() => setIsOpen((v) => !v)}
        aria-label={`pomodoro timer: ${formatTime(timeRemaining)}`}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium tabular-nums transition-opacity duration-150 hover:opacity-70 cursor-pointer"
        style={{
          border: '1px solid var(--border)',
          color: 'var(--accent)',
        }}
      >
        <ClockIcon />
        {formatTime(timeRemaining)}
      </button>

      {/* floating panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed rounded-xl p-4 flex flex-col items-center gap-3"
          style={{
            top: '52px',
            right: '24px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg)',
            minWidth: '184px',
            zIndex: 100,
          }}
        >
          {/* phase label */}
          <span
            className="text-xs font-medium tracking-widest uppercase"
            style={{ color: 'var(--accent)', opacity: 0.7 }}
          >
            {PHASE_LABELS[mode]}
          </span>

          {/* mini ring */}
          <div className="relative flex items-center justify-center">
            <svg
              width={RING_SIZE}
              height={RING_SIZE}
              viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
              style={{ transform: 'rotate(-90deg)' }}
              aria-hidden="true"
            >
              {/* track */}
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                fill="none"
                stroke="var(--border)"
                strokeWidth={RING_STROKE}
              />
              {/* progress arc */}
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={offset}
                opacity={isWork ? 1 : 0.4}
                style={{
                  transition: 'stroke-dashoffset 0.8s ease, opacity 0.5s ease',
                }}
              />
            </svg>

            {/* time inside ring */}
            <div className="absolute flex items-center justify-center">
              <span
                className="text-xs font-bold tabular-nums"
                style={{ color: 'var(--text)' }}
                role="timer"
                aria-label={`${PHASE_LABELS[mode]}: ${formatTime(timeRemaining)} remaining`}
              >
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>

          {/* controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={reset}
              aria-label="reset timer"
              className="px-2.5 py-1 rounded-full text-xs font-medium transition-opacity duration-150 hover:opacity-70 cursor-pointer"
              style={{ border: '1px solid var(--border)', color: 'var(--accent)' }}
            >
              reset
            </button>
            <button
              onClick={handleStartPause}
              aria-label={isRunning ? 'pause timer' : 'start timer'}
              className="px-3 py-1 rounded-full text-xs font-medium transition-opacity duration-150 hover:opacity-80 cursor-pointer"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--bg)',
              }}
            >
              {isRunning ? 'pause' : 'start'}
            </button>
            <button
              onClick={skip}
              aria-label="skip to next phase"
              className="px-2.5 py-1 rounded-full text-xs font-medium transition-opacity duration-150 hover:opacity-70 cursor-pointer"
              style={{ border: '1px solid var(--border)', color: 'var(--accent)' }}
            >
              skip
            </button>
          </div>

          {/* session dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: SESSIONS_BEFORE_LONG_BREAK }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-opacity duration-300"
                style={{
                  backgroundColor: 'var(--accent)',
                  opacity: i < dotsLit ? 1 : 0.2,
                }}
              />
            ))}
            {completedToday > 0 && (
              <span
                className="text-xs ml-1 tabular-nums"
                style={{ color: 'var(--accent)', opacity: 0.5 }}
              >
                {completedToday}
              </span>
            )}
          </div>

          {/* mute toggle */}
          <button
            onClick={toggleMute}
            aria-label={muted ? 'unmute chime' : 'mute chime'}
            className="text-xs transition-opacity duration-200 hover:opacity-70 cursor-pointer"
            style={{ color: 'var(--accent)', opacity: 0.5 }}
          >
            {muted ? 'sound off' : 'sound on'}
          </button>
        </div>
      )}
    </div>
  );
}

function ClockIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
