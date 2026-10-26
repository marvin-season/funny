export function performanceProfile(touchDevice: boolean) {
  return touchDevice
    ? { renderFps: 30, trailLength: 0, burstCount: 4, maxParticles: 40, particleLife: 350 }
    : { renderFps: 60, trailLength: 8, burstCount: 8, maxParticles: 100, particleLife: 500 };
}

export function physicsFps(speedMultiplier: number) {
  // At the base speed cap (520), each substep travels at most 8.7 world pixels.
  return 60 * speedMultiplier;
}

type GameLoop = { started: boolean; running: boolean; resetDelta: () => void; wake: () => void };

export function wakeGameLoop(loop: GameLoop) {
  if (!loop.started || loop.running) return;
  // Do not simulate the entire idle period when restarting a sleeping loop.
  loop.resetDelta();
  loop.wake();
}
