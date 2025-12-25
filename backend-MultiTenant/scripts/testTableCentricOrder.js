const axios = require("axios");

async function testTableCentricOrder() {
  const restaurantId = "restro10";
  const tableId = "table1";
  const sessionId1 = `sess_${Date.now()}`;
  const sessionId2 = `sess_${Date.now() + 1}`;

  try {
    // Wait for the server to start
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 1. Create the first order with session 1
    console.log("Creating the first order with session 1...");
    const response1 = await axios.post(
      `http://localhost:3000/api/${restaurantId}/orders`,
      {
        tableId,
        sessionId: sessionId1,
        customerName: "User 1",
        items: [{ menuItemId: "68db706ca5e37e5aed5be5e8", quantity: 1, priceAtOrder: 100 }],
      }
    );

    console.log("First order created successfully:");
    console.log(response1.data);
    const orderId = response1.data.order._id;

    // 2. A different user scans the same table, so different session but same table
    console.log("\nAdding a second item to the order with session 2...");
    const response2 = await axios.post(
      `http://localhost:3000/api/${restaurantId}/orders`,
      {
        tableId,
        sessionId: sessionId2,
        customerName: "User 2",
        items: [{ menuItemId: "68db706ca5e37e5aed5be5e9", quantity: 2, priceAtOrder: 50 }],
      }
    );

    console.log("\nSecond item added successfully:");
    console.log(response2.data);

    if (response2.data.order._id === orderId) {
      console.log("\n✅ Test Passed: The second user's item was added to the existing order.");
    } else {
      console.log("\n❌ Test Failed: A new order was created instead of updating the existing one.");
    }

    // Cleanup: Mark the order as paid to release the table
    console.log("\nCleaning up: Marking order as paid...");
    await axios.patch(
      `http://localhost:3000/api/${restaurantId}/orders/${orderId}/status`,
      {
        status: "paid",
      }
    );
    console.log("Cleanup complete.");


  } catch (error) {
    console.error("\nError during test:");
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

testTableCentricOrder();
