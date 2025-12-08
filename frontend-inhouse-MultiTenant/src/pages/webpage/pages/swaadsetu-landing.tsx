import React, { useState, useEffect } from "react";
import Hero from "./Hero";
import { LayoutGrid } from "../component/LayoutGrid";
import { motion, useInView } from "framer-motion";
import { CardBody, CardContainer, CardItem } from "../component/ui/3d-card";
import {
  // Mail,
  // Phone,
  // MapPin,
  // Linkedin,
  // Twitter,
  // Menu,
  // X,
  Check,
} from "lucide-react";
import { Footer } from "../component/Footer";
import bg from "../assets/SwaadSetu_shape.png";

// import HotspotInteractive from '../component/MenuScreenShot';
import { useNavigate } from "react-router-dom";
import { CTASection } from "../component/cta-section";
import { StaffSection } from "./staff-section";
import { AnalyticsSection } from "./AnalyticsSection";
import Navbar from "../component/Navbar";

type AnimatedSectionProps = {
  children: React.ReactNode;
  className?: string;
};

const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  className = "",
}) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const decorativeShapes = [
  { type: "circle", size: 12, top: "10%", left: "5%", color: "bg-yellow-400" },
  { type: "square", size: 10, top: "20%", left: "90%", color: "bg-black" },
  { type: "circle", size: 14, top: "80%", left: "15%", color: "bg-yellow-300" },
  { type: "square", size: 8, top: "75%", left: "85%", color: "bg-black" },
  { type: "circle", size: 10, top: "50%", left: "50%", color: "bg-yellow-400" },
  { type: "square", size: 12, top: "40%", left: "30%", color: "bg-black" },
];

const shapeAnimation = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.7, 1],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
  },
};

const SkeletonOne = () => {
  return (
    <div className="space-y-3">
      <p className="font-bold md:text-4xl text-2xl text-white">
        House in the woods
      </p>
      <p className="font-normal text-base my-2 max-w-lg text-neutral-200">
        A serene and tranquil retreat, this house in the woods offers a peaceful
        escape from the hustle and bustle of city life.
      </p>
    </div>
  );
};

const SkeletonTwo = () => {
  return (
    <div className="space-y-3">
      <p className="font-bold md:text-4xl text-2xl text-white">
        House above the clouds
      </p>
      <p className="font-normal text-base my-2 max-w-lg text-neutral-200">
        Perched high above the world, this house offers breathtaking views and a
        unique living experience. It&apos;s a place where the sky meets home,
        and tranquility is a way of life.
      </p>
    </div>
  );
};

const SkeletonThree = () => {
  return (
    <div className="space-y-3">
      <p className="font-bold md:text-4xl text-2xl text-white">
        Greens all over
      </p>
      <p className="font-normal text-base my-2 max-w-lg text-neutral-200">
        A house surrounded by greenery and nature&apos;s beauty. It&apos;s the
        perfect place to relax, unwind, and enjoy life.
      </p>
    </div>
  );
};

const SkeletonFour = () => {
  return (
    <div className="space-y-3">
      <p className="font-bold md:text-4xl text-2xl text-white">
        Rivers are serene
      </p>
      <p className="font-normal text-base my-2 max-w-lg text-neutral-200">
        A house by the river is a place of peace and tranquility. It&apos;s the
        perfect place to relax, unwind, and enjoy life.
      </p>
    </div>
  );
};

interface FormData {
  name: string;
  email: string;
  restaurant: string;
  message: string;
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

interface ScreenshotCardProps {
  icon: string;
  title: string;
  description: string;
}

const SwaadsetuLanding: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    restaurant: "",
    message: "",
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [isOpen, setIsOpen] = useState(false);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.15,
      rootMargin: "0px 0px -80px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-visible");
        }
      });
    }, observerOptions);

    document.querySelectorAll(".animate-on-scroll").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Active section tracking on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "features", "about", "screenshots", "contact"];
      const scrollPosition = window.scrollY + 120;

      for (const sectionId of sections) {
        const section = document.getElementById(sectionId);
        if (section) {
          const { offsetTop, clientHeight } = section;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + clientHeight
          ) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: hook up API call
    console.log("Form submitted:", formData);

    setShowSuccess(true);
    setFormData({ name: "", email: "", restaurant: "", message: "" });

    setTimeout(() => {
      setShowSuccess(false);
    }, 4000);

    setTimeout(() => {
      setIsSubmitting(false);
    }, 800);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const cards = [
    {
      id: 1,
      content: <SkeletonOne />,
      className: "md:col-span-2",
      thumbnail:
        "https://images.unsplash.com/photo-1476231682828-37e571bc172f?q=80&w=3474&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 2,
      content: <SkeletonTwo />,
      className: "col-span-1",
      thumbnail:
        "https://images.unsplash.com/photo-1464457312035-3d7d0e0c058e?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: 3,
      content: <SkeletonThree />,
      className: "col-span-1",
      thumbnail:
        "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: 4,
      content: <SkeletonFour />,
      className: "md:col-span-2",
      thumbnail:
        "https://images.unsplash.com/photo-1475070929565-c985b496cb9f?q=80&w=1200&auto=format&fit=crop",
    },
  ];

  const screenshots: ScreenshotCardProps[] = [
    {
      imageUrl:
        "https://get.apicbase.com/wp-content/uploads/2024/10/Apicbase-Restaurant-Management-Software.png",
      title: "Menu Management",
      description:
        "Create and update your menu with items, combos, images, and dietary tags in seconds.",
      link: "/",
    },
    {
      imageUrl:
        "https://foodship.co.in/wp-content/uploads/2023/05/Order-Management.jpg",
      title: "Order Tracking",
      description:
        "Monitor all orders live and track them from pending to delivered.",
    },
    {
      imageUrl:
        "https://d2xqcz296oofyv.cloudfront.net/wp-content/uploads/2022/04/utility-billing-software-solutions-tridens.jpg",
      title: "Billing System",
      description:
        "Generate accurate bills with extras, taxes, and discounts supported out-of-the-box.",
    },
    {
      imageUrl:
        "https://scholarlykitchen.sspnet.org/wp-content/uploads/2015/07/options-analysis1.jpg?w=300",
      title: "Analytics Dashboard",
      description:
        "See revenue trends, top sellers, and peak hours at a glance.",
    },
    {
      imageUrl: "https://resdiary.com/hubfs/Table%20Management%20System.jpg",
      title: "Table Management",
      description:
        "Visualise table occupancy, open sessions, and assignments in one place.",
    },
    {
      imageUrl:
        "https://www.shutterstock.com/shutterstock/photos/1727885581/display_1500/stock-vector-staff-log-in-icon-profile-individual-icon-1727885581.jpg",
      title: "Staff Portal",
      description:
        "Let staff manage orders and bills quickly using a focused workspace.",
    },
  ];
  const navigate = useNavigate();

  return (
    <div className="font-sans bg-radial from-yellow-100 from-20% via-white to-yellow-100 text-black overflow-x-hidden scroll-smooth">
      {/* Navigation */}

      <Navbar />

      {/* Spacer for fixed nav */}

      {/* Hero Section */}
      <section id="home" className="relative">
        <Hero />
      </section>

      {/* About Section */}
      <section
        id="about"
        className="py-20 px-4 md:px-8 bg-radial from-yellow-100 from-20% via-white to-yellow-100 text-black relative"
      >
        {/* Heading */}

        {/* Two-column layout: FIXED RESPONSIVE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left: Image grid - FIXED CONTAINER */}
          <motion.div className="w-full h-[400px] lg:h-[500px] bg-radial from-yellow-100 from-20% via-white to-yellow-100 rounded-3xl p-8 flex items-center justify-center relative overflow-hidden">
            <LayoutGrid cards={cards} />
          </motion.div>

          {/* Right: Content */}
          {/* Right - Content */}
          <div className="relative overflow-hidden bg-white">
            {/* 🟡 Main Content */}
            <div className="max-w-6xl mx-auto px-6 pt-32 pb-20 lg:pt-40 lg:pb-28 relative z-20">
              <div className="space-y-6">
               <div className="relative w-60 h-20 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg flex items-center">
              {/* Background image */}
              <img
                src={bg}
                alt="About Swaad Setu"
                className="absolute inset-0 w-60 h-10 object-cover "
              />

              {/* Optional dark overlay for readability */}
              {/* <div className="absolute inset-0  bg-black/40" /> */}

              {/* Text content on top */}
              <div className="relative z-10 px-4 ">
                <h3 className="text-lg px-3 mt-2 mb-10 font-semibold text-black ">
                  About Swaad Setu
                </h3>
              </div>
            </div>

                <h2 className="text-4xl lg:text-5xl font-bold font-heading text-black leading-tight">
                  Revolutionizing Restaurant Management in India
                </h2>

                <p className="text-lg text-[#555555] leading-relaxed max-w-3xl">
                  Swaad Setu is India's most comprehensive restaurant management
                  platform, designed specifically for the unique needs of Indian
                  restaurants. From street food stalls to fine dining
                  establishments, we empower every food business with
                  cutting-edge technology.
                </p>

                <div className="space-y-4 pt-4 max-w-xl">
                  {[
                    "Complete contactless ordering with QR technology",
                    "Real-time kitchen display and order management",
                    "Integrated payment gateway with UPI support",
                    "Advanced analytics and business intelligence",
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-[#FFBE00] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check size={16} className="text-black" />
                      </div>
                      <span className="text-[#111111] font-medium">
                        {feature}
                      </span>
                    </div>
                  ))}
                  <div className="">
                    <button
                      className="text-yellow-600 btn btn-outline btn-md ml-10"
                      onClick={() => {
                        navigate("/about");
                      }}
                    >
                      Know more
                    </button>
                  </div>
                </div>

                <div className="pt-6">
                  <div className="bg-[#FFFBF0] border-l-4 border-[#FFBE00] p-6 rounded-lg max-w-2xl">
                    <p className="text-[#111111] font-medium italic">
                      "Swaad Setu transformed our restaurant operations
                      completely. We saw a 35% increase in orders and
                      significantly reduced wait times."
                    </p>
                    <p className="text-sm text-[#888888] mt-2">
                      — Rajesh Kumar, Owner of Spice Garden
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative shapes - FIXED POSITIONING */}
        <div className="absolute inset-0 pointer-events-none">
          {decorativeShapes.map(({ type, size, top, left, color }, i) => (
            <motion.div
              key={i}
              className={`${color} ${
                type === "circle" ? "rounded-full" : "rounded-none"
              }`}
              style={{
                width: size,
                height: size,
                position: "absolute",
                top,
                left,
                zIndex: 10,
                opacity: 0.6,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.6, 0.4, 0.6],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </div>
      </section>

      <div id="features">
        {/* StaffSection */}
        <StaffSection />

        {/* Screenshots Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-radial from-yellow-100 from-20% via-white to-yellow-100">
          <div className="max-w-6xl mx-auto">
            <div className="text-center flex flex-col items-center">
              {/* Label + main heading */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.4,
                  scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
                }}
              >

                {/* <span className="inline-block bg-[#FFBE00] text-black text-xs sm:text-sm font-semibold px-4 py-2 rounded-full tracking-wide">
                  Staff Portal
                </span> */}

                <div className="relative w-40 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto">
                    {/* Background image */}
                <img
                src={bg}
                alt="Staff Portal"
                className="w-full h-12 sm:h-14 md:h-16 lg:h-20 object-cover rounded-md "
              />
              <div className="absolute inset-0 flex items-center justify-center px-4 mt-3 mr-6">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-black text-center">
                  Staff Portal
                </h3>
              </div>
              </div>


                <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-black">
                  Give your team a clean, fast workspace.
                </h2>
              </motion.div>

              {/* subheading */}
              <p className="mt-3 text-gray-700 max-w-2xl mx-auto">
                A glimpse of the key modules your team will use every single
                day.
              </p>

              {/* sub–subheading */}
              <p className="mt-2 text-xs sm:text-sm text-gray-500 max-w-xl mx-auto">
                From order routing to table management, every screen is built to
                reduce taps, cut confusion, and keep service moving smoothly.
              </p>
            </div>

            {/* cards */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 w-full">
              {screenshots.map((screenshot, index) => (
                <CardContainer
                  key={index}
                  className="inter-var w-full max-w-md sm:max-w-lg mx-auto"
                  containerClassName="py-6" // tighter vertical spacing between cards
                >
                  <CardBody className="bg-gray-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] rounded-xl p-6 border w-full">
                    <CardItem
                      translateZ="50"
                      className="text-lg sm:text-xl font-bold text-yellow-400 dark:text-yellow-400"
                    >
                      {screenshot.title}
                    </CardItem>

                    <CardItem
                      as="p"
                      translateZ="60"
                      className="text-neutral-500 text-sm mt-2 dark:text-neutral-300"
                    >
                      {screenshot.description}
                    </CardItem>

                    <CardItem translateZ="100" className="w-full mt-5">
                      <img
                        src={screenshot.imageUrl}
                        loading="lazy"
                        alt={screenshot.title}
                        className="h-40 w-full object-center rounded-xl group-hover/card:shadow-xl"
                      />
                    </CardItem>

                    <div className="flex justify-between items-center mt-6">
                      <CardItem
                        translateZ={20}
                        as="a"
                        href={screenshot.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline btn-warning bg-white px-4 py-2 rounded-xl text-xs font-medium dark:text-yellow-600 text-black hover:bg-yellow-700 hover:text-white transition-colors duration-300"
                      >
                        Try now →
                      </CardItem>
                    </div>
                  </CardBody>
                </CardContainer>
              ))}
            </div>
          </div>
        </section>

        {/* AnalyticsSection */}
        <AnalyticsSection />
      </div>
      <div id="CTA">
              {/* CTA Section */}
              <CTASection />

      </div>
      <div id="contact">
        {/* Footer */}
        <Footer />
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.06);
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.8s ease-out;
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.45s ease-out;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 1.5s ease-out;
        }
        .animate-visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        .duration-600 {
          transition-duration: 600ms;
        }
      `}</style>
    </div>
  );
};

export default SwaadsetuLanding;
