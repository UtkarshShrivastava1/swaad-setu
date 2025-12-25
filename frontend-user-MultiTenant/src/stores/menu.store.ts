import type { Category, MenuItem } from "@/types/types";
import { create } from "zustand";

export type MenuData = {
  branding: { title: string };
  categories: Category[];
  menu: MenuItem[];
  serviceCharge: number;
  taxes: Array<{ name: string; percent: number }>;
  pricingConfigs?: Array<{
    name: string;
    value: number;
    type: "fixed" | "percentage";
  }>;
  globalDiscount?: { value: number; type: "fixed" | "percentage" };
};

interface MenuState {
  menuData: MenuData | null;
  setMenuData: (menuData: MenuData) => void;
}

export const useMenuStore = create<MenuState>((set) => ({
  menuData: null,
  setMenuData: (menuData) => set({ menuData }),
}));
