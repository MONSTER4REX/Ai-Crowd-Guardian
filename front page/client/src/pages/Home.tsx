/**
 * ACG — Home: one single-page cinematic experience.
 * All product details live inside the 6 scroll chapters; no separate
 * product pages below the storyboard.
 */
import Navbar from "@/components/ui/Navbar";
import Storyboard from "@/components/storyboard/Storyboard";

export default function Home() {
  return (
    <div id="top" className="min-h-screen bg-[#0A0A0D] text-[#F5F5F7]">
      <Navbar />
      <main>
        <Storyboard />
      </main>
    </div>
  );
}
