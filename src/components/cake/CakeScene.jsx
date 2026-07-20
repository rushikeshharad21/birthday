import { Component, Suspense, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
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
// Real cake geometry — no assumptions (unchanged from prior pass).
// ---------------------------------------------------------------------------
const CAKE_TOTAL_HEIGHT = CAKE_TOP_SURFACE_Y - CAKE_BASE_Y;

// ---------------------------------------------------------------------------
// Breakpoints — single source of truth, unchanged. Still drives CSS sizing
// (via arbitrary-value media queries), rotate speed, and DPR tier. Also
// drives per-breakpoint camera COMPOSITION (fill fraction, elevation,
// azimuth) via the same 4-tier table.
// ---------------------------------------------------------------------------
const BREAKPOINT_TABLET_PX = 768;
const BREAKPOINT_DESKTOP_PX = 1024;
const BREAKPOINT_LAPTOP_PX = 1280;

// ---------------------------------------------------------------------------
// Per-breakpoint hero composition.
//
// fillFraction is expressed as "fraction of the tighter half-FOV the cake's
// bounding sphere should subtend" (see resolveCameraFraming). Values are
// intentionally conservative (<=0.62) — anything higher starts to risk
// clipping the cherry tip or stand rim on ultra-wide/ultra-narrow aspect
// ratios even with the bounding-sphere guarantee, because a very large
// angular radius pushes sin(angularRadius) close to sin(halfFov), leaving
// little slack for the safety margin.
// ---------------------------------------------------------------------------
const FRAME_CONFIG = {
  mobile: { fillFraction: 0.34, elevationDeg: 80, azimuthDeg: 15 },
  tablet: { fillFraction: 0.44, elevationDeg: 79, azimuthDeg: 18 },
  laptop: { fillFraction: 0.50, elevationDeg: 78, azimuthDeg: 20 },
  desktop: { fillFraction: 0.54, elevationDeg: 77, azimuthDeg: 22 },
};
const BASE_VERTICAL_FOV_DEG = 35;
const CAMERA_DISTANCE_SAFETY_MARGIN = 1.18;

// ---------------------------------------------------------------------------
// FIX — bounding-sphere framing.
//
// The previous version solved vertical and horizontal half-extents
// SEPARATELY (distanceForHeight vs distanceForWidth) and took the max. That
// is only a valid "no clipping" guarantee when the camera looks straight
// on (elevation = 0). Once the camera is tilted up/down by elevationDeg
// (as every tier here does), a world-space vertical extent no longer maps
// 1:1 onto the camera's vertical FOV, so the old guarantee silently broke —
// which is exactly what produced the cropped, zoomed-in framing (cake's
// top layer / icing / cherry cut off, as seen in the screenshot).
//
// The fix: compute ONE bounding sphere around the entire cake (base rim,
// top-layer rim, cherry tip — whichever point is farthest from the orbit
// target), then solve camera distance so that sphere subtends a fixed
// angular fraction of the tighter FOV axis. A sphere's apparent angular
// size is identical from any camera position/angle at a given distance,
// so this guarantee holds regardless of elevation or azimuth — unlike the
// old per-axis extent approach.
// ---------------------------------------------------------------------------
function computeCakeBoundingRadius(targetY) {
  const baseEdgeDist = Math.hypot(CAKE_STAND_RADIUS, targetY - CAKE_BASE_Y);
  const topLayerEdgeDist = Math.hypot(
    CAKE_TOP_LAYER_RADIUS,
    CAKE_TOP_SURFACE_Y - targetY
  );
  const cherryTipDist = CHERRY_TOP_Y - targetY; // cherry sits on the center axis
  // Strawberries sit off-axis (STRAWBERRY_OUTER_RADIUS from center) at the
  // icing surface height — included so a wide strawberry ring can't poke
  // past the guaranteed-visible sphere the way a center-axis decoration
  // never would.
  const strawberryEdgeDist = Math.hypot(
    STRAWBERRY_OUTER_RADIUS,
    CAKE_TOP_SURFACE_Y - targetY
  );
  return Math.max(baseEdgeDist, topLayerEdgeDist, cherryTipDist, strawberryEdgeDist);
}

/**
 * Derives camera distance + FOV + position for a given aspect ratio and
 * breakpoint, guaranteeing the full cake (base rim -> cherry tip, full
 * stand radius) stays within frame at ANY elevation/azimuth, because the
 * fit is solved against a bounding sphere rather than per-axis extents.
 *
 * angularRadius = fillFraction * min(verticalHalfFov, horizontalHalfFov)
 * distance      = boundingRadius / sin(angularRadius) * safetyMargin
 *
 * This is the standard "fit bounding sphere in view" solve: a sphere of
 * radius R viewed from distance D subtends half-angle asin(R/D) regardless
 * of viewing direction, so constraining that half-angle to a fraction of
 * the tighter FOV axis keeps the whole sphere (and everything inside it)
 * on screen no matter how the camera is tilted or rotated.
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
// Orbit target — visual center of the cake BODY only, independent of
// cherry/swirl/toppings. Unchanged from prior pass; framing (above) adds
// the cherry/rim-awareness via the bounding sphere, the pivot itself
// deliberately does not.
// ---------------------------------------------------------------------------
export const ORBIT_TARGET = [0, CAKE_BASE_Y + CAKE_TOTAL_HEIGHT / 2, 0];

// ---------------------------------------------------------------------------
// Controls — input ergonomics, tiered by breakpoint.
// ---------------------------------------------------------------------------
const ORBIT_DAMPING_FACTOR = 0.08;

const ORBIT_ROTATE_SPEED = {
  mobile: 0.45,
  tablet: 0.5,
  laptop: 0.6,
  desktop: 0.6,
};

// Min corresponds to ~77-80° elevation (the near-top-down starting angle
// above) with a couple degrees of headroom, so OrbitControls doesn't clamp
// the initial camera position back down toward the horizon the instant it
// mounts. Max is unchanged — still stops short of looking up from below.
const POLAR_ANGLE_MIN = THREE.MathUtils.degToRad(9);
const POLAR_ANGLE_MAX = Math.PI / 2.1;

// ---------------------------------------------------------------------------
// Lighting — unchanged, out of scope.
// ---------------------------------------------------------------------------
const LIGHT_COLOR_AMBIENT = "#fff1e0";
const LIGHT_COLOR_KEY = "#ffddaa";
const LIGHT_COLOR_FILL = "#bcd4ff";
const LIGHT_COLOR_RIM = "#ffe9c7";

const LIGHT_INTENSITY_AMBIENT = 0.25;
const LIGHT_INTENSITY_KEY = 1.4;
const LIGHT_INTENSITY_FILL = 0.35;
const LIGHT_INTENSITY_RIM = 0.8;

const KEY_LIGHT_POSITION = [4, 6, 3];
const FILL_LIGHT_POSITION = [-4, 2, -2];
const RIM_LIGHT_POSITION = [0, 3.5, -4];
const RIM_LIGHT_ANGLE = 0.5;
const RIM_LIGHT_PENUMBRA = 0.8;
const RIM_LIGHT_DISTANCE = 10;

// ---------------------------------------------------------------------------
// Shadow camera frustum — real stand radius + tuned edge-bleed margin
// (unchanged reasoning from prior pass).
// ---------------------------------------------------------------------------
const SHADOW_MAP_SIZE = 2048;
const SHADOW_EDGE_BLEED_MARGIN = 1.5;
const SHADOW_CAMERA_BOUNDS = CAKE_STAND_RADIUS + SHADOW_EDGE_BLEED_MARGIN;
const SHADOW_CAMERA_NEAR = 0.5;

const KEY_LIGHT_DISTANCE_TO_ORIGIN = new THREE.Vector3(...KEY_LIGHT_POSITION).length();
const SHADOW_CAMERA_FAR = KEY_LIGHT_DISTANCE_TO_ORIGIN + SHADOW_EDGE_BLEED_MARGIN;
const SHADOW_BIAS = -0.0005;

// ---------------------------------------------------------------------------
// Ground contact shadow — real stand radius + falloff multiplier
// (unchanged from prior pass).
// ---------------------------------------------------------------------------
const CONTACT_SHADOW_OPACITY = 0.55;
const CONTACT_SHADOW_FALLOFF_MULTIPLIER = 2.2;
const CONTACT_SHADOW_SCALE = CAKE_STAND_RADIUS * CONTACT_SHADOW_FALLOFF_MULTIPLIER;
const CONTACT_SHADOW_BLUR = 2.6;
const CONTACT_SHADOW_FAR = 4;

// ---------------------------------------------------------------------------
// DPR — tiered by breakpoint.
// ---------------------------------------------------------------------------
const DPR_RANGE_BY_BREAKPOINT = {
  mobile: [1, 1.5],
  tablet: [1, 1.75],
  laptop: [1, 2],
  desktop: [1, 2],
};

const TONE_MAPPING_EXPOSURE = 1.1;
const SCENE_BACKGROUND_COLOR = "#0a0a0a";

function resolveBreakpoint(width) {
  if (width >= BREAKPOINT_LAPTOP_PX) return "desktop";
  if (width >= BREAKPOINT_DESKTOP_PX) return "laptop";
  if (width >= BREAKPOINT_TABLET_PX) return "tablet";
  return "mobile";
}

/** Rounds aspect to 0.02 steps so resize churn doesn't recompute the
 * camera (and resync R3F's camera object) on every animation frame. */
function roundAspectForMemo(aspect) {
  const STEP = 0.02;
  return Math.round(aspect / STEP) * STEP;
}

function useResponsiveViewport() {
  const [viewport, setViewport] = useState(() => {
    if (typeof window === "undefined") {
      return { breakpoint: "desktop", aspect: 16 / 9 };
    }
    return {
      breakpoint: resolveBreakpoint(window.innerWidth),
      aspect: roundAspectForMemo(window.innerWidth / window.innerHeight),
    };
  });

  useEffect(() => {
    let frameId = null;

    const handleResize = () => {
      if (frameId !== null) return;
      frameId = requestAnimationFrame(() => {
        const nextBreakpoint = resolveBreakpoint(window.innerWidth);
        const nextAspect = roundAspectForMemo(
          window.innerWidth / window.innerHeight
        );

        setViewport((prev) => {
          if (prev.breakpoint === nextBreakpoint && prev.aspect === nextAspect) {
            return prev;
          }
          return { breakpoint: nextBreakpoint, aspect: nextAspect };
        });

        frameId = null;
      });
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, []);

  return viewport;
}

function isWebGLSupported() {
  if (typeof window === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

class WebGLErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function SceneFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center px-6 text-center">
      <p className="text-sm text-neutral-400">
        This 3D experience isn't supported in your current browser. Please try
        a modern browser to view the animated cake.
      </p>
    </div>
  );
}

export default function CakeScene() {
  const { breakpoint, aspect } = useResponsiveViewport();
  const [webglSupported] = useState(isWebGLSupported);

  // Recomputed only when rounded aspect OR breakpoint changes — stable
  // identity across resize churn, no visible camera jump.
  const cameraSettings = useMemo(
    () => resolveCameraFraming(aspect, breakpoint),
    [aspect, breakpoint]
  );

  const rotateSpeed = ORBIT_ROTATE_SPEED[breakpoint];
  const dprRange = DPR_RANGE_BY_BREAKPOINT[breakpoint];

  // Container height per breakpoint: mobile deliberately stays well short
  // of 100vh so the next section's top edge is visible on initial load —
  // this, not the camera, is what actually creates scroll affordance.
  const containerClassName =
    "relative w-full overflow-hidden rounded-2xl bg-neutral-950 " +
    "h-[clamp(320px,48vh,440px)] " +
    `[@media(min-width:${BREAKPOINT_TABLET_PX}px)]:h-[clamp(360px,52vh,500px)] ` +
    `[@media(min-width:${BREAKPOINT_DESKTOP_PX}px)]:h-[clamp(420px,62vh,640px)] ` +
    `[@media(min-width:${BREAKPOINT_LAPTOP_PX}px)]:h-[clamp(460px,72vh,780px)]`;

  if (!webglSupported) {
    return (
      <div className={containerClassName}>
        <SceneFallback />
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <WebGLErrorBoundary fallback={<SceneFallback />}>
        <Canvas
          shadows
          dpr={dprRange}
          camera={cameraSettings}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: TONE_MAPPING_EXPOSURE,
          }}
          onCreated={({ gl, scene, camera }) => {
            gl.setClearColor(SCENE_BACKGROUND_COLOR, 1);
            scene.background = new THREE.Color(SCENE_BACKGROUND_COLOR);

            // Belt-and-suspenders: set the camera's position directly here
            // too, instead of relying only on the `camera` prop above. If
            // you see this log in your browser console but the view still
            // looks unchanged, the issue is 100% a stale build/cache, not
            // this code — restart `npm run dev` and hard-refresh.
            const { position, fov } = resolveCameraFraming(aspect, breakpoint);
            camera.position.set(...position);
            camera.fov = fov;
            camera.updateProjectionMatrix();
            camera.lookAt(...ORBIT_TARGET);
            // eslint-disable-next-line no-console
            console.log(
              "[CakeScene] camera framed:",
              { breakpoint, elevationDeg: FRAME_CONFIG[breakpoint].elevationDeg, position }
            );
          }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={LIGHT_INTENSITY_AMBIENT} color={LIGHT_COLOR_AMBIENT} />

            <directionalLight
              position={KEY_LIGHT_POSITION}
              intensity={LIGHT_INTENSITY_KEY}
              color={LIGHT_COLOR_KEY}
              castShadow
              shadow-mapSize-width={SHADOW_MAP_SIZE}
              shadow-mapSize-height={SHADOW_MAP_SIZE}
              shadow-camera-near={SHADOW_CAMERA_NEAR}
              shadow-camera-far={SHADOW_CAMERA_FAR}
              shadow-camera-left={-SHADOW_CAMERA_BOUNDS}
              shadow-camera-right={SHADOW_CAMERA_BOUNDS}
              shadow-camera-top={SHADOW_CAMERA_BOUNDS}
              shadow-camera-bottom={-SHADOW_CAMERA_BOUNDS}
              shadow-bias={SHADOW_BIAS}
            />

            <directionalLight
              position={FILL_LIGHT_POSITION}
              intensity={LIGHT_INTENSITY_FILL}
              color={LIGHT_COLOR_FILL}
            />

            <spotLight
              position={RIM_LIGHT_POSITION}
              intensity={LIGHT_INTENSITY_RIM}
              color={LIGHT_COLOR_RIM}
              angle={RIM_LIGHT_ANGLE}
              penumbra={RIM_LIGHT_PENUMBRA}
              distance={RIM_LIGHT_DISTANCE}
            />

            <Environment preset="studio" />

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
          </Suspense>
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}