# API Routes Documentation

All routes are prefixed with `/api/:rid` where `:rid` is the restaurant ID.

## Table Routes

| Method | Endpoint              | Body                     | Auth Required | Description             |
| ------ | --------------------- | ------------------------ | ------------- | ----------------------- |
| GET    | `/tables`             | None                     | No            | Get all tables          |
| GET    | `/tables/:id`         | None                     | No            | Get table by ID         |
| PATCH  | `/tables/:id/status`  | `{ status: string }`     | Yes           | Update table status     |
| PATCH  | `/tables/:id/session` | `{ sessionId: string }`  | Yes           | Assign session to table |
| PATCH  | `/tables/:id/staff`   | `{ staffAlias: string }` | Yes           | Update staff alias      |

## Order Routes

| Method | Endpoint             | Body                                               | Auth Required | Description         |
| ------ | -------------------- | -------------------------------------------------- | ------------- | ------------------- |
| POST   | `/orders`            | `{ items: [{itemId, quantity}], tableId: string }` | Yes           | Create new order    |
| PATCH  | `/orders/:id/status` | `{ status: string }`                               | Yes           | Update order status |
| GET    | `/orders/active`     | None                                               | Yes           | Get active orders   |
| GET    | `/orders/history`    | None                                               | Yes           | Get order history   |

## Bill Routes

| Method | Endpoint         | Body                                        | Auth Required | Description           |
| ------ | ---------------- | ------------------------------------------- | ------------- | --------------------- |
| POST   | `/bills`         | `{ orderId: string, tableId: string }`      | Yes           | Create bill           |
| PATCH  | `/bills/:id/pay` | `{ paymentMethod: string, amount: number }` | Yes           | Update payment status |
| GET    | `/bills/active`  | None                                        | Yes           | Get active bills      |
| GET    | `/bills/history` | None                                        | Yes           | Get bills history     |

## Call Routes

| Method | Endpoint             | Body                                | Auth Required | Description       |
| ------ | -------------------- | ----------------------------------- | ------------- | ----------------- |
| POST   | `/calls`             | `{ tableId: string, type: string }` | No            | Create staff call |
| PATCH  | `/calls/:id/resolve` | None                                | Yes           | Resolve call      |
| GET    | `/calls/active`      | None                                | Yes           | Get active calls  |

## Admin Routes

| Method | Endpoint               | Body                                        | Auth Required | Description             |
| ------ | ---------------------- | ------------------------------------------- | ------------- | ----------------------- |
| POST   | `/admin/overrides`     | `{ permissions: [string] }`                 | Yes           | Generate override token |
| POST   | `/admin/menu`          | `{ menu: object }`                          | Yes           | Update menu             |
| GET    | `/admin/analytics`     | None                                        | Yes           | Get analytics           |
| POST   | `/admin/export`        | `{ reportType: string, dateRange: object }` | Yes           | Export report           |
| PATCH  | `/admin/tables/:id`    | `{ config: object }`                        | Yes           | Update table config     |
| PATCH  | `/admin/staff-aliases` | `{ aliases: [string] }`                     | Yes           | Update staff aliases    |

## Authentication

- Routes marked "Yes" for Auth Required need `Authorization: Bearer <token>` header
- Tokens are JWT format obtained from `/login` endpoint (not shown in routes)
