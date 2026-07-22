import * as THREE from "three";
import { CAKE_TOP_SURFACE_Y, CAKE_TOP_LAYER_RADIUS } from "./cakeDimensions";

const SWIRL_BASE_RADIUS_RATIO = 0.42 / CAKE_TOP_LAYER_RADIUS;
const SWIRL_HEIGHT_RATIO = 1.05 / CAKE_TOP_LAYER_RADIUS;

const SWIRL_BASE_RADIUS = CAKE_TOP_LAYER_RADIUS * SWIRL_BASE_RADIUS_RATIO;

// Exported so downstream decorations (cherry, berries, leaves) can attach
// to the swirl's actual tip height instead of guessing a world-space
// offset. Any change to the ratio above automatically propagates here.
// UNCHANGED by this pass — attachment height must not move.
export const CENTER_SWIRL_HEIGHT = CAKE_TOP_LAYER_RADIUS * SWIRL_HEIGHT_RATIO;
const SWIRL_TOTAL_HEIGHT = CENTER_SWIRL_HEIGHT;

const SWIRL_RIDGE_COUNT = 5;
const SWIRL_RIDGE_DEPTH = 0.045;
const SWIRL_LATHE_SEGMENTS = 48;
const SWIRL_PROFILE_POINTS = 64;
const SWIRL_TAPER_POWER = 1.6;
const MIN_PROFILE_RADIUS = 0.0001;

// ---------------------------------------------------------------------
// LOOK DEV: volume distribution (gravity-formed feel).
// Additive Gaussian bumps layered on top of the existing taper curve,
// rather than replacing it, so SWIRL_BASE_RADIUS / SWIRL_TOTAL_HEIGHT /
// CENTER_SWIRL_HEIGHT stay mathematically identical to before — only
// the radial profile between base and tip changes shape.
// ---------------------------------------------------------------------

// Fuller middle: a Gaussian bulge centered in the lower-middle of the
// swirl, as if the piped cream settled and spread slightly under its
// own weight before the upper taper begins.
const MID_BULGE_AMOUNT_RATIO = 0.18; // peak bulge, as a fraction of the taper radius at that height
const MID_BULGE_CENTER_T = 0.32; // where along the height (0=base,1=tip) the bulge peaks
const MID_BULGE_WIDTH_T = 0.16; // how spread out the bulge is

// Compressed/flared base: a small Gaussian bump concentrated right at
// t=0, decaying quickly, so the very base reads as slightly flattened
// and spread rather than starting the taper at a hard maximum radius.
const BASE_COMPRESSION_AMOUNT_RATIO = 0.12; // additive, as a fraction of SWIRL_BASE_RADIUS
const BASE_COMPRESSION_WIDTH_T = 0.08;

/**
 * Base radial envelope before ridges: taper curve with the mid-bulge
 * applied multiplicatively (scales with the taper's own radius at that
 * height) and the base flare applied additively (a fixed-width bump
 * independent of the taper value, since it represents a physical
 * squashing effect right at the base rather than a proportional one).
 */
function computeVolumeEnvelope(t) {
  const taper = Math.pow(1 - t, SWIRL_TAPER_POWER);
  const midBulge = Math.exp(
    -((t - MID_BULGE_CENTER_T) ** 2) / (2 * MID_BULGE_WIDTH_T ** 2)
  );
  const baseFlare = Math.exp(-(t * t) / (2 * BASE_COMPRESSION_WIDTH_T ** 2));

  return taper * (1 + MID_BULGE_AMOUNT_RATIO * midBulge) + BASE_COMPRESSION_AMOUNT_RATIO * baseFlare;
}

// ---------------------------------------------------------------------
// LOOK DEV: piping ridge realism.
// A single cosine produces perfectly symmetric peaks and valleys, which
// reads as mathematical rather than piped. Real piping-nozzle grooves
// are asymmetric — a steeper leading edge and a softer trailing edge —
// which is approximated here with a weighted second harmonic at a fixed
// phase offset (a standard deterministic technique for skewing a
// waveform, not randomness).
// ---------------------------------------------------------------------
const RIDGE_HARMONIC2_WEIGHT = 0.35; // strength of the second harmonic relative to the fundamental
const RIDGE_HARMONIC_PHASE = Math.PI / 6; // phase offset that skews peak/valley symmetry

// Ridge strength envelope: full strength through the lower/middle
// section, then eased smoothly to zero approaching the tip, rather than
// the previous straight-line (1 - t) fade. Keeps the point of the swirl
// perfectly smooth while letting ridges stay pronounced longer through
// the body, matching how a real nozzle's texture is strongest where the
// most cream passed through and fades where the stroke was lifted away.
const RIDGE_FADE_START_T = 0.55;

function computeRidgeEnvelope(t) {
  if (t < RIDGE_FADE_START_T) return 1;
  const fadeProgress = (t - RIDGE_FADE_START_T) / (1 - RIDGE_FADE_START_T);
  return Math.cos(fadeProgress * (Math.PI / 2));
}

function buildSwirlProfilePoints() {
  const points = [];
  points.push(new THREE.Vector2(0, 0));

  for (let i = 0; i <= SWIRL_PROFILE_POINTS; i++) {
    const t = i / SWIRL_PROFILE_POINTS;
    const y = t * SWIRL_TOTAL_HEIGHT;

    const volumeEnvelope = computeVolumeEnvelope(t);
    const taperEnvelope = SWIRL_BASE_RADIUS * volumeEnvelope;

    const ridgeEnvelope = computeRidgeEnvelope(t);
    const ridgeAngle = t * Math.PI * 2 * SWIRL_RIDGE_COUNT;
    const ridgeWave =
      (Math.cos(ridgeAngle) +
        RIDGE_HARMONIC2_WEIGHT * Math.cos(2 * ridgeAngle + RIDGE_HARMONIC_PHASE)) *
      SWIRL_RIDGE_DEPTH *
      ridgeEnvelope;

    const radius = Math.max(taperEnvelope + ridgeWave, MIN_PROFILE_RADIUS);
    points.push(new THREE.Vector2(radius, y));
  }

  points[points.length - 1].x = 0;
  return points;
}

const swirlProfilePoints = buildSwirlProfilePoints();

const centerCreamSwirlGeometry = new THREE.LatheGeometry(
  swirlProfilePoints,
  SWIRL_LATHE_SEGMENTS
);
centerCreamSwirlGeometry.computeVertexNormals();

// LOOK DEV: roughness raised and envMapIntensity lowered together.
// Roughness alone controls specular highlight spread, but the "plastic"
// read also came from sharp environment reflections (the scene's
// studio <Environment> map applies to every MeshStandardMaterial).
// Dialing down envMapIntensity reduces reflection sharpness/strength
// without touching color or introducing a second material type.
const centerCreamSwirlMaterial = new THREE.MeshStandardMaterial({
  color: "#e7390e",
  roughness: 0.55,
  metalness: 0,
  envMapIntensity: 0.5,
});

export default function CenterCreamSwirl() {
  return (
    <mesh
      geometry={centerCreamSwirlGeometry}
      material={centerCreamSwirlMaterial}
      position={[0, CAKE_TOP_SURFACE_Y, 0]}
      castShadow
      receiveShadow
    />
  );
}