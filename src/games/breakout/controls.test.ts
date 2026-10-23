import { describe, expect, it } from 'vitest';
import { arenaLayout, TouchDrag } from './controls';
import { HEIGHT, PADDLE_WIDTH, WIDTH } from './model';

describe('mobile arena sizing', () => {
  it.each([[320, 460], [375, 650], [390, 700], [430, 780]])('fills a portrait %i × %i viewport and leaves room below the paddle', (width, height) => {
    const layout = arenaLayout(width, height);
    const scale = width / WIDTH;
    expect(Math.abs(layout.height * scale - height)).toBeLessThan(1);
    expect((layout.height - layout.paddleY) * scale).toBeGreaterThanOrEqual(55);
    expect(layout.paddleY).toBeGreaterThan(300);
  });

  it('fits the complete board in landscape without cropping bricks', () => {
    const layout = arenaLayout(750, 230);
    const scale = Math.min(750 / WIDTH, 230 / layout.height);
    expect(layout.height).toBe(HEIGHT);
    expect(WIDTH * scale).toBeLessThanOrEqual(750);
    expect(layout.height * scale).toBeCloseTo(230);
  });

  it('handles temporarily hidden containers', () => {
    expect(arenaLayout(0, 0).height).toBe(HEIGHT);
  });
});

describe('touch paddle control', () => {
  it('follows finger movement without jumping to where the finger landed', () => {
    const drag = new TouchDrag();
    drag.begin(1, 70);
    expect(drag.move(1, 70, 360)).toBe(360);
    expect(drag.move(1, 110, 360)).toBe(400);
    expect(drag.move(1, 90, 400)).toBe(380);
  });

  it('does not let a second finger take over or release the active drag', () => {
    const drag = new TouchDrag();
    expect(drag.begin(1, 100)).toBe(true);
    expect(drag.begin(2, 500)).toBe(false);
    expect(drag.move(2, 600, 360)).toBe(360);
    drag.end(2);
    expect(drag.move(1, 110, 360)).toBe(370);
  });

  it('allows lifting and re-grabbing from any horizontal position', () => {
    const drag = new TouchDrag();
    drag.begin(1, 100);
    drag.end(1);
    expect(drag.move(1, 200, 360)).toBe(360);
    expect(drag.begin(2, 600)).toBe(true);
    expect(drag.move(2, 580, 360)).toBe(340);
  });

  it('clamps the paddle at the edge and immediately responds when reversing', () => {
    const drag = new TouchDrag();
    const rightEdge = WIDTH - PADDLE_WIDTH / 2 - 12;
    drag.begin(1, 100);
    expect(drag.move(1, 700, 360)).toBe(rightEdge);
    expect(drag.move(1, 690, rightEdge)).toBe(rightEdge - 10);
    expect(drag.move(1, -1000, rightEdge - 10)).toBe(PADDLE_WIDTH / 2 + 12);
  });

  it('clears a cancelled gesture before another starts', () => {
    const drag = new TouchDrag();
    drag.begin(1, 100);
    drag.reset();
    expect(drag.move(1, 200, 360)).toBe(360);
    expect(drag.begin(2, 200)).toBe(true);
  });
});
