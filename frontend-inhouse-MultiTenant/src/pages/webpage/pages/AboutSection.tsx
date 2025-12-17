import { Check,} from "lucide-react";
import { LayoutGrid } from "../component/LayoutGrid";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import bg from "../assets/aboutheading.png";

const AboutSection = () => {


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

   const cards = [
    {
      id: 1,
      content: <SkeletonOne />,
      className: "md:col-span-2",
      thumbnail:
        "https://images.unsplash.com/photo-1476231682828-37e571bc172f?q=80&w=3474&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 2,
      content: <SkeletonTwo />,
      className: "col-span-1",
      thumbnail:
        "https://images.unsplash.com/photo-1464457312035-3d7d0e0c058e?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: 3,
      content: <SkeletonThree />,
      className: "col-span-1",
      thumbnail:
        "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: 4,
      content: <SkeletonFour />,
      className: "md:col-span-2",
      thumbnail:
        "https://images.unsplash.com/photo-1475070929565-c985b496cb9f?q=80&w=1200&auto=format&fit=crop",
    },
  ];
   const navigate = useNavigate(); 

  return (
    
    <div  className="py-10 px-4 md:px-8 bg-radial from-yellow-100 from-20% via-white to-yellow-100 text-black relative">
      {/* Heading */}

        {/* Two-column layout: FIXED RESPONSIVE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto ">
          {/* Left: Image grid - FIXED CONTAINER */}
          <motion.div className="w-full h-[600px]  lg:h-[800px] bg-radial from-yellow-100 from-20% via-white to-yellow-100 rounded-3xl p-6 flex items-center justify-center relative overflow-hidden ">
            <LayoutGrid cards={cards} />
          </motion.div>

          {/* Right - Content */}
          <div className="relative overflow-hidden bg-white  ">
            {/* 🟡 Main Content */}
            <div className="max-w-6xl mx-auto px-6 pt-2 pb-20 lg:pt-10 lg:pb-2 relative z-20">
              <div className="sm:space-y-2 md:space-y-6 lg:space-y-6 ">

                <div className="  w-60 h-auto ml-3  md:w-60 ">
                  {/* Background image */}
                  <img
                    src={bg}
                    alt="About Swaad Setu"
                    className="w-60 h-auto object-cover mix-blend-multiply"
                   
                  />

                
                </div>

                <h2 className="text-3xl lg:text-5xl font-bold font-heading text-black leading-tight p-2  ">
                  Revolutionizing Restaurant Management in India
                </h2>

                <p className="text-sm lg:text-lg text-[#555555] leading-relaxed max-w-3xl p-2.5 ">
                  Swaad Setu is India's most comprehensive restaurant management
                  platform, designed specifically for the unique needs of Indian
                  restaurants. From street food stalls to fine dining
                  establishments, we empower every food business with
                  cutting-edge technology.
                </p>

                <div className="space-y-4 pt-4 max-w-xl text-sm lg:text-lg  md:-text-lg">
                  {[
                    "Complete contactless ordering with QR technology",
                    "Real-time kitchen display and order management",
                    "Integrated payment gateway with UPI support",
                    "Advanced analytics and business intelligence",
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-[#FFBE00] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check size={16} className="text-black" />
                      </div>
                      <span className="text-[#111111] font-medium">
                        {feature}
                      </span>
                    </div>
                  ))}
                  <div className="">
                    <button
                      className="text-yellow-600 btn btn-outline btn-md ml-10"
                      onClick={() => {
                        navigate("/about");
                      }}
                    >
                      Know more
                    </button>
                  </div>
                </div>

               
              </div>
            </div>
           <div className="pt-6 ">
                  <div className="bg-[#FFFBF0] border-l-4 border-[#FFBE00] p-6
                 
                  rounded-lg max-w-2xl text-sm lg:text-lg  md:-text-lg">
                    <p className="text-[#111111] font-medium italic">
                      "Swaad Setu transformed our restaurant operations
                      completely. We saw a 35% increase in orders and
                      significantly reduced wait times."
                    </p>
                    <p className="text-sm text-[#888888] mt-2">
                      — Rajesh Kumar, Owner of Spice Garden
                    </p>
                  </div>
                </div>
          </div>
        </div>
    </div>
  )
}

export default AboutSection
