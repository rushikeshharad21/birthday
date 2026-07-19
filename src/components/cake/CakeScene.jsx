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

// ---------------------------------------------------------------------------
// Real cake geometry — no assumptions. CAKE_BASE_Y and CAKE_STAND_RADIUS
// must exist in cakeDimensions.js; this file no longer guesses either.
// Total height deliberately stops at the structural top surface, not any
// decoration, so the camera/orbit target never depend on garnishes.
// ---------------------------------------------------------------------------
const CAKE_TOTAL_HEIGHT = CAKE_TOP_SURFACE_Y - CAKE_BASE_Y;

// ---------------------------------------------------------------------------
// Breakpoints — single source of truth for CSS sizing, rotate speed, and
// DPR tier alike (see containerClassName below).
// ---------------------------------------------------------------------------
const BREAKPOINT_TABLET_PX = 768;
const BREAKPOINT_DESKTOP_PX = 1024;
const BREAKPOINT_LAPTOP_PX = 1280;

// ---------------------------------------------------------------------------
// Mathematical camera framing
// ---------------------------------------------------------------------------
const BASE_VERTICAL_FOV_DEG = 35;
const TARGET_FILL_FRACTION = 0.62; // cake occupies ~62% of frame, leaving edge headroom

// Fixed cinematic viewing angles — the artistic 3/4 hero composition.
// Stated directly rather than reverse-engineered from a position vector.
const CAMERA_ELEVATION_DEG = 27;
const CAMERA_AZIMUTH_DEG = 35;
const CAMERA_ELEVATION_ANGLE = THREE.MathUtils.degToRad(CAMERA_ELEVATION_DEG);
const CAMERA_AZIMUTH_ANGLE = THREE.MathUtils.degToRad(CAMERA_AZIMUTH_DEG);

const CAMERA_DISTANCE_SAFETY_MARGIN = 1.04;

/**
 * distance = halfExtent / fillFraction / tan(fov / 2)
 * Direct inverse of the perspective relationship
 * visibleHalfExtent = distance * tan(fov / 2).
 */
function solveDistanceForHalfExtent(halfExtent, fovRadians) {
  return halfExtent / TARGET_FILL_FRACTION / Math.tan(fovRadians / 2);
}

/**
 * horizontalFov = 2 * atan(tan(verticalFov / 2) * aspect) is the true
 * frustum relationship — not a linear fov*aspect scale, which has no
 * geometric basis. Distance is solved against both the cake's height
 * and its stand radius; whichever needs more distance wins, guaranteeing
 * no clipping on either axis at any aspect ratio.
 */
function resolveCameraFraming(aspect) {
  const verticalFov = THREE.MathUtils.degToRad(BASE_VERTICAL_FOV_DEG);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);

  const distanceForHeight = solveDistanceForHalfExtent(
    CAKE_TOTAL_HEIGHT / 2,
    verticalFov
  );
  const distanceForWidth = solveDistanceForHalfExtent(
    CAKE_STAND_RADIUS,
    horizontalFov
  );

  const distance =
    Math.max(distanceForHeight, distanceForWidth) * CAMERA_DISTANCE_SAFETY_MARGIN;

  const targetY = ORBIT_TARGET[1];
  const horizontalRadius = distance * Math.cos(CAMERA_ELEVATION_ANGLE);
  const position = [
    horizontalRadius * Math.sin(CAMERA_AZIMUTH_ANGLE),
    targetY + distance * Math.sin(CAMERA_ELEVATION_ANGLE),
    horizontalRadius * Math.cos(CAMERA_AZIMUTH_ANGLE),
  ];

  return { position, fov: BASE_VERTICAL_FOV_DEG };
}

// ---------------------------------------------------------------------------
// Orbit target — visual center of the cake BODY only. Independent of
// cherry, swirl, or any future topping by construction: it only reads
// CAKE_BASE_Y and CAKE_TOP_SURFACE_Y.
// ---------------------------------------------------------------------------
export const ORBIT_TARGET = [0, CAKE_BASE_Y + CAKE_TOTAL_HEIGHT / 2, 0];

// ---------------------------------------------------------------------------
// Controls — input ergonomics, tiered by breakpoint (not continuous math,
// since rotate feel is a UX tuning concern, not a framing concern).
// ---------------------------------------------------------------------------
const ORBIT_DAMPING_FACTOR = 0.08;

const ORBIT_ROTATE_SPEED = {
  mobile: 0.45,
  tablet: 0.5,
  laptop: 0.6,
  desktop: 0.6,
};

const POLAR_ANGLE_MIN = Math.PI / 4;
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
// Shadow camera frustum — bounds from real stand radius. The margin below
// is NOT a derived geometric quantity (there is no formula for shadow-map
// edge bleed without a configured soft-shadow radius); it's a tuned
// constant that exists to keep the hard-edged shadow map from clipping
// the stand silhouette at its exact edge. Named for what it compensates,
// not disguised as a derivation.
// ---------------------------------------------------------------------------
const SHADOW_MAP_SIZE = 2048;
const SHADOW_EDGE_BLEED_MARGIN = 1.5; // tuned: shadow-map texel bleed at silhouette edges, not a geometric derivation
const SHADOW_CAMERA_BOUNDS = CAKE_STAND_RADIUS + SHADOW_EDGE_BLEED_MARGIN;
const SHADOW_CAMERA_NEAR = 0.5;

const KEY_LIGHT_DISTANCE_TO_ORIGIN = new THREE.Vector3(...KEY_LIGHT_POSITION).length();
const SHADOW_CAMERA_FAR = KEY_LIGHT_DISTANCE_TO_ORIGIN + SHADOW_EDGE_BLEED_MARGIN;
const SHADOW_BIAS = -0.0005;

// ---------------------------------------------------------------------------
// Ground contact shadow — real stand radius, plus a falloff multiplier
// (soft shadow needs to extend past the stand edge to read as grounded,
// not clipped flush to the footprint).
// ---------------------------------------------------------------------------
const CONTACT_SHADOW_OPACITY = 0.55;
const CONTACT_SHADOW_FALLOFF_MULTIPLIER = 2.2; // how far the soft shadow fades beyond the stand edge
const CONTACT_SHADOW_SCALE = CAKE_STAND_RADIUS * CONTACT_SHADOW_FALLOFF_MULTIPLIER;
const CONTACT_SHADOW_BLUR = 2.6;
const CONTACT_SHADOW_FAR = 4;

// ---------------------------------------------------------------------------
// DPR — tiered by breakpoint for mobile thermal/battery headroom.
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
            return prev; // same reference — skips the re-render entirely
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

  const cameraSettings = useMemo(() => resolveCameraFraming(aspect), [aspect]);
  const rotateSpeed = ORBIT_ROTATE_SPEED[breakpoint];
  const dprRange = DPR_RANGE_BY_BREAKPOINT[breakpoint];

  const containerClassName =
    "relative w-full overflow-hidden rounded-2xl bg-neutral-950 " +
    "h-[clamp(320px,50vh,480px)] " +
    `[@media(min-width:${BREAKPOINT_TABLET_PX}px)]:h-[clamp(360px,55vh,560px)] ` +
    `[@media(min-width:${BREAKPOINT_DESKTOP_PX}px)]:h-[clamp(400px,60vh,640px)] ` +
    `[@media(min-width:${BREAKPOINT_LAPTOP_PX}px)]:h-[clamp(440px,70vh,760px)]`;

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
          onCreated={({ gl, scene }) => {
            gl.setClearColor(SCENE_BACKGROUND_COLOR, 1);
            scene.background = new THREE.Color(SCENE_BACKGROUND_COLOR);
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