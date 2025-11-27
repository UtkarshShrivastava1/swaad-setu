// src/components/TenantGuard.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTenant } from "../context/TenantContext";
import { isValidRid } from "../utils/tenant.utils";

export function TenantGuard({ children }: { children: React.ReactNode }) {
  const { rid, setRid } = useTenant();
  const { rid: ridFromUrl } = useParams();
  const navigate = useNavigate();

  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 1️⃣ Make sure URL contains a rid
    if (!ridFromUrl) {
      navigate("/select-restaurant", { replace: true });
      return;
    }

    const normalizedRid = ridFromUrl.toLowerCase();

    // 2️⃣ Validate rid format
    if (!isValidRid(normalizedRid)) {
      navigate("/select-restaurant", { replace: true });
      return;
    }

    // 3️⃣ Sync context only if needed
    if (rid !== normalizedRid) {
      setRid(normalizedRid);
    }

    // 4️⃣ Allow children to render
    setReady(true);
  }, [ridFromUrl]);

  if (!ready) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
