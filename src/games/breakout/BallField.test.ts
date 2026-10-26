import type Phaser from 'phaser';
import { describe, expect, it } from 'vitest';
import { BallField } from './BallField';
import { initialState, loseLife } from './model';

// Exercise ball lifecycle against a lightweight scene adapter; Phaser owns collision detection.
function fieldFixture(trailLength = 8) {
  const children: FakeBall[] = [];
  class FakeBall {
    active = true;
    velocity = { x: 0, y: 0, length: () => Math.hypot(this.velocity.x, this.velocity.y) };
    body = { velocity: this.velocity, reset: (x: number, y: number) => { this.x = x; this.y = y; this.setVelocity(0, 0); } };
    constructor(public x: number, public y: number) {}
    setCircle() { return this; }
    setBounce() { return this; }
    setCollideWorldBounds() { return this; }
    setTint() { return this; }
    setVelocity(x: number, y: number) { this.velocity.x = x; this.velocity.y = y; return this; }
    disableBody() { this.active = false; }
    destroy() { children.splice(children.indexOf(this), 1); this.active = false; }
  }
  const graphics = { clear() {}, fillStyle() { return this; }, fillCircle() { return this; } };
  const scene = {
    add: { graphics: () => graphics },
    physics: { add: { group: () => ({ getChildren: () => children, countActive: () => children.filter(ball => ball.active).length, clear: () => { children.length = 0; },
      create: (x: number, y: number) => { const ball = new FakeBall(x, y); children.push(ball); return ball; } }) } },
  } as unknown as Phaser.Scene;
  return new BallField(scene, trailLength);
}

describe('multi-ball lifecycle', () => {
  it('keeps ball movement, boosting and loss detection when mobile trails are disabled', () => {
    const field = fieldFixture(0);
    field.reset(360, 580);
    field.launch(400);
    field.double(660);
    field.setSpeeding(true);
    field.update(660, false);
    expect(field.count).toBe(2);
    expect(field.speedMultiplier).toBe(4);
    for (const ball of field.active) ball.y = 700;
    field.update(660, false);
    expect(field.count).toBe(0);
  });
  it('temporarily doubles speed without stacking repeated presses, and restores the current direction', () => {
    const field = fieldFixture();
    field.reset(360, 580);
    field.launch(400);
    field.setSpeeding(true);
    field.setSpeeding(true);
    const ball = field.active[0];
    expect((ball.body as Phaser.Physics.Arcade.Body).velocity.length()).toBeCloseTo(800);
    ball.setVelocity(-480, 640);
    field.setSpeeding(false);
    field.setSpeeding(false);
    expect((ball.body as Phaser.Physics.Arcade.Body).velocity).toMatchObject({ x: -240, y: 320 });
    expect(field.speeding).toBe(false);
  });

  it('stacks with frenzy but retains frenzy when the hold is released', () => {
    const field = fieldFixture();
    field.reset(360, 580);
    field.launch(400);
    field.double(660);
    field.setSpeeding(true);
    for (const ball of field.active) expect((ball.body as Phaser.Physics.Arcade.Body).velocity.length()).toBeCloseTo(1600);
    field.setSpeeding(false);
    expect(field.multiplier).toBe(2);
    for (const ball of field.active) expect((ball.body as Phaser.Physics.Arcade.Body).velocity.length()).toBeCloseTo(800);
  });

  it('also restores newly split balls when a buff is collected during the hold', () => {
    const field = fieldFixture();
    field.reset(360, 580);
    field.launch(450);
    field.setSpeeding(true);
    field.double(660);
    expect(field.active).toHaveLength(2);
    for (const ball of field.active) expect((ball.body as Phaser.Physics.Arcade.Body).velocity.length()).toBeCloseTo(1800);
    field.setSpeeding(false);
    for (const ball of field.active) expect((ball.body as Phaser.Physics.Arcade.Body).velocity.length()).toBeCloseTo(900);
  });

  it('keeps the speed layers through a paddle collision and releases only the temporary layer', () => {
    const field = fieldFixture();
    field.reset(360, 580);
    field.launch(400);
    field.double(660);
    field.setSpeeding(true);
    const ball = field.active[0];
    field.bounceOnPaddle(ball, -0.7);
    expect((ball.body as Phaser.Physics.Arcade.Body).velocity.length()).toBeCloseTo(1612);
    field.setSpeeding(false);
    const velocity = (ball.body as Phaser.Physics.Arcade.Body).velocity;
    expect(velocity.length()).toBeCloseTo(806);
    expect(velocity.x).toBeLessThan(0);
    expect(velocity.y).toBeLessThan(0);
  });

  it('clears temporary acceleration on a new life or a completed level', () => {
    const field = fieldFixture();
    field.reset(360, 580);
    field.launch(400);
    field.setSpeeding(true);
    field.reset(360, 580);
    expect(field.speeding).toBe(false);
    field.launch(350);
    field.setSpeeding(false);
    expect((field.active[0].body as Phaser.Physics.Arcade.Body).velocity.length()).toBeCloseTo(350);
    field.setSpeeding(true);
    field.hide();
    expect(field.speeding).toBe(false);
  });

  it('doubles a snapshot of existing balls exactly once per pickup', () => {
    const field = fieldFixture();
    field.reset(360, 580);
    field.launch(400);
    expect(field.double(660)).toBe(true);
    expect(field.active).toHaveLength(2);
    for (const ball of field.active) expect((ball.body as Phaser.Physics.Arcade.Body).velocity.length()).toBeCloseTo(800);
    field.double(660);
    expect(field.active).toHaveLength(4);
    for (const ball of field.active) expect((ball.body as Phaser.Physics.Arcade.Body).velocity.length()).toBeCloseTo(1600);
  });

  it('continues while one ball remains and consumes one life only after the last ball falls', () => {
    const field = fieldFixture();
    let state = { ...initialState(), status: 'playing' as const };
    field.reset(360, 580);
    field.launch(400);
    field.double(660);
    field.active[0].y = 700;
    field.update(660, false);
    expect(field.active).toHaveLength(1);
    expect(state.lives).toBe(3);
    field.active[0].y = 700;
    field.update(660, false);
    expect(field.active).toHaveLength(0);
    const afterLoss = loseLife(state);
    expect(afterLoss.lives).toBe(2);
    expect(loseLife(afterLoss).lives).toBe(2);
  });

  it('does not resurrect balls that already fell beyond the arena', () => {
    const field = fieldFixture();
    field.reset(360, 700);
    field.launch(400);
    expect(field.double(660)).toBe(false);
    expect(field.multiplier).toBe(1);
    field.update(660, true);
    expect(field.active).toHaveLength(0);
  });

  it('clears all extra balls and the speed multiplier on reset', () => {
    const field = fieldFixture();
    field.reset(360, 580);
    field.launch(400);
    field.double(660);
    field.reset(360, 580);
    expect(field.active).toHaveLength(1);
    expect(field.multiplier).toBe(1);
    field.launch(350);
    expect((field.active[0].body as Phaser.Physics.Arcade.Body).velocity.length()).toBeCloseTo(350);
  });

  it('preserves every ball velocity on viewport resize', () => {
    const field = fieldFixture();
    field.reset(360, 400);
    field.launch(400);
    field.double(660);
    const velocities = field.active.map(ball => {
      const { x, y } = (ball.body as Phaser.Physics.Arcade.Body).velocity;
      return { x, y };
    });
    field.resize(y => y + 200);
    field.active.forEach((ball, i) => {
      expect(ball.y).toBe(600);
      expect((ball.body as Phaser.Physics.Arcade.Body).velocity).toMatchObject(velocities[i]);
    });
  });

  it('disables all balls safely when the level finishes', () => {
    const field = fieldFixture();
    field.reset(360, 580);
    field.launch(400);
    field.double(660);
    field.hide();
    expect(field.active).toHaveLength(0);
    field.reset(360, 580);
    expect(field.active).toHaveLength(1);
  });
});
