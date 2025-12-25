// utils/order.utils.js
export function mergeItems(order, incomingItems) {
  for (const it of incomingItems) {
    const existing = order.items.find(
      (i) => String(i.menuItemId) === String(it.menuItemId)
    );

    if (existing) {
      existing.quantity += Number(it.quantity || 1);
    } else {
      order.items.push({
        menuItemId: it.menuItemId,
        name: it.name,
        quantity: Number(it.quantity || 1),
        priceAtOrder: it.priceAtOrder,
        status: "placed",
      });
    }
  }
}
