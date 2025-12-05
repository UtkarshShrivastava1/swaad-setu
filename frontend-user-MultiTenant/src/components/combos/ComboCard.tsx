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
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex-grow">
          <h3 className="font-bold text-gray-800 text-lg leading-tight group-hover:text-orange-600 transition-colors">
            {combo.name}
          </h3>
          {combo.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {combo.description}
            </p>
          )}
        </div>

        {/* Pricing & Action */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-baseline gap-2">
              <p className="font-bold text-2xl text-orange-600">
                ₹{combo.price}
              </p>
              {combo.originalPrice && (
                <p className="text-sm text-gray-400 line-through">
                  ₹{combo.originalPrice}
                </p>
              )}
            </div>
            {combo.saveAmount && (
              <div className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                SAVE ₹{combo.saveAmount}
              </div>
            )}
          </div>

          <button
            onClick={() => onAdd(combo)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 transition-all text-black text-sm font-bold rounded-lg cursor-pointer shadow-sm hover:shadow-md"
          >
            <Plus size={14} strokeWidth={3} />
            <span>Add Combo</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComboCard;
