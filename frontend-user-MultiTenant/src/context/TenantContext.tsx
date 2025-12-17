
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { getRestaurant, type Restaurant } from '../api/restaurant.api';

interface TenantContextType {
  rid: string | null;
  tenant: Restaurant | null;
}

const TenantContext = createContext<TenantContextType>({ rid: null, tenant: null });

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context || !context.rid) {
    throw new Error('useTenant must be used within a TenantProvider with a valid rid.');
  }
  return context;
};

interface TenantProviderProps {
  children: ReactNode;
  rid: string;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children, rid }) => {
  const [tenant, setTenant] = useState<Restaurant | null>(null);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const restaurantData = await getRestaurant(rid);
        setTenant(restaurantData);
      } catch (error) {
        console.error("Failed to fetch tenant data:", error);
        setTenant(null); // Ensure tenant is null on error
      }
    };

    if (rid) {
      fetchTenant();
    } else {
      setTenant(null);
    }
  }, [rid]);

  return (
    <TenantContext.Provider value={{ rid, tenant }}>
      {children}
    </TenantContext.Provider>
  );
};
