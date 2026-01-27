import { Typography, Row, Col, Card, Statistic } from "antd";
import {
  CalendarOutlined,
  TeamOutlined,
  ShopOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  UserOutlined,
  SettingOutlined,
  RiseOutlined,
  ProjectOutlined,
  GlobalOutlined,
  ClearOutlined,
  ToolOutlined,
  ContainerOutlined,
  CoffeeOutlined,
  CloudServerOutlined,
} from "@ant-design/icons";
import { ModuleCard } from "./module-card";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/entities/user/model/auth-store";
import { hasPermission } from "@/entities/user/model/roles";

const { Title, Text } = Typography;

export const DashboardPage = () => {
  const { t } = useTranslation("dashboard");
  const { user } = useAuthStore();

  const allModules = [
    {
      id: "bookings",
      title: t("modules.bookings.title"),
      description: t("modules.bookings.description"),
      icon: <CalendarOutlined />,
      color: "#1677ff",
      path: "/bookings",
      permission: "bookings",
    },
    {
      id: "guests",
      title: t("modules.guests.title"),
      description: t("modules.guests.description"),
      icon: <TeamOutlined />,
      color: "#52c41a",
      path: "/guests",
      permission: "guests",
    },
    {
      id: "rooms",
      title: t("modules.rooms.title"),
      description: t("modules.rooms.description"),
      icon: <ShopOutlined />,
      color: "#faad14",
      path: "/rooms",
      permission: "rooms",
    },
    {
      id: "room-types",
      title: t("modules.roomTypes.title"),
      description: t("modules.roomTypes.description"),
      icon: <AppstoreOutlined />,
      color: "#eb2f96",
      path: "/room-types",
      permission: "room-types",
    },
    {
      id: "payments",
      title: t("modules.payments.title"),
      description: t("modules.payments.description"),
      icon: <FileTextOutlined />,
      color: "#722ed1",
      path: "/finance", // Fixed path from /payments to /finance to match sidebar
      permission: "finance",
    },
    {
      id: "staff",
      title: t("modules.staff.title"),
      description: t("modules.staff.description"),
      icon: <UserOutlined />,
      color: "#13c2c2",
      path: "/staff",
      permission: "staff",
    },
    {
      id: "analytics",
      title: t("modules.analytics.title"),
      description: t("modules.analytics.description"),
      icon: <RiseOutlined />,
      color: "#fa541c",
      path: "/analytics",
      permission: "analytics", // Note: Permission might need to be added to roles.ts if not present, assuming 'dashboard' or specific one
    },
    {
      id: "settings",
      title: t("modules.settings.title"),
      description: t("modules.settings.description"),
      icon: <SettingOutlined />,
      color: "#595959",
      path: "/settings",
      permission: "settings",
    },
    // New Modules
    {
      id: "companies",
      title: t("modules.corporate.title") || "Corporate",
      description:
        t("modules.corporate.description") || "Manage corporate clients",
      icon: <GlobalOutlined />,
      color: "#2f54eb",
      path: "/companies",
      permission: "companies",
    },
    {
      id: "housekeeping",
      title: t("modules.housekeeping.title") || "Housekeeping",
      description:
        t("modules.housekeeping.description") || "Room cleaning status",
      icon: <ClearOutlined />,
      color: "#7cb305",
      path: "/housekeeping",
      permission: "housekeeping",
    },
    {
      id: "inventory",
      title: t("modules.inventory.title") || "Inventory",
      description: t("modules.inventory.description") || "Manage supplies",
      icon: <ContainerOutlined />,
      color: "#d48806",
      path: "/inventory",
      permission: "inventory",
    },
    {
      id: "maintenance",
      title: t("modules.maintenance.title") || "Maintenance",
      description:
        t("modules.maintenance.description") || "Maintenance requests",
      icon: <ToolOutlined />,
      color: "#8c8c8c",
      path: "/maintenance",
      permission: "maintenance",
    },
    {
      id: "restaurant",
      title: t("modules.restaurant.title") || "Restaurant",
      description: t("modules.restaurant.description") || "POS and Orders",
      icon: <CoffeeOutlined />,
      color: "#fa541c",
      path: "/restaurant/pos",
      permission: "restaurant-pos", // Using POS as primary entry
    },
  ];

  // Super Admin specific modules
  if (user?.role === "SUPER_ADMIN") {
    allModules.unshift({
      id: "tenants",
      title: "Tenants",
      description: "Manage system tenants",
      icon: <CloudServerOutlined />,
      color: "#f5222d",
      path: "/admin/tenants",
      permission: "super_admin_only", // Special case, often covered by SUPER_ADMIN check
    });
  }

  const modules = allModules.filter((module) => {
    if (module.permission === "super_admin_only")
      return user?.role === "SUPER_ADMIN";
    return hasPermission(user?.role, module.permission);
  });

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: "0 0 8px 0", fontWeight: 700 }}>
          {t("title")}
        </Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          {t("subtitle")}
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        {modules.map((module) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={module.id}>
            <ModuleCard {...module} />
          </Col>
        ))}
      </Row>

      <div style={{ marginTop: 48, marginBottom: 24 }}>
        <Title level={3} style={{ fontWeight: 600 }}>
          {t("quickStats")}
        </Title>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <Statistic title={t("stats.totalRooms")} value={128} />
              </div>
              <div
                style={{
                  width: 40,
                  height: 40,
                  background: "#f0faff",
                  borderRadius: 8,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ShopOutlined style={{ color: "#1677ff" }} />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <Statistic
                  title={t("stats.occupancyRate")}
                  value={74}
                  suffix="%"
                />
              </div>
              <div
                style={{
                  width: 40,
                  height: 40,
                  background: "#f6ffed",
                  borderRadius: 8,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <RiseOutlined style={{ color: "#52c41a" }} />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <Statistic title={t("stats.expectedArrivals")} value={18} />
              </div>
              <div
                style={{
                  width: 40,
                  height: 40,
                  background: "#fff7e6",
                  borderRadius: 8,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ProjectOutlined style={{ color: "#faad14" }} />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <Statistic
                  title={t("stats.revenueToday")}
                  value={4200}
                  prefix="$"
                  precision={2}
                />
              </div>
              <div
                style={{
                  width: 40,
                  height: 40,
                  background: "#f9f0ff",
                  borderRadius: 8,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <FileTextOutlined style={{ color: "#722ed1" }} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
