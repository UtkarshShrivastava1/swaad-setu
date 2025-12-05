import React from "react";
import "swiper/css";
import "swiper/css/pagination";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Category } from "../../types/types";
import clsx from "clsx";

type ComboAdvertisementProps = {
  comboCategories: Category[];
  onViewCombo: (comboName: string) => void;
};

const banners = [
  {
    image: "/Banner_1_Content_rightside.jpg",
  },
  {
    image: "/Banner_2_Content_rightside.jpg",
  },
  {
    image: "/Banner_3_Content_leftside.jpg",
  },
];

const ComboAdvertisement: React.FC<ComboAdvertisementProps> = ({
  comboCategories,
  onViewCombo,
}) => {
  if (!comboCategories || comboCategories.length === 0) return null;

  // Create a shuffled version of the banners array to ensure variety
  const shuffledBanners = [...banners].sort(() => Math.random() - 0.5);

  return (
    <div className="w-full mt-4">
      <Swiper
        modules={[Autoplay, Pagination]}
        loop={true}
        speed={1200}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
        }}
        pagination={{ clickable: true }}
        className="w-full h-[220px] sm:h-[300px] md:h-[380px] lg:h-[420px] xl:h-[480px]"
      >
        {comboCategories.map((combo, index) => {
          // Cycle through the shuffled banners
          const banner = shuffledBanners[index % shuffledBanners.length];
          const contentPosition = banner.image.includes("leftside")
            ? "left"
            : "right";

          return (
            <SwiperSlide key={combo._id}>
              {/* ✅ Background Banner */}
              <div
                className="relative w-full h-full bg-cover bg-center flex items-center"
                style={{
                  backgroundImage: `url(${banner.image})`,
                }}
              >
                {/* ✅ Dark Overlay */}
                <div
                  className={clsx(
                    "absolute inset-0 from-black/80 via-black/60 to-transparent",
                    {
                      "bg-gradient-to-r": contentPosition === "left",
                      "bg-gradient-to-l": contentPosition === "right",
                    }
                  )}
                ></div>

                {/* ✅ Content */}
                <div
                  className={`relative z-10 max-w-2xl w-full px-5 sm:px-10 text-white flex flex-col ${
                    contentPosition === "right"
                      ? "items-end text-right ml-auto"
                      : "items-start text-left"
                  }`}
                >
                  <p className="text-xs sm:text-sm md:text-base text-gray-300 mb-2">
                    🔥 Limited Time Combo
                  </p>

                  <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold mb-3">
                    {combo.name}
                  </h2>

                  {combo.comboMeta?.description && (
                    <p className="text-sm sm:text-base text-gray-200 line-clamp-3 mb-4 md:mb-6">
                      {combo.comboMeta.description}
                    </p>
                  )}

                  {combo.comboMeta && (
                    <div className="flex items-center gap-3 mb-4 md:mb-6">
                      <span className="text-2xl sm:text-3xl font-bold text-yellow-400">
                        ₹{combo.comboMeta.discountedPrice}
                      </span>

                      <span className="text-sm sm:text-base line-through text-gray-300">
                        ₹{combo.comboMeta.originalPrice}
                      </span>

                      <span className="text-xs sm:text-sm bg-green-600 px-2 py-1 rounded-full font-semibold">
                        SAVE ₹{combo.comboMeta.saveAmount}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => onViewCombo(combo.name)}
                    className="px-6 py-3 sm:px-8 sm:py-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition text-sm sm:text-base"
                  >
                    Get Combo
                  </button>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
};

export default ComboAdvertisement;
