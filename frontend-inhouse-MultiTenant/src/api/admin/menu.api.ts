// src/api/admin/menu.api.ts
import client from "./client";

export interface MenuItem {
  itemId?: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  image?: string;
  isActive?: boolean;
  isVegetarian?: boolean;
  preparationTime?: number;
  category?: string;
  metadata?: Record<string, any>;
}

interface CategoryPayload {
  name?: string;
  itemIds?: string[];
  comboMeta?: {
    originalPrice?: number;
    discountedPrice?: number;
    description?: string;
    image?: string;
  };
}

// -------------------------------------------------------------
// 📋 MENU (GET / POST full menu)
// -------------------------------------------------------------

export async function fetchMenu(rid: string) {
  return client.get(`/api/${rid}/admin/menu`);
}

export async function createMenu(rid: string, data: any) {
  return client.post(`/api/${rid}/admin/menu`, data);
}

export async function updateMenu(rid: string, menuData: any) {
  return client.post(`/api/${rid}/admin/menu`, menuData);
}

// -------------------------------------------------------------
// 🍽️ MENU ITEMS
// -------------------------------------------------------------

// Add single menu item
export async function addMenuItem(rid: string, itemData: Omit<MenuItem, 'image'>, imageFile?: File) {
  const formData = new FormData();
  formData.append('item', JSON.stringify(itemData));
  if (imageFile) {
    formData.append('image', imageFile);
  }
  return client.post(`/api/${rid}/admin/menu/items`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

// Update existing item
export async function updateMenuItem(
  rid: string,
  itemId: string,
  itemData: Partial<Omit<MenuItem, 'image'>> & { image?: null | string }, // image?: null for explicit removal
  imageFile?: File
) {
  const formData = new FormData();
  formData.append('item', JSON.stringify(itemData));
  if (imageFile) {
    formData.append('image', imageFile);
  }
  // No need to append 'image' field if imageFile is undefined and image is not null in itemData,
  // as per backend spec, absence means preserve existing image.

  return client.patch(`/api/${rid}/admin/menu/items/${itemId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

// Delete (soft/hard)
export async function deleteMenuItem(rid: string, itemId: string, soft = true) {
  return client.delete(`/api/${rid}/admin/menu/items/${itemId}`, {
    data: { soft },
  });
}

// Restore a soft-deleted item
export async function restoreMenuItem(rid: string, itemId: string) {
  return client.patch(
    `/api/${rid}/admin/menu/items/${itemId}/restore`,
    {},
  );
}

// -------------------------------------------------------------
// 🗂️ CATEGORIES
// -------------------------------------------------------------

// Fetch all categories
export async function fetchCategories(rid: string) {
  return client.get(`/api/${rid}/admin/menu/categories`);
}

// Add new category
export async function addCategory(rid: string, category: CategoryPayload) {
  return client.post(
    `/api/${rid}/admin/menu/categories`,
    { category },
  );
}

// Update existing category
export async function updateCategory(
  rid: string,
  categoryId: string,
  payload: CategoryPayload
) {
  return client.patch(
    `/api/${rid}/admin/menu/categories/${categoryId}`,
    payload,
  );
}

// Delete category (soft delete optional)
export async function deleteCategory(
  rid: string,
  categoryId: string,
  soft = true
) {
  return client.delete(`/api/${rid}/admin/menu/categories/${categoryId}`, {
    data: { soft },
  });
}
