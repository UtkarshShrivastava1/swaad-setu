import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem } from "../types/types";

type State = {
  items: CartItem[];
  addItem: (it: CartItem) => void;
  removeItem: (cartItemId: string) => void;
  updateQty: (cartItemId: string, delta: number) => void;
  clear: () => void;
  subtotal: () => number;
};

export const useCart = create<State>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (it) => {
        const existing = get().items.find(
          (i) => i.itemId === it.itemId && i.notes === it.notes
        );
        if (existing && existing.cartItemId) {
          // Item with same ID and notes exists, just update quantity
          get().updateQty(existing.cartItemId, it.quantity);
        } else {
          // Add as a new item with a unique id
          const newItem = {
            ...it,
            cartItemId: `${it.itemId}-${Date.now()}`, // Simple unique ID
          };
          set({ items: [...get().items, newItem] });
        }
      },
      removeItem: (cartItemId) =>
        set({
          items: get().items.filter((i) => i.cartItemId !== cartItemId),
        }),
      updateQty: (cartItemId, delta) =>
        set({
          items: get()
            .items.map((item) =>
              item.cartItemId === cartItemId
                ? { ...item, quantity: item.quantity + delta }
                : item
            )
            .filter((item) => item.quantity > 0),
        }),
      clear: () => set({ items: [] }),
      subtotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
    }),
    {
      name: "resto_cart_v1",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
