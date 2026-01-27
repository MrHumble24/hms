import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Branch {
  id: string;
  name: string;
  address?: string;
  isActive: boolean;
}

interface TenantState {
  activeTenantId: string | null;
  activeBranchId: string | null;
  availableBranches: Branch[];

  setActiveTenant: (tenantId: string) => void;
  setActiveBranch: (branchId: string) => void;
  setAvailableBranches: (branches: Branch[]) => void;
  clearContext: () => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      activeTenantId: null,
      activeBranchId: null,
      availableBranches: [],

      setActiveTenant: (tenantId: string) => {
        set({ activeTenantId: tenantId });
        localStorage.setItem("activeTenantId", tenantId);
      },

      setActiveBranch: (branchId: string) => {
        set({ activeBranchId: branchId });
        localStorage.setItem("activeBranchId", branchId);
      },

      setAvailableBranches: (branches: Branch[]) => {
        set({ availableBranches: branches });

        // Check if current active branch is still valid
        const currentId = localStorage.getItem("activeBranchId");
        const isCurrentValid = branches.find(
          (b) => b.id === currentId && b.isActive,
        );

        if (!isCurrentValid && branches.length > 0) {
          const firstActiveBranch = branches.find((b) => b.isActive);
          if (firstActiveBranch) {
            set({ activeBranchId: firstActiveBranch.id });
            localStorage.setItem("activeBranchId", firstActiveBranch.id);
          } else {
            set({ activeBranchId: null });
            localStorage.removeItem("activeBranchId");
          }
        } else if (!isCurrentValid) {
          set({ activeBranchId: null });
          localStorage.removeItem("activeBranchId");
        }
      },

      clearContext: () => {
        set({
          activeTenantId: null,
          activeBranchId: null,
          availableBranches: [],
        });
        localStorage.removeItem("activeTenantId");
        localStorage.removeItem("activeBranchId");
      },
    }),
    {
      name: "tenant-storage",
    },
  ),
);
