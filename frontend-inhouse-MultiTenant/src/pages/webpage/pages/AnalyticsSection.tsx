
import { useNavigate } from "react-router-dom";
import bg from "../assets/SwaadSetu_shape.png";

export function AnalyticsSection() {
    const navigate = useNavigate();
  return (
    <section id="features" className="py-24 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-20">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          {/* <div className="inline-block mb-4">
            <span className="bg-[#FFBE00] text-black text-sm font-semibold px-4 py-2 rounded-full">
              Admin Dashboard
            </span>
          </div> */}

          
              <div className="relative w-54 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto">
                  {/* Background image */}
              <img
              src={bg}
              alt="Staff Portal"
              className="w-full h-12 sm:h-14 md:h-16 lg:h-20 object-cover rounded-md "
            />
            <div className="absolute inset-0 flex items-center justify-center px-4 mt-5 mr-6">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-black text-center">
                 Admin Dashboard
              </h3>
            </div>
            </div>
          <h2 className="text-4xl lg:text-5xl font-bold font-heading text-white mb-6">Data-Driven Decision Making</h2>
          <p className="text-lg text-[#EDEDED]">
            Comprehensive analytics dashboard providing real-time insights into every aspect of your restaurant
            business.
          </p>
        </div>

       
    

        {/* Dashboard Preview */}
        {/* Dashboard Preview — with overlay, KPI chips & CTAs */}
   
<div className="relative group rounded-3xl overflow-hidden border border-[#333333] bg-[#0b0b0b]">
  {/* Background image */}
  <img
    src="https://hd.wallpaperswide.com/thumbs/god_of_war_kratos_spartan_warrior_videogame_gaming_greek_god_of_war-t2.jpg"
    alt="Modern restaurant analytics dashboard displaying sales charts and order statistics"
    className="w-full h-[420px] md:h-[520px] object-cover block"
  />

  {/* Dark gradient overlay */}
  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent pointer-events-none" />

  {/* Hover overlay content */}
  <div
    className="
      absolute inset-0
      flex items-center justify-center
      px-6
      z-20
      opacity-0
      pointer-events-none
      transition-opacity duration-300
      group-hover:opacity-100
      group-hover:pointer-events-auto
    "
  >
    <div className="w-full h-full flex items-center justify-center px-6">
      <div className="text-center">
        <h4 className="text-white text-xl font-semibold mb-3">
          Explore Customer Features
        </h4>

        <p className="text-sm text-gray-200 max-w-xs mx-auto mb-4">
          Contactless ordering, live tracking, secure payments — everything to
          make dining smooth and fast.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate("/features")}
            className="inline-flex items-center px-5 py-3 rounded-full bg-amber-500 text-black font-semibold shadow hover:bg-amber-600 transition cursor-pointer"
          >
            Explore Features
          </button>

          <button
            onClick={() => navigate("/demo")}
            className="inline-flex items-center px-4 py-3 rounded-full border border-white/20 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 transition cursor-pointer"
          >
            Request Demo
          </button>
        </div>
      </div>
    </div>
  </div>

  {/* Decorative glow */}
  <div className="absolute -right-16 -bottom-10 w-48 h-48 bg-amber-400 rounded-2xl opacity-10 blur-3xl pointer-events-none" />

  {/* Top-right label */}
  <div className="absolute right-6 top-6 z-20 text-sm text-gray-300">
    Live • Real-time analytics
  </div>
</div>




        {/* Features List */}
        <div className="grid md:grid-cols-3 gap-8 mt-12">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">Sales Reports</h3>
            <p className="text-[#EDEDED]">Daily, weekly, monthly revenue tracking with trend analysis</p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">Menu Insights</h3>
            <p className="text-[#EDEDED]">Best sellers, slow movers, and profit margin analysis</p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">Customer Analytics</h3>
            <p className="text-[#EDEDED]">Repeat customers, peak hours, and behavioral patterns</p>
          </div>
        </div>
      </div>
    </section>
  )
}
