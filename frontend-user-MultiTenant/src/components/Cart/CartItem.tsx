import { Minus, Plus, Trash } from "lucide-react";
import type { CartItem as CartItemType } from "@/stores/cart.store";
import { GENERIC_ITEM_IMAGE_FALLBACK } from "@/utils/constants";

type Props = {
  item: CartItemType;
  onUpdateQty: (cartItemId: string, newQty: number) => void;
  onRemove: (cartItemId: string) => void;
};

export function CartItem({ item, onUpdateQty, onRemove }: Props) {
  const handleQuantityChange = (amount: number) => {
    if (item.cartItemId) {
      const newQty = item.quantity + amount;
      if (newQty > 0) {
        onUpdateQty(item.cartItemId, amount);
      } else {
        onRemove(item.cartItemId);
      }
    }
  };

  return (
    <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group border-l-4 border-yellow-500">
      <div className="flex">
        {/* Image */}
        <div className="relative w-28 sm:w-32 flex-shrink-0">
          <img
            src={item.image || GENERIC_ITEM_IMAGE_FALLBACK}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col">
          {/* Top Part */}
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-white text-base sm:text-lg leading-tight line-clamp-2 pr-2">
                {item.name}
              </h3>
              <p className="font-bold text-lg sm:text-xl text-yellow-500">
                ₹{(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
            <p className="text-sm text-gray-400">₹{item.price} each</p>
          </div>

          {/* Bottom Part */}
          <div className="mt-2 sm:mt-3 flex items-end justify-between">
            {/* Quantity Controls */}
            <div className="flex items-center gap-2 bg-gray-900 rounded-xl p-1">
              <button
                onClick={() => handleQuantityChange(-1)}
                className="w-8 h-8 rounded-lg bg-gray-700/60 flex items-center justify-center text-gray-300 hover:bg-yellow-500/80 hover:text-black transition-all duration-200"
              >
                {item.quantity === 1 ? <Trash size={14} /> : <Minus size={14} />}
              </button>
              <span className="px-3 text-base font-bold text-white min-w-[2rem] text-center">
                {item.quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(1)}
                className="w-8 h-8 rounded-lg bg-gray-700/60 flex items-center justify-center text-gray-300 hover:bg-yellow-500/80 hover:text-black transition-all duration-200"
              >
                <Plus size={14} />
              </button>
            </div>
            <button
              onClick={() => item.cartItemId && onRemove(item.cartItemId)}
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-700 rounded-xl transition-all duration-200"
              title="Remove item"
            >
              <Trash size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}