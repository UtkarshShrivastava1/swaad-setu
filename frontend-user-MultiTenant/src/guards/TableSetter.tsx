
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTable } from "../context/TableContext";
import { useTenant } from "../context/TenantContext";
import { fetchTable } from "../api/table.api";
import { getOrder } from "../api/order.api"; // import getOrder

const TableSetter = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const { setTable } = useTable();
  const navigate = useNavigate();
  const { rid } = useTenant();

  useEffect(() => {
    const setTableAndCheckForActiveOrder = async () => {
      if (tableId && rid) {
        // 1. Set Table
        const tables = await fetchTable(rid);
        const table = tables.find((t: any) => t._id === tableId);
        if (table) {
          setTable(table);
        }

        // 2. Check for active order
        const sessionId = sessionStorage.getItem("resto_session_id");
        if (sessionId) {
          try {
            const existingOrders = await getOrder(rid, sessionId);
            const activeOrder = existingOrders.find(
              (o) =>
                o.status !== "completed" &&
                o.status !== "cancelled" &&
                o.tableId === tableId
            );

            if (activeOrder) {
              sessionStorage.setItem("active_order_id", activeOrder._id);
              console.log(
                "Active order ID set in TableSetter:",
                activeOrder._id
              );
            } else {
              // If no active order is found, we should clear any stale active_order_id
              sessionStorage.removeItem("active_order_id");
              console.log("Active order ID removed in TableSetter");
            }
          } catch (error) {
            console.error("Error fetching active order in TableSetter:", error);
            sessionStorage.removeItem("active_order_id");
          }
        }

        // 3. Redirect to the menu page
        navigate(`/t/${rid}/menu`);
      }
    };
    setTableAndCheckForActiveOrder();
  }, [tableId, setTable, navigate, rid]);

  return null; // This component does not render anything
};

export default TableSetter;

