
import type { MenuItem } from "../../types/types";

type Props = {
  item: MenuItem;
  onAdd: (item: {
    itemId: string;
    name: string;
    price: number;
    quantity: number;
  }) => void;
};

export default function MenuCard({ item, onAdd }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden group">
      {/* Image Section */}
      {item.image ? (
        <img
          src={item.image}
          alt={item.name}
          className="h-40 w-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="h-40 w-full bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-t-2xl flex items-center justify-center text-gray-400">
          🍽️
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 pr-3">
            <h3 className="font-semibold text-gray-900 text-lg leading-tight">
              {item.name}
            </h3>
            {item.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {item.description}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="font-bold text-xl text-orange-600">₹{item.price}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              per plate
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center text-gray-500 text-sm">
            {item.preparationTime ? (
              <span className="inline-flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full text-xs text-gray-600">
                ⏱ {item.preparationTime} min
              </span>
            ) : (
              <span className="text-xs text-gray-400 italic">Quick Serve</span>
            )}
          </div>

          <button
            onClick={() =>
              onAdd({
                itemId: item.itemId,
                name: item.name,
                price: item.price,
                quantity: 1,
              })
            }
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 transition-all text-white text-sm font-bold rounded-xl cursor-pointer shadow-md hover:shadow-lg"
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}
