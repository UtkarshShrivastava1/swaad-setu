import { FiGrid, FiUsers } from "react-icons/fi";

function TableHeroSection() {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="relative mb-6 overflow-hidden rounded-3xl border border-white/40 bg-gradient-to-br from-[#051224] via-[#0a1a35] to-[#051224] px-6 py-5 shadow-2xl">
      {/* Glow Layer */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,190,0,0.18),transparent_45%)]" />

      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-300 text-[#051224] flex items-center justify-center text-2xl shadow-lg">
            🍽️
          </div>

          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Table Management
            </h1>
            <p className="text-xs sm:text-sm text-amber-200 font-medium flex items-center gap-2 mt-0.5">
              <FiGrid className="text-emerald-400" />
              Live floor & seating control
            </p>
          </div>
        </div>

        {/* Right Side Meta */}
        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-amber-200 border border-white/20">
            <FiUsers className="opacity-80" />
            <span>Active Tables</span>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-amber-200 border border-white/20">
            <span>{today}</span>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1.5 text-emerald-300 border border-emerald-400/30">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </div>
        </div>
      </div>
    </div>
  );
}

export default TableHeroSection;
