import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useTenant } from "./TenantContext";
import { getActiveOrderByTableId } from "@/api/order.api";
import type { Order } from "@/api/order.api";
import { useCart } from "@/stores/cart.store";

export type Table = {
  _id: string;
  tableNumber: number;
  capacity: number;
  isActive: boolean;
  isDeleted: boolean;
};

interface TableContextType {
  table: Table | null;
  activeOrder: Order | null;
  isLoading: boolean;
  setTable: (table: Table | null) => Promise<void>;
  clearTable: () => void;
  tableId: string | null;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

export const useTable = () => {
  const context = useContext(TableContext);
  if (context === undefined) {
    throw new Error("useTable must be used within a TableProvider");
  }
  return context;
};

interface TableProviderProps {
  children: ReactNode;
}

export const TableProvider: React.FC<TableProviderProps> = ({ children }) => {
  const { rid } = useTenant();
  const { initializeCartFromOrder, clear: clearCart, setInitialized } = useCart();

  const [table, setTableState] = useState<Table | null>(() => {
    const storedTable = sessionStorage.getItem("resto_table");
    return storedTable ? JSON.parse(storedTable) : null;
  });
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const setTable = useCallback(
    async (newTable: Table | null) => {
      if (!newTable) {
        clearTable();
        return;
      }

      console.log("Setting table and fetching active order:", newTable);
      setIsLoading(true);
      setTableState(newTable);
      sessionStorage.setItem("resto_table", JSON.stringify(newTable));

      if (!rid) {
        console.error("Restaurant ID (rid) is not available.");
        setIsLoading(false);
        return;
      }

      try {
        const order = await getActiveOrderByTableId(rid, newTable._id);
        setActiveOrder(order);

        if (order) {
          console.log("Active order found:", order);
          // When a user joins a table with an active order, they should start with an empty cart
          // for adding new items, not have their cart pre-filled with existing items.
          clearCart();
          setInitialized(false);
          sessionStorage.setItem("resto_session_id", order.sessionId);
          sessionStorage.setItem("active_order_id", order._id);
        } else {
          console.log("No active order found for this table. Clearing cart.");
          clearCart();
          // Also ensure isInitialized is false so a new cart doesn't think it's synced
          setInitialized(false); 
          sessionStorage.removeItem("resto_session_id");
          sessionStorage.removeItem("active_order_id");
        }
      } catch (error) {
        console.error("Failed to fetch or process active order:", error);
        // On error, clear everything to be safe
        clearCart();
        setInitialized(false);
        sessionStorage.removeItem("resto_session_id");
        sessionStorage.removeItem("active_order_id");
      } finally {
        setIsLoading(false);
      }
    },
    [rid, initializeCartFromOrder, clearCart, setInitialized]
  );

  const clearTable = useCallback(() => {
    console.log("Clearing table, order, and cart.");
    sessionStorage.removeItem("resto_table");
    sessionStorage.removeItem("resto_session_id");
    sessionStorage.removeItem("active_order_id");
    setTableState(null);
    setActiveOrder(null);
    clearCart();
    setInitialized(false);
  }, [clearCart, setInitialized]);

  const tableId = table ? table._id : null;

  return (
    <TableContext.Provider
      value={{ table, activeOrder, isLoading, setTable, clearTable, tableId }}
    >
      {children}
    </TableContext.Provider>
  );
};
