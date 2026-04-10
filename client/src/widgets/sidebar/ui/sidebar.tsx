import {
  Layout,
  Menu,
  Typography,
  Space,
  Button,
  type MenuProps,
  Drawer,
  Grid,
} from "antd";
import {
  DashboardOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  ContainerOutlined,
  UserOutlined,
  ShopOutlined,
  ClearOutlined,
  TeamOutlined,
  FileTextOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ToolOutlined,
  BankOutlined,
  MailOutlined,
  AuditOutlined,
  GlobalOutlined,
  TruckOutlined,
  CodeOutlined,
} from "@ant-design/icons";
import { ChefHat, History } from "lucide-react";
import { useTabStore } from "@/entities/navigation/model/tab-store";
import { useSidebarStore } from "@/entities/navigation/model/sidebar-store";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BranchSwitcher } from "@/widgets/branch-switcher/ui/branch-switcher";
import { useAuthStore } from "@/entities/user/model/auth-store";
import { hasPermission } from "@/entities/user/model/roles";

const { Sider } = Layout;
const { Title } = Typography;

type MenuItem = Required<MenuProps>["items"][number] & {
  path?: string;
  children?: MenuItem[];
  permission?: string;
};

export const Sidebar = () => {
  const { t } = useTranslation("sidebar");
  const navigate = useNavigate();
  const addTab = useTabStore((state) => state.addTab);
  const activeTabKey = useTabStore((state) => state.activeTabKey);
  const { collapsed, toggleCollapsed } = useSidebarStore();
  const { user } = useAuthStore();

  const menuItems: MenuItem[] = [
    ...(user?.role === "SUPER_ADMIN"
      ? [
          {
            key: "admin-tenants",
            icon: <SettingOutlined />,
            label: "Tenant Management",
            path: "/admin/tenants",
            // Permissions handled by explicit check above, or we could strict check "admin-tenants"
          },
          {
            key: "admin-logs",
            icon: <CodeOutlined />,
            label: "System Logs",
            path: "/admin/logs",
          },
          { type: "divider" } as MenuItem,
        ]
      : []),
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: t("menu.dashboard"),
      path: "/",
      permission: "dashboard",
    },
    {
      type: "divider",
    },
    {
      key: "bookings-group",
      label: t("menu.reservation"),
      type: "group",
      children: [
        {
          key: "bookings",
          icon: <CalendarOutlined />,
          label: t("menu.bookings"),
          path: "/bookings",
          permission: "bookings",
        },
        {
          key: "guests",
          icon: <TeamOutlined />,
          label: t("menu.guests"),
          path: "/guests",
          permission: "guests",
        },
        {
          key: "corporate",
          icon: <ShopOutlined />,
          label: t("menu.corporate"),
          path: "/companies",
          permission: "companies",
        },
        {
          key: "housekeeping",
          icon: <ClearOutlined />,
          label: t("menu.housekeeping") || "Housekeeping",
          path: "/housekeeping",
          permission: "housekeeping",
        },
        {
          key: "concierge",
          icon: <TruckOutlined />,
          label: t("menu.concierge") || "Concierge",
          path: "/concierge",
          permission: "concierge",
        },
      ],
    },
    {
      key: "rooms-group",
      label: t("menu.inventory"),
      type: "group",
      children: [
        {
          key: "rooms",
          icon: <ShopOutlined />,
          label: t("menu.rooms"),
          path: "/rooms",
          permission: "rooms",
        },
        {
          key: "rooms-visual",
          icon: <AppstoreOutlined />,
          label: t("menu.visualGrid"),
          path: "/rooms/visual",
          permission: "rooms", // Same permission as rooms management
        },
        {
          key: "inventory-supplies",
          icon: <ContainerOutlined />,
          label: t("menu.supplies") || "Supplies",
          path: "/inventory",
          permission: "inventory",
        },
        {
          key: "room-types",
          icon: <SettingOutlined />,
          label: t("menu.roomTypes"),
          path: "/room-types",
          permission: "room-types",
        },
        {
          key: "maintenance",
          icon: <ToolOutlined />,
          label: "Maintenance",
          path: "/maintenance",
          permission: "maintenance",
        },
      ],
    },
    {
      key: "restaurant-group",
      label: t("menu.restaurant"),
      type: "group",
      children: [
        {
          key: "restaurant-pos",
          icon: <ShopOutlined />,
          label: t("menu.pos"),
          path: "/restaurant/pos",
          permission: "restaurant-pos",
        },
        {
          key: "restaurant-kds",
          icon: <ChefHat size={18} />,
          label: t("menu.kds"),
          path: "/restaurant/kds",
          permission: "restaurant-kds",
        },
        {
          key: "restaurant-history",
          icon: <History size={18} />,
          label: t("menu.orderHistory"),
          path: "/restaurant/history",
          permission: "restaurant-history",
        },
        {
          key: "restaurant-menu",
          icon: <AppstoreOutlined />,
          label: t("menu.menuManagement"),
          path: "/restaurant/menu",
          permission: "restaurant-menu",
        },
      ],
    },
    {
      key: "finance-group",
      label: t("menu.finance"),
      type: "group",
      children: [
        {
          key: "finance",
          icon: <FileTextOutlined />,
          label: t("menu.payments"),
          path: "/finance",
          permission: "finance",
        },
      ],
    },
    {
      key: "system-group",
      label: t("menu.system"),
      type: "group",
      children: [
        {
          key: "branches",
          icon: <BankOutlined />,
          label: "Branches",
          path: "/branches",
          permission: "branches",
        },
        {
          key: "staff",
          icon: <UserOutlined />,
          label: t("menu.staff"),
          path: "/staff",
          permission: "staff",
        },
        {
          key: "communications",
          icon: <MailOutlined />,
          label: "Communications",
          path: "/communications",
          permission: "communications",
        },
        {
          key: "emehmon",
          icon: <GlobalOutlined />,
          label: "E-Mehmon",
          path: "/emehmon",
          permission: "emehmon",
        },
        {
          key: "audit",
          icon: <AuditOutlined />,
          label: "Audit Logs",
          path: "/audit",
          permission: "audit",
        },
        {
          key: "settings",
          icon: <SettingOutlined />,
          label: t("menu.settings"),
          path: "/settings",
          permission: "settings",
        },
      ],
    },
  ];

  // Logic to filter menu items based on role
  // This recursively filters the menu items
  const filterMenuItems = (items: any[]): any[] => {
    return items
      .map((item) => {
        // If item has children, filter them first
        if (item.children) {
          const filteredChildren = filterMenuItems(item.children);
          if (filteredChildren.length === 0) return null; // Remove group if no children allowed
          return { ...item, children: filteredChildren };
        }

        // Sentinel check for dividers or explicit super admin items which don't have 'permission' property
        if (!item.permission) return item;

        // Check permission
        return hasPermission(user?.role, item.permission) ? item : null;
      })
      .filter(Boolean); // Remove nulls
  };

  const filteredItems = filterMenuItems(menuItems as any[]);

  const handleMenuClick = ({ key }: { key: string }) => {
    const item = findMenuItem(menuItems as any[], key);
    if (item && item.path) {
      addTab({
        key: item.key,
        label: item.label,
        path: item.path,
      });
      const stored = useTabStore
        .getState()
        .tabs.find((t) => t.key === item.key);
      navigate(stored?.path ?? item.path);
    }
  };

  const findMenuItem = (items: any[], key: string): any => {
    for (const item of items) {
      if (item.key === key) return item;
      if (item.children) {
        const found = findMenuItem(item.children, key);
        if (found) return found;
      }
    }
    return null;
  };

  const { md } = Grid.useBreakpoint();
  const isMobile = !md;

  const sidebarContent = (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed && !isMobile ? "center" : "space-between",
          padding: collapsed && !isMobile ? "0" : "0 24px",
          borderBottom: "1px solid #f0f0f0",
          flexShrink: 0,
        }}
      >
        {(!collapsed || isMobile) && (
          <Space>
            <div
              style={{
                width: 32,
                height: 32,
                background: "#1677ff",
                borderRadius: 8,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ShopOutlined style={{ color: "#fff", fontSize: 18 }} />
            </div>
            <Title
              level={4}
              style={{ margin: 0, color: "#1677ff", letterSpacing: -0.5 }}
            >
              HMS PRO
            </Title>
          </Space>
        )}
        {!isMobile && (
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleCollapsed}
            style={{
              fontSize: 16,
              width: 40,
              height: 40,
            }}
          />
        )}
      </div>
      {!collapsed && !isMobile && <BranchSwitcher />}
      {isMobile && (
        <div style={{ padding: "0 16px" }}>
          <BranchSwitcher />
        </div>
      )}
      <Menu
        mode="inline"
        selectedKeys={[activeTabKey]}
        onClick={handleMenuClick}
        items={filteredItems}
        inlineCollapsed={isMobile ? false : collapsed}
        style={{
          height: "100%",
          borderRight: 0,
          padding: "16px 8px",
          overflowY: "auto",
        }}
      />
    </div>
  );

  if (isMobile) {
    return (
      <Drawer
        placement="left"
        onClose={toggleCollapsed}
        open={!collapsed} // On mobile: collapsed=true (default) means closed. !collapsed=true means open.
        width={260}
        styles={{ body: { padding: 0 } }}
        closable={false}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  return (
    <Sider
      width={260}
      collapsedWidth={80}
      collapsed={collapsed}
      theme="light"
      style={{
        boxShadow: "2px 0 8px rgba(0,0,0,0.05)",
        zIndex: 100,
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        transition: "all 0.2s",
      }}
    >
      {sidebarContent}
    </Sider>
  );
};
