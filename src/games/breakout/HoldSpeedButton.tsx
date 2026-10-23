import { useCallback, useEffect, useRef } from 'react';
import { ChevronsRight } from 'lucide-react';

type Props = {
  enabled: boolean;
  speeding: boolean;
  frenzy: boolean;
  ballCount: number;
  onChange: (enabled: boolean) => void;
};

export default function HoldSpeedButton({ enabled, speeding, frenzy, ballCount, onChange }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pointerId = useRef<number | null>(null);
  const keyboardHeld = useRef(false);
  const release = useCallback(() => {
    const id = pointerId.current;
    pointerId.current = null;
    keyboardHeld.current = false;
    if (id !== null && buttonRef.current?.hasPointerCapture(id)) buttonRef.current.releasePointerCapture(id);
    onChange(false);
  }, [onChange]);

  useEffect(() => {
    if (!enabled || !speeding) release();
  }, [enabled, speeding, release]);

  useEffect(() => {
    const hidden = () => { if (document.hidden) release(); };
    window.addEventListener('blur', release);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('blur', release);
      document.removeEventListener('visibilitychange', hidden);
      release();
    };
  }, [release]);

  return <button ref={buttonRef} type="button" disabled={!enabled} aria-label="按住加速，松开恢复" aria-pressed={speeding}
    onPointerDown={event => {
      if (event.button !== 0 || pointerId.current !== null || keyboardHeld.current) return;
      event.preventDefault();
      pointerId.current = event.pointerId;
      event.currentTarget.setPointerCapture(event.pointerId);
      onChange(true);
    }}
    onPointerUp={event => { if (event.pointerId === pointerId.current) release(); }}
    onPointerCancel={event => { if (event.pointerId === pointerId.current) release(); }}
    onLostPointerCapture={event => { if (event.pointerId === pointerId.current) release(); }}
    onContextMenu={event => event.preventDefault()}
    onBlur={release}
    onKeyDown={event => {
      if (![' ', 'Enter'].includes(event.key)) return;
      event.preventDefault();
      if (event.repeat || keyboardHeld.current || pointerId.current !== null) return;
      keyboardHeld.current = true;
      onChange(true);
    }}
    onKeyUp={event => {
      if ([' ', 'Enter'].includes(event.key) && keyboardHeld.current) { event.preventDefault(); release(); }
    }}
    className={`flex min-h-11 min-w-40 touch-none flex-col items-center justify-center rounded-xl px-4 py-1 select-none [-webkit-touch-callout:none] disabled:opacity-40 ${speeding ? 'bg-lime text-ink' : 'bg-white/10 text-lime'}`}>
    <span className="flex items-center gap-1 text-xs font-medium"><ChevronsRight size={17} />{speeding ? '加速中 · 松开恢复' : '按住加速 ×2'}</span>
    <span className="text-[10px] opacity-70">{frenzy ? `双倍狂热 · ${ballCount} 球 · ${speeding ? 4 : 2}× 球速` : '松开恢复原速'}</span>
  </button>;
}
