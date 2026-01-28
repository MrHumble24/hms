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
        // Check BOTH localStorage and current state to avoid race conditions
        const currentIdFromStorage = localStorage.getItem("activeBranchId");
        const currentState = useTenantStore.getState();
        const currentId = currentIdFromStorage || currentState.activeBranchId;

        const isCurrentValid =
          currentId && branches.find((b) => b.id === currentId && b.isActive);

        console.log(
          "🏢 setAvailableBranches - Current ID:",
          currentId,
          "Valid:",
          !!isCurrentValid,
          "Branches:",
          branches.map((b) => b.id),
        );

        // Only auto-select if there's NO valid current branch
        if (!isCurrentValid && branches.length > 0) {
          const firstActiveBranch = branches.find((b) => b.isActive);
          if (firstActiveBranch) {
            console.log(
              "🏢 Auto-selecting first branch:",
              firstActiveBranch.id,
            );
            set({ activeBranchId: firstActiveBranch.id });
            localStorage.setItem("activeBranchId", firstActiveBranch.id);
          } else {
            set({ activeBranchId: null });
            localStorage.removeItem("activeBranchId");
          }
        } else if (isCurrentValid && !currentState.activeBranchId) {
          // If localStorage has valid ID but state doesn't, sync them
          set({ activeBranchId: currentId });
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
      onRehydrateStorage: () => (state) => {
        // When zustand rehydrates from storage, sync the individual localStorage keys
        // that the API interceptor reads from
        if (state) {
          console.log("🔄 Zustand Hydration - syncing localStorage", {
            tenantId: state.activeTenantId,
            branchId: state.activeBranchId,
          });

          if (state.activeTenantId) {
            localStorage.setItem("activeTenantId", state.activeTenantId);
          }
          if (state.activeBranchId) {
            localStorage.setItem("activeBranchId", state.activeBranchId);
          }
        }
      },
    },
  ),
);
