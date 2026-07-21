import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import CakeModel from "../cake/CakeModel"

export default function BirthdayCake() {
  return (
    <section
      aria-label="Birthday cake"
      className="min-h-[75vh] flex items-center justify-center bg-red-100/70"
    >
      <div className="w-full h-[70vh] ">
        <Canvas
          camera={{
            position: [3, 2.5, 10],
            fov: 48,
          }}
          shadows
        >
          {/* Lights */}
          <ambientLight intensity={1.2} />

          <directionalLight
            position={[5, 8, 5]}
            intensity={2}
            castShadow
          />

          {/* Cake */}
          <CakeModel />

          {/* Camera controls (temporary for testing) */}
          <OrbitControls />
        </Canvas>
      </div>
    </section>
  );
}