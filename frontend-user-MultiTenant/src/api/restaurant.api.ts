import { api } from "./client";

export interface Restaurant {
  _id: string;
  restaurantName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: {
    street: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    country: string | null;
  };
  hashedPin: string;
  staffHashedPin: string;
  staffAliases: string[];
  waiterNames: string[];
  pricingConfigs: any[]; // Define this more strictly if you have the shape
  globalDiscount?: { value: number; type: 'fixed' | 'percentage' };
  subscription: any; // Define this more strictly if you have the shape
  UPISettings: {
    UPI_ID: string;
    UPI_NAME: string;
    UPI_CURRENCY: string;
  };
  overrideTokens: any[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export async function getRestaurant(rid: string): Promise<Restaurant> {
  return api<Restaurant>(`/api/restaurants/${rid}`);
}

export const getActivePricingConfig = (rid: string) => {
  return api(`/api/restaurants/${rid}/pricing`);
};
