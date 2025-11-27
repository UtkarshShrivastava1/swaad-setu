
import React, { ReactNode, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { TenantProvider } from '../context/TenantContext';
import { useTenantStore } from '../stores/tenantStore';
import { useCart } from '../stores/cart.store';

const TenantGuard: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { rid } = useParams<{ rid: string }>();
  const { rid: storedRid, setRid } = useTenantStore();
  const { clear } = useCart();

  useEffect(() => {
    if (rid && rid !== storedRid) {
      // Clear cart when tenant changes
      clear();
      setRid(rid);
    }
  }, [rid, storedRid, setRid, clear]);

  if (!rid) {
    return <div>Restaurant ID (rid) is missing from the URL.</div>;
  }

  const isValidRid = /^[a-zA-Z0-9-_]+$/.test(rid);

  if (!isValidRid) {
    return <div>Invalid Restaurant ID format.</div>;
  }

  return <TenantProvider rid={rid}>{children}</TenantProvider>;
};

export default TenantGuard;
