'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePomodoro } from '../hooks/usePomodoro';
import { useChime } from '../hooks/useChime';
import { useSessions } from '../hooks/useSessions';
import { useMode } from './ModeProvider';
import { PHASES, PHASE_LABELS, formatTime } from '../lib/pomodoro';

const RING_RADIUS = 28;
const RING_STROKE = 4;
const RING_SIZE = (RING_RADIUS + RING_STROKE) * 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const SETTINGS_KEY = 'scribe:pomo-settings';

interface Settings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  dailyGoal: number;
}

const DEFAULT_SETTINGS: Settings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
  dailyGoal: 8,
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

function saveSettings(s: Settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch { /* ignore */ }
}

function totalForPhase(phase: string, s: Settings): number {
  if (phase === PHASES.WORK) return s.workMinutes * 60;
  if (phase === PHASES.SHORT_BREAK) return s.shortBreakMinutes * 60;
  return s.longBreakMinutes * 60;
}

export function PomodoroWidget() {
  const { isZen } = useMode();
  const [isOpen, setIsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  // form state — edited live, applied on close
  const [draft, setDraft] = useState<Settings>(DEFAULT_SETTINGS);
  const panelRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);

  // Load persisted settings + mute on mount
  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    setDraft(s);
    setMuted(localStorage.getItem('scribe-pomo-muted') === '1');
  }, []);

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
    workMinutes: settings.workMinutes,
    shortBreakMinutes: settings.shortBreakMinutes,
    longBreakMinutes: settings.longBreakMinutes,
    sessionsBeforeLongBreak: settings.sessionsBeforeLongBreak,
  });

  const { completedToday, logSession, clearToday } = useSessions();
  const { play } = useChime();

  const total = totalForPhase(mode, settings);
  const progress = timeRemaining / total;
  const isWork = mode === PHASES.WORK;

  // log session + chime when a work session completes
  const prevCompletedRef = useRef(completedSessions);
  useEffect(() => {
    if (completedSessions > prevCompletedRef.current) {
      logSession();
      if (!muted) play();
    }
    prevCompletedRef.current = completedSessions;
  }, [completedSessions, logSession, play, muted]);

  // chime on break → work transition
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
        closeSettingsIfOpen();
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, draft]);

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

  function updateDraft(key: keyof Settings, raw: string) {
    const value = Math.max(0, parseInt(raw, 10) || 0);
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function closeSettingsIfOpen() {
    if (!settingsOpen) return;
    // Apply draft → settings, persist, reset timer to new duration
    const next = {
      ...draft,
      workMinutes: Math.max(1, draft.workMinutes),
      shortBreakMinutes: Math.max(1, draft.shortBreakMinutes),
      longBreakMinutes: Math.max(1, draft.longBreakMinutes),
      sessionsBeforeLongBreak: Math.max(1, draft.sessionsBeforeLongBreak),
      dailyGoal: Math.max(0, draft.dailyGoal),
    };
    setSettings(next);
    setDraft(next);
    saveSettings(next);
    reset();
    setSettingsOpen(false);
  }

  // ring math
  const offset = RING_CIRCUMFERENCE * (1 - Math.max(0, Math.min(1, progress)));

  // session dots: how many lit in the current cycle
  const sbLB = settings.sessionsBeforeLongBreak;
  const dotsLit =
    completedToday === 0 ? 0 : completedToday % sbLB || sbLB;

  const goalReached = settings.dailyGoal > 0 && completedToday >= settings.dailyGoal;

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
          className="fixed rounded-xl flex flex-col"
          style={{
            top: '52px',
            right: '24px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg)',
            minWidth: '200px',
            zIndex: 100,
          }}
        >
          {settingsOpen ? (
            <SettingsPanel
              draft={draft}
              onChange={updateDraft}
              onClose={closeSettingsIfOpen}
            />
          ) : (
            <MainPanel
              mode={mode}
              timeRemaining={timeRemaining}
              isRunning={isRunning}
              isWork={isWork}
              offset={offset}
              completedToday={completedToday}
              dotsLit={dotsLit}
              sbLB={sbLB}
              dailyGoal={settings.dailyGoal}
              goalReached={goalReached}
              muted={muted}
              onStartPause={handleStartPause}
              onReset={reset}
              onSkip={skip}
              onToggleMute={toggleMute}
              onClearSessions={clearToday}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main panel ────────────────────────────────────────────────────────────

interface MainPanelProps {
  mode: string;
  timeRemaining: number;
  isRunning: boolean;
  isWork: boolean;
  offset: number;
  completedToday: number;
  dotsLit: number;
  sbLB: number;
  dailyGoal: number;
  goalReached: boolean;
  muted: boolean;
  onStartPause: () => void;
  onReset: () => void;
  onSkip: () => void;
  onToggleMute: () => void;
  onClearSessions: () => void;
  onOpenSettings: () => void;
}

function MainPanel({
  mode, timeRemaining, isRunning, isWork, offset,
  completedToday, dotsLit, sbLB, dailyGoal, goalReached,
  muted, onStartPause, onReset, onSkip, onToggleMute,
  onClearSessions, onOpenSettings,
}: MainPanelProps) {
  return (
    <div className="p-4 flex flex-col items-center gap-3">
      {/* header row: phase label + settings gear */}
      <div className="w-full flex items-center justify-between">
        <span
          className="text-xs font-medium tracking-widest uppercase"
          style={{ color: 'var(--accent)', opacity: 0.7 }}
        >
          {PHASE_LABELS[mode as keyof typeof PHASE_LABELS]}
        </span>
        <button
          onClick={onOpenSettings}
          className="w-6 h-6 flex items-center justify-center rounded transition-opacity duration-150 hover:opacity-70 cursor-pointer"
          style={{ color: 'var(--accent)', opacity: 0.5 }}
          aria-label="timer settings"
        >
          <GearIcon />
        </button>
      </div>

      {/* mini ring */}
      <div className="relative flex items-center justify-center">
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          style={{ transform: 'rotate(-90deg)' }}
          aria-hidden="true"
        >
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            stroke="var(--border)"
            strokeWidth={RING_STROKE}
          />
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
            style={{ transition: 'stroke-dashoffset 0.8s ease, opacity 0.5s ease' }}
          />
        </svg>
        <div className="absolute flex items-center justify-center">
          <span
            className="text-xs font-bold tabular-nums"
            style={{ color: 'var(--text)' }}
            role="timer"
            aria-label={`${PHASE_LABELS[mode as keyof typeof PHASE_LABELS]}: ${formatTime(timeRemaining)} remaining`}
          >
            {formatTime(timeRemaining)}
          </span>
        </div>
      </div>

      {/* controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          aria-label="reset timer"
          className="px-2.5 py-1 rounded-full text-xs font-medium transition-opacity duration-150 hover:opacity-70 cursor-pointer"
          style={{ border: '1px solid var(--border)', color: 'var(--accent)' }}
        >
          reset
        </button>
        <button
          onClick={onStartPause}
          aria-label={isRunning ? 'pause timer' : 'start timer'}
          className="px-3 py-1 rounded-full text-xs font-medium transition-opacity duration-150 hover:opacity-80 cursor-pointer"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--bg)' }}
        >
          {isRunning ? 'pause' : 'start'}
        </button>
        <button
          onClick={onSkip}
          aria-label="skip to next phase"
          className="px-2.5 py-1 rounded-full text-xs font-medium transition-opacity duration-150 hover:opacity-70 cursor-pointer"
          style={{ border: '1px solid var(--border)', color: 'var(--accent)' }}
        >
          skip
        </button>
      </div>

      {/* session dots + count + clear */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: sbLB }).map((_, i) => (
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
          <>
            <span
              className="text-xs ml-1 tabular-nums"
              style={{ color: 'var(--accent)', opacity: 0.5 }}
            >
              {dailyGoal > 0 ? `${completedToday} / ${dailyGoal}` : completedToday}
            </span>
            <button
              onClick={onClearSessions}
              className="text-xs leading-none transition-opacity duration-150 hover:opacity-100 cursor-pointer"
              style={{ color: 'var(--accent)', opacity: 0.35 }}
              aria-label="clear today's sessions"
              title="clear sessions"
            >
              ×
            </button>
          </>
        )}
        {goalReached && (
          <span
            className="text-xs ml-0.5"
            style={{ color: 'var(--accent)', opacity: 0.7 }}
            title="daily goal reached"
          >
            ✓
          </span>
        )}
      </div>

      {/* mute toggle */}
      <button
        onClick={onToggleMute}
        aria-label={muted ? 'unmute chime' : 'mute chime'}
        className="text-xs transition-opacity duration-200 hover:opacity-70 cursor-pointer"
        style={{ color: 'var(--accent)', opacity: 0.5 }}
      >
        {muted ? 'sound off' : 'sound on'}
      </button>
    </div>
  );
}

// ─── Settings panel ─────────────────────────────────────────────────────────

interface SettingsPanelProps {
  draft: Settings;
  onChange: (key: keyof Settings, value: string) => void;
  onClose: () => void;
}

function SettingsPanel({ draft, onChange, onClose }: SettingsPanelProps) {
  return (
    <div className="p-4 flex flex-col gap-4" style={{ minWidth: '220px' }}>
      {/* header */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-semibold"
          style={{ color: 'var(--text)' }}
        >
          settings
        </span>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded transition-opacity duration-150 hover:opacity-70 cursor-pointer text-base leading-none"
          style={{ color: 'var(--accent)', opacity: 0.6 }}
          aria-label="close settings"
        >
          ×
        </button>
      </div>

      {/* durations section */}
      <div className="flex flex-col gap-2.5">
        <span
          className="text-xs font-medium tracking-widest uppercase"
          style={{ color: 'var(--accent)', opacity: 0.5 }}
        >
          durations (minutes)
        </span>
        {([
          ['workMinutes', 'work'],
          ['shortBreakMinutes', 'short break'],
          ['longBreakMinutes', 'long break'],
        ] as const).map(([key, label]) => (
          <SettingRow
            key={key}
            label={label}
            value={draft[key]}
            min={1}
            max={120}
            onChange={(v) => onChange(key, v)}
          />
        ))}
      </div>

      {/* sessions section */}
      <div className="flex flex-col gap-2.5">
        <span
          className="text-xs font-medium tracking-widest uppercase"
          style={{ color: 'var(--accent)', opacity: 0.5 }}
        >
          sessions
        </span>
        <SettingRow
          label="sessions before long break"
          value={draft.sessionsBeforeLongBreak}
          min={1}
          max={10}
          onChange={(v) => onChange('sessionsBeforeLongBreak', v)}
        />
        <SettingRow
          label="daily goal (0 to disable)"
          value={draft.dailyGoal}
          min={0}
          max={24}
          onChange={(v) => onChange('dailyGoal', v)}
        />
      </div>
    </div>
  );
}

interface SettingRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: string) => void;
}

function SettingRow({ label, value, min, max, onChange }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs" style={{ color: 'var(--text)', opacity: 0.7 }}>
        {label}
      </span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="w-16 text-center text-xs rounded-md px-2 py-1 tabular-nums outline-none"
        style={{
          backgroundColor: 'var(--code-bg)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
        }}
      />
    </div>
  );
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
