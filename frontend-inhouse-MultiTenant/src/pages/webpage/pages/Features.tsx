import { useEffect, useRef, useState } from "react";
import Navbar from "../component/Navbar";
import BackButton from "../component/ui/BackButton";
import { Footer } from "../component/Footer";

type Tab = {
  id: string;
  label: string;
  images: string[];
  detailLeft: { title: string; lines: string[] };
  detailRight: { title: string; lines: string[] }; // same length as detailLeft.lines
};

const TABS: Tab[] = [
  {
    id: "tab-1",
    label: "Admin",
    images: [
      "https://picsum.photos/id/1015/1200/800",
      "https://picsum.photos/id/1018/1200/800",
      "https://picsum.photos/id/1025/1200/800",
    ],
    detailLeft: {
      title: "Admin Control",
      lines: ["Fast ordering", "Queue management", "Kiosk ready"],
    },
    detailRight: {
      title: "Admin Insights",
      lines: [
        "Fast ordering gives your customers a frictionless experience, reducing cart drop-off and improving table turnover.",
        "Queue management helps admins see bottlenecks in real time and redistribute workload across staff.",
        "Kiosk-ready flows make it easy to plug into self-service hardware without redesigning your operations.",
      ],
    },
  },
  {
    id: "tab-2",
    label: "Staff",
    images: [
      "https://picsum.photos/id/1035/1200/800",
      "https://picsum.photos/id/1040/1200/800",
      "https://picsum.photos/id/1041/1200/800",
    ],
    detailLeft: {
      title: "Staff Workflow",
      lines: ["Table management", "Menu syncing", "POS integration"],
    },
    detailRight: {
      title: "Staff Performance",
      lines: [
        "Table management lets staff quickly see which tables need attention and which are ready to close.",
        "Menu syncing ensures every device shows the latest prices, items, and availability — instantly.",
        "POS integration removes double entry and cuts down billing errors during rush hours.",
      ],
    },
  },
  {
    id: "tab-3",
    label: "User",
    images: [
      "https://picsum.photos/id/1050/1200/800",
      "https://picsum.photos/id/1060/1200/800",
      "https://picsum.photos/id/1062/1200/800",
    ],
    detailLeft: {
      title: "User Experience",
      lines: ["Delivery routing", "Partner apps", "Discount management"],
    },
    detailRight: {
      title: "User Retention",
      lines: [
        "Smart delivery routing reduces delays and improves overall satisfaction for repeat orders.",
        "Deep integrations with partner apps keep you visible where your customers already spend time.",
        "Discount management lets you run targeted offers that actually drive loyalty, not just one-time sales.",
      ],
    },
  },
];

const AUTO_PLAY_INTERVAL_MS = 3000;

export default function TabbedCarouselLayout(): JSX.Element {
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isHoveringCarousel, setIsHoveringCarousel] = useState<boolean>(false);
  const [selectedBulletIndex, setSelectedBulletIndex] = useState<number>(0); // 🔑 which bullet is active

  const autoplayRef = useRef<number | null>(null);

  const activeTab = TABS[activeTabIndex];
  const images = activeTab.images;
  const imageCount = images.length;

   /* 🔥 GUARANTEED SCROLL TO TOP */
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);


  // Reset image + selected bullet on tab change
  useEffect(() => {
    setCurrentImageIndex(0);
    setSelectedBulletIndex(0); // reset to first point when changing tab
  }, [activeTabIndex]);

  // Auto-advance carousel
  useEffect(() => {
    if (autoplayRef.current) {
      window.clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }

    if (!isHoveringCarousel && imageCount > 0) {
      autoplayRef.current = window.setInterval(() => {
        setCurrentImageIndex((i) => (i + 1) % imageCount);
      }, AUTO_PLAY_INTERVAL_MS);
    }

    return () => {
      if (autoplayRef.current) {
        window.clearInterval(autoplayRef.current);
        autoplayRef.current = null;
      }
    };
  }, [isHoveringCarousel, imageCount]);

  function goPrev() {
    setCurrentImageIndex((i) => (i - 1 + imageCount) % imageCount);
  }

  function goNext() {
    setCurrentImageIndex((i) => (i + 1) % imageCount);
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Fixed header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <Navbar />
        <div className="px-0 -mx-6 py-2">
          <BackButton />
        </div>
      </header>

      {/* Main content */}
      <main className="pt-28 pb-10 px-6 relative bg-white mt-5">
        {/* Decorative shapes */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <svg
            className="absolute -top-16 -left-16 w-96 opacity-30"
            viewBox="0 0 600 600"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g transform="translate(300,300)">
              <path
                d="M120,-170C160,-120,170,-60,170,10C170,80,160,160,110,200C60,240,-20,240,-90,210C-160,180,-210,120,-230,50C-250,-20,-240,-100,-200,-150C-160,-200,-80,-220,-10,-210C60,-200,80,-220,120,-170Z"
                fill="#FDE68A"
              />
            </g>
          </svg>
          <svg
            className="absolute -bottom-32 -right-16 w-96 opacity-10"
            viewBox="0 0 600 600"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g transform="translate(300,300)">
              <path
                d="M120,-170C160,-120,170,-60,170,10C170,80,160,160,110,200C60,240,-20,240,-90,210C-160,180,-210,120,-230,50C-250,-20,-240,-100,-200,-150C-160,-200,-80,-220,-10,-210C60,-200,80,-220,120,-170Z"
                fill="#ffffff"
              />
            </g>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* header + tab buttons */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-6">
            <div> 
              <h2 className="text-3xl sm:text-4xl font-semibold text-black ">
                <span className="block">Explore Features</span>
                <span className="block ">
                  Switch roles to preview their workspace
                </span>
              </h2>
              <p className="text-gray-600 mt-3 max-w-2xl text-sm sm:text-base">
                Click the bullets under each role to see how the right-hand insights change based on what matters most.
              </p>
            </div>

            {/* Tab buttons */}
            <div className="flex gap-3 md:justify-end">
              {TABS.map((t, idx) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTabIndex(idx)}
                  className={`rounded-full px-4 py-1 text-sm font-medium transition transform ${
                    idx === activeTabIndex
                      ? "bg-yellow-400 text-black shadow-lg scale-105"
                      : "bg-black/10 text-black hover:bg-gray-300"
                  }`}
                  aria-pressed={idx === activeTabIndex}
                  title={t.label}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1) Carousel box */}
            <div className="col-span-1">
              <div
                className="relative rounded-2xl overflow-hidden bg-black/80 border border-white/10 shadow-2xl"
                onMouseEnter={() => setIsHoveringCarousel(true)}
                onMouseLeave={() => setIsHoveringCarousel(false)}
              >
                <div className="w-full h-72 sm:h-96 md:h-[28rem] lg:h-[24rem]">
                  <img
                    key={images[currentImageIndex]}
                    src={images[currentImageIndex]}
                    alt={`${activeTab.label} ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover transition-opacity duration-700"
                    style={{ opacity: 1 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>

                {/* Prev/Next */}
                <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
                  <button
                    onClick={goPrev}
                    className="pointer-events-auto bg-black/60 border border-white/10 text-white p-2 rounded-full hover:bg-black/80 transition"
                    aria-label="Previous"
                  >
                    ‹
                  </button>
                  <button
                    onClick={goNext}
                    className="pointer-events-auto bg-black/60 border border-white/10 text-white p-2 rounded-full hover:bg-black/80 transition"
                    aria-label="Next"
                  >
                    ›
                  </button>
                </div>

                {/* indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`w-2 h-2 rounded-full transition-transform ${
                        i === currentImageIndex
                          ? "scale-125 bg-yellow-400"
                          : "bg-white/50"
                      }`}
                      aria-label={`Go to image ${i + 1}`}
                    />
                  ))}
                </div>

                {/* badge */}
                <div className="absolute top-3 left-3 bg-yellow-400 text-black px-3 py-1 rounded-full font-semibold text-sm shadow">
                  {activeTab.label} view
                </div>
              </div>

              {/* quick metrics */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/5 p-3">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    Avg. Order Value
                  </div>
                  <div className="text-lg font-bold text-yellow-500">₹420</div>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    Daily Orders
                  </div>
                  <div className="text-lg font-bold text-yellow-500">420</div>
                </div>
              </div>
            </div>

            {/* 2) Left details — clickable bullets */}
            <div className="col-span-1">
              <div className="rounded-2xl bg-white text-black p-6 shadow-2xl border border-black/10 h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold">
                    {activeTab.detailLeft.title}
                  </h3>
                  <ul className="mt-4 space-y-2 text-sm text-gray-700">
                    {activeTab.detailLeft.lines.map((line, idx) => {
                      const isActive = idx === selectedBulletIndex;
                      return (
                        <li
                          key={idx}
                          className={`flex items-start gap-3 leading-relaxed cursor-pointer rounded-lg px-2 py-1 transition ${
                            isActive
                              ? "bg-yellow-50 text-black"
                              : "hover:bg-gray-100"
                          }`}
                          onClick={() => setSelectedBulletIndex(idx)} // 🔥 update selected bullet
                        >
                          <span
                            className={`inline-block w-2 h-2 rounded-full mt-2 ${
                              isActive ? "bg-yellow-500" : "bg-gray-400"
                            }`}
                          />
                          <div className="lg:tooltip" data-tip="click me">

                          <span className={isActive ? "font-semibold" : ""}>
                            {line}
                          </span>
                          </div>

                        </li>
                      );
                    })}
                  </ul>
                </div>
{/* 
                <div className="mt-6 flex gap-3">
                  <button className="flex-1 bg-black text-white py-2 rounded-xl font-semibold hover:opacity-90 transition">
                    Explore This View
                  </button>
                </div> */}
              </div>
            </div>

            {/* 3) Right details — description based on selected bullet */}
            <div className="col-span-1">
              <div className="rounded-2xl bg-white text-black p-6 shadow-2xl border border-black/10 h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    {activeTab.detailRight.title}
                  </h3>

                  {/* show the selected bullet title */}
                  <div className="text-sm font-semibold text-yellow-600 mb-2">
                    {activeTab.detailLeft.lines[selectedBulletIndex]}
                  </div>

                  {/* description mapped by index */}
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {activeTab.detailRight.lines[selectedBulletIndex]}
                  </p>
                </div>

                <div className="mt-6">
                  <div className="text-sm text-gray-600 mb-2 font-medium">
                    Quick stats
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1 rounded-lg bg-black/5 p-3 text-sm">
                      <div className="text-xs text-gray-500">Conversion</div>
                      <div className="font-semibold text-yellow-500">4.2%</div>
                    </div>
                    <div className="flex-1 rounded-lg bg-black/5 p-3 text-sm">
                      <div className="text-xs text-gray-500">Satisfaction</div>
                      <div className="font-semibold text-yellow-500">98%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
