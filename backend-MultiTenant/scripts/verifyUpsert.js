const axios = require("axios");
const assert = require("assert");

async function verifyUpsert() {
  const restaurantId = "restro10";
  const tableId = "table1";
  const sessionId = `sess_${Date.now()}`;
  const initialItem = { menuItemId: "68db706ca5e37e5aed5be5e8", quantity: 1, priceAtOrder: 100 };
  const newItem = { menuItemId: "68db706ca5e37e5aed5be5e9", quantity: 2, priceAtOrder: 50 };

  try {
    // 1. Create the first order
    console.log("Creating the first order...");
    const response1 = await axios.post(
      `http://localhost:3000/api/${restaurantId}/orders`,
      {
        tableId,
        sessionId,
        customerName: "John Doe",
        items: [initialItem],
      }
    );

    const order1 = response1.data.order;
    assert.strictEqual(response1.status, 201, "First order creation failed");
    assert.strictEqual(order1.items.length, 1, "First order should have 1 item");
    assert.strictEqual(order1.items[0].menuItemId, initialItem.menuItemId, "First order has wrong item");
    console.log("✅ First order created successfully.");

    // 2. Update the order status to "served"
    console.log("\nUpdating the order status to 'served'...");
    await axios.patch(
      `http://localhost:3000/api/${restaurantId}/orders/${order1._id}/status`,
      {
        status: "served",
      }
    );
    console.log("✅ Order status updated to 'served'.");

    // 3. Add another item to the same order
    console.log("\nAdding a second item to the order...");
    const response2 = await axios.post(
      `http://localhost:3000/api/${restaurantId}/orders`,
      {
        tableId,
        sessionId,
        customerName: "John Doe",
        items: [newItem],
      }
    );

    const order2 = response2.data.order;
    assert.strictEqual(response2.status, 200, "Second order creation failed");
    assert.strictEqual(order2._id, order1._id, "A new order was created instead of updating the existing one");
    assert.strictEqual(order2.items.length, 2, "Updated order should have 2 items");
    
    const updatedItem = order2.items.find(item => item.menuItemId === newItem.menuItemId);
    assert.ok(updatedItem, "New item not found in updated order");
    assert.strictEqual(updatedItem.quantity, newItem.quantity, "New item quantity is incorrect");

    assert.strictEqual(order2.status, "placed", `Order status should be reset to 'placed', but it is '${order2.status}'`);
    console.log("✅ Order status successfully reset to 'placed'.");
    
    console.log("✅ Second item added successfully and status is correct.");
    console.log("\n✅✅✅ Upsert logic with status reset test passed! ✅✅✅");

  } catch (error) {
    console.error("\n❌ Test Failed:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error(error);
    }
  }
}

verifyUpsert();