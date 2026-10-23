import { describe, expect, it } from 'vitest';
import { BALL_RADIUS, destroyBrick, formatTime, initialState, LEVEL_COUNT, loseLife, makeBricks, nextLevel, PADDLE_Y, paddleVelocity, WIDTH, type GameState } from './model';

const playing = (changes: Partial<GameState> = {}): GameState => ({ ...initialState(), status: 'playing', ...changes });

describe('level layouts', () => {
  it.each([1, 2, 3, 4, 5])('level %i has distinct non-overlapping bricks within the arena', level => {
    const bricks = makeBricks(level);
    expect(bricks.length).toBeGreaterThan(20);
    expect(new Set(bricks.map(b => `${b.x},${b.y}`)).size).toBe(bricks.length);
    for (const brick of bricks) {
      expect(brick.x - 33).toBeGreaterThan(BALL_RADIUS);
      expect(brick.x + 33).toBeLessThan(WIDTH - BALL_RADIUS);
      expect(brick.y + 13).toBeLessThan(PADDLE_Y - 200);
      expect([1, 2]).toContain(brick.hp);
      for (const other of bricks) {
        if (brick === other) continue;
        expect(Math.abs(brick.x - other.x) >= 66 || Math.abs(brick.y - other.y) >= 26).toBe(true);
      }
    }
  });

  it('introduces reinforced bricks only from level three', () => {
    expect(makeBricks(1).every(b => b.hp === 1)).toBe(true);
    expect(makeBricks(2).every(b => b.hp === 1)).toBe(true);
    expect(makeBricks(3).some(b => b.hp === 2)).toBe(true);
  });
});

describe('scoring and progression', () => {
  it('rewards consecutive hits and caps the multiplier at ten', () => {
    let state = playing();
    for (let i = 0; i < 12; i++) state = destroyBrick(state);
    expect(state.score).toBe(750);
    expect(state.combo).toBe(12);
    expect(state.bestCombo).toBe(12);
    expect(state.remaining).toBe(state.total - 12);
  });

  it('clears a level exactly once and grants a completion bonus', () => {
    const state = destroyBrick(playing({ remaining: 1, level: 2, score: 80 }));
    expect(state.status).toBe('level-complete');
    expect(state.score).toBe(290);
    expect(destroyBrick(state)).toBe(state);
  });

  it('preserves scores and restores one life on the next level', () => {
    const state = nextLevel({ ...playing(), status: 'level-complete', lives: 1, score: 420, seconds: 35, combo: 9 });
    expect(state).toMatchObject({ level: 2, lives: 2, score: 420, seconds: 35, status: 'ready', combo: 0 });
    expect(state.remaining).toBe(makeBricks(2).length);
    expect(nextLevel({ ...state, status: 'level-complete', lives: 3 }).lives).toBe(3);
  });

  it('cannot skip an unfinished level', () => {
    const state = playing();
    expect(nextLevel(state)).toBe(state);
  });

  it('wins at the end of the fifth level instead of generating a sixth', () => {
    const state = destroyBrick(playing({ level: LEVEL_COUNT, remaining: 1 }));
    expect(state.status).toBe('won');
    expect(state.score).toBe(510);
    expect(nextLevel(state)).toBe(state);
  });

  it('loses one life, resets the combo and preserves the score', () => {
    const state = loseLife(playing({ score: 350, combo: 5, bestCombo: 8 }));
    expect(state).toMatchObject({ lives: 2, combo: 0, bestCombo: 8, score: 350, status: 'ready' });
    expect(loseLife(state)).toBe(state);
  });

  it('ends the game on the last life without decrementing again', () => {
    const state = loseLife(playing({ lives: 1 }));
    expect(state).toMatchObject({ lives: 0, status: 'lost' });
    expect(loseLife(state)).toBe(state);
  });

  it('does not award points or lose lives while paused', () => {
    const state: GameState = { ...playing(), status: 'paused' };
    expect(destroyBrick(state)).toBe(state);
    expect(loseLife(state)).toBe(state);
  });
});

describe('paddle control', () => {
  it('reflects upward and steers toward the hit side', () => {
    const left = paddleVelocity(-0.9, 400);
    const right = paddleVelocity(0.9, 400);
    expect(left.x).toBeLessThan(0);
    expect(right.x).toBeGreaterThan(0);
    expect(left.y).toBeLessThan(0);
    expect(right.y).toBeLessThan(0);
    expect(left.y).toBeCloseTo(right.y);
  });

  it('avoids a vertical loop at the center and limits extreme angles and speed', () => {
    expect(Math.abs(paddleVelocity(0, 350).x)).toBeGreaterThan(0);
    expect(paddleVelocity(4, 800)).toEqual(paddleVelocity(1, 520));
    expect(Math.hypot(...Object.values(paddleVelocity(1, 800)))).toBeCloseTo(520);
    expect(Math.hypot(...Object.values(paddleVelocity(0, 800)))).toBeCloseTo(520);
    expect(paddleVelocity(1, 800).y).toBeLessThan(-250);
  });

  it('formats elapsed time without wrapping after an hour', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(125.8)).toBe('02:05');
    expect(formatTime(3601)).toBe('60:01');
  });
});
