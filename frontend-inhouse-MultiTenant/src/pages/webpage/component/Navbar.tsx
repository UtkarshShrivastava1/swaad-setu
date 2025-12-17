import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Logo from "../assets/logo3.png";
import { motion } from "framer-motion";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { id: "home", path: "/", label: "Home" },
    { id: "about", path: "/about", label: "About" },
    { id: "features", path: "/features", label: "Features" },
    { id: "pricing", path: "/pricing", label: "Pricing" },
  ];

  const handleContactClick = () => {
    const scrollToContact = () => {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    };

    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(scrollToContact, 100); // wait for page to change
    } else {
      scrollToContact();
    }
    setIsOpen(false);
  };

  const handleMobileNavClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
  }

  return (
    <nav className="fixed top-0 inset-x-0 bg-black backdrop-blur border-b 0 shadow-lg z-50 ">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between relative">
        <img
          src={Logo}
          alt="Swaadsetu Logo"
          onClick={() => navigate("/")}
          className="w-30 h-6 sm:w-40 sm:h-10 lg:w-65 lg:h-11 -ml-4 lg:-ml-13 object-contain cursor-pointer"
        />

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-6 text-sm font-medium font-sans">
          {navLinks.map((link) => (
            <li key={link.id}>
              <Link
                to={link.path}
                className={`transition-colors duration-200 px-2 py-1 rounded ${
                  location.pathname === link.path
                    ? "text-yellow-400"
                    : "text-white hover:text-yellow-300"
                } focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/80`}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <button
              onClick={handleContactClick}
              className="transition-colors duration-200 px-2 py-1 rounded text-white hover:text-yellow-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/80"
            >
              Contact
            </button>
          </li>
          <li>
            <button
              onClick={() => navigate("/select-restaurant")}
              className="bg-yellow-500 text-black px-4 py-2 rounded-md font-medium hover:bg-yellow-600 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/80"
            >
              Go to App
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
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
            <ul className="bg-black/90 backdrop-blur border border-yellow-500/40 rounded-lg shadow-lg py-3 flex flex-col font-sans">
              {navLinks.map((link) => (
                <li key={link.id} className="w-full">
                  <button
                    onClick={() => handleMobileNavClick(link.path)}
                    className={`w-full text-left px-4 py-2 text-sm font-medium ${
                      location.pathname === link.path
                        ? "text-yellow-400"
                        : "text-white hover:text-yellow-300"
                    } focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/80`}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
              <li className="w-full">
                <button
                  onClick={handleContactClick}
                  className="w-full text-left px-4 py-2 text-sm font-medium text-white hover:text-yellow-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/80"
                >
                  Contact
                </button>
              </li>
            </ul>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;