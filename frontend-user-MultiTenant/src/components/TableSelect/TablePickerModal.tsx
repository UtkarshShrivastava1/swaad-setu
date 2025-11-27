
import React, { useState, useEffect } from 'react';
import { useTable } from '../../context/TableContext';
import { useTenant } from '../../context/TenantContext';
import axios from 'axios';

interface TablePickerModalProps {
  onClose: () => void;
}

const TablePickerModal: React.FC<TablePickerModalProps> = ({ onClose }) => {
  const { setTableId } = useTable();
  const { rid } = useTenant();
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    async function fetchTables() {
      try {
        const res = await axios.get(`${baseUrl}/api/${rid}/tables`);
        const availableTables = res.data.filter(
          (t: any) => t.isActive && !t.isDeleted
        );
        setTables(availableTables);
      } catch (err) {
        console.error("Error fetching tables:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTables();
  }, [baseUrl, rid]);

  const handleSelect = () => {
    if (selectedTableId) {
      setTableId(selectedTableId);
      onClose();
    } else {
      alert('Please select a table.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">Select a Table</h2>
        {loading ? (
          <p className="text-gray-600">Loading tables...</p>
        ) : (
          <select
            value={selectedTableId}
            onChange={(e) => setSelectedTableId(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          >
            <option value="" disabled>-- Select a table --</option>
            {tables.map(table => (
              <option key={table._id} value={table._id}>
                Table {table.tableNumber} ({table.capacity} seats)
              </option>
            ))}
          </select>
        )}
        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
          <button onClick={handleSelect} className="px-4 py-2 rounded bg-blue-500 text-white">Select</button>
        </div>
      </div>
    </div>
  );
};

export default TablePickerModal;

