import { api } from "./client";

export interface Restaurant {
  _id: string;
  restaurantName: string;
  // Add other restaurant properties as needed
}

export async function getRestaurant(rid: string): Promise<Restaurant> {
  return api<Restaurant>(`/restaurants/${rid}`);
}
