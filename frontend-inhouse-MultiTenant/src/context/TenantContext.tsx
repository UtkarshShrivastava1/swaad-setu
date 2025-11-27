import { createContext, ReactNode, useContext, useState } from "react";

export interface Admin {
  _id: string;
  restaurantId: string;
  pricingConfigs: any[]; // TODO: strongly type later
  username: string;
}

export interface TenantContextType {
  rid: string | null;
  setRid: (rid: string) => void;
  clearRid: () => void;
  admin: Admin | null;
  setAdmin: (admin: Admin) => void;
}

export const TenantContext = createContext<TenantContextType | undefined>(
  undefined
);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [rid, setRidState] = useState<string | null>(() => {
    return localStorage.getItem("currentRid") || null;
  });

  const [admin, setAdminState] = useState<Admin | null>(() => {
    const storedAdmin = sessionStorage.getItem("admin");
    return storedAdmin ? JSON.parse(storedAdmin) : null;
  });

  const setRid = (newRid: string) => {
    localStorage.setItem("currentRid", newRid);
    setRidState(newRid);
  };

  const setAdmin = (newAdmin: Admin) => {
    sessionStorage.setItem("admin", JSON.stringify(newAdmin));
    setAdminState(newAdmin);
  };

  const clearRid = () => {
    if (rid) {
      localStorage.removeItem(`adminToken_${rid}`);
      localStorage.removeItem(`staffToken_${rid}`);
    }

    localStorage.removeItem("currentRid");
    sessionStorage.removeItem("admin");

    setRidState(null);
    setAdminState(null);
  };

  return (
    <TenantContext.Provider value={{ rid, setRid, clearRid, admin, setAdmin }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantContextType {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return context;
}
