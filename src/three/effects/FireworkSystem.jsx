import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { easeOutCubic } from "../particles/FireworkLauncher";
import {
  SPARK_SIZE,
  TRAIL_TUBE_RADIUS,
  SMOKE_PUFF_SIZE,
  SMOKE_COLOR,
} from "../../config/fireworksConfig";

// ---------------------------------------------------------------------------
// Shared geometry + materials — module scope, built exactly once, reused by
// every instance within each InstancedMesh. Same discipline as the cake
// decorations (CenterCherry, CreamRosettes, CakeDrips).
//
// Fade/glow approach for this phase: shrink-to-nothing + color dimming,
// combined with additive blending for sparks/trails so overlapping
// particles brighten naturally. Phase 7's shader replaces this with a real
// per-instance alpha curve for a softer falloff — this phase is plumbing,
// not final look-dev.
// ---------------------------------------------------------------------------
const trailGeometry = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
const sparkGeometry = new THREE.SphereGeometry(1, 8, 6);
const smokeGeometry = new THREE.SphereGeometry(1, 8, 6);

const trailMaterial = new THREE.MeshBasicMaterial({
  color: "#ffffff", // multiplies with per-instance color, kept neutral
  transparent: true,
  opacity: 0.85,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

const sparkMaterial = new THREE.MeshBasicMaterial({
  color: "#ffffff",
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

const smokeMaterial = new THREE.MeshBasicMaterial({
  color: SMOKE_COLOR,
  transparent: true,
  opacity: 0.22,
  depthWrite: false,
});

// ---------------------------------------------------------------------------
// Reused scratch objects — mutated in place every frame, never reallocated.
// Same pattern as CakeModel's `dummy` Object3D for instance matrices.
// ---------------------------------------------------------------------------
const dummy = new THREE.Object3D();
const scratchOrigin = new THREE.Vector3();
const scratchEnd = new THREE.Vector3();
const scratchDirection = new THREE.Vector3();
const scratchColor = new THREE.Color();
const UP_AXIS = new THREE.Vector3(0, 1, 0);

/**
 * Writes one InstancedMesh's matrices/colors from a ParticlePool's
 * currently-active particles. Rather than hiding inactive slots, this sets
 * `mesh.count` to the pool's activeCount and writes instances densely from
 * loop index 0 — cheaper than zero-scaling the whole capacity every frame,
 * and correct because InstancedMesh only draws the first `count` instances
 * regardless of what stale data sits beyond that in the buffer.
 */
function writeTrails(pool, mesh) {
  if (!mesh) return;
  const count = pool.activeCount;
  mesh.count = count;

  for (let i = 0; i < count; i += 1) {
    const slot = pool.activeIndices[i];
    const origin = pool.get("origin", slot);
    const apex = pool.get("apex", slot);
    const progress = Math.min(pool.get("progress", slot)[0], 1);
    const color = pool.get("color", slot);

    const eased = easeOutCubic(progress);
    scratchOrigin.set(origin[0], origin[1], origin[2]);
    scratchEnd.set(
      origin[0] + (apex[0] - origin[0]) * eased,
      origin[1] + (apex[1] - origin[1]) * eased,
      origin[2] + (apex[2] - origin[2]) * eased
    );

    const length = scratchOrigin.distanceTo(scratchEnd);
    scratchDirection.copy(scratchEnd).sub(scratchOrigin);
    const hasDirection = scratchDirection.lengthSq() > 0.000001;
    if (hasDirection) scratchDirection.normalize();

    dummy.position.copy(scratchOrigin).lerp(scratchEnd, 0.5);
    dummy.quaternion.setFromUnitVectors(
      UP_AXIS,
      hasDirection ? scratchDirection : UP_AXIS
    );
    dummy.scale.set(TRAIL_TUBE_RADIUS, Math.max(length, 0.0001), TRAIL_TUBE_RADIUS);
    dummy.updateMatrix();

    mesh.setMatrixAt(i, dummy.matrix);
    scratchColor.setRGB(color[0], color[1], color[2]);
    mesh.setColorAt(i, scratchColor);
  }

  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

function writeSparks(pool, mesh) {
  if (!mesh) return;
  const count = pool.activeCount;
  mesh.count = count;

  for (let i = 0; i < count; i += 1) {
    const slot = pool.activeIndices[i];
    const position = pool.get("position", slot);
    const color = pool.get("color", slot);
    const life = pool.get("life", slot)[0];
    const maxLife = pool.get("maxLife", slot)[0];
    const lifeRatio = Math.max(life / maxLife, 0);

    dummy.position.set(position[0], position[1], position[2]);
    dummy.quaternion.identity();
    dummy.scale.setScalar(Math.max(SPARK_SIZE * lifeRatio, 0.0001));
    dummy.updateMatrix();

    mesh.setMatrixAt(i, dummy.matrix);
    // Dimming color alongside shrinking scale — with additive blending,
    // both read as the spark losing brightness as it dies, not just size.
    scratchColor.setRGB(color[0] * lifeRatio, color[1] * lifeRatio, color[2] * lifeRatio);
    mesh.setColorAt(i, scratchColor);
  }

  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

function writeSmoke(pool, mesh) {
  if (!mesh) return;
  const count = pool.activeCount;
  mesh.count = count;

  for (let i = 0; i < count; i += 1) {
    const slot = pool.activeIndices[i];
    const delay = pool.get("delay", slot)[0];
    const position = pool.get("position", slot);
    const life = pool.get("life", slot)[0];
    const maxLife = pool.get("maxLife", slot)[0];
    const lifeRatio = Math.max(life / maxLife, 0);

    dummy.position.set(position[0], position[1], position[2]);
    dummy.quaternion.identity();

    // Still waiting on its spawn delay — kept in the pool (it's occupying
    // a slot and counts toward activeCount) but not yet visible, so it
    // doesn't pop into existence before its delay elapses.
    let scale = 0;
    if (delay <= 0) {
      const growth = 1 + (1 - lifeRatio) * 0.8; // puff expands as it ages
      const fadeOut = Math.min(lifeRatio * 2, 1); // shrinks out over the last half of its life
      scale = SMOKE_PUFF_SIZE * growth * fadeOut;
    }
    dummy.scale.setScalar(Math.max(scale, 0.0001));
    dummy.updateMatrix();

    mesh.setMatrixAt(i, dummy.matrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
}

/**
 * Renders a FireworkLauncher's live simulation state. Does NOT own the
 * launcher — a parent (useFireworkSequence, Phase 9) creates and drives
 * its lifecycle (start/stop); this component only calls update() each
 * frame and reflects the resulting pool state visually. `launcher` is
 * expected to be a stable, always-defined instance for as long as this
 * component is mounted — mount/unmount FireworkSystem itself if you need
 * to add/remove the whole effect, rather than passing a changing launcher.
 */
export default function FireworkSystem({ launcher }) {
  const trailRef = useRef(null);
  const sparkRef = useRef(null);
  const smokeRef = useRef(null);

  useFrame((_, delta) => {
    // Clamp delta so a backgrounded tab resuming (or a dev-tools pause)
    // doesn't integrate one huge physics step — particles would otherwise
    // visibly teleport instead of smoothly continuing.
    const dt = Math.min(delta, 1 / 30);
    launcher.update(dt);

    writeTrails(launcher.trailPool, trailRef.current);
    writeSparks(launcher.sparkPool, sparkRef.current);
    writeSmoke(launcher.smokePool, smokeRef.current);
  });

  return (
    <group name="FireworkSystem">
      <instancedMesh
        ref={trailRef}
        args={[trailGeometry, trailMaterial, launcher.trailPool.capacity]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={sparkRef}
        args={[sparkGeometry, sparkMaterial, launcher.sparkPool.capacity]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={smokeRef}
        args={[smokeGeometry, smokeMaterial, launcher.smokePool.capacity]}
        frustumCulled={false}
      />
    </group>
  );
}