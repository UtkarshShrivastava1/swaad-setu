import { useEffect, useRef, useState } from "react";

/**
 * FeaturesCarousel.jsx
 * - click tabs (Admin / Staff / User) to swap slide sets
 * - image always centered (object-contain)
 * - autoplay slides for the active tab
 */

export default function FeaturesCarousel({
  panels = null, // optional panels override; default sample is used when not provided
  interval = 4500,
  cardMaxWidth = 900,
  cardHeight = 520,
}) {
  // default demo data (replace with your real screenshots)
  const demoPanels = {
    admin: {
      title: "Admin Panel",
      intro: "Powerful tools for restaurant owners & managers.",
      slides: [
        {
          src: "https://placehold.co/1200x800?text=Admin+Dashboard+1",
          title: "Orders Overview",
          caption: "Overview of daily orders, revenue, and quick actions.",
        },
        {
          src: "https://placehold.co/1200x800?text=Admin+Settings",
          title: "Settings & User Management",
          caption: "Manage staff accounts, permissions, and store configuration.",
        },
      ],
    },
    staff: {
      title: "Staff Tools",
      intro: "Speed-focused interfaces for kitchen & front-of-house staff.",
      slides: [
        {
          src: "https://placehold.co/1200x800?text=Kitchen+Display",
          title: "Kitchen Display",
          caption: "Real-time order tickets with timers and priority markers.",
        },
        {
          src: "https://placehold.co/1200x800?text=POS+Interface",
          title: "POS Interface",
          caption: "Fast-touch POS for quick order entry and checkouts.",
        },
      ],
    },
    user: {
      title: "Customer Experience",
      intro: "Simple, fast, contactless ordering for customers.",
      slides: [
        {
          src: "https://placehold.co/1200x800?text=Customer+Menu",
          title: "QR Menu & Ordering",
          caption: "Scan QR, browse menu, customize items, place orders contactlessly.",
        },
        {
          src: "https://placehold.co/1200x800?text=Order+Tracking",
          title: "Order Tracking",
          caption: "Track order status in real-time from preparation to ready.",
        },
      ],
    },
  };

  const data = panels || demoPanels;

  const tabKeys = Object.keys(data);
  const [activeTab, setActiveTab] = useState(tabKeys[0] || "admin");
  const slides = data[activeTab].slides || [];
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);
  const startXRef = useRef(null);

  // autoplay slides of current tab
  useEffect(() => {
    startAuto();
    return () => stopAuto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, activeTab, slides.length]);

  function startAuto() {
    stopAuto();
    if (!slides || slides.length <= 1) return;
    timerRef.current = setTimeout(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, interval);
  }
  function stopAuto() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  // when tab changes, reset slide index to 0
  useEffect(() => {
    setIndex(0);
  }, [activeTab]);

  // keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIndex((i) => (i + 1) % slides.length);
  const goTo = (i) => setIndex(i % slides.length);

  // swipe handlers
  const onPointerDown = (e) => {
    startXRef.current = e.clientX ?? e.touches?.[0]?.clientX;
    stopAuto();
  };
  const onPointerUp = (e) => {
    if (startXRef.current == null) return;
    const endX = e.clientX ?? e.changedTouches?.[0]?.clientX;
    const delta = endX - startXRef.current;
    startXRef.current = null;
    if (Math.abs(delta) > 50) {
      if (delta < 0) next();
      else prev();
    }
    startAuto();
  };

  if (!tabKeys.length) return null;

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {tabKeys.map((k) => (
          <button
            key={k}
            onClick={() => setActiveTab(k)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              activeTab === k
                ? "bg-amber-500 text-white shadow"
                : "bg-white ring-1 ring-gray-200 text-gray-700"
            }`}
          >
            {data[k].title}
          </button>
        ))}
      </div>

      {/* Layout: carousel left, text right on lg; stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left: Carousel */}
        <div
          className="relative rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden"
          onMouseEnter={stopAuto}
          onMouseLeave={startAuto}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onTouchStart={onPointerDown}
          onTouchEnd={onPointerUp}
        >
          {/* slides row */}
          <div
            className="flex transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
            style={{
              width: `${slides.length * 100}%`,
              transform: `translateX(-${index * (100 / slides.length)}%)`,
            }}
          >
            {slides.map((s, i) => (
              <div
                key={i}
                className="w-full flex-shrink-0 flex items-center justify-center px-6 py-6"
                style={{ minHeight: cardHeight }}
              >
                <div
                  className="w-full bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-center overflow-hidden"
                  style={{ maxWidth: `${cardMaxWidth}px`, height: `${cardHeight}px` }}
                >
                  {/* CENTERED IMAGE */}
                  <img
                    src={s.src}
                    alt={s.title || `slide-${i + 1}`}
                    loading="lazy"
                    draggable={false}
                    className="max-w-full max-h-full object-contain"
                    style={{ display: "block", margin: "0 auto" }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* arrows */}
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 rounded-full bg-white/90 hover:bg-white border border-gray-200 shadow p-2 flex items-center justify-center"
          >
            <span className="text-gray-600 text-xl select-none">‹</span>
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 rounded-full bg-white/90 hover:bg-white border border-gray-200 shadow p-2 flex items-center justify-center"
          >
            <span className="text-gray-600 text-xl select-none">›</span>
          </button>

          {/* indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
            <div className="flex gap-3 items-center">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`transition-all rounded-full ${
                    i === index ? "bg-amber-500 w-10 h-2.5" : "bg-gray-300 w-2.5 h-2.5"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right: text & bullets */}
        <div>
          <h3 className="text-2xl font-semibold">{data[activeTab].title}</h3>
          <p className="text-gray-600 mt-3">{data[activeTab].intro}</p>

          <ul className="mt-6 space-y-3">
            {/* example bullets — you can supply actual highlights per panel */}
            {activeTab === "admin" && (
              <>
                <li className="flex gap-3 items-start">
                  <span className="w-2.5 h-2.5 mt-2 rounded-full bg-amber-500" />
                  <span className="text-gray-700">Real-time analytics & revenue dashboard</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="w-2.5 h-2.5 mt-2 rounded-full bg-amber-500" />
                  <span className="text-gray-700">Menu, pricing & promotions management</span>
                </li>
              </>
            )}

            {activeTab === "staff" && (
              <>
                <li className="flex gap-3 items-start">
                  <span className="w-2.5 h-2.5 mt-2 rounded-full bg-amber-500" />
                  <span className="text-gray-700">Kitchen display with timers & prioritization</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="w-2.5 h-2.5 mt-2 rounded-full bg-amber-500" />
                  <span className="text-gray-700">Fast POS workflows for quick checkout</span>
                </li>
              </>
            )}

            {activeTab === "user" && (
              <>
                <li className="flex gap-3 items-start">
                  <span className="w-2.5 h-2.5 mt-2 rounded-full bg-amber-500" />
                  <span className="text-gray-700">QR-driven contactless ordering</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="w-2.5 h-2.5 mt-2 rounded-full bg-amber-500" />
                  <span className="text-gray-700">Order tracking & secure payments (UPI)</span>
                </li>
              </>
            )}
          </ul>

         
        </div>
      </div>
    </div>
  );
}




