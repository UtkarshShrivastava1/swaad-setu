// import { QrCode, Clock, FileText, Bell, CreditCard, BarChart3 } from "lucide-react";
// import { useNavigate } from "react-router-dom";

// const features = [
//   {
//     icon: QrCode,
//     title: "QR Code Ordering",
//     description: "Customers scan and order instantly. No app downloads, no waiting for staff. Pure convenience.",
//     color: "#FFBE00",
//   },
//   {
//     icon: Clock,
//     title: "Live Order Tracking",
//     description: "Real-time order status updates from kitchen to table. Complete transparency for customers.",
//     color: "#22C55E",
//   },
//   {
//     icon: FileText,
//     title: "Digital Bill Management",
//     description: "Generate and share bills instantly. Support for split payments and custom discounts.",
//     color: "#3B82F6",
//   },
//   {
//     icon: Bell,
//     title: "Instant Waiter Call",
//     description: "Direct notification system for customer service. No more waiting or looking around.",
//     color: "#F59E0B",
//   },
//   {
//     icon: CreditCard,
//     title: "Secure Payments",
//     description: "Integrated UPI, cards, wallets. PCI-DSS compliant with instant payment reconciliation.",
//     color: "#8B5CF6",
//   },
//   {
//     icon: BarChart3,
//     title: "Advanced Analytics",
//     description: "Deep insights into sales, customer behavior, menu performance, and peak hours.",
//     color: "#EF4444",
//   },
// ];

// export function StaffSection() {
//   const navigate = useNavigate();
//   return (
//     <section className="py-24 bg-[#111111]">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-20">
//         <div className="grid lg:grid-cols-2 gap-16 items-center">
//           {/* Left - Content */}
//           <div className="space-y-8">
//             <div className="inline-block">
//               <span className="bg-[#FFBE00] text-black text-sm font-semibold px-4 py-2 rounded-full">
//                 Customer Experience
//               </span>
//             </div>

//             <h2 className="text-4xl lg:text-5xl font-bold font-heading text-white leading-tight">
//               Features That Delight Your Customers
//             </h2>

//             <p className="text-lg text-[#EDEDED] leading-relaxed">
//               Every feature is designed to create a seamless, modern dining experience that keeps customers coming back.
//             </p>

//             <div className="space-y-6 pt-4">
//               {features.map((feature, index) => (
//                 <div
//                   key={index}
//                   className="flex items-start space-x-4 p-4 rounded-xl hover:bg-[#222222] transition-colors"
//                 >
//                   <div
//                     className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
//                     style={{ background: feature.color }}
//                   >
//                     <feature.icon size={24} className="text-black" />
//                   </div>
//                   <div>
//                     <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
//                     <p className="text-[#EDEDED] text-sm">{feature.description}</p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Right - Image with Slide-up Overlay */}
//           <div className="relative group w-full max-w-[650px] mx-auto self-start">
//             {/* Main Image */}
//             <img
//               src="https://hd.wallpaperswide.com/thumbs/god_of_war_kratos_spartan_warrior_videogame_gaming_greek_god_of_war-t2.jpg"
//               alt="Restaurant staff using tablet and smartphone"
//               className="rounded-3xl shadow-soft w-full h-auto object-cover block"
//             />

//             {/* Background Glow (behind image corners) */}
//             <div className="absolute -top-6 -left-6 w-48 h-48 bg-[#FFBE00] rounded-3xl opacity-20 blur-3xl pointer-events-none" />

//             {/* Slide-up Overlay - starts h-0, expands to full height on hover */}
//             <div
//               className="
//                 absolute left-0 right-0 bottom-0
//                 rounded-3xl overflow-hidden
//                 h-0 group-hover:h-full
//                 transition-[height] duration-500 ease-in-out
//                 bg-gradient-to-t from-black/70 via-black/30 to-transparent
//                 pointer-events-none
//               "
//               aria-hidden="false"
//             >
//               {/* overlay content container — enables clicks only inside the card */}
//               <div className="w-full h-full flex items-center justify-center pointer-events-auto px-6">
//                 <div className="text-center">
//                   <h4 className="text-white text-xl font-semibold mb-3">Explore Customer Features</h4>
//                   <p className="text-sm text-gray-200 max-w-xs mx-auto mb-4">
//                     Contactless ordering, live tracking, secure payments — everything to make dining smooth and fast.
//                   </p>

//                   <div className="flex items-center justify-center gap-3">
//                     <button
//                       onClick={() => navigate("/features")}
//                       className="inline-flex items-center px-5 py-3 rounded-full bg-amber-500 text-black font-semibold shadow hover:bg-amber-600 transition cursor-pointer"
//                     >
//                       Explore Features
//                     </button>

//                     <button
//                       onClick={() => navigate("/demo")}
//                       className="inline-flex items-center px-4 py-3 rounded-full border border-white/20 text-white bg-white/6 backdrop-blur-sm hover:bg-white/10 transition cursor-pointer"
//                     >
//                       Request Demo
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* small floating label (optional) */}
//             <div className="absolute left-4 top-4 z-20">
//               <span className="bg-white/6 text-white px-3 py-1 rounded-full text-sm">Live Demo</span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

import { QrCode, Clock, FileText, Bell, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";

import bg from "../assets/SwaadSetu_shape.png";
const features = [
  { icon: QrCode, title: "QR Code Ordering", description: "Customers scan and order instantly. No app downloads, no waiting for staff. Pure convenience.", color: "#FFBE00" },
  { icon: Clock, title: "Live Order Tracking", description: "Real-time order status updates from kitchen to table. Complete transparency for customers.", color: "#22C55E" },
  { icon: FileText, title: "Digital Bill Management", description: "Generate and share bills instantly. Support for split payments and custom discounts.", color: "#3B82F6" },
  { icon: Bell, title: "Instant Waiter Call", description: "Direct notification system for customer service. No more waiting or looking around.", color: "#F59E0B" },
  { icon: CreditCard, title: "Secure Payments", description: "Integrated UPI, cards, wallets. PCI-DSS compliant with instant payment reconciliation.", color: "#8B5CF6" },
  
];

export function StaffSection() {
  const navigate = useNavigate();

  // Replace these URLs with different images if you want variety; currently all 4 use the same source.
  const IMG = "https://hd.wallpaperswide.com/thumbs/god_of_war_kratos_spartan_warrior_videogame_gaming_greek_god_of_war-t2.jpg";

  return (
    <section className="section py-16 bg-[#111111]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-20">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left - Content */}
          <div className="space-y-8">
            {/* <div className="inline-block">
              <span className="bg-[#FFBE00] text-black text-sm font-semibold px-4 py-2 rounded-full">
                Customer Experience
              </span>
            </div> */}
                <div className="relative w-60 h-10 flex items-center">
              {/* Background image */}
              <img
                src={bg}
                alt="About Swaad Setu"
                className="absolute inset-0 w-60 h-10 object-cover"
              />

              {/* Optional dark overlay for readability */}
              {/* <div className="absolute inset-0  bg-black/40" /> */}

              {/* Text content on top */}
              <div className="relative z-10 px-4">
                <h3 className="text-lg px-3 mt-3 mb-1 font-semibold text-black">
                  Customer Experience
                </h3>
              </div>
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
              Features That Delight Your Customers
            </h2>

            <p className="text-lg text-[#EDEDED] leading-relaxed">
              Every feature is designed to create a seamless, modern dining experience that keeps
              customers coming back.
            </p>

            <div className="space-y-6 pt-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-4 rounded-xl hover:bg-[#222222] transition-colors"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: feature.color }}
                  >
                    <feature.icon size={24} className="text-black" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-[#EDEDED] text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Multi-card stacked & chained layout */}
          <div className="relative w-full max-w-[720px] mx-auto self-center">
            <div className="relative h-[640px] md:h-[580px]">

              {/* Decorative glow */}
              <div className="absolute -left-8 -top-8 w-52 h-52 bg-[#FFBE00] rounded-3xl opacity-12 blur-3xl pointer-events-none" />

              {/* CARD 1 — Top / Primary (left-top) */}
              <div className="absolute left-0 top-0 w-[68%] md:w-[62%] z-50 transform">
                <div className="relative group rounded-2xl overflow-hidden shadow-2xl border border-black/40">
                  <img
                    src={IMG}
                    alt="Primary artwork"
                    className="w-full h-[340px] md:h-[360px] object-cover block"
                  />
                  {/* Slide-up overlay */}
                  <div className="absolute left-0 right-0 bottom-0 rounded-b-2xl overflow-hidden h-0 group-hover:h-full transition-[height] duration-500 ease-in-out bg-gradient-to-t from-black/75 via-black/30 to-transparent pointer-events-none">
                    <div className="w-full h-full flex items-center justify-center pointer-events-auto px-6 py-8">
                      <div className="text-center">
                        <h4 className="text-white text-xl font-semibold mb-2">Explore Customer Features</h4>
                        <p className="text-sm text-gray-200 max-w-xs mx-auto mb-4">
                          Contactless ordering, live tracking, secure payments — everything to
                          make dining smooth and fast.
                        </p>

                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => navigate("/features")}
                            className="inline-flex items-center px-5 py-3 rounded-full bg-amber-500 text-black font-semibold shadow hover:bg-amber-600 transition cursor-pointer text-sm"
                          >
                            Explore Features
                          </button>

                          <button
                            onClick={() => navigate("/demo")}
                            className="inline-flex items-center px-4 text-sm py-3 rounded-full border border-white/20 text-white bg-white/6 backdrop-blur-sm hover:bg-white/10 transition cursor-pointer"
                          >
                            Request Demo
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute left-4 top-4 z-40">
                    <span className="bg-white/6 text-white px-3 py-1 rounded-full text-sm">Live Demo</span>
                  </div>
                </div>
              </div>

              {/* CARD 2 — Bottom / Secondary (right-bottom) */}
              <div className="absolute right-0 bottom-0 w-[60%] md:w-[54%] z-40 transform translate-x-6 translate-y-6">
                <div className="relative rounded-2xl overflow-hidden shadow-xl border border-black/30">
                  <img
                    src={IMG}
                    alt="Secondary artwork"
                    className="w-full h-[280px] md:h-[300px] object-cover block"
                    style={{ transform: "scale(1.03)" }}
                  />
                  <div className="absolute left-4 bottom-4 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                    Customer view
                  </div>
                </div>
              </div>

              {/* CARD 3 — Right-Top small card that touches CARD 2 left-bottom */}
              <div
                className="absolute left-[6%] -bottom-[30%] w-[56%] md:w-[50%] z-40"
                // slight negative translate to visually 'touch' the 2nd card's left-bottom corner
                style={{ transform: "translateX(12%) translateY(-6%)" }}
              >
                <div className="relative rounded-2xl overflow-hidden shadow-md border border-black/25">
                  <img
                    src={IMG}
                    alt="Tertiary artwork"
                    className="w-full h-[160px] md:h-[180px] object-cover block"
                  />
                  <div className="absolute right-3 bottom-3 bg-white/6 text-white text-xs px-2 py-1 rounded-full">
                    Quick view
                  </div>
                </div>
              </div>

              {/* CARD 4 — Right-Bottom small card that touches CARD 3 right-bottom -> left-top */}
              <div
                className="absolute right-[4%] bottom-[6%] w-[34%] md:w-[28%] z-30"
                // nudge up-left slightly so the left-top corner meets CARD 3 right-bottom visually
                style={{ transform: "translateX(-6%) translateY(6%)" }}
              >
                <div className="relative rounded-2xl overflow-hidden shadow-sm border border-black/20">
                  <img
                    src={IMG}
                    alt="Quaternary artwork"
                    className="w-full h-[140px] md:h-[160px] object-cover block"
                    style={{ filter: "brightness(0.95)" }}
                  />
                  <div className="absolute left-3 top-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                    Menu
                  </div>
                </div>
              </div>

              {/* subtle edge accents to reduce perceived empty space */}
              <div className="absolute left-0 bottom-0 w-12 h-1/3 bg-gradient-to-t from-black/80 to-transparent rounded-tr-2xl" />
              <div className="absolute right-0 top-0 w-12 h-1/3 bg-gradient-to-b from-black/80 to-transparent rounded-bl-2xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


