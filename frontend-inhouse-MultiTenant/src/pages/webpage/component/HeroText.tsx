import React, { useEffect, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
} from "framer-motion";
import { animate } from "motion";
import Image from "../assets/heroImage.png";
import { FlipWords } from "../component/ui/Flipwords";
import { useNavigate } from "react-router-dom";

/* -------------------- COUNTER COMPONENT -------------------- */

type StatCounterProps = {
  from?: number;
  to: number;
  label: string;
  delay?: number;
};

const StatCounter: React.FC<StatCounterProps> = ({
  from = 0,
  to,
  label,
  delay = 0,
}) => {
  const spanRef = useRef<HTMLSpanElement | null>(null);
  const [scope, inView] = useInView({ once: true, margin: "-100px" });

  useEffect(() => {
    if (!inView || !spanRef.current) return;

    const controls = animate(from, to, {
      duration: 2,
      delay,
      easing: "easeOut",
      onUpdate(value) => {
        if (!spanRef.current) return;
        spanRef.current.textContent = `${Math.floor(value)}`;
      },
    });

    return () => controls.stop();
  }, [inView, from, to, delay]);

  return (
    <div ref={scope} className="flex flex-col items-start">
      <div className="text-3xl md:text-5xl font-extrabold leading-none">
        <span ref={spanRef}>{from}</span>
        <span>+</span>
      </div>
      <p className="mt-1 text-xs md:text-sm text-neutral-200">{label}</p>
    </div>
  );
};

/* -------------------- HERO TEXT -------------------- */

const HeroText = () => {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 100]);
  const words = ["Smart", "Optimize", "SmartServe"];

  const variants = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <section className="relative w-full min-h-screen overflow-hidden text-white flex items-end justify-start px-8 pb-16">
      {/* Parallax background */}
      {/* <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${Image})`,
          y: y1,
        }}
      /> */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Foreground content */}
      <div className="relative z-10 max-w-4xl text-left w-full">
        {/* DESKTOP */}
        <div className="hidden md:flex flex-col space-y-5 items-start">
          <motion.h1
            className="text-4xl font-medium"
            variants={variants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 1 }}
          >
            Run Your Restaurant{" "}
            <span className="text-yellow-500">Smarter</span> with{" "}
            <span className="text-yellow-500">SwaadSetu</span>
          </motion.h1>

          <motion.p
            className="text-2xl font-medium text-neutral-300"
            variants={variants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 1.2 }}
          >
            From menu management to promotions,
            <br />
            analytics to inventory—SwaadSet gives restaurant owners
            <br />
            the power to manage everything effortlessly and grow faster.
          </motion.p>

          <motion.div
            variants={variants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 1.4 }}
          >
            <FlipWords
              words={words}
              className="font-black text-white text-5xl"
            />
          </motion.div>

          {/* Desktop buttons */}
          <div className="flex gap-5 mt-10">
            <motion.button
              initial={{ x: -250, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 60, delay: 1.7 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/")}
              className="btn button bg-amber-300 text-black btn-primary btn-xl"
            >
              Try for Free
            </motion.button>

            <motion.button
              initial={{ x: -400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 60, delay: 1.9 }}
              whileTap={{ scale: 0.9 }}
              className="btn button text-yellow-200 btn-outline btn-xl"
            >
              See How It Works
            </motion.button>
          </div>

          {/* Desktop counters */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.1, duration: 0.6 }}
            className="mt-10 grid grid-cols-3 gap-10 z-20"
          >
            <StatCounter to={1000} label="Restaurants Using SwaadSetu" />
            <StatCounter to={1000} label="Daily Orders Processed" delay={0.2} />
            <StatCounter to={1000} label="Happy Diners Served" delay={0.4} />
          </motion.div>
        </div>

        {/* MOBILE */}
        <div className="flex flex-col space-y-6 md:hidden text-left">
          <motion.p
            className="text-2xl font-medium"
            variants={variants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 1 }}
          >
            Run Your Restaurant Smarter with SwaadSetu
          </motion.p>

          <motion.p
            className="text-xs font-black text-neutral-300"
            variants={variants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 1.2 }}
          >
            From menu management to promotions, analytics to inventory—
            SwaadSetu gives restaurant owners the power to manage everything
            effortlessly and grow faster.
          </motion.p>

          <motion.div
            variants={variants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 1.5 }}
          >
            <FlipWords
              words={words}
              className="font-bold text-white text-2xl"
            />
          </motion.div>

          {/* Mobile buttons - animated from bottom */}
          <div className="flex gap-4 mt-2">
            <motion.button
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 80, delay: 1.7 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => navigate("/")}
              className="btn button bg-amber-300 text-black btn-primary btn-xs flex-1"
            >
              Try for Free
            </motion.button>

            <motion.button
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 80, delay: 1.9 }}
              whileTap={{ scale: 0.92 }}
              className="btn button text-yellow-200 btn-outline btn-xs flex-1"
            >
              See How It Works
            </motion.button>
          </div>

          {/* Mobile counters (smaller) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.1, duration: 0.5 }}
            className="mt-4 grid grid-cols-3 gap-3"
          >
            <StatCounter to={1000} label="Restaurants" />
            <StatCounter to={1000} label="Daily Orders" delay={0.2} />
            <StatCounter to={1000} label="Happy Diners" delay={0.4} />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroText;
