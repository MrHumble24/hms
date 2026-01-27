import { useState } from "react";
import {
  Table,
  Button,
  Tag,
  Space,
  Typography,
  Card,
  Grid,
  List,
  Result,
  Modal,
  Descriptions,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  FileTextOutlined,
  ReloadOutlined,
  EyeOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingApi } from "@/entities/booking/api/booking-api";
import {
  emehmonApi,
  type EmehmonLog,
  type EmehmonStatus,
} from "@/entities/emehmon/api/emehmon-api";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const statusConfig: Record<
  EmehmonStatus,
  { color: string; icon: React.ReactNode }
> = {
  PENDING: { color: "default", icon: <SyncOutlined spin /> },
  SUBMITTED: { color: "processing", icon: <SyncOutlined spin /> },
  SUCCESS: { color: "success", icon: <CheckCircleOutlined /> },
  FAILED: { color: "error", icon: <CloseCircleOutlined /> },
  RETRY: { color: "warning", icon: <ReloadOutlined /> },
};

export const EmehmonPage = () => {
  const queryClient = useQueryClient();
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  );
  const [detailsModal, setDetailsModal] = useState<EmehmonLog | null>(null);
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  // Get checked-in bookings
  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => bookingApi.getAll().then((res) => res.data),
  });

  const checkedInBookings = (bookings as any[]).filter(
    (b: any) => b.status === "CHECKED_IN",
  );

  // Get emehmon logs for selected booking
  const { data: logs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ["emehmon-logs", selectedBookingId],
    queryFn: () =>
      selectedBookingId ? emehmonApi.getLogsByBooking(selectedBookingId) : [],
    enabled: !!selectedBookingId,
  });

  const registerMutation = useMutation({
    mutationFn: (bookingId: string) => emehmonApi.registerGuest(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emehmon-logs"] });
      Modal.success({ title: "Registration submitted to E-Mehmon" });
    },
    onError: (error: any) => {
      Modal.error({
        title: "Registration Failed",
        content:
          error.response?.data?.message || "Failed to submit registration",
      });
    },
  });

  const handleRegister = (bookingId: string) => {
    Modal.confirm({
      title: "Register Guest with E-Mehmon?",
      content:
        "This will submit guest information to the E-Mehmon government system.",
      okText: "Register",
      onOk: () => registerMutation.mutate(bookingId),
    });
  };

  const columns = [
    {
      title: "Guest",
      key: "guest",
      render: (_: any, record: any) => (
        <div>
          <Text strong>
            {record.primaryGuest?.firstName} {record.primaryGuest?.lastName}
          </Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.primaryGuest?.passportSeries}
              {record.primaryGuest?.passportNumber}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Room",
      key: "room",
      render: (_: any, record: any) => (
        <Tag>{record.roomStays?.[0]?.room?.number || "Unassigned"}</Tag>
      ),
    },
    {
      title: "Stay",
      key: "dates",
      render: (_: any, record: any) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {dayjs(record.checkIn).format("DD/MM")} -{" "}
          {dayjs(record.checkOut).format("DD/MM")}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="primary"
            icon={<GlobalOutlined />}
            size="small"
            onClick={() => handleRegister(record.id)}
            loading={registerMutation.isPending}
          >
            Register
          </Button>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => setSelectedBookingId(record.id)}
          >
            Logs
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: isMobile ? 16 : 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
          <GlobalOutlined /> E-Mehmon Integration
        </Title>
        <Text type="secondary">
          Register guests with the Uzbekistan E-Mehmon system
        </Text>
      </div>

      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card title="Checked-In Guests Pending Registration">
          {checkedInBookings.length === 0 ? (
            <Result
              icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              title="No pending registrations"
              subTitle="All checked-in guests have been registered"
            />
          ) : (
            <Table
              dataSource={checkedInBookings}
              columns={columns}
              rowKey="id"
              loading={loadingBookings}
              pagination={{ pageSize: 10 }}
              size="small"
            />
          )}
        </Card>

        {selectedBookingId && (
          <Card
            title="Registration History"
            extra={
              <Button onClick={() => setSelectedBookingId(null)} type="text">
                Close
              </Button>
            }
          >
            {logs.length === 0 ? (
              <Text type="secondary">No registration attempts yet</Text>
            ) : (
              <List
                dataSource={logs}
                loading={loadingLogs}
                renderItem={(log: EmehmonLog) => (
                  <List.Item
                    actions={[
                      log.regSlipUrl && (
                        <Button
                          icon={<FileTextOutlined />}
                          size="small"
                          href={log.regSlipUrl}
                          target="_blank"
                        >
                          Slip
                        </Button>
                      ),
                      <Button
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => setDetailsModal(log)}
                      >
                        Details
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Tag
                          color={statusConfig[log.status]?.color}
                          icon={statusConfig[log.status]?.icon}
                        >
                          {log.status}
                        </Tag>
                      }
                      title={`Attempt ${log.retryCount + 1}`}
                      description={dayjs(log.createdAt).format(
                        "YYYY-MM-DD HH:mm:ss",
                      )}
                    />
                    {log.regSlipNumber && (
                      <Text type="success">Reg# {log.regSlipNumber}</Text>
                    )}
                    {log.errorMessage && (
                      <Text type="danger">{log.errorMessage}</Text>
                    )}
                  </List.Item>
                )}
              />
            )}
          </Card>
        )}
      </Space>

      <Modal
        title="Registration Details"
        open={!!detailsModal}
        onCancel={() => setDetailsModal(null)}
        footer={null}
        width={600}
      >
        {detailsModal && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Status">
              <Tag color={statusConfig[detailsModal.status]?.color}>
                {detailsModal.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Registration #">
              {detailsModal.regSlipNumber || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {dayjs(detailsModal.createdAt).format("YYYY-MM-DD HH:mm:ss")}
            </Descriptions.Item>
            {detailsModal.registeredAt && (
              <Descriptions.Item label="Registered">
                {dayjs(detailsModal.registeredAt).format("YYYY-MM-DD HH:mm:ss")}
              </Descriptions.Item>
            )}
            {detailsModal.errorMessage && (
              <Descriptions.Item label="Error">
                <Text type="danger">{detailsModal.errorMessage}</Text>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Request">
              <pre style={{ fontSize: 11, maxHeight: 150, overflow: "auto" }}>
                {JSON.stringify(detailsModal.requestJson, null, 2)}
              </pre>
            </Descriptions.Item>
            {detailsModal.responseJson && (
              <Descriptions.Item label="Response">
                <pre style={{ fontSize: 11, maxHeight: 150, overflow: "auto" }}>
                  {JSON.stringify(detailsModal.responseJson, null, 2)}
                </pre>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};
