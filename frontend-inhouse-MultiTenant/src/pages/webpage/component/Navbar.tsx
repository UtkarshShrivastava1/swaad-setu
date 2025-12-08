import  { useEffect, useState } from 'react'
import Logo from '../assets/logo3.png';
import {
  Menu,
  X, 
} from "lucide-react";
import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';
const Navbar = () => {
    const [activeSection, setActiveSection] = useState('home');
    const [isOpen , setIsOpen] = useState(false);
    const navigate = useNavigate();
  
   const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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


  return (
    <nav className="fixed top-0 inset-x-0 bg-black backdrop-blur border-b 0 shadow-lg z-50">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between relative">
        {/* Logo - Fixed with proper sizing and spacing */}
      
          <img 
            src={Logo} 
            alt="Swaadsetu Logo" 
            onClick={() => navigate('/web')}
            className="w-20 h-5 sm:w-25 sm:h-5 lg:w-65 lg:h-11 -ml-13 object-contain cursor-pointer"
          />

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-6 text-sm font-medium">
          {['home', 'about', 'features', 'contact'].map((section) => (
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
          ))}
          <li>
            <button onClick={() => navigate('/select-restaurant')} className="bg-yellow-500 text-black px-4 py-2 rounded-md font-medium hover:bg-yellow-600 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/80">
              Go to App
            </button>
          </li>

           <li>
              <button  onClick={() => scrollToSection('contact')} className="bg-yellow-500 text-black px-4 py-2 rounded-md font-medium hover:bg-yellow-600 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/80">
              Booking Now 
            </button>
          </li>
        </ul>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md text-white hover:text-yellow-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/80"
          aria-label="Toggle navigation"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>

        {/* Mobile dropdown */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute left-0 right-0 top-full mt-2 px-4"
          >
            <ul className="bg-black/90 backdrop-blur border border-yellow-500/40 rounded-lg shadow-lg py-3 flex flex-col">
              {['home', 'about', 'screenshots', 'contact'].map(
                (section) => (
                  <li key={section} className="w-full">
                    <button
                      onClick={() => {
                        scrollToSection(section);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm font-medium ${
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
              <li className="w-full pt-2 px-4">
                <button
                  onClick={() => {
                    navigate('/select-restaurant');
                    setIsOpen(false);
                  }}
                  className="w-full text-center px-4 py-2 text-sm font-bold bg-yellow-500 text-black rounded-md hover:bg-yellow-600 transition-colors duration-200"
                >
                  Go to App
                </button>
              </li>
            </ul>
          </motion.div>
        )}
      </div>
          </nav>

  )
}

export default Navbar
