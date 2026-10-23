import type Phaser from 'phaser';
import { BALL_RADIUS } from './model';
import { boostedPaddleVelocity, splitBall } from './ball-motion';

export class BallField {
  readonly group: Phaser.Physics.Arcade.Group;
  multiplier = 1;
  speeding = false;
  private trail: Phaser.GameObjects.Graphics;
  private points = new Map<Phaser.Physics.Arcade.Image, { x: number; y: number }[]>();

  constructor(scene: Phaser.Scene) {
    this.trail = scene.add.graphics();
    this.group = scene.physics.add.group({ allowGravity: false });
  }

  get active() { return this.group.getChildren().filter(ball => ball.active) as Phaser.Physics.Arcade.Image[]; }

  setSpeeding(enabled: boolean) {
    if (enabled === this.speeding) return;
    const factor = enabled ? 2 : 0.5;
    for (const ball of this.active) {
      const { x, y } = (ball.body as Phaser.Physics.Arcade.Body).velocity;
      ball.setVelocity(x * factor, y * factor);
    }
    this.speeding = enabled;
  }

  private spawn(x: number, y: number) {
    const ball = this.group.create(x, y, 'ball') as Phaser.Physics.Arcade.Image;
    ball.setCircle(BALL_RADIUS).setBounce(1).setCollideWorldBounds(true);
    if (this.multiplier > 1) ball.setTint(0xffca78);
    this.points.set(ball, []);
    return ball;
  }

  clear() {
    this.group.clear(true, true);
    this.speeding = false;
    this.points.clear();
    this.trail.clear();
  }

  hide() {
    // Collision callbacks can still be iterating the group; disable rather than destroy here.
    for (const ball of this.active) ball.disableBody(true, true);
    this.speeding = false;
    this.points.clear();
    this.trail.clear();
  }

  reset(x: number, y: number) {
    this.clear();
    this.multiplier = 1;
    this.spawn(x, y);
  }

  positionReady(x: number, y: number) {
    for (const ball of this.active) (ball.body as Phaser.Physics.Arcade.Body).reset(x, y);
  }

  launch(speed: number) {
    for (const ball of this.active) ball.setVelocity(speed * 0.32, -speed * Math.sqrt(1 - 0.32 ** 2));
  }

  double(height: number): boolean {
    const originals = this.active.filter(ball => ball.y <= height + BALL_RADIUS);
    if (!originals.length) return false;
    this.multiplier *= 2;
    for (const ball of originals) {
      const { x: vx, y: vy } = (ball.body as Phaser.Physics.Arcade.Body).velocity;
      const [original, extra] = splitBall({ x: ball.x, y: ball.y, vx, vy });
      ball.setVelocity(original.vx, original.vy).setTint(0xffca78);
      this.spawn(extra.x, extra.y).setVelocity(extra.vx, extra.vy);
    }
    return true;
  }

  bounceOnPaddle(ball: Phaser.Physics.Arcade.Image, offset: number) {
    const body = ball.body as Phaser.Physics.Arcade.Body;
    const velocity = boostedPaddleVelocity(offset, body.velocity.length(), this.multiplier * (this.speeding ? 2 : 1));
    ball.setVelocity(velocity.x, velocity.y);
  }

  resize(mapY: (y: number) => number) {
    for (const ball of this.active) {
      const body = ball.body as Phaser.Physics.Arcade.Body;
      const { x: vx, y: vy } = body.velocity;
      body.reset(ball.x, mapY(ball.y));
      ball.setVelocity(vx, vy);
      this.points.set(ball, []);
    }
    this.trail.clear();
  }

  update(height: number, reducedMotion: boolean) {
    this.trail.clear();
    for (const ball of this.active) {
      if (ball.y > height + BALL_RADIUS) {
        this.points.delete(ball);
        ball.destroy();
        continue;
      }
      const velocity = (ball.body as Phaser.Physics.Arcade.Body).velocity;
      const speed = velocity.length();
      if (Math.abs(velocity.y) < speed * 0.22) {
        const y = (velocity.y < 0 ? -1 : 1) * speed * 0.22;
        ball.setVelocity(Math.sign(velocity.x || 1) * Math.sqrt(speed ** 2 - y ** 2), y);
      }
      if (!reducedMotion) {
        const points = this.points.get(ball)!;
        points.unshift({ x: ball.x, y: ball.y });
        points.length = Math.min(12, points.length);
        points.forEach((point, index) => this.trail.fillStyle(this.multiplier > 1 ? 0xffca78 : 0xe1f3ac, (1 - index / 12) * 0.2).fillCircle(point.x, point.y, BALL_RADIUS * (1 - index / 14)));
      }
    }
  }
}
