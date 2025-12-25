import React, { createContext, useContext, useEffect } from "react";
import socketService from "../services/socketService";
import { useTable } from "./TableContext";
import { useTenant } from "./TenantContext";

const SocketContext = createContext(socketService);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { rid } = useTenant();
  const { tableId } = useTable();

  useEffect(() => {
    if (rid && tableId) {
      socketService.connect(rid, tableId);
    }

    return () => {
      socketService.disconnect();
    };
  }, [rid, tableId]);

  return (
    <SocketContext.Provider value={socketService}>
      {children}
    </SocketContext.Provider>
  );
};