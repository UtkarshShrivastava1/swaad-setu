
import React, { createContext, useContext, ReactNode } from 'react';

interface TenantContextType {
  rid: string | null;
}

const TenantContext = createContext<TenantContextType>({ rid: null });

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
  return (
    <TenantContext.Provider value={{ rid }}>
      {children}
    </TenantContext.Provider>
  );
};
