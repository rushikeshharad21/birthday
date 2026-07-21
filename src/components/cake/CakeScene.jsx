import * as THREE from "three";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import SceneCanvas, {
  useSceneViewport,
  BREAKPOINT_TABLET_PX,
  BREAKPOINT_DESKTOP_PX,
  BREAKPOINT_LAPTOP_PX,
} from "../../three/core/SceneCanvas";
import CakeModel from "./CakeModel";
import {
  CAKE_TOP_SURFACE_Y,
  CAKE_TOP_LAYER_RADIUS,
  CAKE_BASE_Y,
  CAKE_STAND_RADIUS,
} from "./cakeDimensions";
import { CHERRY_TOP_Y } from "./CenterCherry";
import { STRAWBERRY_OUTER_RADIUS } from "./Strawberries";

// ---------------------------------------------------------------------------
// Real cake geometry — unchanged.
// ---------------------------------------------------------------------------
const CAKE_TOTAL_HEIGHT = CAKE_TOP_SURFACE_Y - CAKE_BASE_Y;

// ---------------------------------------------------------------------------
// Per-breakpoint hero composition — unchanged from prior pass. This stays
// here (not in SceneCanvas) because it's derived from the cake's actual
// bounding sphere, which SceneCanvas has no knowledge of.
// ---------------------------------------------------------------------------
const FRAME_CONFIG = {
  mobile: { fillFraction: 0.34, elevationDeg: 80, azimuthDeg: 15 },
  tablet: { fillFraction: 0.44, elevationDeg: 79, azimuthDeg: 18 },
  laptop: { fillFraction: 0.50, elevationDeg: 78, azimuthDeg: 20 },
  desktop: { fillFraction: 0.54, elevationDeg: 77, azimuthDeg: 22 },
};
const BASE_VERTICAL_FOV_DEG = 35;
const CAMERA_DISTANCE_SAFETY_MARGIN = 1.18;

/**
 * Bounding-sphere fit — unchanged reasoning from prior pass. Guarantees the
 * full cake (base rim, top-layer rim, cherry tip, strawberry ring) stays in
 * frame at any elevation/azimuth, since a sphere's apparent size is angle-
 * independent.
 */
function computeCakeBoundingRadius(targetY) {
  const baseEdgeDist = Math.hypot(CAKE_STAND_RADIUS, targetY - CAKE_BASE_Y);
  const topLayerEdgeDist = Math.hypot(
    CAKE_TOP_LAYER_RADIUS,
    CAKE_TOP_SURFACE_Y - targetY
  );
  const cherryTipDist = CHERRY_TOP_Y - targetY;
  const strawberryEdgeDist = Math.hypot(
    STRAWBERRY_OUTER_RADIUS,
    CAKE_TOP_SURFACE_Y - targetY
  );
  return Math.max(baseEdgeDist, topLayerEdgeDist, cherryTipDist, strawberryEdgeDist);
}

/**
 * Derives camera distance + FOV + position. This is the function passed to
 * <SceneCanvas computeCamera={...}> — SceneCanvas calls it, doesn't know
 * what's inside it.
 */
function resolveCameraFraming(aspect, breakpoint) {
  const { fillFraction, elevationDeg, azimuthDeg } = FRAME_CONFIG[breakpoint];

  const verticalFov = THREE.MathUtils.degToRad(BASE_VERTICAL_FOV_DEG);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
  const tighterHalfFov = Math.min(verticalFov, horizontalFov) / 2;

  const targetY = ORBIT_TARGET[1];
  const boundingRadius = computeCakeBoundingRadius(targetY);

  const angularRadius = fillFraction * tighterHalfFov;
  const distance =
    (boundingRadius / Math.sin(angularRadius)) * CAMERA_DISTANCE_SAFETY_MARGIN;

  const elevationAngle = THREE.MathUtils.degToRad(elevationDeg);
  const azimuthAngle = THREE.MathUtils.degToRad(azimuthDeg);

  const horizontalRadius = distance * Math.cos(elevationAngle);
  const position = [
    horizontalRadius * Math.sin(azimuthAngle),
    targetY + distance * Math.sin(elevationAngle),
    horizontalRadius * Math.cos(azimuthAngle),
  ];

  return { position, fov: BASE_VERTICAL_FOV_DEG };
}

// ---------------------------------------------------------------------------
// Orbit target — unchanged. Exported in case other cake decorations ever
// need it (some already do, e.g. Strawberries' outer-radius export pattern).
// ---------------------------------------------------------------------------
export const ORBIT_TARGET = [0, CAKE_BASE_Y + CAKE_TOTAL_HEIGHT / 2, 0];

// ---------------------------------------------------------------------------
// Controls — unchanged.
// ---------------------------------------------------------------------------
const ORBIT_DAMPING_FACTOR = 0.08;

const ORBIT_ROTATE_SPEED = {
  mobile: 0.45,
  tablet: 0.5,
  laptop: 0.6,
  desktop: 0.6,
};

const POLAR_ANGLE_MIN = THREE.MathUtils.degToRad(9);
const POLAR_ANGLE_MAX = Math.PI / 2.1;

// ---------------------------------------------------------------------------
// Ground contact shadow — unchanged. Stays here (not in SceneCanvas)
// because its scale is derived from CAKE_STAND_RADIUS.
// ---------------------------------------------------------------------------
const CONTACT_SHADOW_OPACITY = 0.55;
const CONTACT_SHADOW_FALLOFF_MULTIPLIER = 2.2;
const CONTACT_SHADOW_SCALE = CAKE_STAND_RADIUS * CONTACT_SHADOW_FALLOFF_MULTIPLIER;
const CONTACT_SHADOW_BLUR = 2.6;
const CONTACT_SHADOW_FAR = 4;

const FALLBACK_MESSAGE =
  "This 3D experience isn't supported in your current browser. Please try a modern browser to view the animated cake.";

// ---------------------------------------------------------------------------
// Scene contents — everything that used to sit directly inside CakeScene's
// own <Canvas><Suspense> now lives here instead, as children of the shared
// SceneCanvas. Reads breakpoint via useSceneViewport() (provided by
// SceneCanvas's context) instead of re-deriving it locally.
// ---------------------------------------------------------------------------
function CakeSceneContents() {
  const { breakpoint } = useSceneViewport();
  const rotateSpeed = ORBIT_ROTATE_SPEED[breakpoint];

  return (
    <>
      <CakeModel />

      <ContactShadows
        position={[0, -0.001, 0]}
        opacity={CONTACT_SHADOW_OPACITY}
        scale={CONTACT_SHADOW_SCALE}
        blur={CONTACT_SHADOW_BLUR}
        far={CONTACT_SHADOW_FAR}
      />

      <OrbitControls
        target={ORBIT_TARGET}
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={ORBIT_DAMPING_FACTOR}
        rotateSpeed={rotateSpeed}
        minPolarAngle={POLAR_ANGLE_MIN}
        maxPolarAngle={POLAR_ANGLE_MAX}
        enableRotate
        touches={{ ONE: THREE.TOUCH.ROTATE }}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// CakeScene — public API unchanged (default export, no required props), so
// BirthdayCake.jsx and anything else importing it needs no changes.
// ---------------------------------------------------------------------------
export default function CakeScene() {
  // Container height per breakpoint: mobile deliberately stays well short
  // of 100vh so the next section's top edge is visible on initial load.
  // Unchanged from prior pass, now built from SceneCanvas's exported
  // breakpoint constants instead of locally duplicated ones.
  const containerClassName =
    "relative w-full overflow-hidden rounded-2xl bg-neutral-950 " +
    "h-[clamp(320px,48vh,440px)] " +
    `[@media(min-width:${BREAKPOINT_TABLET_PX}px)]:h-[clamp(360px,52vh,500px)] ` +
    `[@media(min-width:${BREAKPOINT_DESKTOP_PX}px)]:h-[clamp(420px,62vh,640px)] ` +
    `[@media(min-width:${BREAKPOINT_LAPTOP_PX}px)]:h-[clamp(460px,72vh,780px)]`;

  return (
    <SceneCanvas
      computeCamera={resolveCameraFraming}
      shadowExtent={CAKE_STAND_RADIUS}
      containerClassName={containerClassName}
      fallbackMessage={FALLBACK_MESSAGE}
      debugLabel="CakeScene"
    >
      <CakeSceneContents />
    </SceneCanvas>
  );
}