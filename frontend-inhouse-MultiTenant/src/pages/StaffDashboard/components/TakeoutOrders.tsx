// src/pages/StaffDashboard/components/TakeoutOrders.tsx
import { useMemo } from "react";
import type { Order } from "../types";
import OrdersComponent from "./OrdersComponent";

type Props = {
  orders: Order[];
  handleUpdateOrderStatus: (orderId: string, status: string) => void;
  handleBillView: (orderId: string) => void;
  isPending: (id: string) => boolean;
  formatINR: (amount: number) => string;
  onNewOrderClick: () => void;
};

export default function TakeoutOrders({
  orders,
  handleUpdateOrderStatus,
  handleBillView,
  isPending,
  formatINR,
  onNewOrderClick,
}: Props) {
  const filteredOrders = useMemo(
    () => orders.filter((order) => !order.isCustomerOrder),
    [orders]
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Takeout Orders</h2>
      </div>
      <OrdersComponent
        filteredOrders={filteredOrders}
        handleUpdateOrderStatus={handleUpdateOrderStatus}
        handleBillView={handleBillView}
        isPending={isPending}
        formatINR={formatINR}
      />
    </div>
  );
}
