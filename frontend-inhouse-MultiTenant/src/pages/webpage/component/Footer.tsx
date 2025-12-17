import { Link } from "react-router-dom"
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react"
import Logo from '../assets/Final_Logo_White.png'
import FooterLogo from '../assets/Logo.png'
import { useNavigate } from "react-router-dom"


export function Footer() {
  const navigate = useNavigate();
  return (
    <footer id="contact" className="bg-black text-white pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-20">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-6">
               <div className="mt-2">
                <button onClick={() => navigate('/web')}>
                <img src={FooterLogo} className="w-55 h-10"/>
                </button>
             </div>
            </div>
            <p className="text-[#EDEDED] leading-relaxed">
              India's premier QR-based restaurant management system. Empowering restaurants to deliver exceptional
              experiences.
            </p>
            <div className="flex space-x-4 space-y-1 mt-3">
              <a
                href="#"
                className="w-10 h-10 bg-[#222222] hover:bg-[#FFBE00] rounded-lg flex items-center justify-center transition-colors group"
              >
                <Facebook size={20} className="text-white group-hover:text-black" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-[#222222] hover:bg-[#FFBE00] rounded-lg flex items-center justify-center transition-colors group"
              >
                <Twitter size={20} className="text-white group-hover:text-black" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-[#222222] hover:bg-[#FFBE00] rounded-lg flex items-center justify-center transition-colors group"
              >
                <Instagram size={20} className="text-white group-hover:text-black" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-[#222222] hover:bg-[#FFBE00] rounded-lg flex items-center justify-center transition-colors group"
              >
                <Linkedin size={20} className="text-white group-hover:text-black" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-lg font-semibold font-heading mb-6 ">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/features" className="text-[#EDEDED] hover:text-[#FFBE00] transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-[#EDEDED] hover:text-[#FFBE00] transition-colors">
                  Pricing  </Link>
              </li>
              {/* <li>
                <Link to="#" className="text-[#EDEDED] hover:text-[#FFBE00] transition-colors">
                  Integrations
                </Link>
              </li> */}
              <li>
                <Link to="/faq" className="text-[#EDEDED] hover:text-[#FFBE00] transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold font-heading mb-6">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-[#EDEDED] hover:text-[#FFBE00] transition-colors">
                  About Us
                </Link>
              </li>
              {/* <li>
                <Link to="#" className="text-[#EDEDED] hover:text-[#FFBE00] transition-colors">
                  Careers
                </Link>
              </li> */}
              <li>
                <Link to="/blogs" className="text-[#EDEDED] hover:text-[#FFBE00] transition-colors">
                  Blog
                </Link>
              </li>
              {/* <li>
                <Link to="#" className="text-[#EDEDED] hover:text-[#FFBE00] transition-colors">
                  Press
                </Link>
              </li>
              <li>
                <Link to="#" className="text-[#EDEDED] hover:text-[#FFBE00] transition-colors">
                  Partners
                </Link>
              </li> */}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold font-heading mb-6">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <Mail size={20} className="text-[#FFBE00] mt-1 flex-shrink-0" />
                <span className="text-[#EDEDED]">connect@swaadsetu.com</span>
              </li>
              <li className="flex items-start space-x-3">
                <Phone size={20} className="text-[#FFBE00] mt-1 flex-shrink-0" />
                <span className="text-[#EDEDED]">+91 9407655717</span>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin size={20} className="text-[#FFBE00] mt-1 flex-shrink-0" />
                <span className="text-[#EDEDED]">Zager Digital Services,  <br/> Startup Enclave ,
                  <br/>CSIT Durg, <br/> Chhattisgarh 491001</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#333333] pt-8">
          <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0">
          
            <div className="grid sm:grid-cols-1 gap-3 md:grid-cols-6 md:gap-4 md:place-content-center 
            md:justify-self-center md:self-center  place-items-center md:ml-30">
               <Link to="/web" className="text-sm text-[#888888] hover:text-[#FFBE00] transition-colors">
                Home
              </Link>
               <Link to="#" className="text-sm text-[#888888] hover:text-[#FFBE00] transition-colors">
                Contact
              </Link>
              <Link to="#" className="text-sm text-[#888888] hover:text-[#FFBE00] transition-colors">
                Privacy Policy
              </Link>
              <Link to="#" className="text-sm text-[#888888] hover:text-[#FFBE00] transition-colors">
                Terms of Service
              </Link>
              <Link to="#" className="text-sm text-[#888888] hover:text-[#FFBE00] transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
    
      <div className="border-t border-[#333333] pt-8 mt-5  justify-center items-center gap-3 flex flex-col " >
        <div>
          <button onClick={() => navigate('/web')}>
          <img src={Logo} className="w-40 h-10"/>
          </button>
        </div>

        <div >
           <button onClick={() => navigate('/web')}>
            <p className="text-sm text-[#888888]">© 2025 Swaad Setu-A Product By ZAGER</p>
          </button>
        </div>

      </div >
      </div>
    </footer>
  )
}
