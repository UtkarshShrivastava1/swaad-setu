import { Flame, Leaf } from "lucide-react";
import type { MenuItem } from "../../types/types";
import { GENERIC_ITEM_IMAGE_FALLBACK } from "../../utils/constants";

type Props = {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
};

export default function MenuCard({ item, onAdd }: Props) {
  /* ================= METADATA ================= */
  let parsedMeta: Record<string, any> | null = null;
  if (item.metadata) {
    if (typeof item.metadata === "string") {
      try {
        parsedMeta = JSON.parse(item.metadata);
      } catch (e) {
        // Silently fail if metadata is malformed
        parsedMeta = null;
      }
    } else {
      parsedMeta = item.metadata;
    }
  }
  /* ================= VEG / NON-VEG AURA ================= */

  const auraWrapper =
    item.isVegetarian === true
      ? "bg-gradient-to-br from-emerald-400 via-emerald-500 to-green-600 p-[2px] shadow-[0_0_22px_rgba(16,185,129,0.45)]"
      : item.isVegetarian === false
        ? "bg-gradient-to-br from-red-400 via-red-500 to-rose-600 p-[2px] shadow-[0_0_22px_rgba(239,68,68,0.45)]"
        : "bg-gray-200 p-[1px]";

  const topStrip =
    item.isVegetarian === true
      ? "bg-gradient-to-r from-emerald-400 to-green-500"
      : item.isVegetarian === false
        ? "bg-gradient-to-r from-red-400 to-rose-500"
        : "bg-gray-300";

  return (
    <div className={`rounded-2xl ${auraWrapper}`}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group relative">
        {/* TOP COLOR STRIP */}
        <div className={`h-[4px] w-full ${topStrip}`} />

        {/* ================= IMAGE ================= */}
        {item.image ? (
          <div className="relative h-40 w-full overflow-hidden">
            <img
              src={item.image || GENERIC_ITEM_IMAGE_FALLBACK}
              alt={item.name}
              className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        ) : (
          <div className="h-40 w-full bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center text-gray-400 text-3xl">
            🍽️
          </div>
        )}

        {/* ================= VEG / NON-VEG BADGE ================= */}
        {item.isVegetarian !== undefined && (
          <div
            className={`absolute top-3 right-3 p-2 rounded-full shadow-xl ring-2 ring-white ${
              item.isVegetarian
                ? "bg-emerald-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {item.isVegetarian ? <Leaf size={14} /> : <Flame size={14} />}
          </div>
        )}

        {/* ================= CONTENT ================= */}
        <div className="p-4">
          {/* TITLE + PRICE */}
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 pr-3">
              <h3 className="font-semibold text-gray-900 text-lg leading-tight line-clamp-2 min-h-[44px]">
                {item.name}
              </h3>

              {item.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2 min-h-[36px]">
                  {item.description}
                </p>
              )}
              {/* ================= METADATA TAGS ================= */}
              {parsedMeta && (
                <div className="flex flex-wrap gap-2 mt-3">
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

            {/* PRICE */}
            <div className="text-right shrink-0">
              <p className="font-bold text-xl text-orange-600">₹{item.price}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                per plate
              </p>
            </div>
          </div>

          {/* ================= FOOTER ================= */}
          <div className="mt-3 flex items-center justify-between">
            {/* PREP TIME */}
            <div className="flex items-center text-gray-500 text-sm">
              {item.preparationTime ? (
                <span className="inline-flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full text-xs text-gray-600">
                  ⏱ {item.preparationTime} min
                </span>
              ) : (
                <span className="text-xs text-gray-400 italic">
                  Quick Serve
                </span>
              )}
            </div>

            {/* ADD BUTTON */}
            <button
              onClick={() => onAdd(item)}
              className="px-4 py-2 rounded-xl text-sm font-bold text-black
              bg-gradient-to-r from-yellow-400 to-orange-500
              hover:from-yellow-500 hover:to-orange-600
              transition-all shadow-md hover:shadow-xl active:scale-95"
            >
              + Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
