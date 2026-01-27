import { useState } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Typography,
  Space,
  Select,
  Popconfirm,
  Grid,
  List,
  Input,
} from "antd";
import { PlusOutlined, FilterOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  maintenanceApi,
  TicketStatus,
  type MaintenanceTicket,
} from "@/entities/maintenance/api/maintenance-api";
import { CreateTicketModal } from "@/widgets/maintenance/ui/create-ticket-modal";
import { usePaginationSearchParams } from "@/shared/hooks/use-pagination-search-params";
import dayjs from "dayjs";

const { Title } = Typography;

export const MaintenancePage = () => {
  const { params, handleSearch, handleTableChange, pagination, apiParams } =
    usePaginationSearchParams();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const queryClient = useQueryClient();
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  const { data, isLoading } = useQuery({
    queryKey: ["maintenance-tickets", apiParams],
    queryFn: () => maintenanceApi.getAll(apiParams),
  });

  const tickets = data?.data || [];
  const total = data?.total || 0;

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TicketStatus }) =>
      maintenanceApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-tickets"] });
    },
  });

  const columns = [
    {
      title: "Room",
      dataIndex: ["room", "number"],
      key: "room",
      render: (text: string, record: MaintenanceTicket) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{text}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {record.room?.type?.name}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: TicketStatus) => {
        const colors: Record<string, string> = {
          OPEN: "red",
          IN_PROGRESS: "orange",
          RESOLVED: "green",
          WONT_FIX: "default",
        };
        return <Tag color={colors[status]}>{status.replace("_", " ")}</Tag>;
      },
    },
    {
      title: "Reported",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => dayjs(date).format("MMM D, HH:mm"),
    },
  ];

  const renderActions = (record: MaintenanceTicket) => (
    <Space wrap>
      {record.status === TicketStatus.OPEN && (
        <Button
          size="small"
          onClick={() =>
            updateStatusMutation.mutate({
              id: record.id,
              status: TicketStatus.IN_PROGRESS,
            })
          }
        >
          Start Work
        </Button>
      )}
      {record.status === TicketStatus.IN_PROGRESS && (
        <Popconfirm
          title="Resolve this issue?"
          description="This will mark the room as DIRTY for housekeeping."
          onConfirm={() =>
            updateStatusMutation.mutate({
              id: record.id,
              status: TicketStatus.RESOLVED,
            })
          }
        >
          <Button type="primary" size="small">
            Resolve
          </Button>
        </Popconfirm>
      )}
    </Space>
  );

  const updatedColumns = [
    ...columns.slice(0, -1),
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: MaintenanceTicket) => renderActions(record),
    },
  ];

  const filteredTickets = tickets;

  return (
    <div style={{ padding: isMobile ? "20px" : "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          gap: isMobile ? 12 : 0,
          marginBottom: 24,
        }}
      >
        <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
          Maintenance
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
          block={isMobile}
          size={isMobile ? "middle" : "large"}
        >
          Report Issue
        </Button>
      </div>

      <Card bodyStyle={{ padding: isMobile ? 16 : 24 }}>
        <div
          style={{
            marginBottom: 24,
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <Input.Search
            placeholder="Search by room, title or description..."
            onSearch={handleSearch}
            defaultValue={params.search}
            allowClear
            style={{ maxWidth: 400 }}
            size="large"
          />
          <Space>
            <FilterOutlined />
            <Select
              value={params.status || "ALL"}
              onChange={(val) =>
                handleTableChange(pagination, { status: val }, {}, {})
              }
              style={{ width: isMobile ? "100%" : 150 }}
              size="large"
              options={[
                { label: "All Statuses", value: "ALL" },
                { label: "Open", value: TicketStatus.OPEN },
                { label: "In Progress", value: TicketStatus.IN_PROGRESS },
                { label: "Resolved", value: TicketStatus.RESOLVED },
              ]}
            />
          </Space>
        </div>

        {!isMobile ? (
          <Table
            dataSource={filteredTickets}
            columns={updatedColumns}
            rowKey="id"
            loading={isLoading}
            onChange={handleTableChange}
            pagination={{ ...pagination, total }}
          />
        ) : (
          <List
            dataSource={filteredTickets}
            loading={isLoading}
            pagination={{ ...pagination, total, align: "center" }}
            renderItem={(ticket: MaintenanceTicket) => {
              const colors: Record<string, string> = {
                OPEN: "red",
                IN_PROGRESS: "orange",
                RESOLVED: "green",
                WONT_FIX: "default",
              };
              return (
                <List.Item>
                  <Card
                    style={{ width: "100%", margin: "0 4px" }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <Typography.Text strong style={{ fontSize: 16 }}>
                        Room {ticket.room?.number}
                      </Typography.Text>
                      <Tag color={colors[ticket.status]}>
                        {ticket.status.replace("_", " ")}
                      </Tag>
                    </div>
                    <div style={{ marginBottom: 12 }}>{ticket.description}</div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                        fontSize: 12,
                        color: "#888",
                      }}
                    >
                      <span>{ticket.room?.type?.name}</span>
                      <span>
                        {dayjs(ticket.createdAt).format("MMM D, HH:mm")}
                      </span>
                    </div>
                    <div
                      style={{ borderTop: "1px solid #f0f0f0", paddingTop: 12 }}
                    >
                      {renderActions(ticket)}
                    </div>
                  </Card>
                </List.Item>
              );
            }}
          />
        )}
      </Card>

      <CreateTicketModal
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
      />
    </div>
  );
};
