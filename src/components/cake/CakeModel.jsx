import React, { useLayoutEffect, useRef, memo } from "react";
import {
  CylinderGeometry,
  LatheGeometry,
  TubeGeometry,
  SphereGeometry,
  Curve,
  Vector2,
  Vector3,
  Object3D,
  MeshStandardMaterial,
} from "three";

// ---------------------------------------------------------------------------
// 1. Shared geometry
// ---------------------------------------------------------------------------
const unitCylinderGeometry = new CylinderGeometry(1, 1, 1, 64);

const unitSphereGeometry = new SphereGeometry(1, 32, 16);

// Dedicated low-res cylinder for drip bodies — avoids spending 64 segments
// on a feature that renders only a few pixels tall.
const dripBodyGeometry = new CylinderGeometry(1, 1, 1, 12);

// ---------------------------------------------------------------------------
// 2. Shared materials
// ---------------------------------------------------------------------------
const cakeMaterial = new MeshStandardMaterial({
  color: "#f3e5c8",
  roughness: 0.6,
  metalness: 0.05,
});

const creamMaterial = new MeshStandardMaterial({
  color: "#fffaf0",
  roughness: 0.4,
  metalness: 0.0,
});

const standMaterial = new MeshStandardMaterial({
  color: "#b8985a",
  roughness: 0.3,
  metalness: 0.9,
});

// ---------------------------------------------------------------------------
// 3. Dimension constants
// ---------------------------------------------------------------------------
const BOTTOM_LAYER_RADIUS = 1.6;
const BOTTOM_LAYER_HEIGHT = 1.1;

const TOP_LAYER_RADIUS = 1.05;
const TOP_LAYER_HEIGHT = 0.85;

const CREAM_RING_RADIUS = TOP_LAYER_RADIUS * 1.585;
const CREAM_RING_HEIGHT = 0.12;

const STAND_RADIUS = BOTTOM_LAYER_RADIUS * 1.25;
const STAND_HEIGHT = 0.15;

// ---------------------------------------------------------------------------
// 3a. Stand silhouette — radius ratios (fractions of STAND_RADIUS)
// ---------------------------------------------------------------------------
const BASE_FOOT_RADIUS_RATIO = 0.9;
const BASE_BULGE_RADIUS_RATIO = 1.0;
const BASE_NECK_RADIUS_RATIO = 0.42;
const LOWER_COLLAR_RADIUS_RATIO = 0.5;
const COLUMN_WAIST_RADIUS_RATIO = 0.32;
const UPPER_COLLAR_RADIUS_RATIO = 0.48;
const PLATE_UNDER_RADIUS_RATIO = 0.44;
const PLATE_EDGE_RADIUS_RATIO = 1.0;
const PLATE_CHAMFER_RADIUS_RATIO = 0.92;

const BASE_BULGE_HEIGHT_RATIO = 0.55;
const COLLAR_TRANSITION_RATIO = 0.5;
const PLATE_WALL_HEIGHT_RATIO = 0.45;

// ---------------------------------------------------------------------------
// 3b. Stand silhouette — height fractions of STAND_HEIGHT (sum to exactly 1)
// ---------------------------------------------------------------------------
const BASE_HEIGHT_FRACTION = 0.32;
const LOWER_COLLAR_HEIGHT_FRACTION = 0.1;
const UPPER_COLLAR_HEIGHT_FRACTION = 0.1;
const PLATE_HEIGHT_FRACTION = 0.18;
const COLUMN_HEIGHT_FRACTION =
  1 -
  BASE_HEIGHT_FRACTION -
  LOWER_COLLAR_HEIGHT_FRACTION -
  UPPER_COLLAR_HEIGHT_FRACTION -
  PLATE_HEIGHT_FRACTION;

const BASE_TOP_Y = STAND_HEIGHT * BASE_HEIGHT_FRACTION;
const LOWER_COLLAR_TOP_Y = BASE_TOP_Y + STAND_HEIGHT * LOWER_COLLAR_HEIGHT_FRACTION;
const COLUMN_TOP_Y = LOWER_COLLAR_TOP_Y + STAND_HEIGHT * COLUMN_HEIGHT_FRACTION;
const UPPER_COLLAR_TOP_Y = COLUMN_TOP_Y + STAND_HEIGHT * UPPER_COLLAR_HEIGHT_FRACTION;
const PLATE_TOP_Y = UPPER_COLLAR_TOP_Y + STAND_HEIGHT * PLATE_HEIGHT_FRACTION;

const BASE_FOOT_RADIUS = STAND_RADIUS * BASE_FOOT_RADIUS_RATIO;
const BASE_BULGE_RADIUS = STAND_RADIUS * BASE_BULGE_RADIUS_RATIO;
const BASE_NECK_RADIUS = STAND_RADIUS * BASE_NECK_RADIUS_RATIO;
const LOWER_COLLAR_RADIUS = STAND_RADIUS * LOWER_COLLAR_RADIUS_RATIO;
const COLUMN_WAIST_RADIUS = STAND_RADIUS * COLUMN_WAIST_RADIUS_RATIO;
const UPPER_COLLAR_RADIUS = STAND_RADIUS * UPPER_COLLAR_RADIUS_RATIO;
const PLATE_UNDER_RADIUS = STAND_RADIUS * PLATE_UNDER_RADIUS_RATIO;
const PLATE_EDGE_RADIUS = STAND_RADIUS * PLATE_EDGE_RADIUS_RATIO;
const PLATE_CHAMFER_RADIUS = PLATE_EDGE_RADIUS * PLATE_CHAMFER_RADIUS_RATIO;

const STAND_RADIAL_SEGMENTS = 64;

// ---------------------------------------------------------------------------
// 3c. Icing cap — radius ratios (fractions of TOP_LAYER_RADIUS / ICING_RADIUS)
// ---------------------------------------------------------------------------
const ICING_OVERHANG_RATIO = 1.08;
const ICING_FLAT_CENTER_RADIUS_RATIO = 0.5;
const ICING_EDGE_ROUND_MID_RATIO = 0.5;

const ICING_CAP_HEIGHT_RATIO = 0.22;
const ICING_EDGE_LIFT_RATIO = 0.35;
const ICING_SKIRT_DROP_RATIO = 0.3;

const ICING_RADIUS = TOP_LAYER_RADIUS * ICING_OVERHANG_RATIO;
const ICING_FLAT_CENTER_RADIUS = ICING_RADIUS * ICING_FLAT_CENTER_RADIUS_RATIO;
const ICING_CAP_HEIGHT = TOP_LAYER_HEIGHT * ICING_CAP_HEIGHT_RATIO;
const ICING_EDGE_LIFT_HEIGHT = ICING_CAP_HEIGHT * ICING_EDGE_LIFT_RATIO;
const ICING_SKIRT_DROP_HEIGHT = TOP_LAYER_HEIGHT * ICING_SKIRT_DROP_RATIO;

const ICING_RADIAL_SEGMENTS = STAND_RADIAL_SEGMENTS;

// ---------------------------------------------------------------------------
// 3d. Frosting lip
// ---------------------------------------------------------------------------
const FROSTING_PATH_RADIUS_RATIO = 1.0;
const FROSTING_PATH_RADIUS = ICING_RADIUS * FROSTING_PATH_RADIUS_RATIO;

const FROSTING_TUBE_RADIUS_RATIO = 0.4;
const FROSTING_TUBE_RADIUS = ICING_CAP_HEIGHT * FROSTING_TUBE_RADIUS_RATIO;

const FROSTING_FLATTEN_RATIO = 0.55;

const FROSTING_EMBED_RATIO = 0.4;

const FROSTING_WOBBLE_PRIMARY_FREQUENCY = 5;
const FROSTING_WOBBLE_SECONDARY_FREQUENCY = 11;
const FROSTING_WOBBLE_PRIMARY_AMPLITUDE_RATIO = 0.16;
const FROSTING_WOBBLE_SECONDARY_AMPLITUDE_RATIO = 0.08;
const FROSTING_WOBBLE_PRIMARY_AMPLITUDE =
  FROSTING_TUBE_RADIUS * FROSTING_WOBBLE_PRIMARY_AMPLITUDE_RATIO;
const FROSTING_WOBBLE_SECONDARY_AMPLITUDE =
  FROSTING_TUBE_RADIUS * FROSTING_WOBBLE_SECONDARY_AMPLITUDE_RATIO;

const FROSTING_TUBULAR_SEGMENTS = 128;
const FROSTING_RADIAL_SEGMENTS = ICING_RADIAL_SEGMENTS;

// ---------------------------------------------------------------------------
// 3e. Cake drips
// ---------------------------------------------------------------------------
const DRIP_COUNT = 16;
const DRIP_ANGLE_STEP = (Math.PI * 2) / DRIP_COUNT;

const DRIP_RADIUS_RATIO = 0.6;
const DRIP_RADIUS = FROSTING_TUBE_RADIUS * DRIP_RADIUS_RATIO;

const DRIP_MIN_LENGTH_RATIO = 0.25;
const DRIP_MAX_LENGTH_RATIO = 0.65;

const DRIP_LENGTH_FREQUENCY = 2.4;

// Drips originate at the sponge surface radius, tucked just under the icing
// overhang so they read as emerging from beneath the icing skirt.
const DRIP_ORIGIN_RADIUS = TOP_LAYER_RADIUS;

const DRIP_BODY_RADIAL_SEGMENTS = 12;

// ---------------------------------------------------------------------------
// 4. Position constants (derived, stacked bottom-up from the stand)
// ---------------------------------------------------------------------------
const BOTTOM_LAYER_Y = STAND_HEIGHT + BOTTOM_LAYER_HEIGHT / 2;

const CREAM_RING_Y =
  STAND_HEIGHT + BOTTOM_LAYER_HEIGHT + CREAM_RING_HEIGHT / 2;

const TOP_LAYER_Y =
  STAND_HEIGHT + BOTTOM_LAYER_HEIGHT + CREAM_RING_HEIGHT + TOP_LAYER_HEIGHT / 2;

const TOP_SPONGE_SURFACE_Y = TOP_LAYER_Y + TOP_LAYER_HEIGHT / 2;

const FROSTING_Y_RESOLVED =
  TOP_SPONGE_SURFACE_Y +
  ICING_EDGE_LIFT_HEIGHT -
  FROSTING_TUBE_RADIUS * FROSTING_EMBED_RATIO;

const DRIP_ORIGIN_Y = TOP_SPONGE_SURFACE_Y - ICING_SKIRT_DROP_HEIGHT;

// ---------------------------------------------------------------------------
// 4a. Decorative piped border positions (depend on position constants above)
// ---------------------------------------------------------------------------
const PEARL_RADIUS_RATIO = 0.35;
const PEARL_RADIUS = FROSTING_TUBE_RADIUS * PEARL_RADIUS_RATIO;

const PEARL_OVERLAP_RATIO = 0.85;

// --- Top border -------------------------------------------------------------
const TOP_BORDER_RADIUS_RATIO = 1.02;
const TOP_BORDER_RADIUS = ICING_RADIUS * TOP_BORDER_RADIUS_RATIO;

const TOP_BORDER_LIFT_RATIO = 0.6;
const TOP_BORDER_Y =
  TOP_SPONGE_SURFACE_Y + ICING_CAP_HEIGHT + PEARL_RADIUS * TOP_BORDER_LIFT_RATIO;

const TOP_BORDER_PEARL_COUNT = Math.ceil(
  (Math.PI * 2 * TOP_BORDER_RADIUS) / (PEARL_RADIUS * 2 * PEARL_OVERLAP_RATIO)
);

// --- Bottom border ----------------------------------------------------------
const BOTTOM_BORDER_RADIUS_RATIO = 1.01;
const BOTTOM_BORDER_RADIUS = TOP_LAYER_RADIUS * BOTTOM_BORDER_RADIUS_RATIO;

const BOTTOM_BORDER_DROP_RATIO = 0.4;
const BOTTOM_BORDER_Y =
  TOP_LAYER_Y - TOP_LAYER_HEIGHT / 2 - PEARL_RADIUS * BOTTOM_BORDER_DROP_RATIO;

const BOTTOM_BORDER_PEARL_COUNT = Math.ceil(
  (Math.PI * 2 * BOTTOM_BORDER_RADIUS) / (PEARL_RADIUS * 2 * PEARL_OVERLAP_RATIO)
);

// ---------------------------------------------------------------------------
// 5. Public API for future siblings (Candle, Flame, Cherry, Sprinkles, ...)
// ---------------------------------------------------------------------------
export const CAKE_TOP_SURFACE_Y = TOP_SPONGE_SURFACE_Y + ICING_CAP_HEIGHT;
export const CAKE_TOP_LAYER_RADIUS = TOP_LAYER_RADIUS;
export const ICING_FLAT_CENTER_RADIUS_EXPORT = ICING_FLAT_CENTER_RADIUS;

// ---------------------------------------------------------------------------
// 6. Stand geometry
// ---------------------------------------------------------------------------
function buildStandProfile() {
  const baseBulgeY = BASE_TOP_Y * BASE_BULGE_HEIGHT_RATIO;
  const lowerCollarMidY =
    BASE_TOP_Y + (LOWER_COLLAR_TOP_Y - BASE_TOP_Y) * COLLAR_TRANSITION_RATIO;
  const columnMidY =
    LOWER_COLLAR_TOP_Y + (COLUMN_TOP_Y - LOWER_COLLAR_TOP_Y) * 0.5;
  const upperCollarMidY =
    COLUMN_TOP_Y + (UPPER_COLLAR_TOP_Y - COLUMN_TOP_Y) * COLLAR_TRANSITION_RATIO;
  const plateWallBottomY =
    UPPER_COLLAR_TOP_Y +
    (PLATE_TOP_Y - UPPER_COLLAR_TOP_Y) *
      (1 - PLATE_WALL_HEIGHT_RATIO) *
      0.5;
  const plateWallTopY =
    PLATE_TOP_Y -
    (PLATE_TOP_Y - UPPER_COLLAR_TOP_Y) * PLATE_WALL_HEIGHT_RATIO * 0.5;

  return [
    new Vector2(0, 0),
    new Vector2(BASE_FOOT_RADIUS, 0),
    new Vector2(BASE_BULGE_RADIUS, baseBulgeY),
    new Vector2(BASE_NECK_RADIUS, BASE_TOP_Y),
    new Vector2(LOWER_COLLAR_RADIUS, lowerCollarMidY),
    new Vector2(COLUMN_WAIST_RADIUS, columnMidY),
    new Vector2(UPPER_COLLAR_RADIUS, upperCollarMidY),
    new Vector2(PLATE_UNDER_RADIUS, UPPER_COLLAR_TOP_Y),
    new Vector2(PLATE_EDGE_RADIUS, plateWallBottomY),
    new Vector2(PLATE_EDGE_RADIUS, plateWallTopY),
    new Vector2(PLATE_CHAMFER_RADIUS, PLATE_TOP_Y),
    new Vector2(0, PLATE_TOP_Y),
  ];
}

const standGeometry = new LatheGeometry(
  buildStandProfile(),
  STAND_RADIAL_SEGMENTS
);

// ---------------------------------------------------------------------------
// 6a. Icing cap geometry
// ---------------------------------------------------------------------------
function buildIcingProfile() {
  const edgeMidRadius =
    ICING_RADIUS +
    (ICING_FLAT_CENTER_RADIUS - ICING_RADIUS) * ICING_EDGE_ROUND_MID_RATIO;
  const edgeMidHeight =
    ICING_EDGE_LIFT_HEIGHT +
    (ICING_CAP_HEIGHT - ICING_EDGE_LIFT_HEIGHT) * ICING_EDGE_ROUND_MID_RATIO;

  // Slightly inset the skirt attachment point to eliminate z-fighting with
  // the sponge top face and side surface.
  const ICING_SKIRT_INSET = 0.002;

  return [
    new Vector2(TOP_LAYER_RADIUS + ICING_SKIRT_INSET, -ICING_SKIRT_DROP_HEIGHT),
    new Vector2(TOP_LAYER_RADIUS + ICING_SKIRT_INSET, 0),
    new Vector2(ICING_RADIUS, ICING_EDGE_LIFT_HEIGHT),
    new Vector2(edgeMidRadius, edgeMidHeight),
    new Vector2(ICING_FLAT_CENTER_RADIUS, ICING_CAP_HEIGHT),
    new Vector2(0, ICING_CAP_HEIGHT),
  ];
}

const icingGeometry = new LatheGeometry(
  buildIcingProfile(),
  ICING_RADIAL_SEGMENTS
);

// ---------------------------------------------------------------------------
// 6b. Frosting lip geometry
// ---------------------------------------------------------------------------
class FrostingPath extends Curve {
  getPoint(t, target) {
    const out = target || new Vector3();
    const theta = t * Math.PI * 2;
    const wobble =
      FROSTING_WOBBLE_PRIMARY_AMPLITUDE *
        Math.sin(FROSTING_WOBBLE_PRIMARY_FREQUENCY * theta) +
      FROSTING_WOBBLE_SECONDARY_AMPLITUDE *
        Math.sin(FROSTING_WOBBLE_SECONDARY_FREQUENCY * theta);
    const radius = FROSTING_PATH_RADIUS + wobble;
    return out.set(
      radius * Math.cos(theta),
      0,
      radius * Math.sin(theta)
    );
  }
}

const frostingPath = new FrostingPath();

// Pre-flatten the tube geometry so the mesh scale stays uniform (1,1,1).
// Non-uniform scale on a TubeGeometry distorts normals and breaks lighting.
const frostingGeometry = (() => {
  const geo = new TubeGeometry(
    frostingPath,
    FROSTING_TUBULAR_SEGMENTS,
    FROSTING_TUBE_RADIUS,
    FROSTING_RADIAL_SEGMENTS,
    true
  );
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, pos.getY(i) * FROSTING_FLATTEN_RATIO);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
})();

// ---------------------------------------------------------------------------
// 7. Pearl geometry (shared by both borders, low segment count)
// ---------------------------------------------------------------------------
const pearlGeometry = new SphereGeometry(1, 8, 6);

// ---------------------------------------------------------------------------
// 8. Reusable dummy for matrix composition
// ---------------------------------------------------------------------------
const dummy = new Object3D();

// ---------------------------------------------------------------------------
// 9. InstancedMesh args (module-level to avoid per-render array allocation)
// ---------------------------------------------------------------------------
const dripBodyArgs = [dripBodyGeometry, creamMaterial, DRIP_COUNT];
const dripTipArgs = [unitSphereGeometry, creamMaterial, DRIP_COUNT];
const topBorderArgs = [pearlGeometry, creamMaterial, TOP_BORDER_PEARL_COUNT];
const bottomBorderArgs = [pearlGeometry, creamMaterial, BOTTOM_BORDER_PEARL_COUNT];

// ---------------------------------------------------------------------------
// 10. Small reusable subcomponents
// ---------------------------------------------------------------------------
const CakeStand = memo(function CakeStand() {
  return (
    <mesh
      geometry={standGeometry}
      material={standMaterial}
      castShadow
      receiveShadow
    />
  );
});

const BottomLayer = memo(function BottomLayer() {
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
});

const TopLayer = memo(function TopLayer() {
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
});

const CreamFilling = memo(function CreamFilling() {
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
});

const IcingCap = memo(function IcingCap() {
  return (
    <mesh
      geometry={icingGeometry}
      material={creamMaterial}
      position={[0, TOP_SPONGE_SURFACE_Y, 0]}
      castShadow
      receiveShadow
    />
  );
});

const FrostingLip = memo(function FrostingLip() {
  return (
    <mesh
      geometry={frostingGeometry}
      material={creamMaterial}
      position={[0, FROSTING_Y_RESOLVED, 0]}
      castShadow
      receiveShadow
    />
  );
});

// ---------------------------------------------------------------------------
// 10a. CakeDrips
// ---------------------------------------------------------------------------
const CakeDrips = memo(function CakeDrips() {
  const bodyRef = useRef(null);
  const tipRef = useRef(null);

  useLayoutEffect(() => {
    const bodyMesh = bodyRef.current;
    const tipMesh = tipRef.current;
    if (!bodyMesh || !tipMesh) return;

    for (let i = 0; i < DRIP_COUNT; i++) {
      const angle = i * DRIP_ANGLE_STEP;
      const wave = (Math.sin(i * DRIP_LENGTH_FREQUENCY) + 1) / 2;
      const lengthRatio =
        DRIP_MIN_LENGTH_RATIO +
        (DRIP_MAX_LENGTH_RATIO - DRIP_MIN_LENGTH_RATIO) * wave;
      const dripLength = TOP_LAYER_HEIGHT * lengthRatio;

      const x = DRIP_ORIGIN_RADIUS * Math.cos(angle);
      const z = DRIP_ORIGIN_RADIUS * Math.sin(angle);

      dummy.position.set(x, DRIP_ORIGIN_Y - dripLength / 2, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(DRIP_RADIUS, dripLength, DRIP_RADIUS);
      dummy.updateMatrix();
      bodyMesh.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x, DRIP_ORIGIN_Y - dripLength, z);
      dummy.scale.set(DRIP_RADIUS, DRIP_RADIUS, DRIP_RADIUS);
      dummy.updateMatrix();
      tipMesh.setMatrixAt(i, dummy.matrix);
    }

    bodyMesh.instanceMatrix.needsUpdate = true;
    tipMesh.instanceMatrix.needsUpdate = true;

    bodyMesh.computeBoundingSphere();
    tipMesh.computeBoundingSphere();
  }, []);

  return (
    <group name="CakeDrips">
      <instancedMesh
        ref={bodyRef}
        args={dripBodyArgs}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={tipRef}
        args={dripTipArgs}
        castShadow
        receiveShadow
      />
    </group>
  );
});

// ---------------------------------------------------------------------------
// 10b. CakeBorders
// ---------------------------------------------------------------------------
const CakeBorders = memo(function CakeBorders() {
  const topRef = useRef(null);
  const bottomRef = useRef(null);

  useLayoutEffect(() => {
    const topMesh = topRef.current;
    const bottomMesh = bottomRef.current;
    if (!topMesh || !bottomMesh) return;

    const topAngleStep = (Math.PI * 2) / TOP_BORDER_PEARL_COUNT;
    for (let i = 0; i < TOP_BORDER_PEARL_COUNT; i++) {
      const angle = i * topAngleStep;
      dummy.position.set(
        TOP_BORDER_RADIUS * Math.cos(angle),
        TOP_BORDER_Y,
        TOP_BORDER_RADIUS * Math.sin(angle)
      );
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(PEARL_RADIUS, PEARL_RADIUS, PEARL_RADIUS);
      dummy.updateMatrix();
      topMesh.setMatrixAt(i, dummy.matrix);
    }
    topMesh.instanceMatrix.needsUpdate = true;
    topMesh.computeBoundingSphere();

    const bottomAngleStep = (Math.PI * 2) / BOTTOM_BORDER_PEARL_COUNT;
    for (let i = 0; i < BOTTOM_BORDER_PEARL_COUNT; i++) {
      const angle = i * bottomAngleStep;
      dummy.position.set(
        BOTTOM_BORDER_RADIUS * Math.cos(angle),
        BOTTOM_BORDER_Y,
        BOTTOM_BORDER_RADIUS * Math.sin(angle)
      );
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(PEARL_RADIUS, PEARL_RADIUS, PEARL_RADIUS);
      dummy.updateMatrix();
      bottomMesh.setMatrixAt(i, dummy.matrix);
    }
    bottomMesh.instanceMatrix.needsUpdate = true;
    bottomMesh.computeBoundingSphere();
  }, []);

  return (
    <group name="CakeBorders">
      <instancedMesh
        ref={topRef}
        args={topBorderArgs}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={bottomRef}
        args={bottomBorderArgs}
        castShadow
        receiveShadow
      />
    </group>
  );
});

// ---------------------------------------------------------------------------
// 11. CakeModel export
// ---------------------------------------------------------------------------
export default memo(function CakeModel() {
  return (
    <group name="BirthdayCake">
      <CakeStand />
      <BottomLayer />
      <CreamFilling />
      <TopLayer />
      <IcingCap />
      <FrostingLip />
      <CakeDrips />
      <CakeBorders />
    </group>
  );
});