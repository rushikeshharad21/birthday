import {
  Component,
  Suspense,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";

// ---------------------------------------------------------------------------
// Breakpoints — single source of truth for the WHOLE app's 3D scenes now,
// not just the cake. Any scene mounted inside SceneCanvas (cake today,
// fireworks/balloons later) reads the same tiers via useSceneViewport()
// instead of each maintaining its own resize listener.
// ---------------------------------------------------------------------------
const BREAKPOINT_TABLET_PX = 768;
const BREAKPOINT_DESKTOP_PX = 1024;
const BREAKPOINT_LAPTOP_PX = 1280;

export { BREAKPOINT_TABLET_PX, BREAKPOINT_DESKTOP_PX, BREAKPOINT_LAPTOP_PX };

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

// ---------------------------------------------------------------------------
// Viewport context — lets any child scene (CakeScene, FireworkSystem, ...)
// read {breakpoint, aspect} without each one re-attaching its own resize
// listener. SceneCanvas is the single owner of this state.
// ---------------------------------------------------------------------------
const SceneViewportContext = createContext(null);

export function useSceneViewport() {
  const ctx = useContext(SceneViewportContext);
  if (!ctx) {
    throw new Error("useSceneViewport must be called within a <SceneCanvas>.");
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// DPR — tiered by breakpoint. Unchanged values from the cake scene; this is
// a device-capability concern, not a cake concern, so it belongs here.
// ---------------------------------------------------------------------------
const DPR_RANGE_BY_BREAKPOINT = {
  mobile: [1, 1.5],
  tablet: [1, 1.75],
  laptop: [1, 2],
  desktop: [1, 2],
};

const TONE_MAPPING_EXPOSURE = 1.1;
const DEFAULT_SCENE_BACKGROUND_COLOR = "#0a0a0a";

// ---------------------------------------------------------------------------
// Lighting rig — moved from CakeScene.jsx verbatim (values unchanged). This
// becomes the shared studio rig for every scene mounted inside SceneCanvas,
// including fireworks later, so lighting stays visually consistent across
// features instead of each one inventing its own.
//
// shadow-camera bounds are the one thing that legitimately depends on
// WHAT'S in the scene (a wide cake needs a wider shadow frustum than a
// narrow one), so those are the single prop callers must pass in —
// everything else about the rig is scene-agnostic.
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

const SHADOW_MAP_SIZE = 2048;
const SHADOW_EDGE_BLEED_MARGIN = 1.5;
const SHADOW_CAMERA_NEAR = 0.5;
const SHADOW_BIAS = -0.0005;

const KEY_LIGHT_DISTANCE_TO_ORIGIN = new THREE.Vector3(...KEY_LIGHT_POSITION).length();
const SHADOW_CAMERA_FAR = KEY_LIGHT_DISTANCE_TO_ORIGIN + SHADOW_EDGE_BLEED_MARGIN;

/**
 * The shared studio lighting rig. `shadowExtent` is the only scene-specific
 * input — it's the radius the key light's shadow frustum must cover (e.g.
 * CakeScene passes CAKE_STAND_RADIUS + a margin). Everything else about the
 * rig (colors, intensities, positions) is intentionally fixed so every
 * feature mounted in SceneCanvas is lit identically.
 */
function SceneLighting({ shadowExtent }) {
  const shadowBounds = shadowExtent + SHADOW_EDGE_BLEED_MARGIN;

  return (
    <>
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
        shadow-camera-left={-shadowBounds}
        shadow-camera-right={shadowBounds}
        shadow-camera-top={shadowBounds}
        shadow-camera-bottom={-shadowBounds}
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
    </>
  );
}

// ---------------------------------------------------------------------------
// WebGL support check + fallback — moved from CakeScene.jsx verbatim, made
// generic (message is now a prop instead of a hardcoded cake-specific
// string) since any scene mounted here can reuse the same guard.
// ---------------------------------------------------------------------------
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

function SceneFallback({ message }) {
  return (
    <div className="flex h-full w-full items-center justify-center px-6 text-center">
      <p className="text-sm text-neutral-400">{message}</p>
    </div>
  );
}

const DEFAULT_FALLBACK_MESSAGE =
  "This 3D experience isn't supported in your current browser. Please try a modern browser.";

// ---------------------------------------------------------------------------
// SceneCanvas — the ONE <Canvas> in the app.
//
// `computeCamera(aspect, breakpoint)` stays a caller-supplied function
// rather than logic living here, because camera framing is inherently
// scene-content-specific (the cake's bounding-sphere math has no business
// living in a generic shell that fireworks will also use, and vice versa).
// SceneCanvas owns WHEN the camera gets positioned (on create + on
// breakpoint/aspect change); the caller owns HOW.
// ---------------------------------------------------------------------------
export default function SceneCanvas({
  children,
  computeCamera,
  shadowExtent,
  containerClassName,
  fallbackMessage = DEFAULT_FALLBACK_MESSAGE,
  backgroundColor = DEFAULT_SCENE_BACKGROUND_COLOR,
  debugLabel = "SceneCanvas",
}) {
  const { breakpoint, aspect } = useResponsiveViewport();
  const [webglSupported] = useState(isWebGLSupported);

  // Recomputed only when rounded aspect OR breakpoint changes — stable
  // identity across resize churn, no visible camera jump.
  const cameraSettings = useMemo(
    () => computeCamera(aspect, breakpoint),
    [aspect, breakpoint, computeCamera]
  );

  const dprRange = DPR_RANGE_BY_BREAKPOINT[breakpoint];

  if (!webglSupported) {
    return (
      <div className={containerClassName}>
        <SceneFallback message={fallbackMessage} />
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <WebGLErrorBoundary fallback={<SceneFallback message={fallbackMessage} />}>
        <SceneViewportContext.Provider value={{ breakpoint, aspect }}>
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
              gl.setClearColor(backgroundColor, 1);
              scene.background = new THREE.Color(backgroundColor);

              // Belt-and-suspenders: set the camera position directly here
              // too, not just via the `camera` prop — same reasoning as
              // before (guards against any prop-merge timing quirk).
              const { position, fov } = computeCamera(aspect, breakpoint);
              camera.position.set(...position);
              camera.fov = fov;
              camera.updateProjectionMatrix();

              // eslint-disable-next-line no-console
              console.log(`[${debugLabel}] camera framed:`, {
                breakpoint,
                position,
              });
            }}
          >
            <Suspense fallback={null}>
              <SceneLighting shadowExtent={shadowExtent} />
              <Environment preset="studio" />
              {children}
            </Suspense>
          </Canvas>
        </SceneViewportContext.Provider>
      </WebGLErrorBoundary>
    </div>
  );
}