import client from "./client";

interface UPISettings {
  UPI_ID?: string;
  UPI_NAME?: string;
  UPI_CURRENCY?: string;
}

export interface RestaurantConfig {
  restaurantName?: string;
  ownerName?: string;
  phone?: string;
  UPISettings?: UPISettings;
}

export const updateRestaurantConfig = async (
  rid: string,
  config: Partial<RestaurantConfig>
) => {
  return client.patch(`/api/${rid}/admin/config`, config);
};