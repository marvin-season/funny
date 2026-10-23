import Phaser from 'phaser';
import { BALL_RADIUS, destroyBrick, initialState, loseLife, makeBricks, makeObstacles, nextLevel, PADDLE_WIDTH, WIDTH, type GameControls, type GameSnapshot } from './model';
import { arenaLayout, TouchDrag } from './controls';
import { BallField } from './BallField';

type Options = {
  sound: boolean;
  onState: (state: GameSnapshot) => void;
  onReady: (controls: GameControls) => void;
};

class BreakoutScene extends Phaser.Scene {
  private state = initialState();
  private balls!: BallField;
  private powerups!: Phaser.Physics.Arcade.Group;
  private paddle!: Phaser.Physics.Arcade.Image;
  private bricks!: Phaser.Physics.Arcade.StaticGroup;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private keys = new Set<string>();
  private audio: AudioContext | null = null;
  private soundEnabled: boolean;
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private lastSecond = -1;
  private background!: Phaser.GameObjects.Graphics;
  private shadow!: Phaser.GameObjects.Ellipse;
  private touchDrag = new TouchDrag();
  private arena: ReturnType<typeof arenaLayout>;
  private landscape = window.innerWidth > window.innerHeight;

  constructor(private options: Options, private parent: HTMLElement) {
    super('breakout');
    this.soundEnabled = options.sound;
    const bounds = parent.getBoundingClientRect();
    this.arena = arenaLayout(bounds.width, bounds.height);
  }

  create() {
    this.makeTextures();
    this.physics.world.setBounds(10, 10, WIDTH - 20, this.arena.height - 10, true, true, true, false);
    this.background = this.add.graphics();
    this.drawBackground();
    this.shadow = this.add.ellipse(WIDTH / 2, this.arena.paddleY + 22, PADDLE_WIDTH + 15, 8, 0x0a1b17, 0.15);
    this.balls = new BallField(this);
    this.particles = this.add.particles(0, 0, 'particle', {
      emitting: false, lifespan: 650, speed: { min: 35, max: 150 }, gravityY: 220,
      scale: { start: 1, end: 0 }, alpha: { start: 0.9, end: 0 }, maxParticles: 240,
    });
    this.bricks = this.physics.add.staticGroup();
    this.obstacles = this.physics.add.staticGroup();
    this.powerups = this.physics.add.group({ allowGravity: false });
    this.paddle = this.physics.add.staticImage(WIDTH / 2, this.arena.paddleY, 'paddle');
    this.physics.add.collider(this.balls.group, this.bricks, (_ball, object) => this.hitBrick(object as Phaser.Physics.Arcade.Image));
    this.physics.add.collider(this.balls.group, this.obstacles, (_ball, object) => this.hitObstacle(object as Phaser.Physics.Arcade.Image));
    // Arcade passes the individual sprite first and the group member second.
    this.physics.add.collider(this.paddle, this.balls.group, (_paddle, ball) => this.hitPaddle(ball as Phaser.Physics.Arcade.Image), (_paddle, ball) => this.state.status === 'playing' && ((ball as Phaser.Physics.Arcade.Image).body as Phaser.Physics.Arcade.Body).velocity.y > 0);
    this.physics.add.overlap(this.paddle, this.powerups, (_paddle, powerup) => this.collectPowerup(powerup as Phaser.Physics.Arcade.Image));
    this.setupLevel();

    const canvas = this.game.canvas;
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', '打砖块游戏区。左右方向键或 A、D 移动挡板，空格发射或暂停，也可以用鼠标或手指移动。');
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.wasTouch) {
        if (pointer.isDown) this.movePaddle(this.touchDrag.move(pointer.id, pointer.x, this.paddle.x));
      } else this.movePaddle(pointer.x);
    });
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.wasTouch) {
        if (!this.touchDrag.begin(pointer.id, pointer.x)) return;
      } else this.movePaddle(pointer.x);
      this.start();
    });
    const releaseTouch = (pointer: Phaser.Input.Pointer) => this.touchDrag.end(pointer.id);
    this.input.on('pointerup', releaseTouch);
    this.input.on('pointerupoutside', releaseTouch);
    const cancelTouch = () => this.pauseGame();
    canvas.addEventListener('touchcancel', cancelTouch);
    const observer = new ResizeObserver(() => this.resizeArena());
    observer.observe(this.parent);

    const keyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target instanceof HTMLElement && event.target.closest('button, a, input, select, textarea, dialog, [contenteditable="true"]')) return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(key)) { event.preventDefault(); this.keys.add(key); }
      if ([' ', 'Enter', 'Escape'].includes(key)) {
        event.preventDefault();
        if (event.repeat) return;
        if (this.state.status === 'playing') this.pauseGame();
        else if (key !== 'Escape') this.start();
      }
    };
    const keyUp = (event: KeyboardEvent) => this.keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key);
    const blur = () => this.pauseGame();
    const hidden = () => { if (document.hidden) this.pauseGame(); };
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', hidden);
    const cleanup = () => {
      observer.disconnect();
      canvas.removeEventListener('touchcancel', cancelTouch);
      this.touchDrag.reset();
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', hidden);
      if (this.audio) { void this.audio.close().catch(() => {}); this.audio = null; }
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    this.events.once(Phaser.Scenes.Events.DESTROY, cleanup);
    this.options.onReady({ start: () => this.start(), pause: () => this.pauseGame(), restart: () => this.restart(), next: () => this.next(),
      setSpeeding: enabled => this.setSpeeding(enabled),
      setSound: enabled => { this.soundEnabled = enabled; if (enabled) this.unlockAudio(); } });
    this.publish();
  }

  private drawBackground() {
    this.background.clear().fillStyle(0xffffff, 0.05);
    for (let x = 24; x < WIDTH; x += 24) for (let y = 24; y < this.arena.height; y += 24) this.background.fillCircle(x, y, 0.9);
  }

  private resizeArena() {
    const bounds = this.parent.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const layout = arenaLayout(bounds.width, bounds.height);
    const landscape = window.innerWidth > window.innerHeight;
    if (landscape !== this.landscape) this.pauseGame();
    this.landscape = landscape;
    this.scale.getParentBounds();
    if (layout.height === this.arena.height && layout.paddleY === this.arena.paddleY) {
      this.scale.refresh();
      return;
    }
    // Keep the fixed obstacle region unchanged so resizing cannot place the ball inside a barrier.
    const oldPaddleY = this.arena.paddleY;
    const fixedRegionBottom = Math.max(300, ...makeObstacles(this.state.level).map(obstacle => obstacle.y + obstacle.height / 2 + BALL_RADIUS + 2));
    const mapY = (y: number) => y <= fixedRegionBottom ? y : fixedRegionBottom + (y - fixedRegionBottom) * (layout.paddleY - fixedRegionBottom) / (oldPaddleY - fixedRegionBottom);
    this.arena = layout;
    this.scale.setGameSize(WIDTH, layout.height);
    this.physics.world.setBounds(10, 10, WIDTH - 20, layout.height - 10, true, true, true, false);
    this.paddle.setY(layout.paddleY).refreshBody();
    this.shadow.setPosition(this.paddle.x, layout.paddleY + 22);
    this.balls.resize(y => this.state.status === 'ready' ? layout.paddleY - 17 : mapY(y));
    for (const object of this.powerups.getChildren()) {
      const powerup = object as Phaser.Physics.Arcade.Image;
      if (!powerup.active) continue;
      (powerup.body as Phaser.Physics.Arcade.Body).reset(powerup.x, mapY(powerup.y));
      powerup.setVelocityY(this.dropSpeed(powerup.y));
    }
    this.touchDrag.reset();
    this.drawBackground();
  }

  private makeTextures() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffffff).fillRoundedRect(0, 0, 66, 26, 5);
    graphics.generateTexture('brick', 66, 26);
    graphics.clear().fillStyle(0xf7ffe5).fillCircle(BALL_RADIUS, BALL_RADIUS, BALL_RADIUS);
    graphics.generateTexture('ball', BALL_RADIUS * 2, BALL_RADIUS * 2);
    graphics.clear().fillStyle(0xd4ed8a).fillRoundedRect(0, 0, PADDLE_WIDTH, 14, 7);
    graphics.fillStyle(0x36543c, 0.35).fillRoundedRect(PADDLE_WIDTH / 2 - 14, 5, 28, 3, 2);
    graphics.generateTexture('paddle', PADDLE_WIDTH, 14);
    graphics.clear().fillStyle(0x829498).fillRoundedRect(0, 0, 128, 16, 4);
    graphics.fillStyle(0xdce5e5).fillRoundedRect(3, 2, 122, 3, 1);
    graphics.fillStyle(0x43595e).fillCircle(9, 10, 2).fillCircle(119, 10, 2);
    graphics.lineStyle(1, 0x43595e, 0.55);
    for (let x = 24; x < 108; x += 12) graphics.lineBetween(x, 12, x + 5, 7);
    graphics.generateTexture('obstacle', 128, 16);
    graphics.clear().fillStyle(0xffffff).fillRect(0, 0, 5, 5);
    graphics.generateTexture('particle', 5, 5);
    graphics.destroy();
    for (const [key, width, height] of [['frenzy-brick', 66, 26], ['frenzy-drop', 46, 34]] as const) {
      const texture = this.textures.createCanvas(key, width, height)!;
      const context = texture.getContext();
      context.fillStyle = '#f5b85b';
      context.fillRect(0, 0, width, height);
      context.strokeStyle = '#ffe5b0';
      context.lineWidth = 2;
      context.strokeRect(2, 2, width - 4, height - 4);
      context.fillStyle = '#20372c';
      context.font = `bold ${key === 'frenzy-drop' ? 23 : 20}px system-ui, sans-serif`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('×2', width / 2, height / 2);
      texture.refresh();
    }
  }

  private setupLevel() {
    this.bricks.clear(true, true);
    this.obstacles.getChildren().forEach(obstacle => this.tweens.killTweensOf(obstacle));
    this.obstacles.clear(true, true);
    this.particles.killAll();
    for (const definition of makeBricks(this.state.level)) {
      const brick = this.bricks.create(definition.x, definition.y, definition.buff ? 'frenzy-brick' : 'brick') as Phaser.Physics.Arcade.Image;
      if (!definition.buff) brick.setTint(definition.color);
      brick.setData({ hp: definition.hp, color: definition.buff ? 0xf5b85b : definition.color, buff: definition.buff });
      if (definition.hp > 1) brick.setAlpha(0.65);
    }
    for (const definition of makeObstacles(this.state.level)) {
      const obstacle = this.obstacles.create(definition.x, definition.y, 'obstacle') as Phaser.Physics.Arcade.Image;
      obstacle.setDisplaySize(definition.width, definition.height).refreshBody();
    }
    this.resetBall();
  }

  private resetBall() {
    this.physics.pause();
    this.powerups.clear(true, true);
    this.keys.clear();
    this.touchDrag.reset();
    this.paddle.setPosition(WIDTH / 2, this.arena.paddleY).refreshBody();
    this.shadow.setPosition(WIDTH / 2, this.arena.paddleY + 22);
    this.balls.reset(WIDTH / 2, this.arena.paddleY - 17);
  }

  private movePaddle(x: number) {
    if (!['playing', 'ready'].includes(this.state.status)) return;
    const position = Phaser.Math.Clamp(x, PADDLE_WIDTH / 2 + 12, WIDTH - PADDLE_WIDTH / 2 - 12);
    this.paddle.setX(position).refreshBody();
    this.shadow.setX(position);
    if (this.state.status === 'ready') this.balls.positionReady(position, this.arena.paddleY - 17);
  }

  private start() {
    if (!['ready', 'paused'].includes(this.state.status)) return;
    this.unlockAudio();
    if (this.state.status === 'ready') {
      const speed = 350 + (this.state.level - 1) * 25;
      this.balls.launch(speed);
    }
    this.state.status = 'playing';
    this.physics.resume();
    this.game.canvas.focus({ preventScroll: true });
    this.publish();
  }

  private pauseGame() {
    this.keys.clear();
    this.touchDrag.reset();
    this.balls.setSpeeding(false);
    if (this.state.status !== 'playing') return;
    this.state.status = 'paused';
    this.physics.pause();
    this.publish();
  }

  private setSpeeding(enabled: boolean) {
    if (enabled && this.state.status !== 'playing') return;
    if (enabled === this.balls.speeding) return;
    this.balls.setSpeeding(enabled);
    this.publish();
  }

  private restart() {
    this.state = initialState();
    this.setupLevel();
    this.publish();
    this.game.canvas.focus({ preventScroll: true });
  }

  private next() {
    if (this.state.status !== 'level-complete') return;
    this.state = nextLevel(this.state);
    this.setupLevel();
    this.publish();
    this.game.canvas.focus({ preventScroll: true });
  }

  private hitBrick(brick: Phaser.Physics.Arcade.Image) {
    if (this.state.status !== 'playing' || !brick.active) return;
    const hp = Number(brick.getData('hp')) - 1;
    brick.setData('hp', hp);
    if (hp <= 0) {
      brick.disableBody(true, true);
      if (!this.reducedMotion) this.particles.setParticleTint(Number(brick.getData('color'))).explode(10, brick.x, brick.y);
      this.state = destroyBrick(this.state);
      if (brick.getData('buff') === 'frenzy' && this.state.status === 'playing') {
        const drop = this.powerups.create(brick.x, brick.y, 'frenzy-drop') as Phaser.Physics.Arcade.Image;
        drop.setVelocityY(this.dropSpeed(brick.y));
      }
    } else {
      brick.setAlpha(1);
      this.tweens.add({ targets: brick, alpha: 0.4, duration: 65, yoyo: true });
    }
    this.playTone('brick');
    if (['level-complete', 'won'].includes(this.state.status)) {
      this.physics.pause();
      this.balls.hide();
      this.powerups.getChildren().forEach(drop => (drop as Phaser.Physics.Arcade.Image).disableBody(true, true));
      this.playTone('clear');
    }
    this.publish();
  }

  private hitObstacle(obstacle: Phaser.Physics.Arcade.Image) {
    if (this.state.status !== 'playing') return;
    if (!this.reducedMotion) {
      this.tweens.killTweensOf(obstacle);
      obstacle.setAlpha(1);
      this.tweens.add({ targets: obstacle, alpha: 0.55, duration: 70, yoyo: true });
    }
    this.playTone('obstacle');
  }

  private dropSpeed(y: number) {
    return Math.max(150, (this.arena.paddleY - y) / 3.5);
  }

  private collectPowerup(powerup: Phaser.Physics.Arcade.Image) {
    if (!powerup.active || this.state.status !== 'playing') return;
    if (!this.balls.double(this.arena.height)) return;
    powerup.disableBody(true, true);
    this.playTone('frenzy');
    this.publish();
  }

  private hitPaddle(ball: Phaser.Physics.Arcade.Image) {
    const offset = (ball.x - this.paddle.x) / (PADDLE_WIDTH / 2);
    this.balls.bounceOnPaddle(ball, offset);
    this.state.combo = 0;
    this.playTone('paddle');
    this.publish();
  }

  update(_time: number, delta: number) {
    if (!this.balls) return;
    const direction = (this.keys.has('ArrowRight') || this.keys.has('d') ? 1 : 0) - (this.keys.has('ArrowLeft') || this.keys.has('a') ? 1 : 0);
    if (direction) this.movePaddle(this.paddle.x + direction * 0.6 * Math.min(delta, 50));
    if (this.state.status !== 'playing') return;
    this.state.seconds += Math.min(delta, 50) / 1000;
    if (Math.floor(this.state.seconds) !== this.lastSecond) { this.lastSecond = Math.floor(this.state.seconds); this.publish(); }
    const previousCount = this.balls.active.length;
    this.balls.update(this.arena.height, this.reducedMotion);
    for (const object of [...this.powerups.getChildren()]) {
      const powerup = object as Phaser.Physics.Arcade.Image;
      if (powerup.y > this.arena.height + 34) powerup.destroy();
    }
    if (!this.balls.active.length) {
      this.state = loseLife(this.state);
      this.resetBall();
      if (this.state.status === 'lost') this.balls.clear();
      this.playTone('life');
      this.publish();
      return;
    }
    if (previousCount !== this.balls.active.length) this.publish();
  }

  private publish() { this.options.onState({ ...this.state, seconds: Math.floor(this.state.seconds), ballCount: this.balls.active.length, frenzy: this.balls.multiplier > 1, speeding: this.balls.speeding }); }

  private unlockAudio() {
    if (!this.soundEnabled) return;
    try {
      if (!this.audio) this.audio = new AudioContext();
      if (this.audio.state === 'suspended') void this.audio.resume().catch(() => {});
    } catch { /* Sound is optional. */ }
  }

  private playTone(event: 'brick' | 'paddle' | 'clear' | 'life' | 'obstacle' | 'frenzy') {
    const context = this.audio;
    if (!this.soundEnabled || !context || context.state !== 'running') return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const frequency = event === 'brick' ? 390 + Math.min(this.state.combo, 12) * 42 : event === 'paddle' ? 240 : event === 'clear' ? 880 : event === 'obstacle' ? 180 : event === 'frenzy' ? 660 : 130;
    const duration = event === 'clear' || event === 'frenzy' ? 0.3 : event === 'life' ? 0.2 : 0.065;
    oscillator.type = event === 'obstacle' ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(event === 'life' ? 65 : frequency * 1.15, context.currentTime + duration);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.045, context.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(gain); gain.connect(context.destination);
    oscillator.start(); oscillator.stop(context.currentTime + duration);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
}

export function createGame(parent: HTMLElement, options: Options) {
  const bounds = parent.getBoundingClientRect();
  const layout = arenaLayout(bounds.width, bounds.height);
  return new Phaser.Game({
    type: Phaser.AUTO, parent, width: WIDTH, height: layout.height, backgroundColor: '#20372c',
    banner: false, audio: { noAudio: true },
    input: { activePointers: 2, touch: { capture: true } },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, fps: 120, fixedStep: true } },
    scene: new BreakoutScene(options, parent),
  });
}
