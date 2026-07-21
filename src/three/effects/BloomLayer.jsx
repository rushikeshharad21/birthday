import { EffectComposer, Bloom } from "@react-three/postprocessing";
import {
  BLOOM_INTENSITY_BY_BREAKPOINT,
  BLOOM_LUMINANCE_THRESHOLD,
  BLOOM_LUMINANCE_SMOOTHING,
} from "../../config/fireworksConfig";

/**
 * Shared bloom pass — mounted once inside SceneCanvas (see SceneCanvas.jsx)
 * rather than per-feature, so every scene rendered there (the cake today,
 * fireworks once Phase 9 wires FireworkSystem in) shares one
 * postprocessing cost instead of each stacking its own EffectComposer.
 *
 * `breakpoint` is a prop rather than read via a hook here, deliberately —
 * SceneCanvas already owns that state, and having BloomLayer import a hook
 * back from SceneCanvas would create a circular module dependency
 * (SceneCanvas -> BloomLayer -> SceneCanvas) that's easy to break
 * accidentally under Vite's fast-refresh. A plain prop avoids the cycle
 * entirely.
 *
 * Note: since this mounts at the SceneCanvas level, it will apply to
 * everything in that scene, not just fireworks — including the cake's
 * existing bright highlights (icing sheen, cherry clearcoat). That's an
 * intentional, expected visual change once this lands: a little bit of
 * soft glow on the cake's own highlights too, not just future sparks.
 * BLOOM_LUMINANCE_THRESHOLD (0.25) keeps it restricted to genuinely bright
 * areas rather than glowing the whole scene.
 */
export default function BloomLayer({ breakpoint }) {
  const intensity =
    BLOOM_INTENSITY_BY_BREAKPOINT[breakpoint] ?? BLOOM_INTENSITY_BY_BREAKPOINT.desktop;

  return (
    <EffectComposer>
      <Bloom
        intensity={intensity}
        luminanceThreshold={BLOOM_LUMINANCE_THRESHOLD}
        luminanceSmoothing={BLOOM_LUMINANCE_SMOOTHING}
        mipmapBlur
      />
    </EffectComposer>
  );
}