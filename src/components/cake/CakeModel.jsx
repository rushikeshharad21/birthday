import { CylinderGeometry, MeshStandardMaterial } from "three";

// ---------------------------------------------------------------------------
// 1. Shared geometry
// A unit cylinder (radius 1, height 1) is reused for every layer/stand mesh.
// Per-instance size is applied via <mesh scale>, avoiding N geometry allocations.
// ---------------------------------------------------------------------------
const unitCylinderGeometry = new CylinderGeometry(1, 1, 1, 64);

// ---------------------------------------------------------------------------
// 2. Shared materials
// One material instance per surface type — swapped never, shared everywhere.
// ---------------------------------------------------------------------------
const cakeMaterial = new MeshStandardMaterial({
  color: "#f3e5c8", // soft vanilla
  roughness: 0.6,
  metalness: 0.05,
});

const creamMaterial = new MeshStandardMaterial({
  color: "#fffaf0", // warm white
  roughness: 0.4,
  metalness: 0.0,
});

const standMaterial = new MeshStandardMaterial({
  color: "#cdaa5c", // matte metallic gold
  roughness: 0.35,
  metalness: 0.85,
});

// ---------------------------------------------------------------------------
// 3. Dimension constants
// ---------------------------------------------------------------------------
const BOTTOM_LAYER_RADIUS = 1.6;
const BOTTOM_LAYER_HEIGHT = 1.1;

const TOP_LAYER_RADIUS = 1.05;
const TOP_LAYER_HEIGHT = 0.85;

// Cream belongs to the top tier, so it's derived from TOP_LAYER_RADIUS.
// NOTE: this multiplier (~1.585) is intentionally NOT "slightly larger" —
// it's back-solved to preserve the original absolute radius (1.664) that
// was previously derived from BOTTOM_LAYER_RADIUS * 1.04. The ring still
// needs to overhang BOTTOM_LAYER_RADIUS (1.6) for the visual to read
// correctly; do not "simplify" this to a small ratio like 1.05 without
// checking it against BOTTOM_LAYER_RADIUS, or the overhang disappears.
const CREAM_RING_RADIUS = TOP_LAYER_RADIUS * 1.585;
const CREAM_RING_HEIGHT = 0.12;

const STAND_RADIUS = BOTTOM_LAYER_RADIUS * 1.25; // slightly wider than bottom layer
const STAND_HEIGHT = 0.15;

// ---------------------------------------------------------------------------
// 4. Position constants (derived, stacked bottom-up from the stand)
// Declared once at module scope — these never change, so no useMemo needed.
// ---------------------------------------------------------------------------
const STAND_Y = STAND_HEIGHT / 2;

const BOTTOM_LAYER_Y = STAND_HEIGHT + BOTTOM_LAYER_HEIGHT / 2;

const CREAM_RING_Y =
  STAND_HEIGHT + BOTTOM_LAYER_HEIGHT + CREAM_RING_HEIGHT / 2;

const TOP_LAYER_Y =
  STAND_HEIGHT + BOTTOM_LAYER_HEIGHT + CREAM_RING_HEIGHT + TOP_LAYER_HEIGHT / 2;

// Public API for future siblings (Candle, Flame, Cherry, Sprinkles, ...).
// These read off the same derivation chain above, so they stay correct
// if any dimension constant changes — no duplicated math at call sites.
export const CAKE_TOP_SURFACE_Y = TOP_LAYER_Y + TOP_LAYER_HEIGHT / 2;
export const CAKE_TOP_LAYER_RADIUS = TOP_LAYER_RADIUS;

// ---------------------------------------------------------------------------
// 5. Small reusable subcomponents
// Each takes only what varies (radius/height/material); geometry is shared.
// ---------------------------------------------------------------------------
function CakeStand() {
  return (
    <mesh
      geometry={unitCylinderGeometry}
      material={standMaterial}
      position={[0, STAND_Y, 0]}
      scale={[STAND_RADIUS, STAND_HEIGHT, STAND_RADIUS]}
      castShadow
      receiveShadow
    />
  );
}

function BottomLayer() {
  return (
    <mesh
      geometry={unitCylinderGeometry}
      material={cakeMaterial}
      position={[0, BOTTOM_LAYER_Y, 0]}
      scale={[BOTTOM_LAYER_RADIUS, BOTTOM_LAYER_HEIGHT, BOTTOM_LAYER_RADIUS]}
      castShadow
      receiveShadow
    />
  );
}

function TopLayer() {
  return (
    <mesh
      geometry={unitCylinderGeometry}
      material={cakeMaterial}
      position={[0, TOP_LAYER_Y, 0]}
      scale={[TOP_LAYER_RADIUS, TOP_LAYER_HEIGHT, TOP_LAYER_RADIUS]}
      castShadow
      receiveShadow
    />
  );
}

function CreamFilling() {
  return (
    <mesh
      geometry={unitCylinderGeometry}
      material={creamMaterial}
      position={[0, CREAM_RING_Y, 0]}
      scale={[CREAM_RING_RADIUS, CREAM_RING_HEIGHT, CREAM_RING_RADIUS]}
      castShadow
      receiveShadow
    />
  );
}

// ---------------------------------------------------------------------------
// 6. CakeModel export
// Geometry only — no lights, camera, controls, environment, or animation.
// Consumed by CakeScene, which owns the rest of the scene graph.
// ---------------------------------------------------------------------------
export default function CakeModel() {
  return (
    <group name="BirthdayCake">
      <CakeStand />
      <BottomLayer />
      <CreamFilling />
      <TopLayer />
    </group>
  );
}