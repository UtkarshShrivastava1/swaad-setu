import React from "react";
import type { Order } from "./OrdersComponent";

interface KOTPrintViewProps {
  order: Order;
  restaurantName?: string;
}

const KOTPrintView = React.forwardRef<HTMLDivElement, KOTPrintViewProps>(
  ({ order, restaurantName = "Restaurant" }, ref) => {
    const orderDate = new Date(
      typeof order.createdAt === "object"
        ? order.createdAt.$date
        : order.createdAt
    );

    return (
      <div ref={ref} className="kot-print">
        <style>{`
          .kot-print {
            font-family: 'monospace', sans-serif;
            font-size: 10pt;
            color: #000;
            /* No fixed width for better printer compatibility */
          }
          .kot-header {
            text-align: center;
            margin-bottom: 12px;
          }
          .kot-header h3 {
            font-size: 14pt;
            font-weight: bold;
            margin: 0;
            text-transform: uppercase;
          }
          .kot-header .kot-order-no {
            font-weight: bold;
            font-size: 12pt;
            border: 1px solid #000;
            padding: 2px 4px;
            display: inline-block;
            margin: 4px 0 8px 0;
          }
          .kot-info {
            font-size: 9pt;
          }
          .kot-info p {
            margin: 2px 0;
            display: flex;
            justify-content: space-between;
          }
           .kot-info p span:first-child {
            font-weight: bold;
           }
          .kot-items {
            margin-top: 12px;
            width: 100%;
            border-collapse: collapse;
          }
          .kot-items th, .kot-items td {
            text-align: left;
            padding: 4px 2px;
            border-bottom: 1px dashed #000;
            vertical-align: top;
          }
          .kot-items thead tr {
            border-bottom: 1px solid #000;
          }
          .kot-items th {
            font-weight: bold;
          }
          .s-no, .item-qty {
            text-align: center;
          }
          .item-qty {
            width: 15%;
          }
          .s-no {
            width: 15%;
          }
          .remark {
            word-break: break-word;
          }
        `}</style>
        <div className="kot-header">
          <h3>Kitchen Order Ticket</h3>
          <p className="kot-order-no">Order #{order.OrderNumberForDay || order.id.slice(-6)}</p>
          <p>{restaurantName}</p>
        </div>
        <div className="kot-info">
          <p><span>Table:</span> <span>{order.tableNumber || "N/A"}</span></p>
          <p><span>Waiter:</span> <span>{order.staffAlias || "N/A"}</span></p>
          <p><span>Date:</span> <span>{orderDate.toLocaleDateString()}</span></p>
          <p><span>Time:</span> <span>{orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></p>
        </div>
        <table className="kot-items">
          <thead>
            <tr>
              <th className="s-no">S.No</th>
              <th>Item</th>
              <th className="item-qty">Qty</th>
              <th>Remark</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={index}>
                <td className="s-no">{index + 1}</td>
                <td>{item.name}</td>
                <td className="item-qty">{item.qty}</td>
                <td className="remark">{item.notes || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
);

export default KOTPrintView;

