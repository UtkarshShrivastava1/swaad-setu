import { client } from "./client";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export interface Restaurant {
  _id: {
    $oid: string;
  };
  restaurantId: string;
  restaurantName: string;
  // Add other fields as needed
}

export const getRestaurantByRid = async (rid: string): Promise<Restaurant> => {
  const response = await client.get(`${BASE_URL}/api/restaurants/${rid}`);
  return response;
};
