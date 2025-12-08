import React from "react";

// HeroOverlap.tsx
// React + TypeScript component using Tailwind CSS.
// Colors: yellow (#FFD43B-ish via Tailwind's yellow-400/500), black, white.
// Two images overlap from the left and right edges over a background image.

type Props = {
  /** Background image path. Defaults to the provided local file. */
  backgroundSrc?: string;
  /** Foreground image used for both overlapping images (you can replace with another). */
  fgSrc?: string;
};

const HeroOverlap: React.FC<Props> = ({
  backgroundSrc = "/mnt/data/IMG_20251205_110334182_HDR_PCT.jpg",
  fgSrc = "/mnt/data/IMG_20251205_110334182_HDR_PCT.jpg",
}) => {
  return (
    <section className="w-full min-h-screen flex items-center justify-center bg-black">
      {/* Background container */}
      <div
        className="relative w-full max-w-6xl mx-auto px-6 py-20 rounded-2xl overflow-hidden shadow-2xl"
        aria-hidden={false}
      >
        {/* Background image with subtle dark overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center transform-gpu"
          style={{
            backgroundImage: `url(${backgroundSrc})`,
            filter: "brightness(0.35) contrast(1.05)",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Yellow accent ring in top-left */}
        <div className="absolute -left-40 -top-40 w-[320px] h-[320px] rounded-full border-8 border-yellow-400/80 blur-md opacity-60" />

        {/* Content area */}
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          {/* Left overlapping image (comes in from left edge) */}
          <div className="relative w-72 h-96 md:w-96 md:h-[520px] flex-shrink-0">
            <div className="absolute -left-20 top-8 w-full h-full overflow-hidden rounded-3xl shadow-xl border-4 border-black/60">
              <img
                src={fgSrc}
                alt="Left artwork"
                className="w-full h-full object-cover transform-gpu scale-105 hover:scale-110 transition-transform duration-700"
                style={{ mixBlendMode: "normal" }}
              />
            </div>

            {/* Decorative yellow strip */}
            <div className="absolute -left-28 top-12 w-6 h-40 bg-yellow-400 rounded-md shadow-md" />
          </div>

          {/* Center text block */}
          <div className="flex-1 text-center md:text-left text-white">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              <span className="inline-block text-yellow-400 mr-2">Kratos</span>
              Spartan Warrior
            </h1>

            <p className="max-w-xl text-sm md:text-base text-white/90 mb-6">
              A dramatic layered composition with two overlapping images flowing from the edges, a bold
              yellow accent palette, and high-contrast black and white typography. Replace the images or
              tweak the dimensions to match your layout.
            </p>

            <div className="flex items-center justify-center md:justify-start gap-3">
              <button className="px-6 py-3 bg-yellow-400 text-black font-semibold rounded-lg shadow hover:brightness-95 transition">
                Explore
              </button>

              <button className="px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/5 transition">
                Learn more
              </button>
            </div>
          </div>

          {/* Right overlapping image (comes in from right edge) */}
          <div className="relative w-72 h-96 md:w-96 md:h-[520px] flex-shrink-0">
            <div className="absolute -right-20 bottom-8 w-full h-full overflow-hidden rounded-3xl shadow-2xl border-4 border-black/60">
              <img
                src={fgSrc}
                alt="Right artwork"
                className="w-full h-full object-cover transform-gpu -scale-x-100 scale-105 hover:scale-110 transition-transform duration-700"
                style={{ mixBlendMode: "screen" }}
              />
            </div>

            {/* Decorative black ribbon */}
            <div className="absolute -right-28 bottom-12 w-8 h-44 bg-black/80 rounded-md shadow-inner" />
          </div>
        </div>

        {/* Bottom stripe for balance */}
        <div className="absolute left-0 right-0 bottom-0 h-20 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>
    </section>
  );
};

export default HeroOverlap;
