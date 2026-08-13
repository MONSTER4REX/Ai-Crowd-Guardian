/**
 * ACG — The single scroll-progress controller.
 * One normalized globalProgress (0-1) over the sticky storyboard
 * section; every animation state derives from it. Scroll is the
 * master controller: reading upward reverses everything.
 */
import { useEffect, useState, useRef } from "react";

export interface StoryboardScrollState {
  globalProgress: number; // 0-1 over the full storyboard section
  phase: "intro" | "story" | "product";
}

export function useStoryboardScroll(): StoryboardScrollState {
  const [state, setState] = useState<StoryboardScrollState>({
    globalProgress: 0,
    phase: "intro",
  });
  const raf = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        // The sticky container drives 0-1; below it the product
        // sections extend the narrative (phase: product).
        const el = document.getElementById("acg-storyboard");
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const total = el.offsetHeight - window.innerHeight;
        const traveled = -rect.top;
        const clamped = Math.min(1, Math.max(0, traveled / total));
        setState({
          globalProgress: clamped,
          phase: rect.top < -total + 2 ? "product" : "story",
        });
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return state;
}

/** Per-scene ramp helper: maps a global progress window to 0-1 with soft edges. */
export function sceneRamp(p: number, a: number, b: number): number {
  if (p <= a) return 0;
  if (p >= b) return 1;
  const t = (p - a) / (b - a);
  return t * t * (3 - 2 * t);
}
