// HotspotInteractive.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";

const HotspotInteractive = ({ screenshot, hotspots = [], width = 1000, height = 560 }) => {
  // hotspots = [{id, xPercent, yPercent, title, description}]
  const [active, setActive] = useState(null);

  return (
    <div className="relative w-full max-w-[1200px] mx-auto mt-20">
      <div className="relative rounded-xl overflow-hidden shadow-lg" style={{ width }}>
        <img src={screenshot } alt="screenshot" className="w-20 block" />
        {hotspots.map((h) => (
          <button
            key={h.id}
            onClick={() => setActive(h.id)}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${h.xPercent}%`, top: `${h.yPercent}%` }}
            aria-label={h.title}
          >
            <motion.div
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.15 }}
              className="w-9 h-9 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center shadow"
            >
              <div className="w-4 h-4 bg-amber-500 rounded-full" />
            </motion.div>
          </button>
        ))}
      </div>

      {/* Panel */}
      {active && (
        <div className="mt-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="p-4 bg-white rounded-md shadow-md max-w-xl"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{hotspots.find(h => h.id === active)?.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{hotspots.find(h => h.id === active)?.description}</p>
              </div>
              <button onClick={() => setActive(null)} className="text-gray-400">Close</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HotspotInteractive;
