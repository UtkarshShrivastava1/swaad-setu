import { client } from "./client";

const BASE_URL =
  import.meta.env.MODE === "production"
    ? import.meta.env.VITE_API_BASE_URL_PROD || "https://api.swaadsetu.com"
    : import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export interface Tax {
  name: string;
  percent: number;
  code: string;
  inclusive: boolean;
  _id?: any;
}

export interface PricingConfig {
  version: number;
  active: boolean;
  effectiveFrom: any;
  globalDiscountPercent: number;
  serviceChargePercent: number;
  taxes: Tax[];
  createdBy: string;
  reason: string;
  createdAt: any;
  offers: any[];
  _id?: any;
}

export interface Restaurant {
  _id: {
    $oid: string;
  };
  restaurantId: string;
  name?: string;
  restaurantName: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  upiSettings?: {
    UPI_ID?: string;
    UPI_NAME?: string;
    UPI_CURRENCY?: string;
  };
  pricingConfigs?: PricingConfig[];
  // Add other fields as needed
}

export const getRestaurantByRid = async (rid: string): Promise<Restaurant> => {
  // Fixed: Use regular parentheses for function call, not backticks with comma
  const response = await client.get(`${BASE_URL}/api/restaurants/${rid}`, {
    params: {
      // Cache buster
      _: new Date().getTime(),
    },
  });

  console.log("API Response:", response);
  return response;
};
