
import { useNavigate } from "react-router-dom";
import bg from "../assets/adminDashboard.jpeg";

export function AnalyticsSection() {
    const navigate = useNavigate();
  return (
   <section id="features" className="py-12 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-20">
        {/* Section Header */}
      <div className="max-w-3xl mx-auto mb-16 text-left md:text-center">
      {/* Label with bg image */}
      <div className=" flex justify-center items-center mt-10">
        <img
          src={bg}
          alt="Admin Dashboard"
          className="w-50 h-10 "
        />
       
      </div>
 


      {/* Heading + intro */}
      <h2 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-white">
        Data-Driven Decision Making
      </h2>
      <p className="mt-3 text-base sm:text-lg text-[#EDEDED]">
        Comprehensive analytics dashboard providing real-time insights into every aspect of your
        restaurant business.
      </p>

      {/* CTA button to features page */}
      <div className="mt-6 sm:block md:hidden">
        <button
          onClick={() => navigate("/features")}
          className="inline-flex items-center px-6 py-3 rounded-full bg-amber-500 text-black font-semibold text-sm sm:text-base shadow hover:bg-amber-600 transition"
        >
          Explore Features
        </button>
      </div>
    </div>

    {/* Dashboard Preview */}
    <div className="relative group rounded-3xl overflow-hidden border border-[#333333] bg-[#0b0b0b]">
      <img
        src="https://hd.wallpaperswide.com/thumbs/god_of_war_kratos_spartan_warrior_videogame_gaming_greek_god_of_war-t2.jpg"
        alt="Modern restaurant analytics dashboard displaying sales charts and order statistics"
        className="w-full h-[460px] md:h-[560px] lg:h-[640px] object-cover block"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-transparent pointer-events-none" />

      <div className="absolute inset-0 flex items-center justify-center px-4 sm:px-6 z-20 opacity-0 pointer-events-none transition-opacity duration-300 group-hover:opacity-100 group-hover:pointer-events-auto">
        <div className="w-full max-w-md text-center">
          <h4 className="text-white text-xl sm:text-2xl font-semibold mb-3">
            Explore Customer Features
          </h4>
          <p className="text-sm sm:text-base text-gray-200 mb-4">
            Contactless ordering, live tracking, secure payments — everything to make dining smooth
            and fast.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate("/features")}
              className="inline-flex text-sm items-center px-5 py-3 rounded-full bg-amber-500 text-black font-semibold shadow hover:bg-amber-600 transition cursor-pointer"
            >
              Explore Features
            </button>
            <button
              onClick={() => navigate("/demo")}
              className="inline-flex items-center px-4 py-3 rounded-full border border-white/20 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 transition cursor-pointer text-sm"
            >
              Request Demo
            </button>
          </div>
        </div>
      </div>

      <div className="absolute -right-16 -bottom-10 w-48 h-48 bg-amber-400 rounded-2xl opacity-10 blur-3xl pointer-events-none" />
      <div className="absolute right-6 top-6 z-20 text-sm text-gray-300">
        Live • Real-time analytics
      </div>
    </div>

    {/* Features List */}
    <div className="grid md:grid-cols-3 gap-8 mt-12">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">Sales Reports</h3>
        <p className="text-[#EDEDED]">
          Daily, weekly, monthly revenue tracking with trend analysis
        </p>
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
