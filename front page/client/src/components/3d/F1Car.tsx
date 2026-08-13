/**
 * ACG — F1Car: a convincing F1 car assembled from primitives.
 * Styled after the Red Bull RB19 livery in the user's reference:
 * matte dark navy body, red bull red engine cover, yellow nose &
 * accents. Structured as one group so a GLTF/GLB can replace it
 * later with zero changes to the storyboard.
 *
 * Style: PRD dark Grand Prix / telemetry — restrained glow, precise surfaces.
 */
import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const MATTE = "#171a24"; // dark navy
const MATTE_DEEP = "#10121a";
const RED = "#e4002b";
const YELLOW = "#ffd100";
const CARBON = "#23252c";
const WHITE = "#e8e8ec";

function Wheel({ position, radius = 0.28 }: { position: [number, number, number]; radius?: number }) {
  return (
    <group position={position} rotation={[0, 0, Math.PI / 2]}>
      <mesh>
        <torusGeometry args={[radius, 0.115, 12, 24]} />
        <meshStandardMaterial color="#111114" roughness={0.95} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[radius * 0.62, radius * 0.62, 0.22, 16]} />
        <meshStandardMaterial color={CARBON} roughness={0.6} metalness={0.4} />
      </mesh>
    </group>
  );
}

export default function F1Car({
  scale = 1,
  suspension = true,
}: {
  scale?: number;
  suspension?: boolean;
}) {
  const bodyRef = useRef<THREE.Group>(null);

  // subtle idle vibration — engine running at the start line
  useFrame(({ clock }) => {
    if (!bodyRef.current || !suspension) return;
    const t = clock.getElapsedTime();
    bodyRef.current.position.y = Math.sin(t * 41) * 0.0035;
  });

  return (
    <group ref={bodyRef} scale={scale}>
      {/* Main monocoque */}
      <mesh position={[0, 0.16, 0]} castShadow>
        <boxGeometry args={[0.62, 0.16, 2.1]} />
        <meshStandardMaterial color={MATTE} roughness={0.55} />
      </mesh>
      {/* Red accent line along the spine of the monocoque */}
      <mesh position={[0, 0.245, -0.6]}>
        <boxGeometry args={[0.26, 0.006, 1.6]} />
        <meshStandardMaterial color={RED} emissive={RED} emissiveIntensity={0.15} />
      </mesh>
      {/* Cockpit / driver halo area */}
      <mesh position={[0, 0.27, -0.15]} castShadow>
        <boxGeometry args={[0.38, 0.1, 0.75]} />
        <meshStandardMaterial color={MATTE_DEEP} roughness={0.5} />
      </mesh>
      {/* Halo (yellow) */}
      <mesh position={[0, 0.3, 0.28]} rotation={[0.3, 0, 0]}>
        <torusGeometry args={[0.14, 0.014, 8, 20, Math.PI]} />
        <meshStandardMaterial color={YELLOW} roughness={0.3} metalness={0.4} />
      </mesh>
      {/* Helmet */}
      <mesh position={[0, 0.34, -0.12]}>
        <sphereGeometry args={[0.09, 16, 12]} />
        <meshStandardMaterial color={YELLOW} roughness={0.35} metalness={0.2} />
      </mesh>
      {/* Nose cone (yellow) */}
      <mesh position={[0, 0.13, 1.55]} castShadow rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.085, 1.05, 8]} />
        <meshStandardMaterial color={YELLOW} roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Front wing — three-element aero */}
      <group position={[0, 0.09, 2.0]}>
        <mesh castShadow>
          <boxGeometry args={[1.5, 0.03, 0.32]} />
          <meshStandardMaterial color={RED} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.025, 0.02]}>
          <boxGeometry args={[1.5, 0.03, 0.22]} />
          <meshStandardMaterial color={MATTE_DEEP} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.035, 0.08]}>
          <boxGeometry args={[1.5, 0.02, 0.22]} />
          <meshStandardMaterial color={MATTE_DEEP} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.02, 0.02]}>
          <boxGeometry args={[0.42, 0.05, 0.2]} />
          <meshStandardMaterial color={MATTE_DEEP} roughness={0.6} />
        </mesh>
      </group>
      {/* Sidepods — tapered wedge silhouette via rotated boxes */}
      <mesh position={[0.34, 0.14, -0.55]} rotation={[0, 0, -0.35]} castShadow>
        <boxGeometry args={[0.13, 0.22, 1.1]} />
        <meshStandardMaterial color={MATTE} roughness={0.5} />
      </mesh>
      <mesh position={[-0.34, 0.14, -0.55]} rotation={[0, 0, 0.35]} castShadow>
        <boxGeometry args={[0.13, 0.22, 1.1]} />
        <meshStandardMaterial color={MATTE} roughness={0.5} />
      </mesh>
      {/* White sponsor stripe along each sidepod */}
      <mesh position={[0.435, 0.13, -0.55]} rotation={[0, 0, -0.35]}>
        <boxGeometry args={[0.012, 0.07, 1.12]} />
        <meshStandardMaterial color={WHITE} emissive={WHITE} emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[-0.435, 0.13, -0.55]} rotation={[0, 0, 0.35]}>
        <boxGeometry args={[0.012, 0.07, 1.12]} />
        <meshStandardMaterial color={WHITE} emissive={WHITE} emissiveIntensity={0.12} />
      </mesh>
      {/* Sidepod yellow accents */}
      <mesh position={[0.35, 0.12, -0.92]} rotation={[0, 0, -0.35]}>
        <boxGeometry args={[0.115, 0.14, 0.32]} />
        <meshStandardMaterial color={YELLOW} roughness={0.4} />
      </mesh>
      <mesh position={[-0.35, 0.12, -0.92]} rotation={[0, 0, 0.35]}>
        <boxGeometry args={[0.115, 0.14, 0.32]} />
        <meshStandardMaterial color={YELLOW} roughness={0.4} />
      </mesh>
      {/* Engine cover (red) */}
      <mesh position={[0, 0.2, -1.35]} castShadow>
        <boxGeometry args={[0.34, 0.13, 1.0]} />
        <meshStandardMaterial color={RED} roughness={0.5} />
      </mesh>
      {/* Airbox / shark fin */}
      <mesh position={[0, 0.28, -1.1]} castShadow>
        <boxGeometry args={[0.16, 0.12, 0.55]} />
        <meshStandardMaterial color={MATTE_DEEP} roughness={0.55} />
      </mesh>
      {/* Rear wing with endplates */}
      <group position={[0, 0.3, -2.05]}>
        <mesh castShadow>
          <boxGeometry args={[0.95, 0.17, 0.06]} />
          <meshStandardMaterial color={MATTE_DEEP} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.09, 0]} castShadow>
          <boxGeometry args={[1.05, 0.04, 0.22]} />
          <meshStandardMaterial color={RED} roughness={0.5} />
        </mesh>
        <mesh position={[0.49, 0, 0]} castShadow>
          <boxGeometry args={[0.03, 0.3, 0.3]} />
          <meshStandardMaterial color={RED} roughness={0.5} />
        </mesh>
        <mesh position={[-0.49, 0, 0]} castShadow>
          <boxGeometry args={[0.03, 0.3, 0.3]} />
          <meshStandardMaterial color={RED} roughness={0.5} />
        </mesh>
      </group>
      {/* Number-1 decal on the nose */}
      <mesh position={[0, 0.2, 1.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.18, 0.3]} />
        <meshStandardMaterial color={WHITE} emissive={WHITE} emissiveIntensity={0.25} />
      </mesh>
      {/* Wheels */}
      <Wheel position={[0.62, 0.28, 1.45]} />
      <Wheel position={[-0.62, 0.28, 1.45]} />
      <Wheel position={[0.74, 0.28, -1.35]} radius={0.32} />
      <Wheel position={[-0.74, 0.28, -1.35]} radius={0.32} />
      {/* Yellow accent stripe */}
      <mesh position={[0, 0.245, 0.45]}>
        <boxGeometry args={[0.16, 0.008, 1.2]} />
        <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}
