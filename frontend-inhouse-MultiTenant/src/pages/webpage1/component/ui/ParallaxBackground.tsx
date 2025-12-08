import { motion, useScroll, useTransform } from 'framer-motion';
import Image from "../../assets/3DImage.png"

const ParallaxBackground = () => {
  const { scrollY } = useScroll();

  // Different scroll speed transforms for each layer
  const y1 = useTransform(scrollY, [0, 500], [0, 100]);
 
  return (
    <section
      id="home"
      className="relative mt-[70px] h-screen overflow-hidden text-white"
    >
      {/* Layer 1 - foreground */}
      <motion.div
        className="absolute inset-0  "
        style={{
          backgroundImage: `url(${Image})`,
          y: y1,
          backgroundSize:"cover",
          backgroundPosition:"center",
        }}
      />
    </section>
  );
};

export default ParallaxBackground;
