import { motion, useReducedMotion } from "framer-motion";
import { ShoppingCart, User, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRestaurantByRid } from "../api/restaurant.api";
import { useTenant } from "../context/TenantContext";

type ButtonBoxProps = {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
};

export default function LandingModern() {
  const navigate = useNavigate();
  const { rid: ridFromUrl } = useParams();
  const { setRid } = useTenant();

  const rid = ridFromUrl!;
  const [restaurantName, setRestaurantName] = useState(rid.toUpperCase());
  
  useEffect(() => {
    setRid(rid); // ensure tenant context stays aligned
  }, [rid, setRid]);

  useEffect(() => {
    getRestaurantByRid(rid)
      .then((data) => {
        setRestaurantName(data.restaurantName);
      })
      .catch((error) => {
        console.error("Failed to fetch restaurant name:", error);
      });
  }, [rid]);

  const shouldReduceMotion = useReducedMotion();

  const motionProps = shouldReduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };

  const ButtonBox = ({ label, onClick, icon }: ButtonBoxProps) => (
    <motion.button
      {...motionProps}
      whileHover={shouldReduceMotion ? {} : { scale: 1.04 }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      onClick={onClick}
      className="relative w-[8.5rem] sm:w-56 md:w-64 lg:w-72 h-40 sm:h-48 md:h-52 lg:h-56 bg-yellow-400 backdrop-blur-sm border border-yellow-500 flex flex-col items-center justify-center gap-3 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-200 cursor-pointer"
    >
      <div className="text-black text-4xl sm:text-5xl">{icon}</div>
      <div className="text-sm sm:text-base md:text-lg font-semibold text-black">
        {label}
      </div>
    </motion.button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-yellow-100 to-yellow-200 p-4">
      <main className="w-full max-w-5xl mx-auto flex flex-col items-center gap-10">
        <header className="text-center px-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-black">
            {restaurantName} — Swad Setu
          </h1>
          <p className="text-xs sm:text-sm text-gray-800 mt-2">
            Quick access for Admin, Staff, and Orders
          </p>
        </header>

        <section className="w-full flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 flex-wrap md:flex-nowrap">
          <ButtonBox
            label="Admin Access"
            onClick={() => navigate(`/t/${rid}/admin-login`)}
            icon={<User className="w-9 h-9" />}
          />

          <ButtonBox
            label="Staff Access"
            onClick={() => navigate(`/t/${rid}/staff-login`)}
            icon={<Users className="w-9 h-9" />}
          />

          <ButtonBox
            label="Place Order"
            onClick={() =>
              (window.location.href = `${
                import.meta.env.VITE_USER_LINK
              }t/${rid}`)
            }
            icon={<ShoppingCart className="w-9 h-9" />}
          />
        </section>

        <footer className="text-xs text-gray-600 mt-4">
          © {new Date().getFullYear()} Swad Setu • Zager Digital Services
        </footer>
      </main>
    </div>
  );
}
