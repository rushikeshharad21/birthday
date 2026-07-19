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

import {
  BOTTOM_LAYER_RADIUS,
  BOTTOM_LAYER_HEIGHT,
  TOP_LAYER_RADIUS,
  TOP_LAYER_HEIGHT,
  CREAM_RING_RADIUS,
  CREAM_RING_HEIGHT,

  STAND_RADIUS,
  STAND_HEIGHT,

  BASE_HEIGHT_FRACTION,
  LOWER_COLLAR_HEIGHT_FRACTION,
  UPPER_COLLAR_HEIGHT_FRACTION,
  PLATE_HEIGHT_FRACTION,

  BASE_TOP_Y,
  LOWER_COLLAR_TOP_Y,
  COLUMN_TOP_Y,
  UPPER_COLLAR_TOP_Y,
  PLATE_TOP_Y,

  BASE_FOOT_RADIUS,
  BASE_BULGE_RADIUS,
  BASE_NECK_RADIUS,
  LOWER_COLLAR_RADIUS,
  COLUMN_WAIST_RADIUS,
  UPPER_COLLAR_RADIUS,
  PLATE_UNDER_RADIUS,
  PLATE_EDGE_RADIUS,
  PLATE_CHAMFER_RADIUS,

  BASE_BULGE_HEIGHT_RATIO,
  COLLAR_TRANSITION_RATIO,
  PLATE_WALL_HEIGHT_RATIO,

  STAND_RADIAL_SEGMENTS,

  ICING_RADIUS,
  ICING_FLAT_CENTER_RADIUS,
  ICING_CAP_HEIGHT,
  ICING_EDGE_LIFT_HEIGHT,
  ICING_SKIRT_DROP_HEIGHT,
  ICING_EDGE_ROUND_MID_RATIO,
  ICING_RADIAL_SEGMENTS,

  FROSTING_PATH_RADIUS,
  FROSTING_TUBE_RADIUS,
  FROSTING_FLATTEN_RATIO,
  FROSTING_EMBED_RATIO,
  FROSTING_WOBBLE_PRIMARY_FREQUENCY,
  FROSTING_WOBBLE_SECONDARY_FREQUENCY,
  FROSTING_WOBBLE_PRIMARY_AMPLITUDE,
  FROSTING_WOBBLE_SECONDARY_AMPLITUDE,
  FROSTING_TUBULAR_SEGMENTS,
  FROSTING_RADIAL_SEGMENTS,

  DRIP_COUNT,
  DRIP_ANGLE_STEP,
  DRIP_RADIUS,
  DRIP_MIN_LENGTH_RATIO,
  DRIP_MAX_LENGTH_RATIO,
  DRIP_LENGTH_FREQUENCY,
  DRIP_ORIGIN_RADIUS,

  BOTTOM_LAYER_Y,
  CREAM_RING_Y,
  TOP_LAYER_Y,
  TOP_SPONGE_SURFACE_Y,
  FROSTING_Y_RESOLVED,
  DRIP_ORIGIN_Y,

  PEARL_RADIUS,
  TOP_BORDER_RADIUS,
  TOP_BORDER_Y,
  TOP_BORDER_PEARL_COUNT,
  BOTTOM_BORDER_RADIUS,
  BOTTOM_BORDER_Y,
  BOTTOM_BORDER_PEARL_COUNT,
} from "./cakeDimensions";
import CreamRosettes from "./CreamRosettes";
import CenterCreamSwirl from "./CenterCreamSwirl";
import CenterCherry from "./CenterCherry";
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

  // FIX: both offsets are now the same "margin" quantity —
  // (1 - PLATE_WALL_HEIGHT_RATIO) * 0.5 * span — applied from the bottom and
  // mirrored from the top. Previously the top offset used
  // PLATE_WALL_HEIGHT_RATIO * 0.5 * span instead of (1 - ratio) * 0.5 * span,
  // which made the two terms cancel algebraically: the resulting wall height
  // was always exactly 0.5 * span regardless of what PLATE_WALL_HEIGHT_RATIO
  // was set to. This version makes the wall height actually equal
  // PLATE_WALL_HEIGHT_RATIO * span, centered in the plate zone, as the name
  // promises.
  const plateSpan = PLATE_TOP_Y - UPPER_COLLAR_TOP_Y;
  const plateWallMargin = plateSpan * (1 - PLATE_WALL_HEIGHT_RATIO) * 0.5;
  const plateWallBottomY = UPPER_COLLAR_TOP_Y + plateWallMargin;
  const plateWallTopY = PLATE_TOP_Y - plateWallMargin;

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
      <CreamRosettes />
      <CenterCreamSwirl />
        <CenterCherry />
    </group>
  );
});