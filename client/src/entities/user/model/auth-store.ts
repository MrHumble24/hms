import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useTenantStore } from "@/entities/tenant/model/tenant-store";

interface Branch {
  id: string;
  name: string;
  address?: string;
  isActive: boolean;
  isSetupCompleted?: boolean;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  tenantId?: string;
  branches?: Branch[];
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true });

        // Initialize tenant context if user has tenant/branch data
        if (user.tenantId && user.branches) {
          const tenantStore = useTenantStore.getState();
          tenantStore.setActiveTenant(user.tenantId);
          tenantStore.setAvailableBranches(user.branches);
        }
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });

        // Clear tenant context
        const tenantStore = useTenantStore.getState();
        tenantStore.clearContext();
      },
    }),
    {
      name: "auth-storage",
    },
  ),
);
