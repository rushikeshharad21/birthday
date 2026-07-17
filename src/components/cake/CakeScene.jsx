import { Component, Suspense, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import CakeModel from "./CakeModel";

// ---------------------------------------------------------------------------
// Breakpoints — mirrored from Tailwind's default `md` / `lg` so the camera
// logic and the CSS height classes below stay in sync.
// ---------------------------------------------------------------------------
const BREAKPOINT_TABLET_PX = 768; // Tailwind `md`
const BREAKPOINT_DESKTOP_PX = 1024; // Tailwind `lg`

// ---------------------------------------------------------------------------
// Camera — one config per breakpoint. Mobile/tablet sit further back and use
// a wider FOV so the full cake stays in frame on narrow, tall viewports
// instead of being cropped by the shorter canvas height.
// ---------------------------------------------------------------------------
const CAMERA_CONFIG = {
  mobile: { position: [4.4, 2.8, 6.2], fov: 45 },
  tablet: { position: [3.8, 2.6, 5.4], fov: 40 },
  desktop: { position: [3.2, 2.4, 4.6], fov: 35 },
};

// Target the cake sits slightly above the floor; orbit pivot matches that height.
const ORBIT_TARGET = [0, 0.6, 0];

// ---------------------------------------------------------------------------
// Controls — rotate-only orbit, tuned for smooth touch drag on mobile.
// ---------------------------------------------------------------------------
const ORBIT_DAMPING_FACTOR = 0.08;
const ORBIT_ROTATE_SPEED = 0.6; // slightly slower than default: prevents overshoot on touch flicks

/**
 * Vertical rotation limits (radians) for OrbitControls.
 * Prevents the camera from dipping below the floor plane or
 * flying up to an unflattering top-down angle.
 * - MIN: slightly above straight-down-the-barrel (keeps a hero angle)
 * - MAX: just short of horizon level (keeps the floor/shadow in frame)
 */
const POLAR_ANGLE_MIN = Math.PI / 4; // 45°
const POLAR_ANGLE_MAX = Math.PI / 2.1; // ~85.7°, just above the ground plane

// ---------------------------------------------------------------------------
// Lighting — warm three-point rig + rim light, tuned for a cinematic mood.
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

// Key-light shadow frustum — sized to just cover the cake + contact shadow.
const SHADOW_MAP_SIZE = 2048;
const SHADOW_CAMERA_NEAR = 0.5;
const SHADOW_CAMERA_FAR = 20;
const SHADOW_CAMERA_BOUNDS = 5; // left/right/top/bottom, symmetric
const SHADOW_BIAS = -0.0005; // avoids shadow acne on curved icing geometry

// ---------------------------------------------------------------------------
// Ground contact shadow (replaces a full floor mesh).
// ---------------------------------------------------------------------------
const CONTACT_SHADOW_OPACITY = 0.55;
const CONTACT_SHADOW_SCALE = 8;
const CONTACT_SHADOW_BLUR = 2.6;
const CONTACT_SHADOW_FAR = 4;

// ---------------------------------------------------------------------------
// Renderer.
// ---------------------------------------------------------------------------
const DPR_RANGE = [1, 2]; // caps pixel ratio on high-DPI phones to protect frame rate
const TONE_MAPPING_EXPOSURE = 1.1;

// Scene background — kept identical to the wrapping div's Tailwind background
// (neutral-950) so the WebGL clear color and the surrounding page never seam.
const SCENE_BACKGROUND_COLOR = "#0a0a0a";

/**
 * Resolves the active layout tier from viewport width, throttled to
 * animation frames so resize/orientation-change events on mid-range Android
 * devices don't trigger a re-render per pixel.
 */
function resolveBreakpoint(width) {
  if (width >= BREAKPOINT_DESKTOP_PX) return "desktop";
  if (width >= BREAKPOINT_TABLET_PX) return "tablet";
  return "mobile";
}

function useResponsiveBreakpoint() {
  const [breakpoint, setBreakpoint] = useState(() =>
    typeof window === "undefined" ? "desktop" : resolveBreakpoint(window.innerWidth)
  );

  useEffect(() => {
    let frameId = null;

    const handleResize = () => {
      if (frameId !== null) return;
      frameId = requestAnimationFrame(() => {
        setBreakpoint(resolveBreakpoint(window.innerWidth));
        frameId = null;
      });
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, []);

  return breakpoint;
}

/** Feature-detects WebGL before the Canvas ever mounts a renderer. */
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

/** Backstop for renderer/context-loss errors thrown after Canvas has mounted. */
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

/**
 * CakeScene
 *
 * Owns all Three.js scene infrastructure: renderer/canvas config, camera,
 * lighting rig, environment/reflections, and camera controls.
 *
 * Deliberately contains no cake geometry — that responsibility belongs
 * entirely to <CakeModel />, keeping this component a pure "stage" that
 * any future model can be dropped into.
 */
export default function CakeScene() {
  const breakpoint = useResponsiveBreakpoint();
  const [webglSupported] = useState(isWebGLSupported);

  // Stable object identity per breakpoint — avoids re-triggering R3F's
  // camera-prop-sync effect on every parent render.
  const cameraSettings = useMemo(() => CAMERA_CONFIG[breakpoint], [breakpoint]);

  const containerClassName =
    "relative w-full h-[360px] sm:h-[420px] md:h-[480px] lg:h-[600px] " +
    "overflow-hidden rounded-2xl bg-neutral-950";

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
          // Cap device pixel ratio to balance sharpness vs. GPU cost on high-DPI screens.
          dpr={DPR_RANGE}
          camera={cameraSettings}
          gl={{
            antialias: true,
            // ACES filmic tone mapping gives the warm, cinematic contrast a product
            // render needs instead of the flat default linear output.
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: TONE_MAPPING_EXPOSURE,
          }}
          onCreated={({ gl, scene }) => {
            // Match the renderer clear color to the wrapping div's background
            // so there's no visible seam between the DOM and the WebGL canvas.
            gl.setClearColor(SCENE_BACKGROUND_COLOR, 1);
            scene.background = new THREE.Color(SCENE_BACKGROUND_COLOR);
          }}
        >
          <Suspense fallback={null}>
            {/* ---------- Lighting rig (three-point + rim) ---------- */}

            {/* Ambient: soft base fill so shadows never crush to pure black. */}
            <ambientLight intensity={LIGHT_INTENSITY_AMBIENT} color={LIGHT_COLOR_AMBIENT} />

            {/* Key light: warm, directional, casts the primary shadow. */}
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

            {/* Fill light: cooler, low-intensity, opposite the key light to soften shadows. */}
            <directionalLight
              position={FILL_LIGHT_POSITION}
              intensity={LIGHT_INTENSITY_FILL}
              color={LIGHT_COLOR_FILL}
            />

            {/* Rim light: grazing backlight that separates the cake from the dark background. */}
            <spotLight
              position={RIM_LIGHT_POSITION}
              intensity={LIGHT_INTENSITY_RIM}
              color={LIGHT_COLOR_RIM}
              angle={RIM_LIGHT_ANGLE}
              penumbra={RIM_LIGHT_PENUMBRA}
              distance={RIM_LIGHT_DISTANCE}
            />

            {/* ---------- Environment ---------- */}
            {/* Studio HDRI drives realistic reflections/highlights on icing and frosting. */}
            <Environment preset="studio" />

            {/* ---------- Subject ---------- */}
            <CakeModel />

            {/* Soft contact shadow grounds the cake without needing a full floor mesh. */}
            <ContactShadows
              position={[0, -0.001, 0]}
              opacity={CONTACT_SHADOW_OPACITY}
              scale={CONTACT_SHADOW_SCALE}
              blur={CONTACT_SHADOW_BLUR}
              far={CONTACT_SHADOW_FAR}
            />

            {/* ---------- Controls ---------- */}
            <OrbitControls
              target={ORBIT_TARGET}
              enableZoom={false}
              enablePan={false}
              enableDamping
              dampingFactor={ORBIT_DAMPING_FACTOR}
              rotateSpeed={ORBIT_ROTATE_SPEED}
              minPolarAngle={POLAR_ANGLE_MIN}
              maxPolarAngle={POLAR_ANGLE_MAX}
              // Rotation-only: no zoom/pan means the composition set above is preserved.
              enableRotate
              // Single-finger drag maps directly to rotate on touch devices.
              touches={{ ONE: THREE.TOUCH.ROTATE }}
            />
          </Suspense>
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}