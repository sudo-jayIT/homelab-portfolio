import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";

/**
 * Preview: About and Contact on the flat Mint Terminal base they sit on in the
 * full page (the grid and rain belong to the chrome). Independent of the
 * chrome so other areas' work in progress cannot break it.
 */
export default function DevAbout() {
  return (
    <main>
      <div className="relative z-10 overflow-clip bg-background">
        <About />
        <Contact />
      </div>
    </main>
  );
}
