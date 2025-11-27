
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTable } from '../context/TableContext';
import { useTenant } from '../context/TenantContext';

const TableSetter = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const { setTableId } = useTable();
  const navigate = useNavigate();
  const { rid } = useTenant();

  useEffect(() => {
    if (tableId) {
      setTableId(tableId);
      // Redirect to the menu page after setting the table
      navigate(`/t/${rid}/`);
    }
  }, [tableId, setTableId, navigate, rid]);

  return null; // This component does not render anything
};

export default TableSetter;
