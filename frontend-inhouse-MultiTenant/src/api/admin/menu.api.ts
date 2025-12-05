import client from "./client";

/* ================================
   TYPES
================================ */

export interface MenuItem {
  itemId: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  image?: string;
  isActive?: boolean;
  isVegetarian?: boolean;
  preparationTime?: number;

  // ✅ IMPORTANT: Backend usually expects categoryId, not just "category"
  categoryId?: string;

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

/* ================================
   MENU (FULL MENU)
================================ */

export async function getMenu(rid: string) {
  console.log("[getMenu] RID →", rid);
  return client.get(`/api/${rid}/admin/menu`);
}

export async function createMenu(rid: string, data: any) {
  console.log("[createMenu] RID →", rid);
  console.log("[createMenu] Payload →", data);
  return client.post(`/api/${rid}/admin/menu`, data);
}

export async function bulkUpdateMenu(rid: string, data: any) {
  console.log("[bulkUpdateMenu] RID →", rid);
  console.log("[bulkUpdateMenu] Payload →", data);
  return client.post(`/api/${rid}/admin/menu`, data);
}

/* ================================
   🍽️ MENU ITEMS
================================ */

// Add single menu item
export async function addMenuItem(rid: string, itemData: Omit<MenuItem, 'image'>, imageFile?: File) {
  const formData = new FormData();

  // The backend expects the item data as a JSON string under the 'item' field
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

  // The backend expects the item data as a JSON string under the 'item' field
  formData.append('item', JSON.stringify(itemData));

  if (imageFile) {
    formData.append('image', imageFile);
  }

  return client.patch(`/api/${rid}/admin/menu/items/${itemId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * ✅ DELETE MENU ITEM
 */
export async function deleteMenuItem(rid: string, itemId: string, soft = true) {
  console.log("[deleteMenuItem] RID →", rid);
  console.log("[deleteMenuItem] ITEM ID →", itemId);
  console.log("[deleteMenuItem] SOFT DELETE →", soft);

  return client.delete(`/api/${rid}/admin/menu/items/${itemId}`, {
    data: { soft },
  });
}

/**
 * ✅ RESTORE MENU ITEM
 */
export async function restoreMenuItem(rid: string, itemId: string) {
  console.log("[restoreMenuItem] RID →", rid);
  console.log("[restoreMenuItem] ITEM ID →", itemId);

  return client.patch(`/api/${rid}/admin/menu/items/${itemId}/restore`);
}

/* ================================
   📂 CATEGORIES
================================ */

export async function addCategory(rid: string, categoryData: CategoryPayload) {
  console.log("[addCategory] RID →", rid);
  console.log("[addCategory] PAYLOAD →", categoryData);

  return client.post(`/api/${rid}/admin/menu/categories`, categoryData);
}

export async function deleteCategory(rid: string, categoryId: string) {
  console.log("[deleteCategory] RID →", rid);
  console.log("[deleteCategory] CATEGORY ID →", categoryId);

  return client.delete(`/api/${rid}/admin/menu/categories/${categoryId}`);
}

export async function fetchCategories(rid: string) {
  console.log("[fetchCategories] RID →", rid);
  return client.get(`/api/${rid}/admin/menu/categories`);
}

export async function updateCategory(
  rid: string,
  categoryId: string,
  categoryData: Partial<CategoryPayload>
) {
  console.log("[updateCategory] RID →", rid);
  console.log("[updateCategory] CATEGORY ID →", categoryId);
  console.log("[updateCategory] PAYLOAD →", categoryData);

  return client.patch(
    `/api/${rid}/admin/menu/categories/${categoryId}`,
    categoryData
  );
}

/* ================================
   ✅ DUPLICATE SAFE MENU UPDATE
================================ */

export async function updateMenu(rid: string, data: any) {
  console.log("[updateMenu] RID →", rid);
  console.log("[updateMenu] PAYLOAD →", data);

  return client.post(`/api/${rid}/admin/menu`, data);
}
