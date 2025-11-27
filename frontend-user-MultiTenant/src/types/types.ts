export type MenuItem = {
  itemId: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  image?: string | null;
  isActive?: boolean;
  isVegetarian?: boolean;
  preparationTime?: number | null;
  metadata?: Record<string, any>;
};

export type Menu = {
  restaurantId: string;
  version: number;
  title?: string;
  items: MenuItem[];
  categories: { name: string; itemIds: string[] }[];
  taxes: { name: string; percent: number }[];
  serviceCharge: number;
};

export type CartItem = {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
};
