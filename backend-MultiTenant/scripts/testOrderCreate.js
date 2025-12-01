const axios = require("axios");

async function testCreateOrder() {
  const restaurantId = "restro10";
  const tableId = "table1";
  const sessionId = `sess_${Date.now()}`;

  try {
    // 1. Create the first order
    console.log("Creating the first order...");
    const response1 = await axios.post(
      `http://localhost:3000/api/${restaurantId}/orders`,
      {
        tableId,
        sessionId,
        customerName: "John Doe",
        items: [{ menuItemId: "68db706ca5e37e5aed5be5e8", quantity: 1, priceAtOrder: 100 }],
      }
    );

    console.log("First order created successfully:");
    console.log(response1.data);
    const orderId = response1.data.order._id;

    // 2. Add another item to the same order
    console.log("\nAdding a second item to the order...");
    const response2 = await axios.post(
      `http://localhost:3000/api/${restaurantId}/orders`,
      {
        tableId,
        sessionId,
        customerName: "John Doe",
        items: [{ menuItemId: "68db706ca5e37e5aed5be5e9", quantity: 2, priceAtOrder: 50 }],
      }
    );

    console.log("\nSecond item added successfully:");
    console.log(response2.data);

    if (response2.data.order._id === orderId) {
      console.log("\n✅ Test Passed: The second item was added to the existing order.");
    } else {
      console.log("\n❌ Test Failed: A new order was created instead of updating the existing one.");
    }

  } catch (error) {
    console.error("\nError creating order:");
    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Data:", error.response.data);
      console.log("Headers:", error.response.headers);
    } else if (error.request) {
      console.log("Request:", error.request);
    } else {
      console.log("Error message:", error.message);
    }
    console.log("Error config:", error.config);
  }
}

testCreateOrder();