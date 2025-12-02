import { Plus } from "lucide-react";
import React from "react";
import type { ComboItem } from "../../types/types";
import { GENERIC_ITEM_IMAGE_FALLBACK } from "../../utils/constants";

type ComboCardProps = {
  combo: ComboItem;
  onAdd: (combo: ComboItem) => void;
};

const ComboCard: React.FC<ComboCardProps> = ({ combo, onAdd }) => {
  const imageUrl =
    combo.image || GENERIC_ITEM_IMAGE_FALLBACK;

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden group">
      {/* Image Section */}
      <img
        src={imageUrl}
        alt={combo.name}
        className="h-40 w-full object-cover group-hover:scale-105 transition-transform duration-300"
      />

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 pr-3">
            <h3 className="font-bold text-gray-900 text-lg leading-tight">
              {combo.name}
              <span className="ml-2 inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold">
                Combo
              </span>
            </h3>
            {combo.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {combo.description}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="text-right">
            {combo.originalPrice && combo.saveAmount ? (
              <>
                <p className="text-sm text-gray-500 line-through">
                  ₹{combo.originalPrice}
                </p>
                <p className="font-bold text-xl text-orange-600">
                  ₹{combo.price}
                </p>
                <p className="text-xs text-green-600 font-semibold mt-1">
                  Save ₹{combo.saveAmount}
                </p>
              </>
            ) : (
              <p className="font-bold text-xl text-orange-600">
                ₹{combo.price}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center text-gray-500 text-sm">
            {/* Combo preparation time can be aggregated or shown as estimated */}
            {combo.preparationTime && (
              <span className="inline-flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full text-xs text-gray-600">
                ⏱ {combo.preparationTime} min
              </span>
            )}
          </div>

          <button
            onClick={() => onAdd(combo)}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 transition-all text-white text-sm font-bold rounded-xl cursor-pointer shadow-md hover:shadow-lg"
          >
            <Plus size={10} strokeWidth={3} /> Add Combo
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComboCard;
