import { useCallback, useEffect, useRef, useState } from 'react';
import { BEST_KEY, initialState, readBest, readSound, SOUND_KEY, type GameControls, type GameSnapshot } from './model';

export function useBreakout() {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<GameControls | null>(null);
  const [hud, setHud] = useState<GameSnapshot>(() => ({ ...initialState(), ballCount: 1, frenzy: false, speeding: false }));
  const [best, setBest] = useState(readBest);
  const bestRef = useRef(best);
  const [sound, setSound] = useState(readSound);
  const soundRef = useRef(sound);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let saveTimer: number | undefined;
    let savedBest = bestRef.current;
    let game: { destroy: (removeCanvas: boolean) => void } | undefined;
    const flushBest = () => {
      window.clearTimeout(saveTimer);
      saveTimer = undefined;
      if (savedBest === bestRef.current) return;
      try {
        localStorage.setItem(BEST_KEY, String(bestRef.current));
        savedBest = bestRef.current;
      } catch { if (!cancelled) setStorageError(true); }
    };
    const onHidden = () => { if (document.hidden) flushBest(); };
    window.addEventListener('pagehide', flushBest);
    document.addEventListener('visibilitychange', onHidden);
    // Async import avoids booting an abandoned game during React StrictMode's setup check.
    void import('./createGame').then(({ createGame }) => {
      if (cancelled || !containerRef.current) return;
      game = createGame(containerRef.current, {
        sound: soundRef.current,
        onState: state => {
          if (cancelled) return;
          setHud(state);
          if (state.score > bestRef.current) {
            bestRef.current = state.score;
            setBest(state.score);
            // Batch synchronous storage writes instead of blocking every brick collision.
            saveTimer ??= window.setTimeout(flushBest, 500);
          }
          if (state.status !== 'playing') flushBest();
        },
        onReady: controls => {
          if (cancelled) return;
          controlsRef.current = controls;
          setReady(true);
        },
      });
    }).catch(() => { if (!cancelled) setLoadError(true); });
    return () => {
      cancelled = true;
      flushBest();
      window.removeEventListener('pagehide', flushBest);
      document.removeEventListener('visibilitychange', onHidden);
      controlsRef.current = null;
      game?.destroy(true);
    };
  }, []);

  const start = useCallback(() => controlsRef.current?.start(), []);
  const pause = useCallback(() => controlsRef.current?.pause(), []);
  const restart = useCallback(() => controlsRef.current?.restart(), []);
  const next = useCallback(() => controlsRef.current?.next(), []);
  const setSpeeding = useCallback((enabled: boolean) => controlsRef.current?.setSpeeding(enabled), []);
  const toggleSound = useCallback(() => {
    soundRef.current = !soundRef.current;
    setSound(soundRef.current);
    controlsRef.current?.setSound(soundRef.current);
    try { localStorage.setItem(SOUND_KEY, soundRef.current ? 'on' : 'off'); } catch { /* Optional preference. */ }
  }, []);

  return { containerRef, hud, best, sound, ready, loadError, storageError, start, pause, restart, next, toggleSound, setSpeeding };
}
