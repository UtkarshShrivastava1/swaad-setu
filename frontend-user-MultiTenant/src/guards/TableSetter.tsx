import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTable } from "../context/TableContext";
import { useTenant } from "../context/TenantContext";
import { fetchTable } from "../api/table.api";

const TableSetter = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const { setTable, isLoading } = useTable(); // Use isLoading from context
  const navigate = useNavigate();
  const { rid } = useTenant();

  useEffect(() => {
    const processTableSelection = async () => {
      if (tableId && rid) {
        const tables = await fetchTable(rid);
        const table = tables.find((t: any) => t._id === tableId);

        if (table) {
          // setTable now handles everything: setting table, fetching order, and syncing cart
          await setTable(table);
          // After everything is done, navigate
          navigate(`/t/${rid}/menu`);
        } else {
          // Handle case where table is not found
          console.error(`Table with ID ${tableId} not found.`);
          navigate(`/t/${rid}`); // Redirect to a safe page
        }
      }
    };

    processTableSelection();
    // The dependency array is tricky here.
    // We want this to run once when the component mounts with the right URL params.
    // setTable is now memoized with useCallback in the context.
  }, [tableId, rid, setTable, navigate]);

  // Optional: Show a loading indicator while the table and order are being processed.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p>Setting up your table...</p>
      </div>
    );
  }

  return null; // This component does not render anything while not loading
};

export default TableSetter;
