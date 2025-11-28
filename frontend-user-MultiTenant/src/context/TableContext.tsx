
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Table = {
  _id: string;
  tableNumber: number;
  capacity: number;
  isActive: boolean;
  isDeleted: boolean;
};

interface TableContextType {
  table: Table | null;
  setTable: (table: Table | null) => void;
  clearTable: () => void;
  tableId: string | null;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

export const useTable = () => {
  const context = useContext(TableContext);
  if (context === undefined) {
    throw new Error('useTable must be used within a TableProvider');
  }
  return context;
};

interface TableProviderProps {
  children: ReactNode;
}

export const TableProvider: React.FC<TableProviderProps> = ({ children }) => {
  const [table, setTableState] = useState<Table | null>(() => {
    const storedTable = sessionStorage.getItem('resto_table');
    return storedTable ? JSON.parse(storedTable) : null;
  });

  const setTable = (table: Table | null) => {
    console.log("Setting table:", table);
    if (table) {
      sessionStorage.setItem('resto_table', JSON.stringify(table));
      setTableState(table);
    } else {
      sessionStorage.removeItem('resto_table');
      setTableState(null);
    }
  };

  const clearTable = () => {
    console.log("Clearing table");
    sessionStorage.removeItem('resto_table');
    setTableState(null);
  };

  const tableId = table ? table._id : null;

  return (
    <TableContext.Provider value={{ table, setTable, clearTable, tableId }}>
      {children}
    </TableContext.Provider>
  );
};
