/**
 * ACG — The master 3D scene.
 * Everything derives from ONE normalized progress value (0-1),
 * passed in by the Storyboard container. No internal timers drive
 * the story; scroll is the master controller.
 *
 * Style: PRD dark Grand Prix / telemetry — #0A0A0D world, #E4002B
 * red thread, restrained lighting, camera = F1 broadcast → digital-twin drone.
 */
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import F1Car from "./F1Car";
import Track, { Ground } from "./Track";
import CrowdParticles from "./CrowdParticles";
import { trackCurve, trackSampled } from "@/data/track";
import { VENUE_NODES, VENUE_EDGES } from "@/data/venue";

/* ---------- derived helpers ---------- */

/** Camera keyframes: position & lookAt along the journey. */
// Opening frame: low, close, cinematic — the car fills the frame
// and faces away into depth, red thread stretching ahead of it.
// Opening frame: positioned ahead of the car's start, turned back
// to see the car up close with the red thread rising behind it.
// NOTE: camera is placed manually after verifying tangent direction.
// Camera behind the car at t=0: car sits at (-14,0,9) facing toward
// the second waypoint (-9.5,5.5), so "behind" is deeper into +Z and -X.
// Camera behind the car at t=0: car sits at (-14,0,9) facing toward
// the second waypoint (-9.5,5.5), so "behind" is deeper into +Z and -X.
// Camera behind the car at t=0: car sits at (-14,0,9) facing toward
// the second waypoint (-9.5,5.5), so "behind" is deeper into +Z and -X.
const CAM_START_POS = new THREE.Vector3(-18.5, 1.4, 13.4);
const CAM_START_LOOK = new THREE.Vector3(-14.0, 0.55, 9.6);
const CAM_END_POS = new THREE.Vector3(4.0, 30.0, 34.0);
const CAM_END_LOOK = new THREE.Vector3(8.0, 0, -6.0);

/** Risk zone positions on the track (near Gate B / Sainte Devote area). */
const RISK_CENTER = new THREE.Vector3(7.5, 0.05, -8.0);

function easeSmooth(t: number) {
  return t * t * (3 - 2 * t);
}

/** Map a global progress to a sub-range with smooth edges. */
function ramp(p: number, a: number, b: number): number {
  if (p <= a) return 0;
  if (p >= b) return 1;
  return (p - a) / (b - a);
}

export default function StoryScene({
  progress,
  isMobile,
}: {
  progress: number; // 0-1, drives everything
  isMobile: boolean;
}) {
  const carRef = useRef<THREE.Group>(null);
  const tmpLook = useRef(new THREE.Vector3());
  const tmpUp = useRef(new THREE.Vector3(0, 1, 0));
  const camera = useThree((s) => s.camera);
  const tmpCam = useRef(new THREE.Vector3());

  /* ---------- derived states ---------- */
  const p = Math.min(1, Math.max(0, progress));

  // Car travels the curve
  const carPos = trackCurve.getPointAt(p);
  const carTangent = trackCurve.getTangentAt(p);

  // Track reveal: line draws from 8% to 60%
  const trackReveal = easeSmooth(ramp(p, 0.04, 0.55));

  // Crowd flow mode (racing line becomes crowd flow) from 40%
  const flowMode = p > 0.4;

  // Risk zone pulses after 58%
  const riskOpacity = ramp(p, 0.55, 0.72);

  // Particles appear from 30%
  const particleReveal = easeSmooth(ramp(p, 0.28, 0.55));

  // Venue twin fades in from 62%, dominates by 85%
  const venueFade = easeSmooth(ramp(p, 0.62, 0.85));

  /* ---------- camera ---------- */
  useFrame(() => {
    const tp = easeSmooth(p);
    // Custom easing for camera height — rises slowly early, then climbs
    const heightT = tp * tp;
    const pos = new THREE.Vector3(
      CAM_START_POS.x + (CAM_END_POS.x - CAM_START_POS.x) * tp,
      CAM_START_POS.y + (CAM_END_POS.y - CAM_START_POS.y) * heightT,
      CAM_START_POS.z + (CAM_END_POS.z - CAM_START_POS.z) * tp
    );
    const look = new THREE.Vector3().lerpVectors(CAM_START_LOOK, CAM_END_LOOK, tp);

    // Late in the journey the look-at also pulls toward the car so it
    // keeps reading as the anchor while settling right.
    if (p > 0.72) {
      const blend = (p - 0.72) / 0.28;
      look.lerp(carPos, easeSmooth(blend) * 0.4);
    }

    if (isMobile) {
      // Portrait frame: raise the opening eye-line and pull back slightly
      // so the car and the rising red thread fit the narrow view.
      pos.y += 2.4 + 10 * heightT;
      pos.z += 5 * tp;
      // Keep the look-at at the car, not ahead of it, so the car stays
      // centered vertically in the portrait frame.
      if (p < 0.5) {
        look.lerp(carPos, 0.5);
        look.y = 0.55;
      }
    }

    camera.position.lerp(pos, 0.1);
    tmpCam.current.copy(look);
    camera.lookAt(tmpCam.current);
    camera.up.lerp(tmpUp.current, 0.1);
  });

  /* ---------- venue geometry (schematic twin) ---------- */
  const venueGroup = useMemo(() => {
    const g = new THREE.Group();
    // Spread the schematic venue across the far plateau, right-of-center
    const ox = 6.0;
    const oz = -14.0;
    const span = 12;

    // Pathway edges as thin red/safe corridors
    for (const edge of VENUE_EDGES) {
      const a = VENUE_NODES.find((n) => n.id === edge.from)!;
      const b = VENUE_NODES.find((n) => n.id === edge.to)!;
      const ax = ox + (a.x / 100 - 0.5) * span;
      const az = oz + (a.y / 100 - 0.5) * span;
      const bx = ox + (b.x / 100 - 0.5) * span;
      const bz = oz + (b.y / 100 - 0.5) * span;
      const pts = [new THREE.Vector3(ax, 0.06, az), new THREE.Vector3(bx, 0.06, bz)];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(
        geo,
        new THREE.LineBasicMaterial({
          color: edge.safe ? "#2ECC71" : "#2A2A32",
          transparent: true,
          opacity: edge.safe ? 0.9 : 0.55,
        })
      );
      g.add(line);
    }

    // Node pillars + labels via small discs
    for (const node of VENUE_NODES) {
      const x = ox + (node.x / 100 - 0.5) * span;
      const z = oz + (node.y / 100 - 0.5) * span;
      const color =
        node.risk && node.risk >= 70 ? "#FF3B30" : node.risk ? "#F5C518" : "#9A9AA5";
      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(node.risk ? 0.55 : 0.3, node.risk ? 0.55 : 0.3, 0.06, 24),
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: node.risk && node.risk >= 70 ? 0.5 : 0.12,
        })
      );
      disc.position.set(x, 0.08, z);
      g.add(disc);
    }

    // A faint venue outline plate
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(span * 1.15, 0.04, span * 1.15),
      new THREE.MeshStandardMaterial({ color: "#141419", roughness: 0.95 })
    );
    plate.position.set(ox, 0.01, oz);
    g.add(plate);
    return g;
  }, []);

  /* ---------- car orientation ---------- */
  useFrame(() => {
    if (!carRef.current) return;
    // Build a flat orientation from the tangent using atan2, keeping the
    // car level on the XZ plane. Nose of the car is along +Z.
    const yaw = Math.atan2(carTangent.x, carTangent.z) + Math.PI;
    carRef.current.rotation.set(0, yaw, 0);
    carRef.current.position.set(carPos.x, carPos.y + 0.29, carPos.z);
  });

  return (
    <>
      {/* Lighting — cinematic but restrained */}
      <ambientLight intensity={0.35} color="#d5d9e3" />
      <directionalLight
        position={[8, 16, 10]}
        intensity={1.6}
        color="#ffffff"
        castShadow
      />
      <directionalLight position={[-10, 6, -8]} intensity={0.45} color="#8a8fa3" />
      <pointLight position={[-6, 4, 8]} intensity={14} color="#E4002B" distance={34} />
      <pointLight position={[10, 3, -10]} intensity={8} color="#E4002B" distance={30} />
      <fog attach="fog" args={["#0a0a0d", 26, 85]} />

      <Ground withGrid={!isMobile} />

      {/* The red thread */}
      <Track reveal={trackReveal} flowMode={flowMode} />

      {/* The storyteller */}
      <group ref={carRef}>
        <F1Car scale={1} />
      </group>

      {/* Crowd flow particles along the track after 40% */}
      <CrowdParticles reveal={particleReveal} />

      {/* Risk zone near Gate B / Sainte Devote */}
      {riskOpacity > 0.01 && (
        <mesh position={[RISK_CENTER.x, 0.07, RISK_CENTER.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.2, 2.5, 48]} />
          <meshBasicMaterial color="#FF3B30" transparent opacity={riskOpacity * 0.75} />
        </mesh>
      )}
      {riskOpacity > 0.01 && (
        <mesh position={[RISK_CENTER.x, 0.05, RISK_CENTER.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.2, 48]} />
          <meshBasicMaterial color="#FF3B30" transparent opacity={riskOpacity * 0.1} />
        </mesh>
      )}

      {/* Schematic venue twin */}
      <primitive object={venueGroup} visible={venueFade > 0.02} />
      {/* Fade handled by parent overlay in DOM — geometry appears abruptly
          at threshold, which reads as the twin "switching on" */}
    </>
  );
}
