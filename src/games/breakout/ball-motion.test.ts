import { describe, expect, it } from 'vitest';
import { boostedPaddleVelocity, splitBall } from './ball-motion';
import { makeBricks, paddleVelocity } from './model';

describe('double frenzy', () => {
  it.each([1, 2, 3, 4, 5])('puts exactly one marked brick into level %i', level => {
    const bricks = makeBricks(level);
    const marked = bricks.filter(brick => brick.buff === 'frenzy');
    expect(marked).toHaveLength(1);
    expect(marked[0].y).toBe(Math.max(...bricks.map(brick => brick.y)));
  });

  it.each([[100, -300], [-200, 350], [80, 450]])('doubles both speeds, preserving the original direction and splitting the extra ball', (vx, vy) => {
    const input = { x: 160, y: 200, vx, vy };
    const [original, extra] = splitBall(input);
    expect(input).toEqual({ x: 160, y: 200, vx, vy });
    expect(original).toEqual({ x: 160, y: 200, vx: vx * 2, vy: vy * 2 });
    expect(Math.hypot(extra.vx, extra.vy)).toBeCloseTo(Math.hypot(vx, vy) * 2);
    expect(extra.vx).not.toBeCloseTo(original.vx);
    expect(extra).toMatchObject({ x: 160, y: 200 });
  });

  it('retains normal paddle behavior before a pickup', () => {
    expect(boostedPaddleVelocity(0.5, 400, 1)).toEqual(paddleVelocity(0.5, 403));
  });

  it('preserves double speed after hitting the paddle instead of falling back to the old limit', () => {
    const velocity = boostedPaddleVelocity(0.5, 900, 2);
    expect(Math.hypot(velocity.x, velocity.y)).toBeCloseTo(906);
    expect(velocity.y).toBeLessThan(0);
    const capped = boostedPaddleVelocity(-0.5, 1040, 2);
    expect(Math.hypot(capped.x, capped.y)).toBeCloseTo(1040);
  });
});
