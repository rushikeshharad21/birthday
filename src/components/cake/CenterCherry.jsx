import * as THREE from "three";
import React from "react";
import { CAKE_TOP_SURFACE_Y, CAKE_TOP_LAYER_RADIUS } from "./cakeDimensions";
import { CENTER_SWIRL_HEIGHT } from "./CenterCreamSwirl";

// Cherry size still scales with cake footprint, since a cherry on a
// small cake and a cherry on a large cake should not be identical in
// world-space radius. Only the cherry's VERTICAL placement has been
// decoupled from cake radius per architecture requirement #3.
const CHERRY_RADIUS_RATIO = 0.11;
const CHERRY_RADIUS = CAKE_TOP_LAYER_RADIUS * CHERRY_RADIUS_RATIO;

// Sphere is squashed on Y so the cherry reads as a soft fruit rather
// than a perfect geometric ball.
const CHERRY_VERTICAL_SQUASH_RATIO = 0.88;

// The cherry must sit slightly embedded in the swirl's tip rather than
// resting exactly at its apex, or a hairline gap/floating artifact
// appears at the seam under certain lighting angles. This ratio is a
// fraction of the cherry's own radius, not an absolute unit, so the
// embed depth scales with the cherry itself.
const CHERRY_EMBED_OVERLAP_RATIO = 0.18;
const CHERRY_EMBED_DEPTH = CHERRY_RADIUS * CHERRY_EMBED_OVERLAP_RATIO;

const CHERRY_SPHERE_WIDTH_SEGMENTS = 32;
const CHERRY_SPHERE_HEIGHT_SEGMENTS = 32;

// Vertices within this angle (radians) of the top pole are pulled
// inward to form the dimple. Beyond this angle the cherry keeps its
// natural spherical curvature.
const DIMPLE_ANGLE_THRESHOLD = 0.35;

// How deep the dimple pulls in, expressed as a fraction of cherry
// radius rather than a fixed world-space distance, so the dimple
// scales correctly if CHERRY_RADIUS_RATIO ever changes.
const DIMPLE_DEPTH_RATIO = 0.22;

// ---------------------------------------------------------------------
// LOOK DEV: organic imperfection.
// A perfect sphere silhouette reads as synthetic; real fruit has small,
// non-uniform surface asymmetry. This is a deterministic multi-lobe
// sinusoidal perturbation (two different angular frequencies combined),
// NOT Math.random() — it stays reproducible across reloads per the
// project's no-randomness rule, while still breaking perfect rotational
// symmetry. Amplitude is deliberately tiny so the cake-viewing-distance
// silhouette is unaffected; this is a surface-texture cue, not a shape
// change.
// ---------------------------------------------------------------------
const IMPERFECTION_AMPLITUDE_RATIO = 0.015; // ~1.5% of cherry radius
const IMPERFECTION_THETA_FREQUENCY = 3; // lobes around the equator
const IMPERFECTION_PHI_FREQUENCY = 2; // lobes pole-to-pole

// ---------------------------------------------------------------------
// LOOK DEV: subtle per-vertex color variation.
// Real cherry skin is never a flat, uniform hex value — it has faint
// darker/lighter patches from natural pigment variation. This is
// deterministic (position-driven, not random) and baked once into a
// vertex-color attribute at module scope, so it costs nothing at
// runtime and requires no texture.
// ---------------------------------------------------------------------
const CHERRY_BASE_COLOR = new THREE.Color("#8a0f12"); // deeper, less saturated than the previous flat red
const CHERRY_COLOR_VARIATION_RATIO = 0.12; // how far a vertex's color can drift from the base
const CHERRY_COLOR_VARIATION_FREQUENCY = 4;

// Reused for every vertex during dimple/imperfection/color generation
// instead of being reallocated per-vertex — this loop runs once at
// module init, so there's no reason to churn the GC for a constant
// reference direction.
const CHERRY_UP_VECTOR = new THREE.Vector3(0, 1, 0);

const STEM_RADIUS = CHERRY_RADIUS * 0.09;
const STEM_TUBE_SEGMENTS = 24;
const STEM_RADIAL_SEGMENTS = 8;

// Overall stem length, expressed relative to cherry radius so a
// larger cherry gets a proportionally longer stem instead of a
// fixed-length one that would look stubby or oversized depending on
// cake scale.
const STEM_LENGTH = CHERRY_RADIUS * 2.1;

// Bezier control-point ratios (all fractions of STEM_LENGTH). Chosen
// so the stem starts near-vertical at the base (real stems emerge
// straight out of the fruit), holds that direction briefly, then
// bends outward toward the tip — the same profile a real maraschino
// stem has, without relying on periodic sine motion.
const STEM_CONTROL_1_Y_RATIO = 0.35;
const STEM_CONTROL_2_X_RATIO = 0.5;
const STEM_CONTROL_2_Y_RATIO = 0.75;
const STEM_CONTROL_2_Z_RATIO = 0.1;
const STEM_END_X_RATIO = 0.85;
const STEM_END_Y_RATIO = 0.95;
const STEM_END_Z_RATIO = 0.15;

// Where the stem's base mesh sits relative to the cherry's local
// center, chosen to emerge from just inside the dimple rather than
// from the exact geometric top pole.
const STEM_BASE_Y_OFFSET_RATIO = 0.92;
const STEM_BASE_Y_OFFSET =
  CHERRY_RADIUS * CHERRY_VERTICAL_SQUASH_RATIO * STEM_BASE_Y_OFFSET_RATIO;

/**
 * Builds the cherry body: a squashed sphere with an inward-pulled
 * dimple at the top pole, a tiny deterministic surface imperfection,
 * and baked per-vertex color variation. Dimple and imperfection are
 * both displaced along each vertex's own surface normal (rather than
 * only along Y) so they follow the sphere's curvature instead of
 * reading as a flat dent.
 */
function buildCherryGeometry() {
  const geometry = new THREE.SphereGeometry(
    CHERRY_RADIUS,
    CHERRY_SPHERE_WIDTH_SEGMENTS,
    CHERRY_SPHERE_HEIGHT_SEGMENTS
  );

  geometry.scale(1, CHERRY_VERTICAL_SQUASH_RATIO, 1);

  const position = geometry.attributes.position;
  const vertex = new THREE.Vector3();
  const normalized = new THREE.Vector3();
  const colors = new Float32Array(position.count * 3);
  const tempColor = new THREE.Color();

  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i);
    normalized.copy(vertex).normalize();

    const angleFromTop = normalized.angleTo(CHERRY_UP_VECTOR);
    const theta = Math.atan2(normalized.z, normalized.x);
    const phi = Math.acos(THREE.MathUtils.clamp(normalized.y, -1, 1));

    // Dimple: unchanged from prior pass.
    if (angleFromTop < DIMPLE_ANGLE_THRESHOLD) {
      const falloff = 1 - angleFromTop / DIMPLE_ANGLE_THRESHOLD;
      const pull = falloff * falloff * CHERRY_RADIUS * DIMPLE_DEPTH_RATIO;
      vertex.addScaledVector(normalized, -pull);
    }

    // Organic imperfection: tiny multi-lobe sinusoidal surface wobble,
    // deterministic and reproducible — not Math.random().
    const imperfection =
      Math.sin(theta * IMPERFECTION_THETA_FREQUENCY) *
      Math.cos(phi * IMPERFECTION_PHI_FREQUENCY) *
      CHERRY_RADIUS *
      IMPERFECTION_AMPLITUDE_RATIO;
    vertex.addScaledVector(normalized, imperfection);

    position.setXYZ(i, vertex.x, vertex.y, vertex.z);

    // Per-vertex color variation, driven by the same deterministic
    // angular signal so darker/lighter patches read as belonging to
    // the surface rather than as noise.
    const colorDrift =
      Math.sin(theta * CHERRY_COLOR_VARIATION_FREQUENCY + phi) *
      CHERRY_COLOR_VARIATION_RATIO;
    tempColor.copy(CHERRY_BASE_COLOR).offsetHSL(0, 0, colorDrift * 0.1);
    colors[i * 3] = tempColor.r;
    colors[i * 3 + 1] = tempColor.g;
    colors[i * 3 + 2] = tempColor.b;
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Stem curve: a single cubic Bezier from the dimple outward. Standard
 * THREE.CubicBezierCurve3, cheaper to evaluate and easier to reason
 * about than a parametric trig function.
 */
const stemCurve = new THREE.CubicBezierCurve3(
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, STEM_LENGTH * STEM_CONTROL_1_Y_RATIO, 0),
  new THREE.Vector3(
    STEM_LENGTH * STEM_CONTROL_2_X_RATIO,
    STEM_LENGTH * STEM_CONTROL_2_Y_RATIO,
    STEM_LENGTH * STEM_CONTROL_2_Z_RATIO
  ),
  new THREE.Vector3(
    STEM_LENGTH * STEM_END_X_RATIO,
    STEM_LENGTH * STEM_END_Y_RATIO,
    STEM_LENGTH * STEM_END_Z_RATIO
  )
);

const cherryGeometry = buildCherryGeometry();

const stemGeometry = new THREE.TubeGeometry(
  stemCurve,
  STEM_TUBE_SEGMENTS,
  STEM_RADIUS,
  STEM_RADIAL_SEGMENTS,
  false
);

// LOOK DEV: MeshPhysicalMaterial reintroduced specifically for clearcoat.
// This is a deliberate reversal of the earlier "MeshStandardMaterial
// everywhere" decision, scoped to this one mesh, because real cherry
// skin behaves as two optical layers (diffuse fruit body + thin glossy
// wax/moisture film) that a single-layer material cannot reproduce
// simultaneously. clearcoat is kept moderate (0.35) rather than near 1.0
// specifically to avoid the "car paint" look — full-strength clearcoat
// produces a wet, lacquered appearance; a partial layer reads as a
// natural waxy fruit sheen instead. vertexColors is enabled so the
// per-vertex color variation baked into the geometry actually renders.
const cherryMaterial = new THREE.MeshPhysicalMaterial({
  color: "#ffffff", // multiplies with vertex colors — kept neutral so baked variation isn't washed out
  vertexColors: true,
  roughness: 0.22,
  metalness: 0,
  clearcoat: 0.35,
  clearcoatRoughness: 0.25,
});

// Stem shifted from a brown/wood tone to an olive-green, since a real
// (even slightly dried) maraschino stem retains a green cast that pure
// brown reads as chocolate or dried wood instead of plant material.
const stemMaterial = new THREE.MeshStandardMaterial({
  color: "#5c6b2f",
  roughness: 0.7,
  metalness: 0,
});

// Absolute world-space Y where the group origin sits: swirl surface
// plus swirl height, minus a small embed so the cherry doesn't float
// above a visible seam.
const CHERRY_GROUP_Y = CAKE_TOP_SURFACE_Y + CENTER_SWIRL_HEIGHT - CHERRY_EMBED_DEPTH;

// Exported attachment points so future decorations (leaf, second
// berry, etc.) can position themselves relative to the cherry without
// recomputing its geometry or guessing world-space numbers.
export const CHERRY_TOP_Y =
  CHERRY_GROUP_Y + CHERRY_RADIUS * CHERRY_VERTICAL_SQUASH_RATIO;
export const CHERRY_STEM_ATTACHMENT_Y = CHERRY_GROUP_Y + STEM_BASE_Y_OFFSET;

function CenterCherry() {
  return (
    <group position={[0, CHERRY_GROUP_Y, 0]}>
      <mesh geometry={cherryGeometry} material={cherryMaterial} castShadow receiveShadow />
      <mesh
        geometry={stemGeometry}
        material={stemMaterial}
        position={[0, STEM_BASE_Y_OFFSET, 0]}
        castShadow
        receiveShadow
      />
    </group>
  );
}

export default React.memo(CenterCherry);