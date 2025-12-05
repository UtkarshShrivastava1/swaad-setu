import { createContext, useContext, useState, type ReactNode } from "react";
import type { Restaurant } from "../api/restaurant.api";

export interface PricingConfig {
  version: number;
  active: boolean;
  globalDiscountPercent: number;
  serviceChargePercent: number;
  taxes: { name: string; percent: number }[];
  createdAt: string;
}

export interface Admin {
  _id: string;
  restaurantId: string;
  pricingConfigs: PricingConfig[];
  username: string;
  // This may contain other properties like upiSettings, but they are not strictly typed here
  [key: string]: any;
}

export interface TenantContextType {
  rid: string | null;
  setRid: (rid: string) => void;
  clearRid: () => void;
  admin: Admin | null;
  setAdmin: (admin: Admin) => void;
  tenant: Restaurant | null;
  setTenant: (tenant: Restaurant) => void;
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

  const [tenant, setTenantState] = useState<Restaurant | null>(() => {
    const storedTenant = sessionStorage.getItem("tenant");
    return storedTenant ? JSON.parse(storedTenant) : null;
  });

  const setRid = (newRid: string) => {
    localStorage.setItem("currentRid", newRid);
    setRidState(newRid);
  };

  const setAdmin = (newAdmin: Admin) => {
    sessionStorage.setItem("admin", JSON.stringify(newAdmin));
    setAdminState(newAdmin);
  };

  const setTenant = (newTenant: Restaurant) => {
    sessionStorage.setItem("tenant", JSON.stringify(newTenant));
    setTenantState(newTenant);
  };

  const clearRid = () => {
    if (rid) {
      localStorage.removeItem(`adminToken_${rid}`);
      localStorage.removeItem(`staffToken_${rid}`);
    }

    localStorage.removeItem("currentRid");
    sessionStorage.removeItem("admin");
    sessionStorage.removeItem("tenant");

    setRidState(null);
    setAdminState(null);
    setTenantState(null);
  };

  return (
    <TenantContext.Provider
      value={{
        rid,
        setRid,
        clearRid,
        admin,
        setAdmin,
        tenant,
        setTenant,
      }}
    >
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
