import { FC, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "../component/Navbar";
import { Footer } from "../component/Footer";

const About: FC = () => {
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
          About{" "}
          <span className="text-yellow-500">
            Swaad Setu
          </span>
        </motion.h1>

        <motion.div
          initial={{ width: 0, x: -100 }}
          animate={{ width: "5rem", x: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut", type: "spring" }}
          className="h-1 bg-yellow-400 mx-auto mt-4 rounded-full"
        />

        {/* Section 1: Intro + images */}
        <section className="mt-12 flex flex-col md:flex-row gap-10 md:gap-16 items-center">
          {/* Left text */}
          <motion.div
            initial={{ opacity: 0, x: -200 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="md:w-1/2 text-center md:text-left"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight">
              We’re{" "}
              <span className="text-yellow-500">
                changing
              </span>{" "}
              the way people connect
            </h2>

            <motion.p
              initial={{ opacity: 0, x: -200 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
              className="mt-6 text-sm sm:text-base text-gray-600"
            >
              Swaad Setu bridges restaurants and their customers through seamless,
              contactless technology. From QR ordering to real-time tracking,
              we’re on a mission to simplify dining while empowering restaurant teams.
            </motion.p>
          </motion.div>

          {/* Right image stack */}
          <div className="md:w-1/2 flex gap-4 justify-center">
            {/* Column 1 */}
            <motion.div
              initial={{ opacity: 0, y: -200 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
              className="flex flex-col gap-4 mt-10"
            >
              <img
                src="https://placehold.co/400x260?text=Kitchen+Display+Screens"
                className="rounded-3xl shadow-md object-cover"
                alt="Modern restaurant kitchen display screens"
              />
              <img
                src="https://placehold.co/400x260?text=Admin+Dashboard"
                className="rounded-3xl shadow-md object-cover"
                alt="Admin dashboard with analytics"
              />
            </motion.div>

            {/* Column 2 */}
            <motion.div
              initial={{ opacity: 0, y: -200 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9, ease: "easeOut" }}
              className="flex flex-col gap-4"
            >
              <img
                src="https://placehold.co/400x260?text=QR+Menu+on+Table"
                className="rounded-3xl shadow-md object-cover"
                alt="QR menu on restaurant table"
              />
              <img
                src="https://placehold.co/400x260?text=Staff+Tablet+View"
                className="rounded-3xl shadow-md object-cover"
                alt="Staff tablet managing orders"
              />
            </motion.div>

            {/* Column 3 */}
            <motion.div
              initial={{ opacity: 0, y: -200 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1, ease: "easeOut" }}
              className="hidden lg:flex flex-col gap-4 mt-10"
            >
              <img
                src="https://placehold.co/280x260?text=Customer+Experience"
                className="rounded-3xl shadow-md object-cover"
                alt="Customer using QR ordering"
              />
            </motion.div>
          </div>
        </section>

        {/* Section 2: Mission + stats */}
        <section className="mt-20 flex flex-col md:flex-row gap-12 md:gap-16 items-start">
          {/* Left: mission */}
          <div className="md:w-1/2 text-center md:text-left">
            <motion.h2
              initial={{ opacity: 0, x: -200 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              className="text-3xl sm:text-4xl md:text-5xl font-semibold"
            >
              Our{" "}
              <span className="text-yellow-500">
                Mission
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, x: -200 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
              className="mt-6 text-sm sm:text-base text-gray-600 font-medium"
            >
              We want every restaurant – from small cafés to busy multi-outlet
              brands – to have access to the same world-class tools as big tech
              companies. Swaad Setu is built for the realities of Indian dining:
              high volume, diverse menus, and guests who value both speed and warmth.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, x: -200 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
              className="mt-4 text-sm sm:text-base text-gray-500"
            >
              We focus on practical features: QR ordering, live order tracking,
              kitchen displays, staff tools, and analytics – all working together
              so your team can focus on hospitality, not juggling paper tickets.
            </motion.p>
          </div>

          {/* Right: stats */}
          <div className="md:w-1/2 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 200 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              className="p-6 rounded-2xl bg-black text-white"
            >
              <h3 className="text-4xl sm:text-5xl font-bold text-yellow-400 text-center">
                44K+
              </h3>
              <p className="mt-2 text-center text-sm text-gray-200">
                Orders processed across partner restaurants
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 200 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
              className="p-6 rounded-2xl bg-white border border-yellow-200 shadow-sm"
            >
              <h3 className="text-4xl sm:text-5xl font-bold text-black text-center">
                19M+
              </h3>
              <p className="mt-2 text-center text-sm text-gray-600">
                Revenue tracked through Swaad Setu dashboards
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 200 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
              className="p-6 rounded-2xl bg-yellow-50 border border-yellow-200"
            >
              <h3 className="text-4xl sm:text-5xl font-bold text-black text-center">
                300+
              </h3>
              <p className="mt-2 text-center text-sm text-gray-700">
                Staff members using our tools daily
              </p>
            </motion.div>
          </div>
        </section>

        {/* Section 3: Team values */}
        <section className="mt-20">
          <motion.h2
            initial={{ opacity: 0, x: 200 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-3"
          >
            Our{" "}
            <span className="text-yellow-500">
              Team Values
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, x: -200 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            className="text-sm sm:text-base text-gray-500 mb-8"
          >
            We’re a small, focused team obsessed with solving real problems for
            restaurants. These are the principles we work by every day.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
            {[
              {
                title: "Be world-class",
                text: "We aim to build tools that feel as polished as the best global SaaS products — while staying rooted in Indian restaurant realities.",
              },
              {
                title: "Share everything you know",
                text: "We document, teach, and share. When one person learns, the entire team and our restaurant partners benefit.",
              },
              {
                title: "Always learning",
                text: "From customer feedback to new tech, we stay curious and keep improving – one release at a time.",
              },
              {
                title: "Be supportive",
                text: "We support each other and our partners. Great service behind the scenes leads to great service at the table.",
              },
              {
                title: "Take responsibility",
                text: "We own outcomes, not just tasks. If something breaks, we fix it, learn from it, and move forward together.",
              },
              {
                title: "Enjoy downtime",
                text: "We believe in sustainable pace. Happy, rested teams build better products and support customers better.",
              },
            ].map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -120 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: 0.2 + idx * 0.05, ease: "easeOut" }}
                className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition"
              >
                <p className="font-semibold mb-3 text-black">{item.title}</p>
                <p className="text-sm text-gray-600">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
      <Footer/>
    </div>
  );
};

export default About;
