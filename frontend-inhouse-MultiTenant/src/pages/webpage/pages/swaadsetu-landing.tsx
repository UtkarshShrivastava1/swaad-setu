'use client';

import React, { useState, useEffect } from 'react';
import Hero from './Hero';
import { LayoutGrid } from '../component/LayoutGrid';
import {motion } from 'framer-motion'
import { CardBody, CardContainer, CardItem } from "../component/ui/3d-card";
import { useNavigate } from 'react-router-dom';

const SkeletonOne = () => {
  return (
    <div className="space-y-3">
      <p className="font-bold md:text-4xl text-2xl text-white">
        House in the woods
      </p>
      <p className="font-normal text-base my-2 max-w-lg text-neutral-200">
        A serene and tranquil retreat, this house in the woods offers a peaceful
        escape from the hustle and bustle of city life.
      </p>
    </div>
  );
};

const SkeletonTwo = () => {
  return (
    <div className="space-y-3">
      <p className="font-bold md:text-4xl text-2xl text-white">
        House above the clouds
      </p>
      <p className="font-normal text-base my-2 max-w-lg text-neutral-200">
        Perched high above the world, this house offers breathtaking views and a
        unique living experience. It&apos;s a place where the sky meets home,
        and tranquility is a way of life.
      </p>
    </div>
  );
};

const SkeletonThree = () => {
  return (
    <div className="space-y-3">
      <p className="font-bold md:text-4xl text-2xl text-white">
        Greens all over
      </p>
      <p className="font-normal text-base my-2 max-w-lg text-neutral-200">
        A house surrounded by greenery and nature&apos;s beauty. It&apos;s the
        perfect place to relax, unwind, and enjoy life.
      </p>
    </div>
  );
};

const SkeletonFour = () => {
  return (
    <div className="space-y-3">
      <p className="font-bold md:text-4xl text-2xl text-white">
        Rivers are serene
      </p>
      <p className="font-normal text-base my-2 max-w-lg text-neutral-200">
        A house by the river is a place of peace and tranquility. It&apos;s the
        perfect place to relax, unwind, and enjoy life.
      </p>
    </div>
  );
};

interface FormData {
  name: string;
  email: string;
  restaurant: string;
  message: string;
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

interface ScreenshotCardProps {
  icon: string;
  title: string;
  description: string;
}

const SwaadsetuLanding: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    restaurant: '',
    message: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const navigate = useNavigate();

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -80px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-visible');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Active section tracking on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'features', 'about', 'screenshots', 'contact'];
      const scrollPosition = window.scrollY + 120;

      for (const sectionId of sections) {
        const section = document.getElementById(sectionId);
        if (section) {
          const { offsetTop, clientHeight } = section;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + clientHeight
          ) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: hook up API call
    console.log('Form submitted:', formData);

    setShowSuccess(true);
    setFormData({ name: '', email: '', restaurant: '', message: '' });

    setTimeout(() => {
      setShowSuccess(false);
    }, 4000);

    setTimeout(() => {
      setIsSubmitting(false);
    }, 800);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cards = [
    {
      id: 1,
      content: <SkeletonOne />,
      className: 'md:col-span-2',
      thumbnail:
        'https://images.unsplash.com/photo-1476231682828-37e571bc172f?q=80&w=3474&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      id: 2,
      content: <SkeletonTwo />,
      className: 'col-span-1',
      thumbnail:
        'https://images.unsplash.com/photo-1464457312035-3d7d0e0c058e?q=80&w=1200&auto=format&fit=crop',
    },
    {
      id: 3,
      content: <SkeletonThree />,
      className: 'col-span-1',
      thumbnail:
        'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?q=80&w=1200&auto=format&fit=crop',
    },
    {
      id: 4,
      content: <SkeletonFour />,
      className: 'md:col-span-2',
      thumbnail:
        'https://images.unsplash.com/photo-1475070929565-c985b496cb9f?q=80&w=1200&auto=format&fit=crop',
    },
  ];

  const features: FeatureCardProps[] = [
    {
      icon: '📋',
      title: 'Digital Menu',
      description:
        'Dynamic menu management with categories, combos, pricing, and real-time updates. Support for images, descriptions, and dietary preferences.',
    },
    {
      icon: '🛎️',
      title: 'Order Management',
      description:
        'Seamless order tracking from placement to completion with real-time status and order history.',
    },
    {
      icon: '💳',
      title: 'Smart Billing',
      description:
        'Automated bill generation with taxes, discounts, charges, and multiple payment methods.',
    },
    {
      icon: '📊',
      title: 'Analytics Dashboard',
      description:
        'Insights into revenue, top items, peak hours, and customer trends across custom ranges.',
    },
    {
      icon: '🪑',
      title: 'Table Management',
      description:
        'Track table sessions, staff assignment, and availability in real-time.',
    },
    {
      icon: '👥',
      title: 'Staff Control',
      description:
        'Role-based access, secure authentication, and activity logs for your team.',
    },
    {
      icon: '💰',
      title: 'Pricing Config',
      description:
        'Flexible tax, discount, and service charge configuration with version control.',
    },
    {
      icon: '📱',
      title: 'Mobile Ready',
      description:
        'Responsive layouts optimised for tablets and phones for staff and customers.',
    },
    {
      icon: '🔐',
      title: 'Secure & Reliable',
      description:
        'JWT auth, PIN protection, and hardened API endpoints to protect your data.',
    },
  ];

 const screenshots: ScreenshotCardProps[] = [
  {
    imageUrl: 'https://get.apicbase.com/wp-content/uploads/2024/10/Apicbase-Restaurant-Management-Software.png',
    title: 'Menu Management',
    description:
      'Create and update your menu with items, combos, images, and dietary tags in seconds.',
  },
  {
    imageUrl: '/images/order-tracking.png',
    title: 'Order Tracking',
    description:
      'Monitor all orders live and track them from pending to delivered.',
  },
  {
    imageUrl: '/images/billing-system.png',
    title: 'Billing System',
    description:
      'Generate accurate bills with extras, taxes, and discounts supported out-of-the-box.',
  },
  {
    imageUrl: '/images/analytics-dashboard.png',
    title: 'Analytics Dashboard',
    description:
      'See revenue trends, top sellers, and peak hours at a glance.',
  },
  {
    imageUrl: '/images/table-management.png',
    title: 'Table Management',
    description:
      'Visualise table occupancy, open sessions, and assignments in one place.',
  },
  {
    imageUrl: '/images/staff-portal.png',
    title: 'Staff Portal',
    description:
      'Let staff manage orders and bills quickly using a focused workspace.',
  },
];


  return (
    <div className="font-sans bg-white text-black overflow-x-hidden scroll-smooth">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 bg-black/90 backdrop-blur border-b border-yellow-500/40 shadow-lg z-50">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <button
            onClick={() => scrollToSection('home')}
            className="flex items-center gap-2 text-xl sm:text-2xl font-extrabold text-yellow-400 tracking-wider uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/80 rounded cursor-pointer"
            aria-label="Swaadsetu home"
          >
            <span className="text-2xl">🍽️</span>
            <span>Swaadsetu</span>
          </button>

          

          <ul className="hidden md:flex items-center gap-6 text-sm font-medium">
            {['home', 'features', 'about', 'screenshots', 'contact'].map(
              (section) => (
                <li key={section}>
                  <button
                    onClick={() => scrollToSection(section)}
                    className={`transition-colors duration-200 px-2 py-1 rounded ${
                      activeSection === section
                        ? 'text-yellow-400'
                        : 'text-white hover:text-yellow-300'
                    } focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/80`}
                  >
                    {section.charAt(0).toUpperCase() + section.slice(1)}
                  </button>
                </li>
              ),
            )}
            <li>
              <button
                onClick={() => navigate('/select-restaurant')}
                className="transition-colors duration-200 px-4 py-2 rounded-full text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/80"
              >
                Go to App
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Spacer for fixed nav */}
      <div className="h-16 md:h-14" />

      {/* Hero Section */}
      <section id="home" className="relative">
        <Hero />
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-100"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-black">
              Powerful Features for Modern Restaurants
            </h2>
            <div className="w-24 h-1 bg-yellow-400 mx-auto mt-4 rounded-full" />
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              Everything from digital menus to analytics in one cohesive
              platform built for Indian dining experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {features.map((feature, index) => (
              <article
                key={index}
                className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-600 bg-white border border-gray-200 rounded-2xl p-7 shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-yellow-400/80 group"
              >
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-yellow-100 text-3xl mb-4 group-hover:scale-105 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-black">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
<section id="about" className="py-20 px-4 md:px-8 bg-white text-black max-w-9xl mx-auto">   
  {/* Heading full width on top */}
  <div className="mb-12 text-center">
  <h2 className="text-4xl font-bold text-yellow-400 inline-block">
    About Swaadsetu
  </h2>
  <div className="w-24 h-1 bg-yellow-400 mt-2 mx-auto" />
</div>

  

  {/* Two-column layout: left images, right content */}
  <div className="grid grid-cols-2 md:flex-row gap-12 ">
    {/* Left: Image grid */}
    <motion.div className="flex-1 "
    //  preserveAspectRatio="none"
    initial={{ y: 20 }}
    animate={{ y: 0 }}
    transition={{ repeat: Infinity, repeatType: "mirror", duration: 6, ease: "easeInOut" }}
    style={{ fill: "#FBBF24" }}
    >
      <div className='bg-yellow-200 rounded-b-full w-full '/>
      <LayoutGrid cards={cards} />
    </motion.div>



<div className="flex-1 flex flex-col justify-center max-w-md space-y-6 relative">
  {/* Animated yellow waves SVG background */}
  <motion.svg
    className="absolute inset-0 -z-10"
    viewBox="0 0 1440 320"
    preserveAspectRatio="none"
    initial={{ y: 20 }}
    animate={{ y: 0 }}
    transition={{ repeat: Infinity, repeatType: "mirror", duration: 6, ease: "easeInOut" }}
    style={{ fill: "#FBBF24" }} // Tailwind yellow-400
  >
    <path
      fillOpacity="0.8"
      d="M0,128L48,133.3C96,139,192,149,288,176C384,203,480,245,576,234.7C672,224,768,160,864,149.3C960,139,1056,181,1152,197.3C1248,213,1344,203,1392,197.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
    />
  </motion.svg>

  {/* <div className='bg-yellow-300 rounded-2xl w-full'></div> */}
  
  <p className="text-xl leading-relaxed relative">
    Swaadsetu is a comprehensive restaurant management system designed to streamline your operations and enhance customer experience. From digital menus to automated billing, we provide everything you need to run a modern restaurant.
  </p>
  <p className="text-xl leading-relaxed relative">
    Our platform handles menu management, order processing, billing, table assignments, staff coordination, and business analytics - all in one integrated solution.
  </p>
  <p className="text-xl leading-relaxed relative">
    Built with cutting-edge technology, Swaadsetu offers real-time updates, secure authentication, and a user-friendly interface that works seamlessly across all devices.
  </p>
</div>

  </div>
</section>


{/* <section id="screenshots" className="py-20 px-8 bg-gradient-to-b from-white to-gray-100">
  <h2 className="text-4xl font-bold text-center mb-12 text-black">
    See It In Action
    <div className="w-24 h-1 bg-yellow-400 mx-auto mt-4" />
  </h2>
  <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    {screenshots.map((screenshot, i) => (
      <motion.div
        key={i}
        className="opacity-0 translate-y-8 rounded-2xl overflow-hidden shadow-lg hover:scale-105 hover:shadow-2xl bg-white"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: i * 0.05 }}
        viewport={{ once: true }}
      >
        <div className="w-full h-64 bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-7xl text-black">
          {screenshot.icon}
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold mb-2 text-black">{screenshot.title}</h3>
          <p className="text-gray-600">{screenshot.description}</p>
        </div>
      </motion.div>
    ))}
  </div>
</section> */}


      {/* Screenshots Section */}
      <section
        id="screenshots"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-gray-50 to-gray-100"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-black">
              See Swaadsetu in Action
            </h2>
            <div className="w-24 h-1 bg-yellow-400 mx-auto mt-4 rounded-full" />
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              A glimpse of key modules your team will use every day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">

            {screenshots.map((screenshot, index) => (

               <CardContainer className="inter-var w-[90%]" key={index}>
      <CardBody className="bg-gray-50 relative group/card  dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-[20%] sm:w-[30rem] h-auto rounded-xl p-6 border  ">
        <CardItem
          translateZ="50"
          className="text-xl font-bold text-neutral-600 dark:text-white"
        >
          {screenshot.title}
        </CardItem>
        <CardItem
          as="p"
          translateZ="60"
          className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300"
        >
             {screenshot.description}
        </CardItem>
        <CardItem translateZ="100" className="w-full mt-4">
          <img
            src={screenshot.imageUrl}
            height="1000"
            width="1000"
            className="h-60 w-full object-cover rounded-xl group-hover/card:shadow-xl"
            alt="thumbnail"
          />
        </CardItem>
        <div className="flex justify-between items-center mt-20">
          <CardItem
            translateZ={20}
            as="a"
            href="https://twitter.com/mannupaaji"
            target="__blank"
            className="px-4 py-2 rounded-xl text-xs font-normal dark:text-white"
          >
            Try now →
          </CardItem>
          <CardItem
            translateZ={20}
            as="button"
            className="px-4 py-2 rounded-xl  bg-yellow-400  dark:bg-white dark:text-black text-white text-xs font-bold"
          >
            Sign up
          </CardItem>
        </div>
      </CardBody>
    </CardContainer>


              // <article
              //   key={index}
              //   className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-600 bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-2"
              // >
              //   <div className="w-full h-56  bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-6xl text-black">
              //     {screenshot.icon}
              //   </div>
              //   <div className="p-6">
              //     <h3 className="text-lg font-semibold mb-1 text-black">
              //       {screenshot.title}
              //     </h3>
              //     <p className="text-sm text-gray-600 leading-relaxed">
              //       {screenshot.description}
              //     </p>
              //   </div>
              // </article>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-black text-yellow-100"
      >
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-12 items-start">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold">
              Get in Touch
            </h2>
            <div className="w-24 h-1 bg-yellow-400 mx-0 mt-4 rounded-full" />
            <p className="mt-4 text-sm sm:text-base text-yellow-100/90 max-w-md">
              Share your restaurant&apos;s needs and get a personalised demo of
              Swaadsetu. From small cafes to multi-floor dining spaces, the
              system adapts to your workflow.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-8 flex flex-col gap-5 bg-black/40 border border-yellow-500/40 rounded-2xl p-6 sm:p-7 shadow-lg"
            >
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="name"
                  className="mb-1 font-semibold text-sm tracking-wide"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Your full name"
                  className="p-3.5 border border-yellow-300/60 rounded-lg text-base bg-black/60 text-yellow-50 placeholder:text-yellow-200/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/80 focus:border-yellow-400"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="email"
                  className="mb-1 font-semibold text-sm tracking-wide"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="your.email@example.com"
                  className="p-3.5 border border-yellow-300/60 rounded-lg text-base bg-black/60 text-yellow-50 placeholder:text-yellow-200/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/80 focus:border-yellow-400"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="restaurant"
                  className="mb-1 font-semibold text-sm tracking-wide"
                >
                  Restaurant Name
                </label>
                <input
                  type="text"
                  id="restaurant"
                  name="restaurant"
                  value={formData.restaurant}
                  onChange={handleInputChange}
                  placeholder="Your restaurant or brand"
                  className="p-3.5 border border-yellow-300/60 rounded-lg text-base bg-black/60 text-yellow-50 placeholder:text-yellow-200/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/80 focus:border-yellow-400"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="message"
                  className="mb-1 font-semibold text-sm tracking-wide"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  placeholder="Tell us about your current workflow and what you want to improve..."
                  rows={5}
                  className="p-3.5 border border-yellow-300/60 rounded-lg text-base bg-black/60 text-yellow-50 placeholder:text-yellow-200/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/80 focus:border-yellow-400 resize-y"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 bg-yellow-300 text-black px-6 py-3.5 rounded-full text-base font-semibold tracking-wide transition-all hover:bg-yellow-400 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/80"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
              {showSuccess && (
                <div className="bg-yellow-50 text-black px-4 py-3 rounded-lg text-sm font-semibold border border-yellow-300 animate-slide-up">
                  ✓ Thank you! We&apos;ll get back to you soon.
                </div>
              )}
            </form>
          </div>

          <aside className="space-y-6 md:pl-4 mt-50">
            <div className="rounded-2xl bg-yellow-50/5 border border-yellow-500/40 p-6">
              <h3 className="text-lg font-semibold text-yellow-200 mb-2">
                Why restaurants choose Swaadsetu
              </h3>
              <ul className="space-y-2 text-sm text-yellow-100/90">
                <li>• Built for Indian menus, taxes, and workflows.</li>
                <li>• Works great on tablets for staff on the floor.</li>
                <li>• Real-time syncing between billing, orders, and tables.</li>
              </ul>
            </div>
            <div className="rounded-2xl bg-yellow-50/5 border border-yellow-500/40 p-6">
              <h3 className="text-lg font-semibold text-yellow-200 mb-2">
                Contact details
              </h3>
              <p className="text-sm text-yellow-100/90">
                Email: support@swaadsetu.in
                <br />
                Location: Ahmedabad, India
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white text-center py-8 px-4 border-t border-yellow-500/30">
        <p className="mb-1 text-sm">
          &copy; {new Date().getFullYear()} Swaadsetu — Restaurant Management
          System
        </p>
        <p className="mb-4 text-xs sm:text-sm text-gray-300">
          Authentic Indian Flavours, Powered by Modern Technology
        </p>
        <div className="flex justify-center gap-5 mt-2 text-2xl">
          <a
            href="#"
            aria-label="Swaadsetu on Facebook"
            className="text-yellow-400 hover:text-yellow-300 hover:scale-110 transition-transform"
          >
            📘
          </a>
          <a
            href="#"
            aria-label="Swaadsetu on Twitter"
            className="text-yellow-400 hover:text-yellow-300 hover:scale-110 transition-transform"
          >
            🐦
          </a>
          <a
            href="#"
            aria-label="Swaadsetu on Instagram"
            className="text-yellow-400 hover:text-yellow-300 hover:scale-110 transition-transform"
          >
            📷
          </a>
          <a
            href="#"
            aria-label="Swaadsetu on LinkedIn"
            className="text-yellow-400 hover:text-yellow-300 hover:scale-110 transition-transform"
          >
            💼
          </a>
        </div>
      </footer>

      <style jsx>{`
        @keyframes pulse-slow {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.06);
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.8s ease-out;
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.45s ease-out;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 1.5s ease-out;
        }
        .animate-visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        .duration-600 {
          transition-duration: 600ms;
        }
      `}</style>
    </div>
  );
};

export default SwaadsetuLanding;
