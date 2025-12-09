import { client } from "./client";

const BASE_URL =
  import.meta.env.MODE === "production"
    ? import.meta.env.VITE_API_BASE_URL_PROD || "https://api.swaadsetu.com"
    : import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

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
  // Add other fields as needed
}

export const getRestaurantByRid = async (rid: string): Promise<Restaurant> => {
  const response = await client.get(`${BASE_URL}/api/restaurants/${rid}`);
  return response;
};
