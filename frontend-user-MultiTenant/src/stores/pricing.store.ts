import type { PricingConfig } from "@/types/types";
import { create } from "zustand";
import { getActivePricingConfig } from "../api/restaurant.api";

type PricingStore = {
  pricingConfig: PricingConfig | null;
  fetchPricingConfig: (rid: string) => Promise<void>;
};

export const usePricingStore = create<PricingStore>((set) => ({
  pricingConfig: null,
  fetchPricingConfig: async (rid) => {
    try {
      const config = await getActivePricingConfig(rid);
      console.log("Fetched pricing config:", config);
      set({ pricingConfig: config });
    } catch (error) {
      console.error("Failed to fetch pricing config:", error);
    }
  },
}));
