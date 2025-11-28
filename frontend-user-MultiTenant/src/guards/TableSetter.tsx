
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTable } from '../context/TableContext';
import { useTenant } from '../context/TenantContext';
import { fetchTable } from '../api/table.api';

const TableSetter = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const { setTable } = useTable();
  const navigate = useNavigate();
  const { rid } = useTenant();

  useEffect(() => {
    const setTableAndNavigate = async () => {
      if (tableId && rid) {
        const tables = await fetchTable(rid);
        const table = tables.find((t: any) => t._id === tableId);
        if (table) {
          setTable(table);
        }
        // Redirect to the menu page after setting the table
        navigate(`/t/${rid}/menu`);
      }
    };
    setTableAndNavigate();
  }, [tableId, setTable, navigate, rid]);

  return null; // This component does not render anything
};

export default TableSetter;
