import { Tabs, Button, Popconfirm, Tooltip } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useTabStore } from "@/entities/navigation/model/tab-store";
import { useNavigate } from "react-router-dom";

export const TabBar = () => {
  const { tabs, activeTabKey, setActiveTab, removeTab, removeAllTabs } =
    useTabStore();
  const navigate = useNavigate();

  const onChange = (key: string) => {
    const tab = tabs.find((t) => t.key === key);
    if (tab) {
      setActiveTab(key);
      navigate(tab.path);
    }
  };

  const onEdit = (targetKey: any, action: "add" | "remove") => {
    if (action === "remove") {
      removeTab(targetKey);
      // Logic to navigate after removal is handled by Zustand store state update if needed,
      // but we should trigger navigation here to ensure router is in sync.
      const currentTabs = useTabStore.getState().tabs;
      const currentActive = useTabStore.getState().activeTabKey;
      const activeTab = currentTabs.find((t) => t.key === currentActive);
      if (activeTab) {
        navigate(activeTab.path);
      }
    }
  };

  const handleCloseAll = () => {
    removeAllTabs();
    navigate("/");
  };

  return (
    <div
      style={{
        background: "#fff",
        padding: "4px 16px 0",
        borderBottom: "1px solid #f0f0f0",
        position: "sticky",
        top: 64,
        zIndex: 90,
      }}
    >
      <Tabs
        type="editable-card"
        activeKey={activeTabKey}
        onChange={onChange}
        onEdit={onEdit}
        hideAdd
        items={tabs.map((tab) => ({
          key: tab.key,
          label: tab.label,
          closable: tab.closable,
        }))}
        style={{ marginBottom: -1 }}
        size="small"
        tabBarExtraContent={
          tabs.length > 1 ? (
            <Tooltip title="Close All Tabs">
              <Popconfirm
                title="Are you sure you want to close all tabs?"
                onConfirm={handleCloseAll}
                placement="bottomRight"
                okText="Close All"
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined style={{ fontSize: 12 }} />}
                  style={{
                    marginRight: 16,
                    color: "#ff4d4f",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 28,
                    borderRadius: 4,
                  }}
                >
                  Close All
                </Button>
              </Popconfirm>
            </Tooltip>
          ) : null
        }
      />
    </div>
  );
};
