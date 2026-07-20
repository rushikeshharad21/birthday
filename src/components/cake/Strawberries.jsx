import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { CAKE_TOP_SURFACE_Y, CAKE_TOP_LAYER_RADIUS } from "./cakeDimensions";

// ---------------------------------------------------------------------------
// Layout — how many strawberries, and where the ring sits. Placed between
// the center swirl and the rosette ring (CreamRosettes sits at 0.82 of
// CAKE_TOP_LAYER_RADIUS) so the two decorations don't collide.
// ---------------------------------------------------------------------------
const STRAWBERRY_COUNT = 5;
const STRAWBERRY_ANGULAR_STEP = (Math.PI * 2) / STRAWBERRY_COUNT;

const STRAWBERRY_PLACEMENT_RADIUS_RATIO = 0.48;
const STRAWBERRY_PLACEMENT_RADIUS =
  CAKE_TOP_LAYER_RADIUS * STRAWBERRY_PLACEMENT_RADIUS_RATIO;

// ---------------------------------------------------------------------------
// Body profile — classic teardrop: flat-ish shoulder near the base (where
// it sits on the icing), widest a third of the way up, tapering to a point
// at the top. Sized as a ratio of CAKE_TOP_LAYER_RADIUS so it scales with
// the cake rather than assuming an absolute world size.
// ---------------------------------------------------------------------------
const BODY_RADIUS_RATIO = 0.15;
const BODY_RADIUS = CAKE_TOP_LAYER_RADIUS * BODY_RADIUS_RATIO;

const BODY_HEIGHT_RATIO = 0.34;
const BODY_HEIGHT = CAKE_TOP_LAYER_RADIUS * BODY_HEIGHT_RATIO;

const BODY_SHOULDER_T = 0.32; // where along the height (0=base,1=tip) the body is widest
const BODY_SHOULDER_RADIUS_RATIO = 1.0; // widest point radius, relative to BODY_RADIUS
const BODY_BASE_RADIUS_RATIO = 0.72; // base is narrower than the shoulder — real strawberries pinch in at the stem end
const BODY_TAPER_POWER = 1.35; // >1 = point forms late, giving a fuller body before the tip

const BODY_PROFILE_SEGMENTS = 20;
const BODY_LATHE_RADIAL_SEGMENTS = 16; // low-poly on purpose — seeds/color read at this size, not geometric facets

/**
 * Samples the strawberry body's 2D (radius, height) profile. A single
 * smooth curve through base -> shoulder -> tip, built from two blended
 * power curves rather than a sphere, so the silhouette reads as a
 * strawberry rather than a cone or a teardrop-of-revolution with a hard
 * kink at the shoulder.
 */
function buildStrawberryProfilePoints() {
  const points = [];
  points.push(new THREE.Vector2(0, 0));

  for (let i = 0; i <= BODY_PROFILE_SEGMENTS; i += 1) {
    const t = i / BODY_PROFILE_SEGMENTS;
    const y = t * BODY_HEIGHT;

    let radius;
    if (t <= BODY_SHOULDER_T) {
      // Base -> shoulder: ease outward from the narrow base to the
      // widest point.
      const localT = t / BODY_SHOULDER_T;
      const eased = Math.sin(localT * (Math.PI / 2));
      radius =
        BODY_RADIUS *
        (BODY_BASE_RADIUS_RATIO +
          (BODY_SHOULDER_RADIUS_RATIO - BODY_BASE_RADIUS_RATIO) * eased);
    } else {
      // Shoulder -> tip: power-curve taper down to a point.
      const localT = (t - BODY_SHOULDER_T) / (1 - BODY_SHOULDER_T);
      radius =
        BODY_RADIUS * BODY_SHOULDER_RADIUS_RATIO * Math.pow(1 - localT, BODY_TAPER_POWER);
    }

    points.push(new THREE.Vector2(Math.max(radius, 0.0001), y));
  }

  points[points.length - 1].x = 0; // exact point at the tip, no floating-point sliver
  return points;
}

// ---------------------------------------------------------------------------
// LOOK DEV: seed texture via baked vertex color (same technique as
// CenterCherry's per-vertex color variation) — costs nothing at runtime,
// no texture asset needed. Small pale-yellow flecks scattered across the
// red body using a deterministic multi-frequency signal so they read as
// achenes (strawberry seeds) rather than noise.
// ---------------------------------------------------------------------------
const STRAWBERRY_BASE_COLOR = new THREE.Color("#c81e3a");
const SEED_COLOR = new THREE.Color("#f3d9a0");
const SEED_FREQUENCY_THETA = 9; // seed rows around the circumference
const SEED_FREQUENCY_Y = 7; // seed rows up the height
const SEED_THRESHOLD = 0.78; // higher = fewer, more isolated seed flecks

function buildStrawberryGeometry() {
  const geometry = new THREE.LatheGeometry(
    buildStrawberryProfilePoints(),
    BODY_LATHE_RADIAL_SEGMENTS
  );

  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const tempColor = new THREE.Color();
  const vertex = new THREE.Vector3();

  for (let i = 0; i < position.count; i += 1) {
    vertex.fromBufferAttribute(position, i);
    const theta = Math.atan2(vertex.z, vertex.x);
    const yNorm = THREE.MathUtils.clamp(vertex.y / BODY_HEIGHT, 0, 1);

    const seedSignal =
      Math.sin(theta * SEED_FREQUENCY_THETA + yNorm * 6.0) *
      Math.sin(yNorm * SEED_FREQUENCY_Y * Math.PI);
    const isSeed = seedSignal > SEED_THRESHOLD;

    tempColor.copy(isSeed ? SEED_COLOR : STRAWBERRY_BASE_COLOR);
    // Faint per-vertex darkening toward the base, like real fruit shading.
    tempColor.offsetHSL(0, 0, -0.05 * (1 - yNorm));

    colors[i * 3] = tempColor.r;
    colors[i * 3 + 1] = tempColor.g;
    colors[i * 3 + 2] = tempColor.b;
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

const strawberryBodyGeometry = buildStrawberryGeometry();

const strawberryBodyMaterial = new THREE.MeshStandardMaterial({
  color: "#ffffff", // neutral so it multiplies cleanly with the baked vertex colors
  vertexColors: true,
  roughness: 0.35,
  metalness: 0,
});

// ---------------------------------------------------------------------------
// Calyx (the green leafy cap) — a shallow, flared cone sitting at the base
// so the leaves read as splaying outward right where the fruit meets the
// icing, the same way a hulled strawberry's cap sits when placed tip-up.
// ---------------------------------------------------------------------------
const CALYX_RADIUS_RATIO = 1.15; // relative to BODY_RADIUS at the base — leaves peek past the body's own silhouette
const CALYX_RADIUS = BODY_RADIUS * CALYX_RADIUS_RATIO;
const CALYX_HEIGHT_RATIO = 0.22;
const CALYX_HEIGHT = BODY_RADIUS * CALYX_HEIGHT_RATIO;
const CALYX_LEAF_COUNT = 6;
const CALYX_RADIAL_SEGMENTS = CALYX_LEAF_COUNT * 2; // flat/pointed alternation reads as individual leaf tips

/**
 * A flattened, star-edged cone: radius alternates between CALYX_RADIUS
 * (leaf tip) and a smaller inset radius (between leaves) around the
 * circumference, giving a scalloped silhouette instead of a plain circle.
 */
function buildCalyxGeometry() {
  const geometry = new THREE.ConeGeometry(
    CALYX_RADIUS,
    CALYX_HEIGHT,
    CALYX_RADIAL_SEGMENTS,
    1,
    true
  );
  geometry.rotateX(Math.PI); // apex down, into the body; flared rim up and out

  const position = geometry.attributes.position;
  const vertex = new THREE.Vector3();
  const LEAF_INSET_RATIO = 0.55;

  for (let i = 0; i < position.count; i += 1) {
    vertex.fromBufferAttribute(position, i);
    if (Math.abs(vertex.y) < CALYX_HEIGHT * 0.01) continue; // skip apex vertex

    const theta = Math.atan2(vertex.z, vertex.x);
    const leafPhase = ((theta / (Math.PI * 2)) * CALYX_LEAF_COUNT) % 1;
    const isLeafTip = Math.abs(leafPhase - 0.5) < 0.25;
    const radialScale = isLeafTip ? 1 : LEAF_INSET_RATIO;

    vertex.x *= radialScale;
    vertex.z *= radialScale;
    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  geometry.computeVertexNormals();
  return geometry;
}

const calyxGeometry = buildCalyxGeometry();

const calyxMaterial = new THREE.MeshStandardMaterial({
  color: "#4f7a3d",
  roughness: 0.6,
  metalness: 0,
});

// ---------------------------------------------------------------------------
// Reusable transform helper + deterministic per-instance variation, same
// pattern as CreamRosettes: fixed non-repeating-multiplier formulas, not
// Math.random(), so placement is reproducible across reloads.
// ---------------------------------------------------------------------------
const dummy = new THREE.Object3D();

const HEADING_VARIATION_AMPLITUDE = 0.4; // radians — strawberries can face any which way, unlike piped rosettes
const SCALE_VARIATION_RATIO = 0.08;
const TILT_VARIATION_AMPLITUDE = 0.12; // slight lean, as if resting naturally rather than machine-placed

export default function Strawberries() {
  const bodyRef = useRef(null);
  const calyxRef = useRef(null);

  useLayoutEffect(() => {
    const bodyMesh = bodyRef.current;
    const calyxMesh = calyxRef.current;
    if (!bodyMesh || !calyxMesh) return;

    for (let i = 0; i < STRAWBERRY_COUNT; i += 1) {
      const angle = i * STRAWBERRY_ANGULAR_STEP;
      const x = STRAWBERRY_PLACEMENT_RADIUS * Math.cos(angle);
      const z = STRAWBERRY_PLACEMENT_RADIUS * Math.sin(angle);

      const heading = Math.sin(i * 2.399963) * HEADING_VARIATION_AMPLITUDE + i;
      const scaleFactor = 1 + Math.cos(i * 1.618034) * SCALE_VARIATION_RATIO;
      const tiltX = Math.sin(i * 0.918273) * TILT_VARIATION_AMPLITUDE;
      const tiltZ = Math.cos(i * 1.207134) * TILT_VARIATION_AMPLITUDE;

      // Body: sits on the icing, base at y=0 locally.
      dummy.position.set(x, CAKE_TOP_SURFACE_Y, z);
      dummy.rotation.set(tiltX, heading, tiltZ);
      dummy.scale.setScalar(scaleFactor);
      dummy.updateMatrix();
      bodyMesh.setMatrixAt(i, dummy.matrix);

      // Calyx: same transform, just nudged up to the base of the body
      // (slightly embedded so there's no seam) rather than recomputed.
      dummy.position.set(
        x,
        CAKE_TOP_SURFACE_Y + CALYX_HEIGHT * 0.15 * scaleFactor,
        z
      );
      dummy.updateMatrix();
      calyxMesh.setMatrixAt(i, dummy.matrix);
    }

    bodyMesh.instanceMatrix.needsUpdate = true;
    calyxMesh.instanceMatrix.needsUpdate = true;
    bodyMesh.computeBoundingSphere();
    calyxMesh.computeBoundingSphere();
  }, []);

  return (
    <group name="Strawberries">
      <instancedMesh
        ref={bodyRef}
        args={[strawberryBodyGeometry, strawberryBodyMaterial, STRAWBERRY_COUNT]}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={calyxRef}
        args={[calyxGeometry, calyxMaterial, STRAWBERRY_COUNT]}
        castShadow
        receiveShadow
      />
    </group>
  );
}

// Exported for camera-framing math (CakeScene.js) so the bounding sphere
// used to guarantee no clipping can account for strawberries sitting away
// from center, the same way it already accounts for the cherry tip.
export const STRAWBERRY_OUTER_RADIUS =
  STRAWBERRY_PLACEMENT_RADIUS + Math.max(BODY_RADIUS, CALYX_RADIUS);