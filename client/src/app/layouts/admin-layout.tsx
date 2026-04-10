import { useEffect } from "react";
import {
  Layout,
  Avatar,
  Space,
  Dropdown,
  Typography,
  type MenuProps,
  Grid,
  Button,
} from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  SearchOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { Sidebar } from "@/widgets/sidebar/ui/sidebar";
import { TabBar } from "@/widgets/tab-bar/ui/tab-bar";
import { LanguageSwitcher } from "@/features/language-switcher/ui/switcher";
import { useAuthStore } from "@/entities/user/model/auth-store";
import { useSidebarStore } from "@/entities/navigation/model/sidebar-store";
import { useNavigate, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BranchGuard } from "@/shared/lib/auth/branch-guard";
import { useLocation } from "react-router-dom";
import { useTabStore } from "@/entities/navigation/model/tab-store";

const { Header, Content } = Layout;

function pathnameOfStoredPath(path: string) {
  return path.split("?")[0].split("#")[0] || "/";
}
const { Text } = Typography;

export const AdminLayout = () => {
  const { t } = useTranslation("common");
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { collapsed, toggleCollapsed } = useSidebarStore();
  const { md } = Grid.useBreakpoint();
  const location = useLocation();
  const isMobile = !md;
  const activeTabKey = useTabStore((s) => s.activeTabKey);
  const updateTabPath = useTabStore((s) => s.updateTabPath);

  useEffect(() => {
    const fullPath = `${location.pathname}${location.search}${location.hash}`;
    const tab = useTabStore
      .getState()
      .tabs.find((t) => t.key === activeTabKey);
    if (!tab) return;
    if (pathnameOfStoredPath(tab.path) !== location.pathname) return;
    if (tab.path === fullPath) return;
    updateTabPath(activeTabKey, fullPath);
  }, [
    location.pathname,
    location.search,
    location.hash,
    activeTabKey,
    updateTabPath,
  ]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      label: t("profile"),
      icon: <UserOutlined />,
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: t("logout"),
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ] as const;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout
        style={{
          marginLeft: isMobile ? 0 : collapsed ? 80 : 260,
          transition: "margin-left 0.2s",
        }}
      >
        <Header
          style={{
            background: "#fff",
            padding: "0 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            position: "sticky",
            top: 0,
            zIndex: 101,
            height: 64,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={toggleCollapsed}
                style={{ fontSize: 16, width: 40, height: 40 }}
              />
            )}
            <Space size="large">
              <SearchOutlined style={{ fontSize: 18, cursor: "pointer" }} />
            </Space>
          </div>
          <Space size="middle">
            <LanguageSwitcher />
            <BellOutlined style={{ fontSize: 18, cursor: "pointer" }} />
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <Space style={{ cursor: "pointer" }}>
                <Avatar
                  style={{ backgroundColor: "#1677ff" }}
                  icon={<UserOutlined />}
                />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    lineHeight: 1.2,
                  }}
                >
                  <Text strong>{user?.fullName}</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {user?.role}
                  </Text>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <TabBar />
        <Content
          style={{
            padding: "24px",
            background: "#f5f7fa",
            minHeight: "calc(100vh - 110px)",
          }}
        >
          {location.pathname.startsWith("/branches") ||
          location.pathname.startsWith("/admin") ? (
            <Outlet />
          ) : (
            <BranchGuard>
              <Outlet />
            </BranchGuard>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};
