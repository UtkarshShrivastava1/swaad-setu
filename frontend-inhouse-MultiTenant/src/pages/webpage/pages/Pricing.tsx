import { FC, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "../component/Navbar";
import { Footer } from "../component/Footer";

const Pricing: FC = () => {
    /* 🔥 GUARANTEED SCROLL TO TOP */
    useEffect(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, []);
  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 via-white to-yellow-50 text-black overflow-x-hidden">
      <Navbar/>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mt-16">
        {/* Page title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-center text-3xl sm:text-4xl md:text-5xl font-bold text-black"
        >
          Our Pricing
        </motion.h1>

        <motion.div
          initial={{ width: 0, x: -100 }}
          animate={{ width: "5rem", x: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut", type: "spring" }}
          className="h-1 bg-yellow-400 mx-auto mt-4 rounded-full"
        />

        {/* Pricing Section */}
        <section className="mt-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pricing Tier 1 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="border border-gray-200 rounded-2xl p-8 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <h2 className="text-2xl font-semibold text-center">Basic</h2>
              <p className="text-center text-gray-500 mt-2">For small restaurants</p>
              <p className="text-5xl font-bold text-center mt-6">₹499<span className="text-lg font-medium">/mo</span></p>
              <ul className="mt-8 space-y-4 text-gray-600">
                <li>QR Menu</li>
                <li>Order Management</li>
                <li>Table Management</li>
                <li>Basic Analytics</li>
              </ul>
              <button className="w-full mt-8 bg-yellow-400 text-black font-bold py-3 rounded-lg hover:bg-yellow-500 transition-colors">Get Started</button>
            </motion.div>

            {/* Pricing Tier 2 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="border-2 border-yellow-400 rounded-2xl p-8 bg-white shadow-xl relative"
            >
              <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                <span className="bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-semibold">Most Popular</span>
              </div>
              <h2 className="text-2xl font-semibold text-center">Pro</h2>
              <p className="text-center text-gray-500 mt-2">For growing businesses</p>
              <p className="text-5xl font-bold text-center mt-6">₹999<span className="text-lg font-medium">/mo</span></p>
              <ul className="mt-8 space-y-4 text-gray-600">
                <li>Everything in Basic</li>
                <li>Advanced Analytics</li>
                <li>Inventory Management</li>
                <li>Waiter Management</li>
              </ul>
              <button className="w-full mt-8 bg-yellow-400 text-black font-bold py-3 rounded-lg hover:bg-yellow-500 transition-colors">Get Started</button>
            </motion.div>

            {/* Pricing Tier 3 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="border border-gray-200 rounded-2xl p-8 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <h2 className="text-2xl font-semibold text-center">Enterprise</h2>
              <p className="text-center text-gray-500 mt-2">For large chains</p>
              <p className="text-5xl font-bold text-center mt-6">Contact Us</p>
              <ul className="mt-8 space-y-4 text-gray-600">
                <li>Everything in Pro</li>
                <li>Multi-outlet Management</li>
                <li>Dedicated Support</li>
                <li>Custom Features</li>
              </ul>
              <button className="w-full mt-8 bg-gray-800 text-white font-bold py-3 rounded-lg hover:bg-black transition-colors">Contact Sales</button>
            </motion.div>
          </div>
        </section>
      </div>
      <Footer/>
    </div>
  );
};

export default Pricing;
