export const WIDTH = 720;
export const HEIGHT = 660;
export const PADDLE_Y = 604;
export const PADDLE_WIDTH = 124;
export const BALL_RADIUS = 8;
export const LEVEL_COUNT = 5;
export const BEST_KEY = 'moment:breakout:best:v1';
export const SOUND_KEY = 'moment:breakout:sound:v1';

export type Status = 'ready' | 'playing' | 'paused' | 'level-complete' | 'won' | 'lost';
export type Brick = { x: number; y: number; hp: number; color: number };
export type GameState = {
  status: Status;
  level: number;
  score: number;
  lives: number;
  combo: number;
  bestCombo: number;
  seconds: number;
  remaining: number;
  total: number;
};
export type GameControls = { start: () => void; pause: () => void; restart: () => void; next: () => void; setSound: (enabled: boolean) => void };

const colors = [0xd4ed8a, 0xadcbb0, 0xe8cb99, 0xa9c6d0, 0xc7b8da];

export function makeBricks(level: number): Brick[] {
  const bricks: Brick[] = [];
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 9; col++) {
      if (level === 1 && (row === 5 || ((col === 0 || col === 8) && row === 0))) continue;
      if (level === 2 && (row + col) % 4 === 0) continue;
      if (level === 3 && Math.abs(col - 4) > row + 1) continue;
      if (level === 4 && (col === 2 || col === 6) && row % 2 === 0) continue;
      bricks.push({ x: 68 + col * 73, y: 98 + row * 35, hp: level >= 3 && (row + col) % 5 === 0 ? 2 : 1, color: colors[row % colors.length] });
    }
  }
  return bricks;
}

export function initialState(): GameState {
  const total = makeBricks(1).length;
  return { status: 'ready', level: 1, score: 0, lives: 3, combo: 0, bestCombo: 0, seconds: 0, remaining: total, total };
}

export function destroyBrick(state: GameState): GameState {
  if (state.status !== 'playing' || state.remaining <= 0) return state;
  const combo = state.combo + 1;
  const remaining = state.remaining - 1;
  const score = state.score + 10 * Math.min(combo, 10) + (remaining === 0 ? 100 * state.level : 0);
  return { ...state, combo, bestCombo: Math.max(state.bestCombo, combo), remaining, score,
    status: remaining === 0 ? (state.level === LEVEL_COUNT ? 'won' : 'level-complete') : 'playing' };
}

export function loseLife(state: GameState): GameState {
  if (state.status !== 'playing') return state;
  const lives = Math.max(0, state.lives - 1);
  return { ...state, lives, combo: 0, status: lives ? 'ready' : 'lost' };
}

export function nextLevel(state: GameState): GameState {
  if (state.status !== 'level-complete' || state.level >= LEVEL_COUNT) return state;
  const level = state.level + 1;
  const total = makeBricks(level).length;
  return { ...state, level, total, remaining: total, status: 'ready', lives: Math.min(3, state.lives + 1), combo: 0 };
}

export function paddleVelocity(offset: number, speed: number) {
  const angle = Math.max(-1, Math.min(1, offset)) * Math.PI / 3;
  const cappedSpeed = Math.min(520, Math.max(100, speed));
  const vx = Math.sin(angle) * cappedSpeed;
  const x = Math.abs(vx) < 28 ? (vx < 0 ? -28 : 28) : vx;
  return { x, y: -Math.sqrt(cappedSpeed ** 2 - x ** 2) };
}

export function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

export function readBest(): number {
  try {
    const n = Number(localStorage.getItem(BEST_KEY));
    return Number.isSafeInteger(n) && n >= 0 ? n : 0;
  } catch { return 0; }
}

export function readSound() {
  try { return localStorage.getItem(SOUND_KEY) !== 'off'; } catch { return true; }
}
