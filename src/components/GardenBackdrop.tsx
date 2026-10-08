/* The background behind every page: the home house's garden (rendered in
   Blender with the house left out, blender/home_house.py), covering the
   screen, softened a little so the page on top stays easy to read, with the
   two young readers sitting on the lawn in the bottom corners. */

import { GARDEN_IMAGE, HOUSE_LAWN } from "@/app/homeHouse";

export default function GardenBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden" style={{ background: HOUSE_LAWN }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={GARDEN_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(255,250,230,0.18),transparent_70%)]" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/reader-girl.png" alt="" className="anim-bob absolute bottom-3 left-6 z-20 hidden h-28 w-auto drop-shadow-lg sm:block sm:h-36" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/reader-boy.png" alt="" className="anim-bob absolute bottom-3 right-8 z-20 hidden h-28 w-auto drop-shadow-lg sm:block sm:h-36" />
    </div>
  );
}
