import {
  CAKE_BASE_Y,
  CAKE_STAND_RADIUS,
  CAKE_TOP_SURFACE_Y,
} from "../components/cake/cakeDimensions";

// ---------------------------------------------------------------------------
// LAUNCH GEOMETRY
//
// Positions are derived from the cake's own dimensions rather than fixed
// world-space numbers, the same principle cakeDimensions.js already
// establishes for the cake itself — if the cake's proportions ever change,
// launch pads stay correctly placed relative to it without hand-tuning.
//
// Z is negative (behind the cake, away from the camera) — CakeScene's
// camera sits at positive-ish Z per its azimuth/elevation solve, so
// negative Z reliably reads as "behind" regardless of orbit angle within
// the allowed control range.
// ---------------------------------------------------------------------------
const LAUNCH_Z_MARGIN_RATIO = 1.7; // multiple of CAKE_STAND_RADIUS — clears the stand's silhouette at every camera angle in POLAR_ANGLE range
const LAUNCH_X_SPREAD_RATIO = 2.4; // multiple of CAKE_STAND_RADIUS — how wide the launch row is

export const FIREWORK_LAUNCH_Z = -(CAKE_STAND_RADIUS * LAUNCH_Z_MARGIN_RATIO);
export const FIREWORK_LAUNCH_Y_BASE = CAKE_BASE_Y; // rockets start at table/ground height

// Five launch pads across X, evenly spaced, center pad omitted so the
// cake's own centerline stays visually uncluttered directly behind it.
export const FIREWORK_LAUNCH_POSITIONS = [
  -1.0, -0.55, 0.15, 0.55, 1.0,
].map((xRatio) => ({
  x: xRatio * CAKE_STAND_RADIUS * LAUNCH_X_SPREAD_RATIO,
  y: FIREWORK_LAUNCH_Y_BASE,
  z: FIREWORK_LAUNCH_Z,
}));

// Explosion apex height range, expressed relative to the cake's own top
// surface so bursts read as "above and behind" the cake regardless of the
// cake's absolute scale.
export const FIREWORK_APEX_HEIGHT_MIN = CAKE_TOP_SURFACE_Y * 1.6;
export const FIREWORK_APEX_HEIGHT_MAX = CAKE_TOP_SURFACE_Y * 2.6;

// ---------------------------------------------------------------------------
// COLOR PALETTE
//
// Deliberately restrained — deep gold, warm white, champagne, soft rose,
// ember amber — rather than cartoon primary reds/greens/blues. This is the
// single biggest lever for "elegant" vs. "kids' party" per the brief.
// ---------------------------------------------------------------------------
export const FIREWORK_COLOR_PALETTE = [
  "#f5d67a", // warm gold
  "#fff6e5", // warm white
  "#e8b4a0", // champagne blush
  "#d98c6b", // soft ember
  "#c98fa8", // muted rose
];

export const SMOKE_COLOR = "#dcd6cc"; // warm-grey, not pure black/white

// ---------------------------------------------------------------------------
// PHYSICS
// ---------------------------------------------------------------------------
export const GRAVITY = 2.4; // world units / s^2 applied to spark velocity.y
export const SPARK_DRAG = 0.985; // multiplicative per-frame velocity damping — >1 frame-rate independent handling lives in the integrator, not here
export const WIND_STRENGTH_MIN = -0.4; // world units / s, applied to velocity.x each frame
export const WIND_STRENGTH_MAX = 0.4;

// ---------------------------------------------------------------------------
// TIMING
// All durations in seconds unless noted.
// ---------------------------------------------------------------------------
export const LAUNCH_INTERVAL_MIN = 1.4; // gap between one launch starting and the next becoming eligible
export const LAUNCH_INTERVAL_MAX = 3.2;
export const TRAIL_ASCENT_DURATION = 1.1; // ground -> apex
export const SPARK_LIFETIME_MIN = 1.4;
export const SPARK_LIFETIME_MAX = 2.2;
export const SMOKE_LIFETIME = 3.5;
export const SMOKE_SPAWN_DELAY = 0.15; // seconds after explosion before smoke starts rising, so it reads as caused by the burst

// ---------------------------------------------------------------------------
// PARTICLE-COUNT TIERS
//
// Same breakpoint keys used throughout the app (CakeScene's
// ORBIT_ROTATE_SPEED, SceneCanvas's DPR_RANGE_BY_BREAKPOINT) so this config
// composes with the existing tiering system instead of inventing a new one.
// ---------------------------------------------------------------------------
export const SPARKS_PER_EXPLOSION_BY_BREAKPOINT = {
  mobile: 28,
  tablet: 40,
  laptop: 52,
  desktop: 64,
};

export const SMOKE_PUFFS_PER_EXPLOSION_BY_BREAKPOINT = {
  mobile: 3,
  tablet: 4,
  laptop: 5,
  desktop: 6,
};

export const MAX_CONCURRENT_LAUNCHES_BY_BREAKPOINT = {
  mobile: 1,
  tablet: 2,
  laptop: 2,
  desktop: 3,
};

// Total instanced-mesh capacity per particle type. Must be >=
// (max concurrent launches) * (particles per explosion) * (a small buffer
// for overlap during fade-out), sized once at pool-creation time — see
// ParticlePool.js (Phase 4). Sized generously for desktop; mobile pools
// stay far smaller since MAX_CONCURRENT_LAUNCHES + SPARKS_PER_EXPLOSION are
// both lower there.
export const SPARK_POOL_CAPACITY_BY_BREAKPOINT = {
  mobile: 96,
  tablet: 200,
  laptop: 280,
  desktop: 400,
};

export const SMOKE_POOL_CAPACITY_BY_BREAKPOINT = {
  mobile: 12,
  tablet: 24,
  laptop: 32,
  desktop: 48,
};

// ---------------------------------------------------------------------------
// VISUAL TUNING
// ---------------------------------------------------------------------------
export const SPARK_SIZE = 0.035; // world-unit radius at full brightness, before fade-driven scale-down
export const TRAIL_TUBE_RADIUS = 0.02;
export const SMOKE_PUFF_SIZE = 0.18;
export const SMOKE_RISE_SPEED = 0.15; // world units / s, straight up

export const BLOOM_INTENSITY_BY_BREAKPOINT = {
  mobile: 0.6, // lighter bloom on mobile — cheaper pass, less GPU fill cost
  tablet: 0.8,
  laptop: 1.0,
  desktop: 1.1,
};
export const BLOOM_LUMINANCE_THRESHOLD = 0.25;
export const BLOOM_LUMINANCE_SMOOTHING = 0.9;

// ---------------------------------------------------------------------------
// DETERMINISTIC VARIATION
//
// Fixed seed for the launcher's pseudo-random sequence (Phase 5), so a
// reload produces a different-feeling-but-reproducible show rather than
// true Math.random() — same reasoning as CreamRosettes' and Strawberries'
// deterministic per-instance variation elsewhere in this codebase.
// ---------------------------------------------------------------------------
export const FIREWORK_SEQUENCE_SEED = 20260721; // arbitrary fixed constant, not derived from Date.now()