import Phaser from 'phaser';
import { BALL_RADIUS, destroyBrick, HEIGHT, initialState, loseLife, makeBricks, nextLevel, PADDLE_WIDTH, PADDLE_Y, paddleVelocity, WIDTH, type GameControls, type GameState } from './model';

type Options = {
  sound: boolean;
  onState: (state: GameState) => void;
  onReady: (controls: GameControls) => void;
};

class BreakoutScene extends Phaser.Scene {
  private state = initialState();
  private ball!: Phaser.Physics.Arcade.Image;
  private paddle!: Phaser.Physics.Arcade.Image;
  private bricks!: Phaser.Physics.Arcade.StaticGroup;
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private trail!: Phaser.GameObjects.Graphics;
  private points: { x: number; y: number }[] = [];
  private keys = new Set<string>();
  private audio: AudioContext | null = null;
  private soundEnabled: boolean;
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private lastSecond = -1;
  private roundLabel!: Phaser.GameObjects.Text;

  constructor(private options: Options) {
    super('breakout');
    this.soundEnabled = options.sound;
  }

  create() {
    this.makeTextures();
    this.physics.world.setBounds(10, 10, WIDTH - 20, HEIGHT - 10, true, true, true, false);
    const background = this.add.graphics();
    background.fillStyle(0xffffff, 0.05);
    for (let x = 24; x < WIDTH; x += 24) for (let y = 24; y < HEIGHT; y += 24) background.fillCircle(x, y, 0.9);
    background.lineStyle(1, 0xffffff, 0.06).strokeRoundedRect(10, 10, WIDTH - 20, HEIGHT - 20, 16);
    const textStyle = { fontFamily: 'system-ui, sans-serif', fontSize: '11px', color: '#93aa8e' };
    this.roundLabel = this.add.text(35, 39, 'ROUND 01', textStyle);
    this.add.text(WIDTH - 35, 39, 'TAKE A BREAK. BREAK A BRICK.', textStyle).setOrigin(1, 0);
    this.add.ellipse(WIDTH / 2, PADDLE_Y + 22, PADDLE_WIDTH + 15, 8, 0x0a1b17, 0.15);
    this.trail = this.add.graphics();
    this.particles = this.add.particles(0, 0, 'particle', {
      emitting: false, lifespan: 650, speed: { min: 35, max: 150 }, gravityY: 220,
      scale: { start: 1, end: 0 }, alpha: { start: 0.9, end: 0 }, maxParticles: 240,
    });
    this.bricks = this.physics.add.staticGroup();
    this.paddle = this.physics.add.staticImage(WIDTH / 2, PADDLE_Y, 'paddle');
    this.ball = this.physics.add.image(WIDTH / 2, PADDLE_Y - 17, 'ball').setCircle(BALL_RADIUS).setBounce(1).setCollideWorldBounds(true);
    this.physics.add.collider(this.ball, this.bricks, (_ball, object) => this.hitBrick(object as Phaser.Physics.Arcade.Image));
    this.physics.add.collider(this.ball, this.paddle, () => this.hitPaddle(), () => this.state.status === 'playing' && this.ballBody.velocity.y > 0);
    this.setupLevel();

    const canvas = this.game.canvas;
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', '打砖块游戏区。左右方向键或 A、D 移动挡板，空格发射或暂停，也可以用鼠标或手指移动。');
    canvas.style.touchAction = 'none';
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.wasTouch || pointer.isDown) this.movePaddle(pointer.x);
    });
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.movePaddle(pointer.x);
      this.start();
    });

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
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', hidden);
      if (this.audio) { void this.audio.close().catch(() => {}); this.audio = null; }
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    this.events.once(Phaser.Scenes.Events.DESTROY, cleanup);
    this.options.onReady({ start: () => this.start(), pause: () => this.pauseGame(), restart: () => this.restart(), next: () => this.next(),
      setSound: enabled => { this.soundEnabled = enabled; if (enabled) this.unlockAudio(); } });
    this.publish();
  }

  private get ballBody() { return this.ball.body as Phaser.Physics.Arcade.Body; }

  private makeTextures() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffffff).fillRoundedRect(0, 0, 66, 26, 5);
    graphics.generateTexture('brick', 66, 26);
    graphics.clear().fillStyle(0xf7ffe5).fillCircle(BALL_RADIUS, BALL_RADIUS, BALL_RADIUS);
    graphics.generateTexture('ball', BALL_RADIUS * 2, BALL_RADIUS * 2);
    graphics.clear().fillStyle(0xd4ed8a).fillRoundedRect(0, 0, PADDLE_WIDTH, 14, 7);
    graphics.fillStyle(0x36543c, 0.35).fillRoundedRect(PADDLE_WIDTH / 2 - 14, 5, 28, 3, 2);
    graphics.generateTexture('paddle', PADDLE_WIDTH, 14);
    graphics.clear().fillStyle(0xffffff).fillRect(0, 0, 5, 5);
    graphics.generateTexture('particle', 5, 5);
    graphics.destroy();
  }

  private setupLevel() {
    this.bricks.clear(true, true);
    this.particles.killAll();
    for (const definition of makeBricks(this.state.level)) {
      const brick = this.bricks.create(definition.x, definition.y, 'brick') as Phaser.Physics.Arcade.Image;
      brick.setTint(definition.color).setData({ hp: definition.hp, color: definition.color });
      if (definition.hp > 1) brick.setAlpha(0.65);
    }
    this.roundLabel.setText(`ROUND ${String(this.state.level).padStart(2, '0')}`);
    this.resetBall();
  }

  private resetBall() {
    this.physics.pause();
    this.keys.clear();
    this.paddle.setPosition(WIDTH / 2, PADDLE_Y).refreshBody();
    this.ball.setVisible(true);
    this.ballBody.reset(WIDTH / 2, PADDLE_Y - 17);
    this.points = [];
    this.trail.clear();
  }

  private movePaddle(x: number) {
    if (!['playing', 'ready'].includes(this.state.status)) return;
    const position = Phaser.Math.Clamp(x, PADDLE_WIDTH / 2 + 12, WIDTH - PADDLE_WIDTH / 2 - 12);
    this.paddle.setX(position).refreshBody();
    if (this.state.status === 'ready') this.ballBody.reset(position, PADDLE_Y - 17);
  }

  private start() {
    if (!['ready', 'paused'].includes(this.state.status)) return;
    this.unlockAudio();
    if (this.state.status === 'ready') {
      const speed = 350 + (this.state.level - 1) * 25;
      this.ball.setVelocity(speed * 0.32, -speed * Math.sqrt(1 - 0.32 ** 2));
    }
    this.state.status = 'playing';
    this.physics.resume();
    this.game.canvas.focus({ preventScroll: true });
    this.publish();
  }

  private pauseGame() {
    this.keys.clear();
    if (this.state.status !== 'playing') return;
    this.state.status = 'paused';
    this.physics.pause();
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
    } else {
      brick.setAlpha(1);
      this.tweens.add({ targets: brick, alpha: 0.4, duration: 65, yoyo: true });
    }
    this.playTone('brick');
    if (['level-complete', 'won'].includes(this.state.status)) {
      this.physics.pause(); this.ball.setVisible(false); this.points = []; this.trail.clear(); this.playTone('clear');
    }
    this.publish();
  }

  private hitPaddle() {
    const offset = (this.ball.x - this.paddle.x) / (PADDLE_WIDTH / 2);
    const velocity = paddleVelocity(offset, this.ballBody.speed + 3);
    this.ball.setVelocity(velocity.x, velocity.y);
    this.state.combo = 0;
    this.playTone('paddle');
    this.publish();
  }

  update(_time: number, delta: number) {
    if (!this.ball) return;
    const direction = (this.keys.has('ArrowRight') || this.keys.has('d') ? 1 : 0) - (this.keys.has('ArrowLeft') || this.keys.has('a') ? 1 : 0);
    if (direction) this.movePaddle(this.paddle.x + direction * 0.6 * Math.min(delta, 50));
    if (this.state.status !== 'playing') return;
    this.state.seconds += Math.min(delta, 50) / 1000;
    if (Math.floor(this.state.seconds) !== this.lastSecond) { this.lastSecond = Math.floor(this.state.seconds); this.publish(); }
    if (this.ball.y > HEIGHT + BALL_RADIUS) {
      this.state = loseLife(this.state);
      this.resetBall();
      if (this.state.status === 'lost') this.ball.setVisible(false);
      this.playTone('life');
      this.publish();
      return;
    }
    // Keep rallies playable when Arcade Physics produces a near-horizontal bounce.
    const velocity = this.ballBody.velocity;
    const speed = velocity.length();
    if (Math.abs(velocity.y) < speed * 0.22) {
      const y = (velocity.y < 0 ? -1 : 1) * speed * 0.22;
      this.ball.setVelocity(Math.sign(velocity.x || 1) * Math.sqrt(speed ** 2 - y ** 2), y);
    }
    if (!this.reducedMotion) {
      this.points.unshift({ x: this.ball.x, y: this.ball.y });
      this.points.length = Math.min(12, this.points.length);
      this.trail.clear();
      this.points.forEach((point, index) => this.trail.fillStyle(0xe1f3ac, (1 - index / 12) * 0.2).fillCircle(point.x, point.y, BALL_RADIUS * (1 - index / 14)));
    }
  }

  private publish() { this.options.onState({ ...this.state, seconds: Math.floor(this.state.seconds) }); }

  private unlockAudio() {
    if (!this.soundEnabled) return;
    try {
      if (!this.audio) this.audio = new AudioContext();
      if (this.audio.state === 'suspended') void this.audio.resume().catch(() => {});
    } catch { /* Sound is optional. */ }
  }

  private playTone(event: 'brick' | 'paddle' | 'clear' | 'life') {
    const context = this.audio;
    if (!this.soundEnabled || !context || context.state !== 'running') return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const frequency = event === 'brick' ? 390 + Math.min(this.state.combo, 12) * 42 : event === 'paddle' ? 240 : event === 'clear' ? 880 : 130;
    const duration = event === 'clear' ? 0.3 : event === 'life' ? 0.2 : 0.065;
    oscillator.type = 'sine';
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
  return new Phaser.Game({
    type: Phaser.AUTO, parent, width: WIDTH, height: HEIGHT, backgroundColor: '#20372c',
    banner: false, audio: { noAudio: true },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, fps: 120, fixedStep: true } },
    scene: new BreakoutScene(options),
  });
}
