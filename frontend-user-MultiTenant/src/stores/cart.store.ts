import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem } from "@/types/types";
import type { Order, OrderItem } from "@/api/order.api"; // Import Order type

type State = {
  items: CartItem[];
  isInitialized: boolean; // To track if the cart has been initialized from an order
  addItem: (it: CartItem) => void;
  removeItem: (cartItemId: string) => void;
  updateQty: (cartItemId: string, delta: number) => void;
  clear: () => void;
  subtotal: () => number;
  initializeCartFromOrder: (order: Order) => void; // New action
  setInitialized: (initialized: boolean) => void; // New action
};

// Helper to map OrderItem to CartItem
const mapOrderItemToCartItem = (orderItem: OrderItem): CartItem => ({
  itemId: orderItem.menuItemId,
  name: orderItem.name,
  price: orderItem.priceAtOrder || orderItem.price || 0, // Fallback to price if priceAtOrder is not set
  quantity: orderItem.quantity,
  notes: orderItem.notes,
  cartItemId: orderItem._id || `${orderItem.menuItemId}-${Date.now()}`, // Use order item ID if available
});

export const useCart = create<State>()(
  persist(
    (set, get) => ({
      items: [],
      isInitialized: false,
      setInitialized: (initialized) => set({ isInitialized: initialized }),
      initializeCartFromOrder: (order) => {
        const cartItems = order.items.map(mapOrderItemToCartItem);
        set({ items: cartItems, isInitialized: true });
        console.log("Cart initialized from order:", order._id);
      },
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
      clear: () => {
        set({ items: [], isInitialized: false }); // Reset isInitialized on clear
        sessionStorage.removeItem("active_order_id"); // Also clear active order
      },
      subtotal: () =>
        get().items.reduce((s, i) => s + i.price * i.quantity, 0),
    }),
    {
      name: "resto_cart_v1",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
