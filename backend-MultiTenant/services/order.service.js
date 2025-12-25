// services/order.service.js
import Order from "../models/Order.js";

export async function getNextOrderNumber(restaurantId, session) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const last = await Order.findOne({
    restaurantId,
    createdAt: { $gte: today },
  })
    .sort({ createdAt: -1 })
    .session(session);

  return (last?.OrderNumberForDay || 0) + 1;
}
