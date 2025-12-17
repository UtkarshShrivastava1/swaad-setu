import { Flame, Leaf } from "lucide-react";
import { useState } from "react";
import type { MenuItem } from "../../types/types";
import { GENERIC_ITEM_IMAGE_FALLBACK } from "../../utils/constants";

type Props = {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
};

export default function MenuCard({ item, onAdd }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  /* ================= METADATA ================= */
  let parsedMeta: Record<string, any> | null = null;
  if (item.metadata) {
    if (typeof item.metadata === "string") {
      try {
        parsedMeta = JSON.parse(item.metadata);
      } catch (e) {
        parsedMeta = null;
      }
    } else {
      parsedMeta = item.metadata;
    }
  }

  const borderColor =
    item.isVegetarian === true
      ? "border-emerald-500"
      : item.isVegetarian === false
      ? "border-red-500"
      : "border-gray-300";

  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group border-l-4 sm:border-l-0 sm:border-t-4 ${borderColor}`}
      onClick={() => {
        if (window.innerWidth < 640) {
          setIsExpanded(!isExpanded);
        }
      }}
    >
      <div className={`flex sm:block ${isExpanded ? 'flex-col' : ''}`}>
        {/* ================= IMAGE ================= */}
        <div className={`relative ${isExpanded ? 'w-full h-40' : 'w-28'} sm:w-full sm:h-40 flex-shrink-0`}>
          <img
            src={item.image || GENERIC_ITEM_IMAGE_FALLBACK}
            alt={item.name}
            className="w-full h-full object-cover sm:group-hover:scale-110 transition-transform duration-500"
          />
          {item.isVegetarian !== undefined && (
            <div
              className={`absolute top-2 right-2 p-1.5 sm:p-2 rounded-full shadow-lg ring-1 sm:ring-2 ring-white ${
                item.isVegetarian
                  ? "bg-emerald-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {item.isVegetarian ? (
                <Leaf size={12} className="sm:w-4 sm:h-4" />
              ) : (
                <Flame size={12} className="sm:w-4 sm:h-4" />
              )}
            </div>
          )}
        </div>

        {/* ================= CONTENT ================= */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col">
          {/* TOP PART */}
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-gray-900 text-base sm:text-lg leading-tight line-clamp-2 pr-2">
                {item.name}
              </h3>
            </div>

            {item.description && (
              <p className={`${isExpanded ? 'block' : 'hidden'} sm:block text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2`}>
                {item.description}
              </p>
            )}

            {parsedMeta && (
              <div className={`${isExpanded ? 'flex' : 'hidden'} sm:flex flex-wrap gap-2 mt-3`}>
                {parsedMeta.chefSpecial === true && (
                  <span className="inline-flex items-center gap-1 bg-amber-100 px-2 py-1 rounded-full text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
                    ⭐ Chef's Special
                  </span>
                )}
                {parsedMeta.spiceLevel &&
                  parsedMeta.spiceLevel !== "none" &&
                  parsedMeta.spiceLevel !== 0 && (
                    <span className="inline-flex items-center gap-1 bg-rose-100 px-2 py-1 rounded-full text-xs font-semibold text-rose-800 ring-1 ring-inset ring-rose-200">
                      🌶️{" "}
                      {typeof parsedMeta.spiceLevel === "string"
                        ? parsedMeta.spiceLevel.charAt(0).toUpperCase() +
                          parsedMeta.spiceLevel.slice(1)
                        : "Spicy"}
                    </span>
                  )}
                {parsedMeta.serves && (
                  <span className="inline-flex items-center gap-1 bg-sky-100 px-2 py-1 rounded-full text-xs font-semibold text-sky-800 ring-1 ring-inset ring-sky-200">
                    👥 Serves {parsedMeta.serves}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* BOTTOM PART */}
          <div className="mt-2 sm:mt-3 flex items-end justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
              <p className="font-bold text-lg sm:text-xl text-orange-600">
                ₹{item.price}
              </p>
              <div className="text-gray-500 text-xs mt-1 sm:mt-0">
                {item.preparationTime ? (
                  <span className="inline-flex items-center gap-1">
                    ⏱ {item.preparationTime} min
                  </span>
                ) : (
                  <span className="italic">Quick Serve</span>
                )}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd(item);
              }}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-black
              bg-gradient-to-r from-yellow-400 to-orange-500
              hover:from-yellow-500 hover:to-orange-600
              transition-all shadow-md hover:shadow-lg active:scale-95 flex-shrink-0"
            >
              + Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}