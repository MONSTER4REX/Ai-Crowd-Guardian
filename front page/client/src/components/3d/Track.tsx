/**
 * ACG — The Red Thread rendered.
 * A glowing red core line + faint secondary line. Visibility grows
 * with reveal progress (0-1) so the runway materializes as the user
 * scrolls. Restraint: the line is a navigation/storytelling element,
 * not a neon tube.
 */
import { useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { trackSampled } from "@/data/track";

export default function Track({
  reveal = 1,
  flowMode = false,
}: {
  reveal?: number; // 0 -> hidden, 1 -> fully drawn
  flowMode?: boolean; // subtle dash animation when acting as crowd flow
}) {
  const geometry = useMemo(() => {
    const total = trackSampled.length;
    const drawCount = Math.max(2, Math.floor(total * reveal));
    const pts = trackSampled.slice(0, drawCount);
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [reveal]);

  // Re-animate geometry each frame so reveal slicing updates smoothly
  const coreRef = useMemo(() => new THREE.BufferGeometry(), []);
  const glowRef = useMemo(() => new THREE.BufferGeometry(), []);

  useFrame(() => {
    const total = trackSampled.length;
    const drawCount = Math.max(2, Math.floor(total * reveal));
    const pts = trackSampled.slice(0, drawCount);
    coreRef.setFromPoints(pts);
    glowRef.setFromPoints(pts);
  });

  return (
    <group>
      {/* Core: thin, crisp red line */}
      <line>
        <primitive object={coreRef} attach="geometry" />
        <lineBasicMaterial color="#E4002B" />
      </line>
      {/* Secondary: faint white guide line, slightly offset */}
      <line>
        <primitive object={glowRef} attach="geometry" />
        <lineBasicMaterial color="#E4002B" transparent opacity={0.18} />
      </line>
      {/* Soft glow halo — a wider, very faint line underneath */}
      <line scale={1.12 as never}>
        <primitive object={coreRef.clone()} attach="geometry" />
        <lineBasicMaterial color="#E4002B" transparent opacity={0.07} />
      </line>
    </group>
  );
}

/** Simple ground runner: dark polished surface + faint grid. */
export function Ground({
  scale = 60,
  withGrid = true,
  enabled = true,
}: {
  scale?: number;
  withGrid?: boolean;
  enabled?: boolean;
}) {
  if (!enabled) return null;
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -2]} receiveShadow>
        <planeGeometry args={[scale, scale]} />
        <meshStandardMaterial color="#0c0c10" roughness={0.92} metalness={0.05} />
      </mesh>
      {enabled && withGrid && (
        <gridHelper
          args={[scale, 60, "#1e1e26", "#15151c"]}
          position={[0, -0.06, -2]}
        />
      )}
    </>
  );
}
