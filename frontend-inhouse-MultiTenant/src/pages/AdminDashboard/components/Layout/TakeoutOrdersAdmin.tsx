// src/pages/AdminDashboard/components/Layout/TakeoutOrdersAdmin.tsx
import type { Order } from "../../../../api/admin/order.api";

type Props = {
  orders: Order[];
};

export default function TakeoutOrdersAdmin({ orders }: Props) {
  // This is a wrapper component that will render the OrdersManagement component
  // with the filtered takeout orders.
  // Currently, OrdersManagement fetches its own data, so we cannot pass orders as a prop.
  // For now, this component will just render the title.
  // TODO: Modify OrdersManagement to accept orders as a prop.

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-yellow-400">
            Takeout Orders
          </h1>
          <p className="text-sm text-zinc-400">
            Track and manage all takeout orders.
          </p>
        </div>
      </div>
      <p className="text-white">
        Displaying {orders.length} takeout orders.
      </p>
    </div>
  );
}
