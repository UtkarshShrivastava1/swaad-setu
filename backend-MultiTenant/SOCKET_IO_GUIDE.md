# Swaad Setu Socket.IO Integration Guide

This guide provides a comprehensive overview of how to integrate real-time features into the Swaad Setu frontend applications (both for customers and staff/admin) using Socket.IO.

The backend is designed to use a room-based system tied to specific restaurants and tables, enabling targeted communication.

## Core Concepts

- **Rooms:** Communication is segregated by rooms. You don't need to join rooms manually; it's handled automatically on connection based on query parameters.
  - **Staff Room:** `restaurant:{rid}:staff` - All staff members for a restaurant connect to this room. It's used for broadcasting events relevant to the entire restaurant staff (e.g., new orders).
  - **Table Room:** `restaurant:{rid}:tables:{tableId}` - A customer's device at a specific table joins this room. It's for events specific to that table (e.g., updates on their own order).
- **Connection:** Clients must provide a restaurant ID (`rid`) in the connection query string. Customers at a table must also provide a `tableId`.

---

## 1. Customer Frontend Integration (User at a Table)

This is for the application that customers use at their table to browse the menu, place orders, and call for service.

### a. Connecting to the Server

You need to establish a connection when the user has been identified as being at a specific table in a restaurant.

**Required Query Parameters:**
- `rid`: The unique ID of the restaurant.
- `tableId`: The unique ID of the table.

```javascript
// Make sure to install the client library first:
// npm install socket.io-client

import { io } from "socket.io-client";

const SERVER_URL = "http://your-backend-api-url.com"; // Replace with your actual backend URL
const restaurantId = "RESTAURANT_ID_HERE"; // The ID of the current restaurant
const tableId = "TABLE_ID_HERE"; // The ID of the user's table

const socket = io(SERVER_URL, {
  query: {
    rid: restaurantId,
    tableId: tableId,
  },
  transports: ["websocket"], // Recommended for better performance
});

socket.on("connect", () => {
  console.log("Successfully connected to the server for table:", tableId);
});

socket.on("disconnect", () => {
  console.log("Disconnected from the server.");
});

socket.on("connect_error", (err) => {
  console.error("Connection failed:", err.message);
});
```

### b. Emitting Events (Sending data to Server)

These are actions initiated by the user.

**Use Case: Calling a Waiter**
```javascript
function callWaiter() {
  console.log("Emitting 'call_waiter' event");
  socket.emit("call_waiter", {
    rid: restaurantId,
    tableId: tableId,
    message: "Needs assistance",
    timestamp: new Date().toISOString(),
  });
}
```

**Use Case: Placing a New Order**
While order placement might primarily be a REST API call, you can use sockets to send a real-time notification to the kitchen staff immediately.
```javascript
function notifyNewOrder(orderData) {
  console.log("Emitting 'new_order' event");
  socket.emit("new_order", {
    rid: restaurantId,
    tableId: tableId,
    order: orderData, // The order payload
  });
}
```

### c. Listening for Events (Receiving data from Server)

These are real-time updates pushed from the server to the user's table.

**Use Case: Order Status Updates**
The server will send an update whenever the status of an order for this table changes (e.g., "Preparing", "Ready", "Served").
```javascript
socket.on("order_status_update", (data) => {
  // data might look like: { orderId: 'xyz', newStatus: 'Preparing' }
  console.log(`Order ${data.orderId} status updated to: ${data.newStatus}`);
  // Update your UI here to reflect the new order status
  updateOrderStatusInUI(data.orderId, data.newStatus);
});
```

**Use Case: General Announcements**
The server can broadcast a message to all tables.
```javascript
socket.on("announcement", (data) => {
  // data might look like: { message: 'The kitchen is closing in 15 minutes.' }
  console.log("Announcement from restaurant:", data.message);
  // Show a notification or modal to the user
  displayAnnouncement(data.message);
});
```

---

## 2. Staff/Admin Frontend Integration

This is for the application used by kitchen staff, managers, and waiters to manage the restaurant.

### a. Connecting to the Server

Staff members only need the restaurant ID to connect. They will receive events from all tables in that restaurant.

**Required Query Parameters:**
- `rid`: The unique ID of the restaurant.

```javascript
// Make sure to install the client library first:
// npm install socket.io-client

import { io } from "socket.io-client";

const SERVER_URL = "http://your-backend-api-url.com"; // Replace with your actual backend URL
const restaurantId = "RESTAURANT_ID_HERE"; // The ID of the restaurant this staff member belongs to

const socket = io(SERVER_URL, {
  query: {
    rid: restaurantId,
  },
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("Staff client successfully connected for restaurant:", restaurantId);
});

socket.on("disconnect", () => {
  console.log("Staff client disconnected.");
});
```

### b. Listening for Events (Receiving data from Users/System)

Staff will primarily listen for events generated by customers.

**Use Case: New Waiter Call**
```javascript
socket.on("call_waiter", (data) => {
  // data might look like: { rid: 'abc', tableId: 't1', message: 'Needs assistance' }
  console.log(`Waiter call from Table ${data.tableId}: ${data.message}`);
  // Add this to a list of active service calls in the UI
  // Trigger a sound or visual notification
  addServiceCallToDashboard(data.tableId, data.message);
});
```

**Use Case: New Order Placed**
```javascript
socket.on("new_order", (data) => {
  // data might look like: { rid: 'abc', tableId: 't1', order: { ... } }
  console.log(`New order received from Table ${data.tableId}`);
  // Display the new order on the kitchen display system (KDS) or admin dashboard
  addNewOrderToQueue(data.order);
});
```

### c. Emitting Events (Sending data to Users/Other Staff)

Staff can also send events to specific tables or all tables.

**Use Case: Updating Order Status**
This event is sent to a specific table. The backend logic should ensure this is routed to the correct `tableId` room.
```javascript
function updateOrderStatus(tableId, orderId, newStatus) {
  console.log(`Emitting 'order_status_update' for table ${tableId}`);
  socket.emit("update_order_status", {
    rid: restaurantId,
    tableId: tableId, // CRITICAL: Specify which table to notify
    payload: {
      orderId: orderId,
      newStatus: newStatus,
    },
  });
}
```

**Use Case: Broadcasting an Announcement**
This event is sent to all tables in the restaurant.
```javascript
function broadcastAnnouncement(messageText) {
  console.log("Broadcasting announcement to all tables");
  socket.emit("broadcast_announcement", {
    rid: restaurantId,
    payload: {
      message: messageText,
    },
  });
}
```

---

## 3. Summary of Potential Events

This is a suggested list of event names. The actual implementation depends on the backend emitting/listening for these specific names.

| Event Name            | Emitted By      | Listened For By | Description                                                              |
| --------------------- | --------------- | --------------- | ------------------------------------------------------------------------ |
| `new_order`           | Customer        | Staff/Admin     | A customer has submitted a new order.                                    |
| `call_waiter`         | Customer        | Staff/Admin     | A customer at a table is requesting assistance.                          |
| `order_status_update` | Staff/Admin     | Customer        | Notifies a table about a change in their order's status.                 |
| `announcement`        | Staff/Admin     | Customer        | A general message broadcast to all tables (e.g., "Closing soon").        |
| `menu_updated`        | Staff/Admin     | Customer        | Notifies all tables that the menu has changed and they should refetch it.|
| `table_status_change` | Staff/Admin     | Staff/Admin     | Update the status of a table (e.g., 'needs cleaning', 'reserved').       |

## 4. Untapped Potential & Advanced Use Cases

- **Real-time Analytics:** The admin dashboard could feature a live chart showing orders per minute, revenue, and popular items, all updated in real-time.
- **Staff-to-Staff Communication:** Create a separate staff-only chat or notification system (e.g., "Chef to Waiter: Dish XYZ is ready for pickup").
- **Inventory Tracking:** When an item is ordered, an event could be sent to an inventory management system. If an item runs out, an `item_unavailable` event could be broadcast to all customers to update their menus in real-time.
- **Gamification:** Offer real-time promotions to customers (e.g., "Flash sale on dessert for the next 5 minutes!").
- **Live Waitlist/Queueing:** For restaurants with waiting lines, provide customers with a real-time view of their position in the queue via a simple web link.
