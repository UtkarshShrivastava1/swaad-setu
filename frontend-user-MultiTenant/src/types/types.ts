export type MenuItem = {
  _id?: string;
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

export type ComboMeta = {
  originalPrice: number;
  discountedPrice: number;
  saveAmount: number;
  description: string;
  image: string | null;
};

export type Category = {
  name: string;
  itemIds: string[];
  _id: string;
  isMenuCombo?: boolean;
  comboMeta?: ComboMeta;
};

export type Menu = {
  restaurantId: string;
  version: number;
  title?: string;
  items: MenuItem[];
  categories: Category[];
  taxes: { name: string; percent: number }[];
  serviceCharge: number;
};

export type CartItem = {
  cartItemId?: string;
  itemId: string;
  name:string;
  price: number;
  quantity: number;
  variant?: string; // e.g., "Half Plate", "Full Plate"
  notes?: string;
  image?: string | null;
};

// New type for a combo when displayed as an item
export type ComboItem = {
  _id: string;
  itemId: string; // Unique ID for combo
  name: string;
  description: string;
  price: number; // discountedPrice
  image: string | null;
  isVegetarian: boolean; // Derived or explicitly set
  preparationTime: number | null; // Derived or explicitly set
  isActive: boolean;
  type: 'combo';
  originalPrice: number;
  saveAmount: number;
  itemIds: string[]; // Original itemIds of the combo
};

// Union type for items that can be displayed
export type DisplayableItem = (MenuItem & { type: 'item' }) | ComboItem;
