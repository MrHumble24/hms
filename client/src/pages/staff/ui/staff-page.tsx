import { useState } from "react";
import {
  Table,
  Button,
  Tag,
  Space,
  Typography,
  Card,
  Input,
  Select,
  Dropdown,
  type MenuProps,
  Modal,
  Badge,
  Tooltip,
  Grid,
  List,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EllipsisOutlined,
  EditOutlined,
  StopOutlined,
  CheckCircleOutlined,
  SafetyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { staffApi, Role, type Staff } from "@/entities/staff/api/staff-api";
import { StaffDrawer } from "@/widgets/staff/ui/staff-drawer";
import { CreateStaffDrawer } from "@/widgets/staff/ui/create-staff-drawer";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/entities/user/model/auth-store";
import { usePaginationSearchParams } from "@/shared/hooks/use-pagination-search-params";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

export const StaffPage = () => {
  const { t } = useTranslation(["staff", "common"]);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const { params, handleSearch, setParam, pagination, apiParams } =
    usePaginationSearchParams();

  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isManager = user?.role === "MANAGER";
  const canManageStaff = isSuperAdmin || isManager;

  const { data, isLoading } = useQuery({
    queryKey: ["staff", apiParams],
    queryFn: () => staffApi.getAllStaff(apiParams),
    enabled: canManageStaff,
  });

  const staff = data?.data || [];
  const total = data?.total || 0;

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => staffApi.updateStaff(id, { isActive: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      Modal.success({
        title: t("staff:deactivated", "Staff Deactivated"),
        content: t(
          "staff:deactivatedMessage",
          "Staff member has been deactivated successfully",
        ),
      });
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => staffApi.updateStaff(id, { isActive: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      Modal.success({
        title: t("staff:activated", "Staff Activated"),
        content: t(
          "staff:activatedMessage",
          "Staff member has been activated successfully",
        ),
      });
    },
  });

  const handleDeactivate = (record: Staff) => {
    Modal.confirm({
      title: t("staff:confirmDeactivate", "Deactivate Staff Member?"),
      content: (
        <div>
          <p>
            {t(
              "staff:deactivateWarning",
              "This will deactivate the staff member. They will no longer be able to access the system.",
            )}
          </p>
          <p>
            <Text strong>{record.fullName}</Text> ({record.email})
          </p>
        </div>
      ),
      okText: t("common:confirm", "Confirm"),
      okType: "danger",
      onOk: () => deactivateMutation.mutate(record.id),
    });
  };

  const handleActivate = (record: Staff) => {
    Modal.confirm({
      title: t("staff:confirmActivate", "Activate Staff Member?"),
      content: (
        <div>
          <p>
            <Text strong>{record.fullName}</Text> ({record.email})
          </p>
        </div>
      ),
      okText: t("common:confirm", "Confirm"),
      onOk: () => activateMutation.mutate(record.id),
    });
  };

  const handleEdit = (record: Staff) => {
    setSelectedStaff(record);
    setIsDrawerOpen(true);
  };

  // Client-side filtering removed in favor of server-side
  const filteredStaff = staff;

  const getRoleColor = (role: string) => {
    switch (role) {
      case Role.SUPER_ADMIN:
        return "red";
      case Role.MANAGER:
        return "blue";
      case Role.ACCOUNTANT:
        return "green";
      case Role.RECEPTIONIST:
        return "purple";
      case Role.HOUSEKEEPER:
        return "orange";
      case Role.MAINTENANCE:
        return "cyan";
      default:
        return "default";
    }
  };

  const columns = [
    {
      title: t("staff:name", "Name"),
      key: "name",
      render: (_: any, record: Staff) => (
        <Space>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: getRoleColor(record.role),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: "bold",
              fontSize: 16,
            }}
          >
            {record.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div>
              <Text strong style={{ opacity: record.isActive ? 1 : 0.5 }}>
                {record.fullName}
              </Text>
              {!record.isActive && (
                <Tag color="default" style={{ marginLeft: 8, fontSize: 11 }}>
                  {t("common:inactive", "Inactive")}
                </Tag>
              )}
            </div>
            <Text
              type="secondary"
              style={{ fontSize: 12, opacity: record.isActive ? 1 : 0.5 }}
            >
              {record.email}
            </Text>
          </div>
        </Space>
      ),
      sorter: (a: Staff, b: Staff) => a.fullName.localeCompare(b.fullName),
    },
    {
      title: t("staff:role", "Role"),
      dataIndex: "role",
      key: "role",
      render: (role: Role) => (
        <Tag color={getRoleColor(role)} icon={<SafetyOutlined />}>
          {t(`staff:roles.${role.toLowerCase()}`, role.replace("_", " "))}
        </Tag>
      ),
      filters: Object.values(Role).map((role) => ({
        text: t(`staff:roles.${role.toLowerCase()}`, role.replace("_", " ")),
        value: role,
      })),
      onFilter: (value: any, record: Staff) => record.role === value,
    },
    {
      title: t("staff:status", "Status"),
      key: "status",
      render: (_: any, record: Staff) => (
        <Badge
          status={record.isActive ? "success" : "default"}
          text={
            record.isActive
              ? t("common:active", "Active")
              : t("common:inactive", "Inactive")
          }
        />
      ),
      filters: [
        { text: t("common:active", "Active"), value: true },
        { text: t("common:inactive", "Inactive"), value: false },
      ],
      onFilter: (value: any, record: Staff) => record.isActive === value,
    },
    {
      title: t("staff:joinedDate", "Joined"),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => (
        <Tooltip title={dayjs(date).format("YYYY-MM-DD HH:mm")}>
          <Text type="secondary">{dayjs(date).fromNow()}</Text>
        </Tooltip>
      ),
      sorter: (a: Staff, b: Staff) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
  ];

  const renderActions = (record: Staff) => {
    const items: MenuProps["items"] = [
      {
        key: "view",
        icon: <UserOutlined />,
        label: t("common:view", "View Details"),
        onClick: () => handleEdit(record),
      },
    ];

    if (canManageStaff) {
      items.push({
        key: "edit",
        icon: <EditOutlined />,
        label: t("common:edit", "Edit"),
        onClick: () => handleEdit(record),
      });
    }

    if (isSuperAdmin) {
      if (record.isActive) {
        items.push({
          key: "deactivate",
          icon: <StopOutlined />,
          label: t("staff:deactivate", "Deactivate"),
          danger: true,
          onClick: () => handleDeactivate(record),
        });
      } else {
        items.push({
          key: "activate",
          icon: <CheckCircleOutlined />,
          label: t("staff:activate", "Activate"),
          onClick: () => handleActivate(record),
        });
      }
    }

    return (
      <Dropdown menu={{ items }} trigger={["click"]}>
        <Button type="text" icon={<EllipsisOutlined />} />
      </Dropdown>
    );
  };

  const updatedColumns = [
    ...columns.slice(0, -1),
    {
      title: t("common:actions", "Actions"),
      key: "actions",
      render: (_: any, record: Staff) => renderActions(record),
    },
  ];

  if (!canManageStaff) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Title level={3}>{t("staff:accessDenied", "Access Denied")}</Title>
        <Text type="secondary">
          {t(
            "staff:accessDeniedMessage",
            "You don't have permission to view staff management",
          )}
        </Text>
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? "16px" : "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          gap: isMobile ? 16 : 0,
          marginBottom: 24,
        }}
      >
        <div>
          <Title
            level={isMobile ? 3 : 2}
            style={{ margin: 0, fontSize: isMobile ? 20 : 24 }}
          >
            {t("staff:title", "Staff Management")}
          </Title>
          <Text type="secondary">
            {t("staff:subtitle", "Manage your team members and their roles")}
          </Text>
        </div>
        <Space wrap style={{ width: isMobile ? "100%" : "auto" }}>
          {!isMobile && (
            <Badge count={filteredStaff.length} showZero>
              <Button icon={<UserOutlined />}>
                {t("staff:totalStaff", "Total Staff")}
              </Button>
            </Badge>
          )}
          {canManageStaff && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => setIsCreateDrawerOpen(true)}
              block={isMobile}
            >
              {t("staff:addStaff", "Add Staff")}
            </Button>
          )}
        </Space>
      </div>

      <Card>
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            gap: 16,
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <Input
            placeholder={t(
              "staff:searchPlaceholder",
              "Search by name, email, or role...",
            )}
            prefix={<SearchOutlined />}
            style={{ width: isMobile ? "100%" : 300 }}
            value={params.search}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
            size={isMobile ? "large" : "middle"}
          />
          <Select
            style={{ width: isMobile ? "100%" : 200 }}
            placeholder={t("staff:filterByRole", "Filter by role")}
            value={params.role || "ALL"}
            onChange={(v) => setParam("role", v)}
            size={isMobile ? "large" : "middle"}
            options={[
              { label: t("common:all", "All Roles"), value: "ALL" },
              ...Object.values(Role).map((role) => ({
                label: t(
                  `staff:roles.${role.toLowerCase()}`,
                  role.replace("_", " "),
                ),
                value: role,
              })),
            ]}
          />
          <Select
            style={{ width: isMobile ? "100%" : 150 }}
            placeholder={t("staff:filterByStatus", "Filter by status")}
            value={params.status || "ALL"}
            onChange={(v) => setParam("status", v)}
            size={isMobile ? "large" : "middle"}
            options={[
              { label: t("common:all", "All"), value: "ALL" },
              { label: t("common:active", "Active"), value: "ACTIVE" },
              { label: t("common:inactive", "Inactive"), value: "INACTIVE" },
            ]}
          />
        </div>

        {!isMobile ? (
          <Table
            dataSource={filteredStaff}
            columns={updatedColumns}
            rowKey="id"
            loading={isLoading}
            pagination={{
              ...pagination,
              total,
              showSizeChanger: true,
              showTotal: (totalValue) =>
                t("staff:totalItems", `Total ${totalValue} staff members`, {
                  total: totalValue,
                }),
            }}
            rowClassName={(record) => (!record.isActive ? "inactive-row" : "")}
          />
        ) : (
          <List
            dataSource={filteredStaff}
            loading={isLoading}
            pagination={{ ...pagination, total, align: "center" }}
            renderItem={(staff: Staff) => (
              <List.Item className={!staff.isActive ? "inactive-row" : ""}>
                <Card
                  style={{ width: "100%", margin: "0 8px" }}
                  bodyStyle={{ padding: 16 }}
                >
                  <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: getRoleColor(staff.role),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: 16,
                        flexShrink: 0,
                      }}
                    >
                      {staff.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <Text strong style={{ fontSize: 16 }}>
                          {staff.fullName}
                        </Text>
                        <Tag
                          color={getRoleColor(staff.role)}
                          style={{ margin: 0, fontSize: 10 }}
                        >
                          {staff.role.replace("_", " ")}
                        </Tag>
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {staff.email}
                      </Text>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Space direction="vertical" size={0}>
                      <Badge
                        status={staff.isActive ? "success" : "default"}
                        text={
                          staff.isActive
                            ? t("common:active")
                            : t("common:inactive")
                        }
                        style={{ fontSize: 12 }}
                      />
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Joined {dayjs(staff.createdAt).fromNow()}
                      </Text>
                    </Space>
                    {renderActions(staff)}
                  </div>
                </Card>
              </List.Item>
            )}
          />
        )}
      </Card>

      <StaffDrawer
        open={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedStaff(null);
        }}
        staff={selectedStaff}
      />

      <CreateStaffDrawer
        open={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
      />

      <style>{`
        .inactive-row {
          opacity: 0.6;
          background: #fafafa;
        }
        .inactive-row:hover {
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
};
