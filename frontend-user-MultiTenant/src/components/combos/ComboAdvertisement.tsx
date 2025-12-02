import React from "react";
import "swiper/css";
import "swiper/css/pagination";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import type { Category } from "../../types/types";
import { GENERIC_ITEM_IMAGE_FALLBACK } from "../../utils/constants";

type ComboHeroCarouselProps = {
  comboCategories: Category[];
  onViewCombo: (comboName: string) => void;
};

const ComboHeroCarousel: React.FC<ComboHeroCarouselProps> = ({
  comboCategories,
  onViewCombo,
}) => {
  if (!comboCategories || comboCategories.length === 0) return null;

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
        {comboCategories.map((combo) => {
          const imageUrl =
            combo.comboMeta?.image || GENERIC_ITEM_IMAGE_FALLBACK;

          return (
            <SwiperSlide key={combo._id}>
              {/* ✅ Background Banner */}
              <div
                className="relative w-full h-full bg-cover bg-center flex items-center"
                style={{
                  backgroundImage: `url(${imageUrl})`,
                }}
              >
                {/* ✅ Dark Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/10"></div>

                {/* ✅ Content */}
                <div className="relative z-10 max-w-2xl px-5 sm:px-10 text-white">
                  <p className="text-xs sm:text-sm text-gray-300 mb-2">
                    🔥 Limited Time Combo
                  </p>

                  <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold mb-3">
                    {combo.name}
                  </h2>

                  {combo.comboMeta?.description && (
                    <p className="text-sm sm:text-base text-gray-200 line-clamp-3 mb-4">
                      {combo.comboMeta.description}
                    </p>
                  )}

                  {combo.comboMeta && (
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl font-bold text-yellow-400">
                        ₹{combo.comboMeta.discountedPrice}
                      </span>

                      <span className="text-sm line-through text-gray-300">
                        ₹{combo.comboMeta.originalPrice}
                      </span>

                      <span className="text-xs bg-green-600 px-2 py-1 rounded-full font-semibold">
                        SAVE ₹{combo.comboMeta.saveAmount}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => onViewCombo(combo.name)}
                    className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition"
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

export default ComboHeroCarousel;
