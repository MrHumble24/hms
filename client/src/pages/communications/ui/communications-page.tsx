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
} from "antd";
import {
  SearchOutlined,
  MailOutlined,
  MessageOutlined,
  WhatsAppOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import {
  communicationsApi,
  type Communication,
  type CommunicationType,
  type CommunicationStatus,
} from "@/entities/communications/api/communications-api";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const channelIcons: Record<string, React.ReactNode> = {
  EMAIL: <MailOutlined />,
  SMS: <MessageOutlined />,
  WHATSAPP: <WhatsAppOutlined />,
  TELEGRAM: <SendOutlined />,
};

const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  PENDING: { color: "default", icon: <ClockCircleOutlined /> },
  SENT: { color: "processing", icon: <SendOutlined /> },
  DELIVERED: { color: "success", icon: <CheckCircleOutlined /> },
  OPENED: { color: "green", icon: <CheckCircleOutlined /> },
  FAILED: { color: "error", icon: <ExclamationCircleOutlined /> },
  BOUNCED: { color: "warning", icon: <ExclamationCircleOutlined /> },
};

export const CommunicationsPage = () => {
  const [typeFilter, setTypeFilter] = useState<CommunicationType | "ALL">(
    "ALL",
  );
  const [statusFilter, setStatusFilter] = useState<CommunicationStatus | "ALL">(
    "ALL",
  );
  const [searchText, setSearchText] = useState("");
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  const { data: communications = [], isLoading } = useQuery({
    queryKey: ["communications", typeFilter, statusFilter],
    queryFn: () =>
      communicationsApi.getAll({
        type: typeFilter !== "ALL" ? typeFilter : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      }),
  });

  const filteredComms = communications.filter((c) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    const guestName =
      `${c.guest?.firstName || ""} ${c.guest?.lastName || ""}`.toLowerCase();
    return (
      guestName.includes(search) ||
      c.content.toLowerCase().includes(search) ||
      c.subject?.toLowerCase().includes(search)
    );
  });

  const columns = [
    {
      title: "Guest",
      key: "guest",
      render: (_: any, record: Communication) => (
        <div>
          <Text strong>
            {record.guest?.firstName} {record.guest?.lastName}
          </Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.guest?.email || record.guest?.phone}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => <Tag>{type.replace(/_/g, " ")}</Tag>,
    },
    {
      title: "Channel",
      dataIndex: "channel",
      key: "channel",
      render: (channel: string) => (
        <Space>
          {channelIcons[channel]}
          <span>{channel}</span>
        </Space>
      ),
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      ellipsis: true,
      render: (subject: string, record: Communication) => (
        <Tooltip title={record.content}>
          <Text>{subject || record.content.substring(0, 50)}...</Text>
        </Tooltip>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: CommunicationStatus) => (
        <Tag
          color={statusConfig[status]?.color}
          icon={statusConfig[status]?.icon}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Sent",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => (
        <Tooltip title={dayjs(date).format("YYYY-MM-DD HH:mm")}>
          <Text type="secondary">{dayjs(date).fromNow()}</Text>
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ padding: isMobile ? 16 : 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
          Guest Communications
        </Title>
        <Text type="secondary">Track all guest notifications and messages</Text>
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
            placeholder="Search by guest or content..."
            prefix={<SearchOutlined />}
            style={{ width: isMobile ? "100%" : 250 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Select
            style={{ width: isMobile ? "100%" : 180 }}
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { label: "All Types", value: "ALL" },
              { label: "Booking Confirmation", value: "BOOKING_CONFIRMATION" },
              { label: "Pre-Arrival", value: "PRE_ARRIVAL" },
              { label: "Welcome", value: "WELCOME" },
              { label: "Checkout Reminder", value: "CHECKOUT_REMINDER" },
              { label: "Post-Stay Survey", value: "POST_STAY_SURVEY" },
              { label: "Marketing", value: "MARKETING" },
            ]}
          />
          <Select
            style={{ width: isMobile ? "100%" : 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: "All Status", value: "ALL" },
              { label: "Pending", value: "PENDING" },
              { label: "Sent", value: "SENT" },
              { label: "Delivered", value: "DELIVERED" },
              { label: "Opened", value: "OPENED" },
              { label: "Failed", value: "FAILED" },
            ]}
          />
        </div>

        {!isMobile ? (
          <Table
            dataSource={filteredComms}
            columns={columns}
            rowKey="id"
            loading={isLoading}
            pagination={{ pageSize: 10 }}
          />
        ) : (
          <List
            dataSource={filteredComms}
            loading={isLoading}
            pagination={{ pageSize: 10, align: "center" }}
            renderItem={(comm: Communication) => (
              <List.Item>
                <Card style={{ width: "100%" }} bodyStyle={{ padding: 12 }}>
                  <div style={{ marginBottom: 8 }}>
                    <Space>
                      {channelIcons[comm.channel]}
                      <Text strong>
                        {comm.guest?.firstName} {comm.guest?.lastName}
                      </Text>
                      <Tag color={statusConfig[comm.status]?.color}>
                        {comm.status}
                      </Tag>
                    </Space>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {comm.type.replace(/_/g, " ")}
                  </Text>
                  <div style={{ marginTop: 4 }}>
                    <Text ellipsis style={{ fontSize: 13 }}>
                      {comm.subject || comm.content.substring(0, 60)}...
                    </Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {dayjs(comm.createdAt).fromNow()}
                  </Text>
                </Card>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};
