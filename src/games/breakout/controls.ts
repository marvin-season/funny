import { HEIGHT, PADDLE_WIDTH, PADDLE_Y, WIDTH } from './model';

export function arenaLayout(width: number, height: number) {
  if (width <= 0 || height <= 0) return { height: HEIGHT, paddleY: PADDLE_Y };
  const arenaHeight = Math.max(HEIGHT, Math.round(WIDTH * height / width));
  // Leave a finger-sized area below the paddle on a portrait phone.
  const bottomGap = Math.max(HEIGHT - PADDLE_Y, Math.min(144, Math.round(64 * WIDTH / width)));
  return { height: arenaHeight, paddleY: arenaHeight - bottomGap };
}

export class TouchDrag {
  private pointerId: number | null = null;
  private lastX = 0;

  begin(id: number, x: number): boolean {
    if (this.pointerId !== null) return false;
    this.pointerId = id;
    this.lastX = x;
    return true;
  }

  move(id: number, x: number, paddleX: number): number {
    if (this.pointerId !== id) return paddleX;
    const nextX = paddleX + x - this.lastX;
    this.lastX = x;
    return Math.max(PADDLE_WIDTH / 2 + 12, Math.min(WIDTH - PADDLE_WIDTH / 2 - 12, nextX));
  }

  end(id: number) { if (this.pointerId === id) this.reset(); }
  reset() { this.pointerId = null; }
}
