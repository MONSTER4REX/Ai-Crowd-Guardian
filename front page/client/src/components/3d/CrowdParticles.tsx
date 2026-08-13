/**
 * ACG — Crowd particles.
 * Instanced dots that drift along the red thread, turning the racing
 * line into visible crowd flow. Cheap: one draw call, positions
 * updated in a useFrame loop tied to global progress + time.
 */
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { trackCurve } from "@/data/track";

const COUNT = 40;

export default function CrowdParticles({ reveal }: { reveal: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(() => Array.from({ length: COUNT }, (_, i) => i / COUNT), []);
  const base = useRef<Float32Array>(new Float32Array(COUNT));

  // Initialize every instance far below the horizon so no dots render
  // before the reveal ramps up — default matrices stack at the origin
  // and would otherwise appear as one huge white sphere.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const d = new THREE.Object3D();
    for (let i = 0; i < COUNT; i++) {
      d.position.set(0, -200, 0);
      d.scale.setScalar(0.001);
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current || reveal <= 0.005) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < COUNT; i++) {
      // Each dot travels the curve at its own speed, evenly staggered.
      // `seeds[i]` spans 0..1, so dots are spread across the entire
      // track instead of clustering into one opaque blob.
      const travel = (t * 0.06 + seeds[i]) % 1;
      const pos = trackCurve.getPointAt(travel);
      const size = reveal * (0.055 + Math.sin(seeds[i] * 23) * 0.02);
      dummy.position.set(pos.x, 0.14 + size, pos.z);
      dummy.scale.setScalar(size * 3);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = Math.min(0.45, reveal * 0.8);
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 8, 6]} />
      <meshBasicMaterial color="#F5F5F7" transparent opacity={0} />
    </instancedMesh>
  );
}
