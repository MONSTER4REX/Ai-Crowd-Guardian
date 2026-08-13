/**
 * ACG — Navbar: thin control-room header. Transparent over the
 * cinematic intro, opaque once the product sections begin.
 */
import { useEffect, useState } from "react";

const LINKS = [
  { label: "Predict", href: "#acg-storyboard" },
  { label: "Digital Twin", href: "#acg-storyboard" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 120);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-[#0A0A0D]/90 backdrop-blur-md" : "bg-transparent"
      }`}
      style={{ borderBottom: scrolled ? "1px solid #2A2A32" : "1px solid transparent" }}
    >
      <div className="container flex h-14 items-center justify-between">
        <a href="#top" className="flex items-center gap-3">
          <span className="flex items-center gap-1" aria-hidden>
            <span
              className="inline-block h-4 w-5 bg-[#E4002B]"
              style={{ clipPath: "polygon(0 0, 100% 18%, 100% 82%, 0 100%)" }}
            />
            <span
              className="inline-block h-3 w-3 bg-[#F5F5F7]"
              style={{ clipPath: "polygon(0 0, 100% 18%, 100% 82%, 0 100%)" }}
            />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-base font-black uppercase tracking-[0.12em] text-[#F5F5F7]">
              AI Crowd Guardian
            </span>
            <span className="mt-1 h-px w-8 bg-[#E4002B]" />
          </span>
        </a>
        <nav className="hidden items-center gap-6 sm:flex">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="micro-label transition-colors hover:text-[#F5F5F7]"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#acg-storyboard"
            className="border border-[#E4002B] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#E4002B] transition-all duration-150 hover:bg-[#E4002B] hover:text-white active:scale-[0.97]"
          >
            Demo
          </a>
        </nav>
      </div>
    </header>
  );
}
