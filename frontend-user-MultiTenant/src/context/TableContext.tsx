
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface TableContextType {
  tableId: string | null;
  setTableId: (id: string | null) => void;
  clearTable: () => void;
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
  const [tableId, setTableIdState] = useState<string | null>(() => {
    return sessionStorage.getItem('resto_table_number');
  });

  const setTableId = (id: string | null) => {
    if (id) {
      sessionStorage.setItem('resto_table_number', id);
      setTableIdState(id);
    } else {
      sessionStorage.removeItem('resto_table_number');
      setTableIdState(null);
    }
  };

  const clearTable = () => {
    sessionStorage.removeItem('resto_table_number');
    setTableIdState(null);
  };

  return (
    <TableContext.Provider value={{ tableId, setTableId, clearTable }}>
      {children}
    </TableContext.Provider>
  );
};
