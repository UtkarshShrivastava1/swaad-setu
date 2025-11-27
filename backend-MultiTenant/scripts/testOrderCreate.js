const axios = require("axios");

async function testCreateOrder() {
  try {
    const response = await axios.post(
      "http://localhost:3000/api/restro10/orders",
      {
        tableId: "table1",
        sessionId: "sess_abc",
        customerName: "John Doe",
        items: [{ menuItemId: "68db706ca5e37e5aed5be5e8", quantity: 1 }],
      }
    );

    console.log("Order created successfully:");
    console.log(response.data);
  } catch (error) {
    console.error("Error creating order:");
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
