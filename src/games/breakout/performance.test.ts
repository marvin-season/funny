import { describe, expect, it, vi } from 'vitest';
import { performanceProfile, physicsFps, wakeGameLoop } from './performance';
import { BALL_RADIUS } from './model';

describe('render and physics budgets', () => {
  it('limits mobile rendering and particle work independently of gameplay', () => {
    const mobile = performanceProfile(true);
    const desktop = performanceProfile(false);
    expect(mobile.renderFps).toBe(30);
    expect(desktop.renderFps).toBe(60);
    expect(mobile.trailLength).toBe(0);
    expect(mobile.burstCount).toBeLessThan(desktop.burstCount);
    expect(mobile.maxParticles).toBeLessThan(desktop.maxParticles);
  });

  it.each([1, 2, 4])('keeps maximum travel below a ball diameter at %ix speed', multiplier => {
    expect(520 * multiplier / physicsFps(multiplier)).toBeLessThan(BALL_RADIUS * 2);
  });

  it('halves normal physics work compared with the previous fixed 120 Hz setting', () => {
    expect(physicsFps(1)).toBe(60);
  });
});

describe('sleeping game loop', () => {
  it('resets idle elapsed time before waking to prevent a catch-up spike', () => {
    const order: string[] = [];
    wakeGameLoop({ started: true, running: false, resetDelta: () => order.push('reset'), wake: () => order.push('wake') });
    expect(order).toEqual(['reset', 'wake']);
  });

  it('does not start a game that is still booting or restart an active frame', () => {
    const resetDelta = vi.fn();
    const wake = vi.fn();
    wakeGameLoop({ started: false, running: false, resetDelta, wake });
    wakeGameLoop({ started: true, running: true, resetDelta, wake });
    expect(resetDelta).not.toHaveBeenCalled();
    expect(wake).not.toHaveBeenCalled();
  });
});
