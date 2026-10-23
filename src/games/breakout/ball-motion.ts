import { paddleVelocity } from './model';

export type BallMotion = { x: number; y: number; vx: number; vy: number };

export function splitBall(ball: BallMotion): [BallMotion, BallMotion] {
  const angle = Math.PI / 15;
  return [
    { ...ball, vx: ball.vx * 2, vy: ball.vy * 2 },
    { ...ball, vx: (ball.vx * Math.cos(angle) - ball.vy * Math.sin(angle)) * 2,
      vy: (ball.vx * Math.sin(angle) + ball.vy * Math.cos(angle)) * 2 },
  ];
}

export function boostedPaddleVelocity(offset: number, speed: number, multiplier: number) {
  const velocity = paddleVelocity(offset, speed / multiplier + 3);
  return { x: velocity.x * multiplier, y: velocity.y * multiplier };
}
