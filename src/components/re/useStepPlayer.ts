import { useEffect, useState } from 'react';

export type ViewMode = 'step' | 'all';

export interface StepPlayer {
  total: number;
  index: number; // effective index (last one in "all" mode)
  viewMode: ViewMode;
  isPlaying: boolean;
  speed: number;
  isComplete: boolean;
  setIndex: (i: number) => void;
  setViewMode: (m: ViewMode) => void;
  setIsPlaying: (p: boolean) => void;
  setSpeed: (s: number) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
  showAll: () => void;
}

/**
 * Shared step-by-step / show-all controller used by every RE → DFA stage.
 * Mirrors the behaviour of the operator-precedence parse trace (←, →, Space, R).
 */
export function useStepPlayer(total: number, resetKey: unknown): StepPlayer {
  const [rawIndex, setRawIndex] = useState(0);
  const [viewMode, setViewModeState] = useState<ViewMode>('step');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const last = Math.max(total - 1, 0);

  useEffect(() => {
    setRawIndex(0);
    setIsPlaying(false);
  }, [resetKey]);

  // auto-play
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setRawIndex((prev) => {
        if (prev >= last) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1100 / speed);
    return () => clearInterval(id);
  }, [isPlaying, speed, last]);

  const toStep = () => {
    if (viewMode === 'all') setViewModeState('step');
  };

  const next = () => {
    toStep();
    setRawIndex((p) => Math.min(last, viewMode === 'all' ? last : p + 1));
  };
  const prev = () => {
    toStep();
    setRawIndex((p) => Math.max(0, (viewMode === 'all' ? last : p) - 1));
  };
  const reset = () => {
    setViewModeState('step');
    setIsPlaying(false);
    setRawIndex(0);
  };
  const showAll = () => {
    setIsPlaying(false);
    setViewModeState('all');
    setRawIndex(last);
  };

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.code === 'Space') {
        e.preventDefault();
        toStep();
        setIsPlaying((p) => !p);
      } else if (e.key.toLowerCase() === 'r') reset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const index = viewMode === 'all' ? last : Math.min(rawIndex, last);

  return {
    total,
    index,
    viewMode,
    isPlaying,
    speed,
    isComplete: index >= last,
    setIndex: (i: number) => {
      setIsPlaying(false);
      setViewModeState('step');
      setRawIndex(Math.max(0, Math.min(last, i)));
    },
    setViewMode: (m: ViewMode) => (m === 'all' ? showAll() : setViewModeState('step')),
    setIsPlaying: (p: boolean) => {
      if (p) {
        toStep();
        if (rawIndex >= last) setRawIndex(0);
      }
      setIsPlaying(p);
    },
    setSpeed,
    next,
    prev,
    reset,
    showAll,
  };
}
