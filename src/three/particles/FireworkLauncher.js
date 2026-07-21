import { Color } from "three";
import ParticlePool from "./ParticlePool";
import {
  FIREWORK_LAUNCH_POSITIONS,
  FIREWORK_APEX_HEIGHT_MIN,
  FIREWORK_APEX_HEIGHT_MAX,
  FIREWORK_COLOR_PALETTE,
  GRAVITY,
  SPARK_DRAG,
  WIND_STRENGTH_MIN,
  WIND_STRENGTH_MAX,
  LAUNCH_INTERVAL_MIN,
  LAUNCH_INTERVAL_MAX,
  TRAIL_ASCENT_DURATION,
  SPARK_LIFETIME_MIN,
  SPARK_LIFETIME_MAX,
  SMOKE_LIFETIME,
  SMOKE_SPAWN_DELAY,
  SMOKE_RISE_SPEED,
  SPARKS_PER_EXPLOSION_BY_BREAKPOINT,
  SMOKE_PUFFS_PER_EXPLOSION_BY_BREAKPOINT,
  MAX_CONCURRENT_LAUNCHES_BY_BREAKPOINT,
  SPARK_POOL_CAPACITY_BY_BREAKPOINT,
  SMOKE_POOL_CAPACITY_BY_BREAKPOINT,
  FIREWORK_SEQUENCE_SEED,
} from "../../config/fireworksConfig";

// ---------------------------------------------------------------------------
// Deterministic PRNG (mulberry32) — same "deterministic, not Math.random()"
// convention the cake decorations already follow (CreamRosettes,
// Strawberries), so a fresh show is reproducible from a fixed seed rather
// than truly random. Re-seeded on every stop() (see below), so re-entering
// the viewport always replays the same sequence rather than drifting.
// ---------------------------------------------------------------------------
function createSeededRandom(seed) {
  let state = seed >>> 0;
  return function mulberry32() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randRange(rng, min, max) {
  return min + rng() * (max - min);
}

function randInt(rng, exclusiveMax) {
  return Math.floor(rng() * exclusiveMax);
}

// Ease-out cubic — the "smooth easing" on trail ascent from the brief:
// fast off the pad, settling gently into the apex rather than arriving
// at constant speed.
function easeOutCubic(t) {
  const f = t - 1;
  return f * f * f + 1;
}

// Reused across every hex->RGB conversion (launch events only, not
// per-frame) instead of constructing a new THREE.Color per call.
const SCRATCH_COLOR = new Color();
function hexToRgbArray(hex) {
  SCRATCH_COLOR.set(hex);
  return [SCRATCH_COLOR.r, SCRATCH_COLOR.g, SCRATCH_COLOR.b];
}

/**
 * Owns the entire firework lifecycle as plain, framework-agnostic state:
 * scheduling launches, advancing trails, triggering explosions, integrating
 * spark/smoke physics, and returning particles to their pools. Nothing in
 * this class touches React or Three.js scene objects — FireworkSystem.jsx
 * (Phase 6) reads this instance's three pools (trailPool/sparkPool/
 * smokePool) inside its own useFrame and writes InstancedMesh
 * matrices/attributes from them. That split is what keeps physics
 * integration allocation-free and independent of React's render cycle.
 *
 * One instance is meant to be created per active viewport-entry (see
 * useFireworkSequence, Phase 9) and discarded on exit — its pool capacities
 * are fixed at construction time from the breakpoint tier, so a
 * mobile<->desktop breakpoint change mid-session should be handled by the
 * consuming hook creating a fresh instance, not by resizing this one.
 */
export default class FireworkLauncher {
  constructor(breakpoint) {
    this._maxConcurrentLaunches = MAX_CONCURRENT_LAUNCHES_BY_BREAKPOINT[breakpoint];
    this._sparksPerExplosion = SPARKS_PER_EXPLOSION_BY_BREAKPOINT[breakpoint];
    this._smokePerExplosion = SMOKE_PUFFS_PER_EXPLOSION_BY_BREAKPOINT[breakpoint];

    this.trailPool = new ParticlePool(this._maxConcurrentLaunches, {
      origin: 3, // launch pad position — fixed for the trail's lifetime
      apex: 3, // precomputed target (includes wind drift) — fixed for the trail's lifetime
      progress: 1, // 0 -> 1 over TRAIL_ASCENT_DURATION
      color: 3,
    });

    const sparkCapacity = SPARK_POOL_CAPACITY_BY_BREAKPOINT[breakpoint];
    this.sparkPool = new ParticlePool(sparkCapacity, {
      position: 3,
      velocity: 3,
      color: 3,
      life: 1,
      maxLife: 1,
    });

    const smokeCapacity = SMOKE_POOL_CAPACITY_BY_BREAKPOINT[breakpoint];
    this.smokePool = new ParticlePool(smokeCapacity, {
      position: 3,
      life: 1,
      maxLife: 1,
      delay: 1, // counts down before the puff starts rising, so smoke visibly follows the burst rather than appearing simultaneously with it
    });

    // Pre-allocated scratch buffers for this-frame's "particles to release"
    // — reused every call instead of a fresh array per frame, since a
    // frame's release list can never exceed that pool's own capacity.
    this._trailReleaseScratch = new Int32Array(this._maxConcurrentLaunches);
    this._sparkReleaseScratch = new Int32Array(sparkCapacity);
    this._smokeReleaseScratch = new Int32Array(smokeCapacity);

    this._rng = createSeededRandom(FIREWORK_SEQUENCE_SEED);
    this._active = false;
    this._timeUntilNextLaunch = 0;
  }

  get isActive() {
    return this._active;
  }

  /** Begins scheduling launches. Safe to call repeatedly — no-ops if
   * already active. */
  start() {
    if (this._active) return;
    this._active = true;
    // Small initial stagger (rather than launching instantly on entry) so
    // the first burst doesn't feel like it was "waiting" for the viewport
    // trigger — reads as already-in-progress ambience instead.
    this._timeUntilNextLaunch = randRange(this._rng, 0, LAUNCH_INTERVAL_MIN);
  }

  /**
   * Hard stop: halts new launches AND immediately releases every in-flight
   * particle (trail, spark, smoke) back to their pools. This matches the
   * product requirement literally — on leaving the section, stop
   * launching, dispose all particles, reset timers, no memory leaks —
   * rather than letting an in-progress burst finish naturally, so nothing
   * lingers once the section scrolls off-screen.
   *
   * Note: this only clears CPU-side particle records. GPU-side disposal
   * (InstancedMesh geometry/material/buffers) is FireworkSystem.jsx's
   * responsibility, since it's the one that owns those resources.
   */
  stop() {
    this._active = false;
    this.trailPool.releaseAll();
    this.sparkPool.releaseAll();
    this.smokePool.releaseAll();
    // Re-seeding (not just zeroing the timer) means the NEXT start() call
    // replays the same deterministic sequence from the beginning, rather
    // than continuing from wherever the RNG happened to be — consistent,
    // reproducible behavior across every viewport re-entry.
    this._rng = createSeededRandom(FIREWORK_SEQUENCE_SEED);
    this._timeUntilNextLaunch = 0;
  }

  /** Advances the entire simulation by `dt` seconds. Call once per frame
   * from useFrame, regardless of whether isActive is true — trails/sparks/
   * smoke already in flight still need to finish integrating even after
   * stop()'s hard-clear (which is instant) or during the brief window
   * before an explicit stop() call. In practice, since stop() clears
   * everything immediately, this mainly matters while `_active` is true. */
  update(dt) {
    if (this._active) {
      this._updateScheduler(dt);
    }
    this._updateTrails(dt);
    this._updateSparks(dt);
    this._updateSmoke(dt);
  }

  _updateScheduler(dt) {
    this._timeUntilNextLaunch -= dt;
    if (this._timeUntilNextLaunch > 0) return;

    if (this.trailPool.activeCount >= this._maxConcurrentLaunches) {
      // At capacity — retry shortly rather than losing the beat entirely.
      this._timeUntilNextLaunch = 0.1;
      return;
    }

    this._launch();
    this._timeUntilNextLaunch = randRange(
      this._rng,
      LAUNCH_INTERVAL_MIN,
      LAUNCH_INTERVAL_MAX
    );
  }

  _launch() {
    const slot = this.trailPool.acquire();
    if (slot === -1) return; // exhausted — skip this launch, per ParticlePool's documented contract

    const pad =
      FIREWORK_LAUNCH_POSITIONS[randInt(this._rng, FIREWORK_LAUNCH_POSITIONS.length)];
    const apexY = randRange(this._rng, FIREWORK_APEX_HEIGHT_MIN, FIREWORK_APEX_HEIGHT_MAX);
    const drift =
      randRange(this._rng, WIND_STRENGTH_MIN, WIND_STRENGTH_MAX) * TRAIL_ASCENT_DURATION;
    const colorHex =
      FIREWORK_COLOR_PALETTE[randInt(this._rng, FIREWORK_COLOR_PALETTE.length)];

    this.trailPool.set("origin", slot, [pad.x, pad.y, pad.z]);
    this.trailPool.set("apex", slot, [pad.x + drift, apexY, pad.z]);
    this.trailPool.set("progress", slot, [0]);
    this.trailPool.set("color", slot, hexToRgbArray(colorHex));
  }

  _updateTrails(dt) {
    const dtRatio = dt / TRAIL_ASCENT_DURATION;
    const indices = this.trailPool.activeIndices;
    const count = this.trailPool.activeCount;
    let releaseCount = 0;

    for (let i = 0; i < count; i += 1) {
      const index = indices[i];
      const progress = this.trailPool.get("progress", index);
      progress[0] += dtRatio;

      if (progress[0] >= 1) {
        this._explode(index);
        this._trailReleaseScratch[releaseCount] = index;
        releaseCount += 1;
      }
    }

    // Released after the pass completes, not during — release() does an
    // internal swap-remove that could otherwise reorder entries still
    // pending visitation within this same loop.
    for (let i = 0; i < releaseCount; i += 1) {
      this.trailPool.release(this._trailReleaseScratch[i]);
    }
  }

  _explode(trailIndex) {
    const apex = this.trailPool.get("apex", trailIndex);
    const color = this.trailPool.get("color", trailIndex);

    for (let i = 0; i < this._sparksPerExplosion; i += 1) {
      const slot = this.sparkPool.acquire();
      if (slot === -1) break; // pool exhausted — remaining sparks for this burst are simply skipped

      // Uniform-on-sphere direction via the standard two-random-numbers
      // formula, not random-per-axis-then-normalize (which biases toward
      // the cube's corners rather than spreading evenly).
      const u = this._rng() * 2 - 1; // cos(phi), uniform in [-1, 1]
      const theta = this._rng() * Math.PI * 2;
      const sinPhi = Math.sqrt(1 - u * u);
      const dirX = sinPhi * Math.cos(theta);
      const dirY = u;
      const dirZ = sinPhi * Math.sin(theta);

      const speed = randRange(this._rng, 1.4, 2.6);
      const life = randRange(this._rng, SPARK_LIFETIME_MIN, SPARK_LIFETIME_MAX);

      this.sparkPool.set("position", slot, [apex[0], apex[1], apex[2]]);
      this.sparkPool.set("velocity", slot, [dirX * speed, dirY * speed, dirZ * speed]);
      this.sparkPool.set("color", slot, [color[0], color[1], color[2]]);
      this.sparkPool.set("life", slot, [life]);
      this.sparkPool.set("maxLife", slot, [life]);
    }

    for (let i = 0; i < this._smokePerExplosion; i += 1) {
      const slot = this.smokePool.acquire();
      if (slot === -1) break;

      const jitterX = randRange(this._rng, -0.15, 0.15);
      const jitterZ = randRange(this._rng, -0.15, 0.15);
      const delay = SMOKE_SPAWN_DELAY + randRange(this._rng, 0, 0.2);

      this.smokePool.set("position", slot, [apex[0] + jitterX, apex[1], apex[2] + jitterZ]);
      this.smokePool.set("life", slot, [SMOKE_LIFETIME]);
      this.smokePool.set("maxLife", slot, [SMOKE_LIFETIME]);
      this.smokePool.set("delay", slot, [delay]);
    }
  }

  _updateSparks(dt) {
    // SPARK_DRAG is tuned as a per-60fps-frame multiplier; scaling the
    // exponent by dt*60 keeps the same visual decay rate regardless of the
    // device's actual frame rate (60fps mobile vs 120fps desktop).
    const dragFactor = Math.pow(SPARK_DRAG, dt * 60);
    const indices = this.sparkPool.activeIndices;
    const count = this.sparkPool.activeCount;
    let releaseCount = 0;

    for (let i = 0; i < count; i += 1) {
      const index = indices[i];
      const velocity = this.sparkPool.get("velocity", index);
      const position = this.sparkPool.get("position", index);
      const life = this.sparkPool.get("life", index);

      velocity[1] -= GRAVITY * dt;
      velocity[0] *= dragFactor;
      velocity[1] *= dragFactor;
      velocity[2] *= dragFactor;

      position[0] += velocity[0] * dt;
      position[1] += velocity[1] * dt;
      position[2] += velocity[2] * dt;

      life[0] -= dt;
      if (life[0] <= 0) {
        this._sparkReleaseScratch[releaseCount] = index;
        releaseCount += 1;
      }
    }

    for (let i = 0; i < releaseCount; i += 1) {
      this.sparkPool.release(this._sparkReleaseScratch[i]);
    }
  }

  _updateSmoke(dt) {
    const indices = this.smokePool.activeIndices;
    const count = this.smokePool.activeCount;
    let releaseCount = 0;

    for (let i = 0; i < count; i += 1) {
      const index = indices[i];
      const delay = this.smokePool.get("delay", index);

      if (delay[0] > 0) {
        delay[0] -= dt;
        continue; // holds position until its delay elapses
      }

      const position = this.smokePool.get("position", index);
      const life = this.smokePool.get("life", index);

      position[1] += SMOKE_RISE_SPEED * dt;

      life[0] -= dt;
      if (life[0] <= 0) {
        this._smokeReleaseScratch[releaseCount] = index;
        releaseCount += 1;
      }
    }

    for (let i = 0; i < releaseCount; i += 1) {
      this.smokePool.release(this._smokeReleaseScratch[i]);
    }
  }
}

// Exported for FireworkSystem.jsx (Phase 6), which needs the same easing
// curve to interpolate a trail's visual endpoint between origin and apex.
export { easeOutCubic };