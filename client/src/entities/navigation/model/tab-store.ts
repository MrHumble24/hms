import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AppTab {
  key: string;
  label: string;
  path: string;
  icon?: string; // Icon name from Ant Design or Lucide
  closable?: boolean;
}

interface TabStore {
  tabs: AppTab[];
  activeTabKey: string;
  addTab: (tab: AppTab) => void;
  removeTab: (targetKey: string) => void;
  setActiveTab: (key: string) => void;
  removeAllTabs: () => void;
  /** Keeps search/hash when switching tabs (path must stay in sync with the router). */
  updateTabPath: (key: string, path: string) => void;
}

export const useTabStore = create<TabStore>()(
  persist(
    (set, get) => ({
      tabs: [
        { key: "dashboard", label: "Dashboard", path: "/", closable: false },
      ],
      activeTabKey: "dashboard",
      addTab: (tab) => {
        const { tabs } = get();
        if (!tabs.find((t) => t.key === tab.key)) {
          set({ tabs: [...tabs, { ...tab, closable: tab.closable ?? true }] });
        }
        set({ activeTabKey: tab.key });
      },
      removeTab: (targetKey) => {
        const { tabs, activeTabKey } = get();
        let newActiveKey = activeTabKey;
        let lastIndex = -1;
        tabs.forEach((tab, i) => {
          if (tab.key === targetKey) {
            lastIndex = i - 1;
          }
        });
        const newTabs = tabs.filter((tab) => tab.key !== targetKey);
        if (newTabs.length && newActiveKey === targetKey) {
          if (lastIndex >= 0) {
            newActiveKey = newTabs[lastIndex].key;
          } else {
            newActiveKey = newTabs[0].key;
          }
        }
        set({ tabs: newTabs, activeTabKey: newActiveKey });
      },
      setActiveTab: (key) => set({ activeTabKey: key }),
      updateTabPath: (key, path) => {
        set((state) => ({
          tabs: state.tabs.map((t) =>
            t.key === key ? { ...t, path } : t,
          ),
        }));
      },
      removeAllTabs: () => {
        set({
          tabs: [
            {
              key: "dashboard",
              label: "Dashboard",
              path: "/",
              closable: false,
            },
          ],
          activeTabKey: "dashboard",
        });
      },
    }),
    {
      name: "hms-tabs-storage",
    },
  ),
);
