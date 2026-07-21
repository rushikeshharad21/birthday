import * as THREE from "three";

// ---------------------------------------------------------------------------
// GPU-driven look-dev for firework spark particles.
//
// Why a custom shader instead of Phase 6's approach (JS-side scale-to-zero
// + color dimming on a MeshBasicMaterial): shrinking a 3D sphere to a
// point reads as the particle "collapsing" up close, not fading, and can't
// produce a soft glowing edge. This shader keeps size/position exactly as
// Phase 6 already wires them (via instanceMatrix, set from JS every frame
// — unchanged), and adds three things purely on the GPU, per instance, at
// zero additional CPU cost per particle:
//
//   1. Real alpha-based fade (aFade attribute -> gl_FragColor.a) instead
//      of shrinking geometry to simulate fading.
//   2. A fresnel-style rim brightening, so each spark reads as a small
//      glowing ember with a brighter edge, not a flat-shaded ball.
//   3. A subtle per-particle twinkle (aSeed attribute + uTime uniform), so
//      a burst of sparks shimmers rather than pulsing in lockstep.
//
// Integration contract (wired into FireworkSystem.jsx as the next step,
// pending review of this file):
//   - the spark InstancedMesh's geometry needs two extra
//     InstancedBufferAttributes: "aFade" (float, one per instance, written
//     every frame from life/maxLife — replaces the current color-dimming
//     trick) and "aSeed" (float, one per instance, written ONCE at spawn
//     time in FireworkLauncher — a stable per-particle random value, never
//     re-randomized per frame, so a given spark's twinkle phase stays
//     consistent for its whole lifetime).
//   - the material needs a uTime uniform, incremented each frame in
//     FireworkSystem's existing useFrame loop.
//   - dummy.scale in FireworkSystem's writeSparks() should go back to a
//     constant SPARK_SIZE (no more *lifeRatio) once this lands, since fade
//     is now the shader's job, not the geometry's.
// ---------------------------------------------------------------------------

export const fireworkSparkVertexShader = /* glsl */ `
  attribute float aFade;
  attribute float aSeed;

  varying vec3 vColor;
  varying float vFade;
  varying float vSeed;
  varying vec3 vViewNormal;

  void main() {
    #ifdef USE_INSTANCING_COLOR
      vColor = instanceColor;
    #else
      vColor = vec3(1.0);
    #endif

    vFade = aFade;
    vSeed = aSeed;

    vec3 transformed = position;

    #ifdef USE_INSTANCING
      transformed = (instanceMatrix * vec4(transformed, 1.0)).xyz;
      // Uniform scale only (SPARK_SIZE is applied via dummy.scale.setScalar
      // in FireworkSystem, never non-uniformly) so transforming the normal
      // by the instance's upper 3x3 doesn't need an inverse-transpose —
      // a plain rotation/uniform-scale is normal-preserving up to length,
      // and we normalize afterward anyway.
      mat3 instanceNormalMatrix = mat3(instanceMatrix);
      vViewNormal = normalize(normalMatrix * instanceNormalMatrix * normal);
    #else
      vViewNormal = normalize(normalMatrix * normal);
    #endif

    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const fireworkSparkFragmentShader = /* glsl */ `
  uniform float uTime;

  varying vec3 vColor;
  varying float vFade;
  varying float vSeed;
  varying vec3 vViewNormal;

  void main() {
    // Fresnel-style rim brightening: sphere edges (where the view-space
    // normal points away from the camera) glow brighter than the center —
    // reads as a small glowing ember rather than a flat-shaded ball.
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    float rim = 1.0 - abs(dot(normalize(vViewNormal), viewDir));
    float glow = 0.55 + 0.9 * pow(rim, 2.0);

    // Subtle per-particle twinkle: a slow sine driven by uTime, phase-
    // offset per instance via aSeed so a burst shimmers rather than
    // pulsing in lockstep. Kept gentle (0.85-1.0 range) — sparkle, not
    // strobe.
    float twinkle = 0.85 + 0.15 * sin(uTime * 6.0 + vSeed * 6.2831853);

    vec3 finalColor = vColor * glow * twinkle;
    gl_FragColor = vec4(finalColor, vFade);
  }
`;

/**
 * Builds the ShaderMaterial for spark particles. Called once at module
 * scope by FireworkSystem.jsx (same "build once, reuse forever" discipline
 * as every other material in this codebase) — not per-frame, not per-
 * particle.
 */
export function createFireworkSparkMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: fireworkSparkVertexShader,
    fragmentShader: fireworkSparkFragmentShader,
    uniforms: {
      uTime: { value: 0 },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}