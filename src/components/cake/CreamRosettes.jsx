import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import {
  CAKE_TOP_SURFACE_Y,
  CAKE_TOP_LAYER_RADIUS,
} from "./cakeDimensions";

// ---------------------------------------------------------------------------
// Layout — how many rosettes, and where the ring of them sits.
// Both are derived from CAKE_TOP_LAYER_RADIUS so the decoration always tracks
// the cake's actual size instead of assuming a fixed world-space radius.
// ---------------------------------------------------------------------------
const ROSETTE_COUNT = 10; // even count → the ring is symmetric across any diameter, not just some
const ROSETTE_ANGULAR_STEP = (Math.PI * 2) / ROSETTE_COUNT; // equal spacing, no randomness

// Kept inboard of the top layer's true edge so a rosette's own radius never
// pushes past CAKE_TOP_LAYER_RADIUS — i.e. never overhangs into thin air.
const ROSETTE_PLACEMENT_RADIUS_RATIO = 0.82;
const ROSETTE_PLACEMENT_RADIUS = CAKE_TOP_LAYER_RADIUS * ROSETTE_PLACEMENT_RADIUS_RATIO;

// ---------------------------------------------------------------------------
// Rosette profile — the shape piped by a star tip: a flat base that flares
// slightly, a body that ripples inward as it rises (the "swirl"), tapering
// to a point. Sizes are ratios of CAKE_TOP_LAYER_RADIUS so the decoration
// scales with the cake rather than assuming an absolute world size.
//
// Note on "spiral" and "star petals": THREE.LatheGeometry revolves a 2D
// profile uniformly around Y, so it is, by construction, rotationally
// symmetric — radius can only vary with height, never with angle. That
// means neither a true helical spiral nor a true star-shaped (petaled)
// cross-section can come from the lathe profile alone, at any height every
// angular slice has the same radius. What LOOK DEV below adds is a
// post-lathe vertex pass (buildStarLobedGeometry) that displaces the
// generated vertices radially as a function of angle-around-Y, which is
// how the star-nozzle petal silhouette (requirement 1) is actually
// achieved without replacing LatheGeometry — the lathe still builds the
// base revolve; the lobing is sculpted onto its output afterward, the same
// pattern already used for CenterCherry's dimple.
// ---------------------------------------------------------------------------
const ROSETTE_BASE_RADIUS_RATIO = 0.12;
const ROSETTE_BASE_RADIUS = CAKE_TOP_LAYER_RADIUS * ROSETTE_BASE_RADIUS_RATIO;

const ROSETTE_HEIGHT_RATIO = 0.16;
const ROSETTE_HEIGHT = CAKE_TOP_LAYER_RADIUS * ROSETTE_HEIGHT_RATIO;

const ROSETTE_RIDGE_COUNT = 3; // visible vertical swirl ridges from base to tip
const ROSETTE_RIDGE_AMPLITUDE_RATIO = 0.18; // subtle ripple — enough to read as piped, not corrugated

const ROSETTE_LATHE_PROFILE_SEGMENTS = 24; // profile sample density along the rosette's height
const ROSETTE_LATHE_RADIAL_SEGMENTS = 32; // smoothness of the revolution around Y

// ---------------------------------------------------------------------------
// LOOK DEV: volume distribution (gravity/piping-formed feel).
// Additive Gaussian bumps layered on the existing linear taper, rather than
// replacing it, so ROSETTE_HEIGHT and the placement radius stay untouched —
// only the radius-vs-height shape changes.
// ---------------------------------------------------------------------------
const BASE_FLARE_AMOUNT_RATIO = 0.15; // wider contact area right at the base
const BASE_FLARE_WIDTH_T = 0.09;

const MID_BULGE_AMOUNT_RATIO = 0.16; // fuller volume through the body
const MID_BULGE_CENTER_T = 0.34;
const MID_BULGE_WIDTH_T = 0.15;

function computeVolumeEnvelope(t) {
  const taper = 1 - t;
  const baseFlare = Math.exp(-(t * t) / (2 * BASE_FLARE_WIDTH_T ** 2));
  const midBulge = Math.exp(
    -((t - MID_BULGE_CENTER_T) ** 2) / (2 * MID_BULGE_WIDTH_T ** 2)
  );
  return taper * (1 + MID_BULGE_AMOUNT_RATIO * midBulge) + BASE_FLARE_AMOUNT_RATIO * baseFlare;
}

// ---------------------------------------------------------------------------
// LOOK DEV: star nozzle petal lobing (post-lathe vertex pass).
// Radius is scaled by (1 + amplitude * cos(lobeCount * theta)) where theta
// is each vertex's angle around Y. Lobe count of 8 approximates a typical
// open-star piping tip; amplitude is kept modest so edges stay soft rather
// than sharply crenellated. At the tip, radius is already ~0, so the
// multiplicative lobing leaves the point sharp regardless of angle.
// ---------------------------------------------------------------------------
const STAR_LOBE_COUNT = 8;
const STAR_LOBE_AMPLITUDE = 0.14;

/**
 * Samples the rosette's 2D (radius, height) profile once. Not called per
 * frame or per instance — every rosette instance reuses the single geometry
 * this produces.
 */
function buildRosetteProfilePoints() {
  const points = [];

  // Closes the bottom to a single point at the icing surface, so the base
  // reads as flush and flat rather than an open ring.
  points.push(new THREE.Vector2(0, 0));

  for (let i = 0; i <= ROSETTE_LATHE_PROFILE_SEGMENTS; i += 1) {
    const t = i / ROSETTE_LATHE_PROFILE_SEGMENTS; // 0 at the base, 1 at the tip
    const volumeEnvelope = computeVolumeEnvelope(t);
    const ridge =
      1 + ROSETTE_RIDGE_AMPLITUDE_RATIO * Math.cos(ROSETTE_RIDGE_COUNT * Math.PI * 2 * t);
    const radius = ROSETTE_BASE_RADIUS * volumeEnvelope * ridge;

    // Eased rise (slow start, faster finish) rather than a linear ramp —
    // this is what makes the base look gradually rounded instead of conical.
    const y = ROSETTE_HEIGHT * Math.sin(t * (Math.PI / 2));

    points.push(new THREE.Vector2(radius, y));
  }

  return points;
}

/**
 * Applies the star-nozzle angular lobing to an already-built lathe geometry.
 * Runs once at module init, mutating the shared BufferGeometry's position
 * attribute in place — every InstancedMesh instance reuses this single,
 * already-lobed geometry, so the cost is paid exactly once, never per
 * instance and never per frame.
 */
function applyStarLobing(geometry) {
  const position = geometry.attributes.position;
  const vertex = new THREE.Vector3();

  for (let i = 0; i < position.count; i += 1) {
    vertex.fromBufferAttribute(position, i);

    const theta = Math.atan2(vertex.z, vertex.x);
    const lobeFactor = 1 + STAR_LOBE_AMPLITUDE * Math.cos(STAR_LOBE_COUNT * theta);

    vertex.x *= lobeFactor;
    vertex.z *= lobeFactor;

    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  geometry.computeVertexNormals();
}

// ---------------------------------------------------------------------------
// Shared geometry + material — built exactly once at module scope and reused
// by every instance. No per-instance geometry or material is ever created.
// ---------------------------------------------------------------------------
const rosetteGeometry = new THREE.LatheGeometry(
  buildRosetteProfilePoints(),
  ROSETTE_LATHE_RADIAL_SEGMENTS
);
applyStarLobing(rosetteGeometry);

// LOOK DEV: roughness raised and envMapIntensity lowered together, same
// rationale as CenterCreamSwirl — the "plastic" read comes from both
// specular width and reflection sharpness picked up from the scene's
// studio Environment map, so both levers matter, not roughness alone.
const rosetteMaterial = new THREE.MeshStandardMaterial({
  color: "#12ac0d", // matches the cream filling's warm-white tone
  roughness: 0.58,
  metalness: 0,
  envMapIntensity: 0.5,
});

// Single reusable transform helper — mutated and re-read for every instance
// inside the layout effect below, never recreated.
const dummy = new THREE.Object3D();

// ---------------------------------------------------------------------------
// LOOK DEV: controlled handcrafted variation.
// Deterministic, index-driven offsets to heading, scale, and height — fixed
// formulas using non-repeating multipliers, not Math.random(), computed
// once per instance inside the existing mount-time loop (no per-frame cost).
// Amplitudes are deliberately small: enough that no two rosettes are
// pixel-identical, not enough to read as randomly generated objects.
// ---------------------------------------------------------------------------
const HEADING_VARIATION_AMPLITUDE = 0.05; // radians
const SCALE_VARIATION_RATIO = 0.04;
const HEIGHT_VARIATION_RATIO = 0.035;

export default function CreamRosettes() {
  const instancedMeshRef = useRef(null);

  useLayoutEffect(() => {
    const instancedMesh = instancedMeshRef.current;
    if (!instancedMesh) return;

    for (let i = 0; i < ROSETTE_COUNT; i += 1) {
      const angle = i * ROSETTE_ANGULAR_STEP;

      dummy.position.set(
        ROSETTE_PLACEMENT_RADIUS * Math.cos(angle),
        CAKE_TOP_SURFACE_Y, // sits exactly on the icing — no gap, no floating
        ROSETTE_PLACEMENT_RADIUS * Math.sin(angle)
      );

      // Tiny deterministic heading offset per rosette — reads as each one
      // having been piped by hand at a slightly different wrist angle,
      // rather than all ten being mechanically identical copies.
      const headingOffset = Math.sin(i * 2.399963) * HEADING_VARIATION_AMPLITUDE;
      dummy.rotation.set(0, headingOffset, 0);

      // Tiny deterministic scale/height variation — same rationale.
      const scaleFactor = 1 + Math.cos(i * 1.618034) * SCALE_VARIATION_RATIO;
      const heightFactor = 1 + Math.sin(i * 0.918273) * HEIGHT_VARIATION_RATIO;
      dummy.scale.set(scaleFactor, scaleFactor * heightFactor, scaleFactor);

      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[rosetteGeometry, rosetteMaterial, ROSETTE_COUNT]}
      castShadow
      receiveShadow
    />
  );
}