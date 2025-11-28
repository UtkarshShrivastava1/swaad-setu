import HeroText from "../component/HeroText";
import Image from "../assets/generated-image-removebg-preview.png";
import { motion } from "framer-motion";

const Hero = () => {
  return (
    <section className="flex items-start justify-center min-h-screen overflow-hidden md:items-start md:justify-start c-space relative">
      <HeroText />
      <motion.figure
        className="absolute bottom-0 right-0 w-[250px] h-[250px] md:w-[600px] md:h-[600px] lg:w-[1000px] lg:h-[1000px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        style={{ maxWidth: "100vw", maxHeight: "100vh" }}
      >
        <img
          src={Image}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "right bottom",
          }}
          alt="Hero image"
        />
      </motion.figure>
    </section>
  );
};

export default Hero;
