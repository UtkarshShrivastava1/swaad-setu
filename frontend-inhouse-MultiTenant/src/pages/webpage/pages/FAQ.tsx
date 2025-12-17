import React, { useState } from "react";
import { faqData } from "../component/FAQ"; // adjust path
import { CTASection } from "../component/cta-section";
import Navbar from "../component/Navbar";
import { Footer } from "../component/Footer";

type CategoryId =
  | "general"
  | "customer"
  | "features"
  | "setup"
  | "pricing"
  | "support"
  | "integration"
  | "compliance";

const FAQ: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("general");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");


  const toggleFAQ = (id: string) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const onSearch = () => {
    if (!searchTerm.trim()) return;
    // optional: you can filter in-memory instead of DOM querying
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = e => {
    if (e.key === "Enter") onSearch();
  };

  // const categories: { id: CategoryId; label: string }[] = [
  //   { id: "general", label: "General" },
  //   { id: "customer", label: "Customer Experience" },
  //   { id: "features", label: "Features & Benefits" },
  //   { id: "setup", label: "Setup & Technical" },
  //   { id: "pricing", label: "Pricing & Billing" },
  //   { id: "support", label: "Support" },
  //   { id: "integration", label: "Integration" },
  //   { id: "compliance", label: "Compliance" },
  // ];

  
  const categories = faqData.map(c => ({ id: c.id, label: c.label }));

  const activeCategoryData = faqData.find(c => c.id === activeCategory);




  return (
    <div className="bg-[#fffef8] text-[#1a1a1a] min-h-screen">
      {/* Header */}
   
      <Navbar/>

    

      {/* Main layout */}
   <main className="max-w-6xl mx-auto px-5 mb-16 py-30">

      <div className="mb-10  w-full flex flex-col justify-center items-center">
          <h1 className="font-bold text-2xl lg:text-4xl ">SWAAD SETU - <span className="text-yellow-400">FAQ  </span></h1>
         <p className="text-gray-500 ">Everything you need to know about our QR-based ordering platform</p>
      </div>
  <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6 ">
    {/* Sidebar */}
    <aside className="w-full md:w-64 md:sticky md:top-5">
      <ul className="flex flex-wrap md:flex-col gap-1">
        {categories.map( cat => (
          <li key={cat.id} className="w-1/2 md:w-full">
            <button
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={[
                "w-full text-left text-sm font-medium px-4 py-2 rounded-md border-2 border-transparent shadow-sm transition-all",
                "bg-white text-[#666666] hover:bg-[#f9f9f6] hover:text-gray-400",
                activeCategory === cat.id
                  ? "bg-linear-135 from-[#1a1a1a] to-[#2d2d2d] text-white border-l-4 border-l-[#ffc107] shadow-lg font-bold"
                  : "",
              ].join(" ")}
            >
              {cat.label}
            </button>
          </li>
        ))}
      </ul>
    </aside>

          {/* FAQ content (example: only General shown, replicate for others) */}
         <section className="flex-1 flex flex-col gap-4">
      {activeCategoryData && (
        <div className="animate-[slideIn_0.3s_ease]">
          <h1 className="text-xl md:text-3xl font-extrabold text-[#1a1a1a] mb-5 pb-3 border-b-2 border-b-yellow-300 ml-4">
            {activeCategoryData.label} {activeCategory}
          </h1>
          {activeCategoryData.items.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-md shadow-md hover:shadow-lg transition-transform duration-200 hover:-translate-y-0.5 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleFAQ(item.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left font-medium text-base text-[#1a1a1a] hover:bg-[#f9f9f6] transition-colors hover:text-yellow-400"
              >
                <span>{item.question}</span>
                <span
                  className={[
                    "text-lg text-[#1a1a1a] transition-transform",
                    openItems[item.id] ? "rotate-180" : "",
                  ].join(" ")}
                >
                  ❱
                </span>
              </button>

              <div
                className={[
                  "bg-[#fafaf8] overflow-hidden transition-all duration-300",
                  openItems[item.id]
                    ? "max-h-[500px] px-5 pb-5 pt-0"
                    : "max-h-0 px-5 pb-0",
                ].join(" ")}
              >
                {item.answer}

                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-block px-3 py-1 rounded-full bg-[#ffe082] text-[11px] font-medium text-[#1a1a1a]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  
        </div>
      </main>

      {/* CTA section */}
      <CTASection />

      {/* Footer (convert similarly using Tailwind if present in your file) */}

      <Footer/>
    </div>
  );
};

export default FAQ;
