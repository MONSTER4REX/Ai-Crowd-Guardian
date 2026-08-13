/**
 * ACG — The master storyboard shell.
 * A tall scroll driver (500vh) with a sticky 100vh 3D viewport.
 * One progress value drives the Canvas; DOM layers sit on top for
 * text, telemetry, and brand reveal. Scroll up reverses everything.
 */
import { Suspense } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import StoryScene from "@/components/3d/StoryScene";
import StoryOverlay from "@/components/storyboard/StoryOverlay";
import TelemetryHUD from "@/components/storyboard/TelemetryHUD";
import { useStoryboardScroll } from "@/hooks/useStoryboardScroll";
import { useIsMobile } from "@/hooks/useMobile";

export default function Storyboard() {
  const { globalProgress } = useStoryboardScroll();
  const isMobile = useIsMobile();

  return (
    <div
      id="acg-storyboard"
      className="relative"
      style={{ height: isMobile ? "380vh" : "500vh" }}
    >
      {/* Sticky 3D viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#0A0A0D]">
        <Canvas
          shadows
          dpr={[1, 1.75]}
          camera={{ position: [-7.5, 1.5, 6], fov: 48, near: 0.1, far: 200 }}
          gl={{ antialias: true }}
          onCreated={({ gl, scene }) => {
            gl.setClearColor("#0a0a0d", 1);
            scene.background = new THREE.Color("#0a0a0d");
          }}
        >
          <color attach="background" args={["#0a0a0d"]} />
          <Suspense fallback={null}>
            <StoryScene progress={globalProgress} isMobile={isMobile} />
          </Suspense>
        </Canvas>

        {/* Cinematic vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 55%, rgba(10,10,13,0.55) 100%)",
          }}
        />

        {/* Progress rail — thin red line showing journey position */}
        <div className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-full bg-[#16161B]">
          <div
            className="h-full bg-[#E4002B] transition-none"
            style={{ width: `${globalProgress * 100}%` }}
          />
        </div>

        {/* Story text layers */}
        <StoryOverlay progress={globalProgress} />
        <TelemetryHUD progress={globalProgress} />
      </div>
    </div>
  );
}
