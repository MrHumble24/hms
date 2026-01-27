import { useState } from "react";
import {
  Table,
  Tag,
  Space,
  Typography,
  Card,
  Input,
  Select,
  Grid,
  List,
  Tooltip,
  Avatar,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  PlusCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  LoginOutlined,
  LogoutOutlined,
  ExportOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import {
  auditApi,
  type AuditLog,
  type AuditAction,
} from "@/entities/audit/api/audit-api";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const actionIcons: Record<AuditAction, React.ReactNode> = {
  CREATE: <PlusCircleOutlined style={{ color: "#52c41a" }} />,
  UPDATE: <EditOutlined style={{ color: "#1890ff" }} />,
  DELETE: <DeleteOutlined style={{ color: "#ff4d4f" }} />,
  LOGIN: <LoginOutlined style={{ color: "#722ed1" }} />,
  LOGOUT: <LogoutOutlined style={{ color: "#8c8c8c" }} />,
  EXPORT: <ExportOutlined style={{ color: "#faad14" }} />,
  VIEW: <EyeOutlined style={{ color: "#13c2c2" }} />,
};

const actionColors: Record<AuditAction, string> = {
  CREATE: "success",
  UPDATE: "processing",
  DELETE: "error",
  LOGIN: "purple",
  LOGOUT: "default",
  EXPORT: "warning",
  VIEW: "cyan",
};

export const AuditPage = () => {
  const [actionFilter, setActionFilter] = useState<AuditAction | "ALL">("ALL");
  const [entityFilter, setEntityFilter] = useState<string>("");
  const [searchText, setSearchText] = useState("");
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", actionFilter, entityFilter],
    queryFn: () =>
      auditApi.getAll({
        action: actionFilter !== "ALL" ? actionFilter : undefined,
        entityType: entityFilter || undefined,
        take: 100,
      }),
  });

  const logs = data?.logs || [];

  const filteredLogs = logs.filter((log) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      log.user?.fullName?.toLowerCase().includes(search) ||
      log.entityType.toLowerCase().includes(search) ||
      log.entityId.toLowerCase().includes(search)
    );
  });

  const columns = [
    {
      title: "User",
      key: "user",
      render: (_: any, record: AuditLog) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <Text>{record.user?.fullName || "System"}</Text>
        </Space>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (action: AuditAction) => (
        <Tag color={actionColors[action]} icon={actionIcons[action]}>
          {action}
        </Tag>
      ),
    },
    {
      title: "Entity",
      key: "entity",
      render: (_: any, record: AuditLog) => (
        <div>
          <Text strong>{record.entityType}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 11 }} copyable>
              {record.entityId.substring(0, 8)}...
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Time",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => (
        <Tooltip title={dayjs(date).format("YYYY-MM-DD HH:mm:ss")}>
          <Text type="secondary">{dayjs(date).fromNow()}</Text>
        </Tooltip>
      ),
    },
    {
      title: "IP",
      dataIndex: "ipAddress",
      key: "ipAddress",
      render: (ip: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {ip || "-"}
        </Text>
      ),
    },
  ];

  const entityTypes = [...new Set(logs.map((l) => l.entityType))];

  return (
    <div style={{ padding: isMobile ? 16 : 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
          Audit Logs
        </Title>
        <Text type="secondary">
          Track all system activities and user actions
        </Text>
      </div>

      <Card>
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <Input
            placeholder="Search by user or entity..."
            prefix={<SearchOutlined />}
            style={{ width: isMobile ? "100%" : 250 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Select
            style={{ width: isMobile ? "100%" : 150 }}
            value={actionFilter}
            onChange={setActionFilter}
            options={[
              { label: "All Actions", value: "ALL" },
              { label: "Create", value: "CREATE" },
              { label: "Update", value: "UPDATE" },
              { label: "Delete", value: "DELETE" },
              { label: "Login", value: "LOGIN" },
              { label: "Logout", value: "LOGOUT" },
              { label: "Export", value: "EXPORT" },
              { label: "View", value: "VIEW" },
            ]}
          />
          <Select
            style={{ width: isMobile ? "100%" : 150 }}
            value={entityFilter}
            onChange={setEntityFilter}
            placeholder="Entity Type"
            allowClear
            options={[
              { label: "All Entities", value: "" },
              ...entityTypes.map((e) => ({ label: e, value: e })),
            ]}
          />
        </div>

        {!isMobile ? (
          <Table
            dataSource={filteredLogs}
            columns={columns}
            rowKey="id"
            loading={isLoading}
            pagination={{ pageSize: 20, showTotal: (t) => `${t} logs` }}
            size="small"
          />
        ) : (
          <List
            dataSource={filteredLogs}
            loading={isLoading}
            pagination={{ pageSize: 15, align: "center" }}
            renderItem={(log: AuditLog) => (
              <List.Item>
                <Card style={{ width: "100%" }} bodyStyle={{ padding: 12 }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <Avatar icon={<UserOutlined />} />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text strong>{log.user?.fullName || "System"}</Text>
                        <Tag
                          color={actionColors[log.action]}
                          style={{ margin: 0 }}
                        >
                          {log.action}
                        </Tag>
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {log.entityType} • {log.entityId.substring(0, 8)}...
                      </Text>
                      <div>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {dayjs(log.createdAt).format("MMM DD, HH:mm")}
                        </Text>
                      </div>
                    </div>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};
