import { motion, useScroll, useTransform, animate, stagger } from 'framer-motion';
import Image from "../assets/heroImage.png";
import { FlipWords } from "../component/ui/Flipwords";
import { useNavigate } from 'react-router-dom';


const HeroText = () => {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 100]);
  const words = ["Smart", "Optimize", "SmartServe"];
  const variants = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 },
  };

  const btnVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { delay: 1.6 } },
  };

  return (
    <section className="relative  w-full min-h-screen overflow-hidden text-white flex items-end justify-start px-8 pb-16 ">
      {/* Parallax background as motion div behind */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${Image})`,
          y: y1,
        }}
      />
      <div className="absolute inset-0 bg-black/60"/>

      {/* Foreground content container - stick left/bottom */}
      <div className="relative z-10 max-w-4xl text-left w-full mb-15">
        {/* Desktop View */}
        <div className="hidden md:flex flex-col space-y-5 items-start">
          <motion.h1
            className="text-4xl font-medium"
            variants={variants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 1 }}
          >
            Run Your Restaurant <span className="text-yellow-500">Smarter</span> with{" "}
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
            <FlipWords words={words} className="font-black text-white text-5xl" />
          </motion.div>

          <div className="flex gap-5 mt-10">
                        <motion.button
                         variants={btnVariants}
                        animate="visible"
                           whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.8 }}
                        onClick={() => navigate('/')}
                        className="btn button bg-amber-300 text-black btn-primary btn-xl"
                        >
              Try for Free
            
                        </motion.button>
                        <motion.button
                         variants={btnVariants}
                        animate="visible"
                         whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.8 }}
                        className="btn button text-yellow-200 btn-outline btn-xl">
                          See How It Works
                        </motion.button>          </div>
        </div>

        {/* Mobile View */}
        <div className="flex flex-col space-y-6 md:hidden text-left">
          <motion.p
            className="text-2xl font-medium"
            variants={variants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 1 }}
          >
            Run Your Restaurant Smarter with SwaadSet
          </motion.p>

          <motion.p
            className="text-xl font-black text-neutral-300"
            variants={variants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 1.2 }}
          >
            From menu management to promotions, analytics to inventory—SwaadSet gives restaurant owners the power to manage everything effortlessly and grow faster.
          </motion.p>

          <motion.div
            variants={variants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 1.5 }}
          >
            <FlipWords words={words} className="font-bold text-white text-2xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroText;
