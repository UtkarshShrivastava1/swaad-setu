import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem } from "../types/types";

type State = {
  items: CartItem[];
  addItem: (it: CartItem) => void;
  removeItem: (itemId: string) => void;
  updateQty: (itemId: string, qty: number) => void;
  clear: () => void;
  subtotal: () => number;
};

export const useCart = create<State>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (it) => {
        const existing = get().items.find((i) => i.itemId === it.itemId);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.itemId === it.itemId
                ? { ...i, quantity: i.quantity + it.quantity }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, it] });
        }
      },
      removeItem: (itemId) =>
        set({ items: get().items.filter((i) => i.itemId !== itemId) }),
      updateQty: (itemId, qty) =>
        set({
          items: get().items.map((i) =>
            i.itemId === itemId ? { ...i, quantity: qty } : i
          ),
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
