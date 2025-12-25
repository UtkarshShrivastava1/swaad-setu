import React, { createContext, useContext, useEffect } from "react";
import socketService from "../services/socketService";
import { useTenant } from "./TenantContext";

const SocketContext = createContext(socketService);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { rid } = useTenant();

  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("staffToken");

    if (rid && token) {
      socketService.connect(rid, token);
    }

    return () => {
      socketService.disconnect();
    };
  }, [rid]);

  return (
    <SocketContext.Provider value={socketService}>
      {children}
    </SocketContext.Provider>
  );
};
