import { QrCode, Clock, FileText, Bell, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";

import bg from "../assets/customerHeading.png";
const features = [
  { icon: QrCode, title: "QR Code Ordering", description: "Customers scan and order instantly. No app downloads, no waiting for staff. Pure convenience.", color: "#FFBE00" },
  { icon: Clock, title: "Live Order Tracking", description: "Real-time order status updates from kitchen to table. Complete transparency for customers.", color: "#22C55E" },
  { icon: FileText, title: "Digital Bill Management", description: "Generate and share bills instantly. Support for split payments and custom discounts.", color: "#3B82F6" },
  { icon: Bell, title: "Instant Waiter Call", description: "Direct notification system for customer service. No more waiting or looking around.", color: "#F59E0B" },
  { icon: CreditCard, title: "Secure Payments", description: "Integrated UPI, cards, wallets. PCI-DSS compliant with instant payment reconciliation.", color: "#8B5CF6" },
  
];

export function CustomerSection() {
  const navigate = useNavigate();

  // Replace these URLs with different images if you want variety; currently all 4 use the same source.
  const IMG = "https://hd.wallpaperswide.com/thumbs/god_of_war_kratos_spartan_warrior_videogame_gaming_greek_god_of_war-t2.jpg";

  return (
<section className="section py-16 bg-[#111111]">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-20">
    <div className="space-y-6 ">
      

      <div >
        <img src={bg}  className="w-60 h-auto"/>
      </div>

      {/* 2-column responsive layout */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-10">
        {/* LEFT: heading + text + buttons + FEATURES (ALL VISIBLE) */}
        <div className="flex-1 text-left">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Features That Delight Your Customers
          </h2>

          <p className="mt-3 text-base sm:text-lg text-[#EDEDED] leading-relaxed">
            Every feature is designed to create a seamless, modern dining
            experience that keeps customers coming back.
          </p>

          {/* Buttons */}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center px-5 py-3 rounded-full bg-amber-500 text-black font-semibold text-sm shadow hover:bg-amber-600 transition"
            >
              Request Live Demo
            </button>
            <button
              onClick={() => navigate("/features")}
              className="inline-flex items-center px-5 py-3 rounded-full border border-white/20 text-white text-sm hover:bg-white/10 transition"
            >
              Explore All Features
            </button>
          </div>

          {/* FEATURES LIST – SAME AS YOURS, JUST SLIGHTLY TIGHTER */}
          <div className="mt-6 grid md:grid-cols-1 gap-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start space-x-4 p-4 rounded-xl bg-[#181818] hover:bg-[#222222] transition-colors"
              >
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: feature.color }}
                >
                  <feature.icon size={22} className="text-black" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-[#EDEDED] text-xs sm:text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: centered gallery */}
        <div className="flex-1 mt-10 lg:mt-0">
          <div className="grid grid-cols-2 gap-4 sm:gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="relative rounded-2xl overflow-hidden shadow-xl border border-black/30 group"
              >
                <img
                  src={IMG}
                  alt={`Gallery ${i}`}
                  className="w-full h-32 sm:h-40 md:h-44 lg:h-52 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="p-3">
                    <p className="text-xs sm:text-sm text-white">
                      Customer view {i}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
</section>


  );
}


