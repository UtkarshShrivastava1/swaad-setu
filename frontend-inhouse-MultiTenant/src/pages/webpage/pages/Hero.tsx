import { useEffect, useState } from "react";
import Image from "../assets/new_banner.png";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import mobileImage from "../assets/mobileBanner.PNG";

const shapeVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1, rotate: 360 },
};

const transitionSettings = {
  duration: 2,
  repeat: Infinity,
  ease: "easeInOut",
  repeatDelay: 1,
};

const shapes = [
  { type: "circle", top: "11.2%", left: "9%", size: 12, delay: 0 },
  { type: "square", top: "30%", left: "70%", size: 14, delay: 0.5 },
  { type: "circle", top: "60%", left: "40%", size: 10, delay: 1 },
  { type: "square", top: "80%", left: "85%", size: 16, delay: 1.5 },
  { type: "circle", top: "20%", left: "80%", size: 10, delay: 2 },
  { type: "square", top: "50%", left: "20%", size: 12, delay: 2.5 },
];

// simple counter
const Counter = ({ target, label }: { target: number; label: string }) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frameId: number;
    const duration = 2000;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [target]);

  return (
    <div className="flex flex-col items-center md:items-start">
      <span className="text-3xl md:text-5xl font-extrabold leading-none lg:text-white">
        {value}+
      </span>
      <span className="mt-1 text-[10px] md:text-xs lg:text-neutral-200 sm:text-gray-600 text-center md:text-left">
        {label}
      </span>
    </div>
  );
};

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen overflow-hidden c-space flex flex-col items-stretch justify-start">
 
      {/* Desktop banner (md+) */}
      <div className="w-full hidden md:block">
        <img
          src={Image}
          alt="Hero banner"
          className="w-full h-screen object-cover"
        />
      </div>

      {/* Mobile banner */}
      <div className="w-full block md:hidden">
        <img
          src={mobileImage}
          alt="Mobile hero banner"
          className="w-full h-[70vh] object-cover mx-auto"
          style={{ objectPosition: "center" }}
        />
      </div>

      {/* DESKTOP overlay: buttons + counters on top of image */}
      <div className="absolute inset-0 hidden md:flex items-end justify-start pointer-events-none">
        <div className="w-auto px-6 pb-16 pl-28.5 pointer-events-auto">
          <div className="flex flex-col gap-4 items-start">
            {/* buttons */}
            <div className="flex flex-row gap-4 items-center">
              <motion.button
                initial={{ x: -200, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 50, delay: 0.9 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/")}
                className="btn md:btn-lg bg-amber-300 text-black font-medium px-6 py-3 rounded shadow"
              >
                Try for Free
              </motion.button>

              <motion.button
                initial={{ x: -400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 50, delay: 0.7 }}
                whileTap={{ scale: 0.95 }}
                className="btn border md:btn-lg border-amber-300 text-amber-500 bg-transparent px-6 py-3 rounded"
              >
                See How It Works
              </motion.button>
            </div>

            {/* counters */}
            <div className="flex gap-10 justify-start lg:text-white">
              <Counter target={58} label="Restaurants Using SwaadSetu" />
              <Counter target={100} label="Daily Orders Processed" />
              <Counter target={100} label="Happy Diners Served" />
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE CTA + counters: separate section BELOW image */}
      <div className="md:hidden w-full bg-[#f6eab5] px-6 pt-4 pb-8 flex flex-col items-center gap-4">
        {/* smaller buttons, not overlapping character */}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <motion.button
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 70, delay: 0.3 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/")}
            className="bg-amber-300 text-black font-semibold px-4 py-2 rounded shadow text-sm"
          >
            Try for Free
          </motion.button>

          <motion.button
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 70, delay: 0.4 }}
            whileTap={{ scale: 0.95 }}
            className="border border-amber-300 text-amber-600 bg-transparent px-4 py-2 rounded text-sm"
          >
            See How It Works
          </motion.button>
        </div>

        {/* counters band */}
        <div className="mt-2 flex justify-center gap-6 text-black">
          <Counter target={1000} label="Restaurants Using SwaadSetu" />
          <Counter target={1000} label="Daily Orders Processed" />
          <Counter target={1000} label="Happy Diners Served" />
        </div>
      </div>

      {/* Animated shapes (unchanged) */}
      {shapes.map(({ type, top, left, size, delay }, index) => (
        <motion.div
          key={index}
          initial="initial"
          animate="animate"
          variants={shapeVariants}
          transition={{ ...transitionSettings, delay }}
          style={{
            position: "absolute",
            top,
            left,
            width: size,
            height: size,
            borderRadius: type === "circle" ? "50%" : "0%",
            background: "linear-gradient(90deg, #ffb347, #ffcc33)",
            zIndex: 8,
            opacity: 0.75,
            pointerEvents: "none",
          }}
          className="hidden sm:block"
          aria-hidden="true"
        />
      ))}
    </section>
  );
};

export default Hero;
