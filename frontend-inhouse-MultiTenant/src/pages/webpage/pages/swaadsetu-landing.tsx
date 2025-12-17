import React, { useState, useEffect } from "react";
import Hero from "./Hero";
import { Footer } from "../component/Footer";
import { CTASection } from "../component/cta-section";
import { CustomerSection } from "./customer-section";
import { AnalyticsSection } from "./AnalyticsSection";
import Navbar from "../component/Navbar";
import AboutSection from "./AboutSection";
import MobileFloatingButton from "../component/ui/MobileFolatingButton";
import StaffSection from "./StaffSection";

const SwaadsetuLanding: React.FC = () => {
  const [activeSection, setActiveSection] = useState("home");

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
      const sections = ["home", "features", "about", "contact"];
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

  return (
    <div className="font-sans bg-radial from-yellow-100 from-20% via-white to-yellow-100 text-black overflow-x-hidden scroll-smooth">
      {/* Navigation */}

      <Navbar />

      {/* Hero Section */}
      <section id="home" className="relative md:mt-16">
        <Hero />
      </section>

      <MobileFloatingButton
        onClick={() => {
          console.log("FAB clicked");
          // navigate("/create") or open modal
        }}
      />

      {/* About Section */}
      <section id="about">
        <AboutSection />
      </section>

      <div id="features">
        {/* StaffSection */}
        <CustomerSection />

        {/* Staff Section */}
        <StaffSection />

        {/* AnalyticsSection */}
        <AnalyticsSection />
      </div>

      <div id="contact">
        {/* CTA Section*/}
        <CTASection />
        {/* Footer */}
        <Footer />
      </div>

      <style>{`
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
