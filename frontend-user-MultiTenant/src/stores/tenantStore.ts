
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface TenantState {
  rid: string | null;
  setRid: (rid: string) => void;
  clearRid: () => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      rid: null,
      setRid: (rid) => set({ rid }),
      clearRid: () => set({ rid: null }),
    }),
    {
      name: 'tenant-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
    }
  )
);
