import { useState } from "react";
import {
  Table,
  Tag,
  Space,
  Button,
  Typography,
  Card,
  Input,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  Select,
  message,
  Spin,
  Grid,
  List,
} from "antd";
import {
  SearchOutlined,
  ArrowRightOutlined,
  FileTextOutlined,
  DollarOutlined,
  LoadingOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  financeApi,
  type Folio,
  type CreateFolioDto,
} from "@/entities/finance/api/finance-api";
import { bookingApi } from "@/entities/booking/api/booking-api";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePaginationSearchParams } from "@/shared/hooks/use-pagination-search-params";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export const FolioManagerPage = () => {
  const { t } = useTranslation(["finance", "common"]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;
  const { params, handleSearch, handleTableChange, pagination, apiParams } =
    usePaginationSearchParams();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [form] = Form.useForm();

  // Fetch all bookings only for the creation modal
  const { data: bookingsData } = useQuery({
    queryKey: ["bookings", "checked-in"],
    queryFn: () => bookingApi.getAll({ status: "CHECKED_IN", take: 100 }),
  });
  const bookings = bookingsData?.data || [];

  // Fetch Folios with pagination
  const { data: foliosData, isLoading: foliosLoading } = useQuery({
    queryKey: ["folios", apiParams],
    queryFn: () => financeApi.getAllFolios(apiParams),
  });

  // Fetch Stats
  const { data: stats } = useQuery({
    queryKey: ["folios", "stats"],
    queryFn: financeApi.getFolioStats,
  });

  const allFolios = foliosData?.data || [];
  const total = foliosData?.total || 0;

  const createFolioMutation = useMutation({
    mutationFn: (data: CreateFolioDto) => financeApi.createFolio(data),
    onSuccess: (folio) => {
      message.success(t("finance:folioCreated", "Folio created successfully"));
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setIsCreateModalOpen(false);
      form.resetFields();
      navigate(`/finance/folios/${folio.id}`);
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message ||
          t("common:error", "Failed to create folio"),
      );
    },
  });

  const handleCreateFolio = (values: CreateFolioDto) => {
    createFolioMutation.mutate(values);
  };

  // Client-side filtering removed
  const filteredFolios = allFolios;

  // Statistics from server

  const columns = [
    {
      title: "Folio ID",
      dataIndex: "id",
      key: "id",
      render: (id: string) => <Text code>{id.slice(0, 8)}</Text>,
    },
    {
      title: "Guest / Room",
      key: "guest",
      render: (record: Folio) => (
        <Space direction="vertical" size={0}>
          <Text strong>
            {record.booking?.primaryGuest?.lastName}{" "}
            {record.booking?.primaryGuest?.firstName}
          </Text>
          <Tag>{record.booking?.roomStays?.[0]?.room?.number || "N/A"}</Tag>
        </Space>
      ),
    },
    {
      title: "Check-in / Check-out",
      key: "dates",
      render: (record: Folio) => (
        <Space direction="vertical" size={0}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            In: {dayjs(record.booking?.checkIn).format("MMM DD, YYYY")}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Out: {dayjs(record.booking?.checkOut).format("MMM DD, YYYY")}
          </Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag
          color={
            status === "OPEN"
              ? "green"
              : status === "CLOSED"
                ? "default"
                : "red"
          }
        >
          {status}
        </Tag>
      ),
      filters: [
        { text: "Open", value: "OPEN" },
        { text: "Closed", value: "CLOSED" },
        { text: "Void", value: "VOID" },
      ],
      filteredValue: params.status ? [params.status] : null,
    },
    {
      title: "Type",
      key: "type",
      render: (record: Folio) =>
        record.isPrimary ? (
          <Tag color="gold">Primary</Tag>
        ) : (
          <Tag>Secondary</Tag>
        ),
      filters: [
        { text: "Primary", value: true },
        { text: "Secondary", value: false },
      ],
      filteredValue:
        params.isPrimary !== undefined ? [JSON.parse(params.isPrimary)] : null,
    },
    {
      title: "Items / Payments",
      key: "counts",
      render: (record: Folio) => (
        <Space>
          <Tag color="blue">{record.items?.length || 0} items</Tag>
          <Tag color="green">{record.payments?.length || 0} payments</Tag>
        </Space>
      ),
    },
  ];

  const renderActions = (record: Folio) => (
    <Button
      type="primary"
      ghost
      icon={<ArrowRightOutlined />}
      onClick={() => navigate(`/finance/folios/${record.id}`)}
      block={isMobile}
    >
      Open Folio
    </Button>
  );

  const updatedColumns = [
    ...columns.slice(0, -1),
    {
      title: "",
      key: "actions",
      render: (record: Folio) => renderActions(record),
    },
  ];

  return (
    <div style={{ padding: isMobile ? "16px" : "24px" }}>
      <div
        style={{
          marginBottom: 32,
          display: "flex",
          justifyContent: "space-between",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          gap: isMobile ? 16 : 0,
        }}
      >
        <div>
          <Title
            level={isMobile ? 3 : 2}
            style={{ margin: 0, fontSize: isMobile ? 22 : 28 }}
          >
            {t("finance:title", "Finance Management")}
          </Title>
          <Text type="secondary">
            Monitor guest accounts, audit charges, and process payments.
          </Text>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => setIsCreateModalOpen(true)}
          block={isMobile}
        >
          Create Folio
        </Button>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
          >
            <Statistic
              title="Active Guest Accounts"
              value={stats?.activeAccounts || 0}
              prefix={<FileTextOutlined style={{ color: "#1677ff" }} />}
              valueStyle={{ fontSize: isMobile ? 20 : 24 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
          >
            <Statistic
              title="Total Folios"
              value={stats?.totalFolios || 0}
              prefix={<DollarOutlined style={{ color: "#52c41a" }} />}
              valueStyle={{ fontSize: isMobile ? 20 : 24 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
          >
            <Statistic
              title="Open Folios"
              value={stats?.openFolios || 0}
              prefix={<LoadingOutlined style={{ color: "#fa8c16" }} />}
              valueStyle={{ fontSize: isMobile ? 20 : 24 }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        bordered={false}
        style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
      >
        <div style={{ marginBottom: 24 }}>
          <Input
            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
            placeholder="Search folios by Guest Name, Room # or ID..."
            size="large"
            style={{ width: "100%", maxWidth: 500 }}
            value={params.search}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
          />
        </div>

        {foliosLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : !isMobile ? (
          <Table
            columns={updatedColumns}
            dataSource={filteredFolios}
            rowKey="id"
            onChange={handleTableChange}
            pagination={{
              ...pagination,
              total,
              showSizeChanger: true,
              showTotal: (totalValue) => `Total ${totalValue} folios`,
            }}
            locale={{
              emptyText: params.search
                ? "No folios found matching your search"
                : "No folios created yet. Create a folio for checked-in guests.",
            }}
          />
        ) : (
          <List
            dataSource={filteredFolios}
            pagination={{ ...pagination, total, align: "center" }}
            renderItem={(folio: Folio) => (
              <List.Item>
                <Card
                  style={{ width: "100%", margin: "0 8px" }}
                  bodyStyle={{ padding: 16 }}
                  title={
                    <Text code style={{ fontSize: 12 }}>
                      #{folio.id.slice(0, 8)}
                    </Text>
                  }
                  extra={
                    <Tag
                      color={
                        folio.status === "OPEN"
                          ? "green"
                          : folio.status === "CLOSED"
                            ? "default"
                            : "red"
                      }
                    >
                      {folio.status}
                    </Tag>
                  }
                >
                  <div style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <Text strong style={{ fontSize: 16 }}>
                        {folio.booking?.primaryGuest?.lastName}{" "}
                        {folio.booking?.primaryGuest?.firstName}
                      </Text>
                      <Tag>
                        {folio.booking?.roomStays?.[0]?.room?.number || "N/A"}
                      </Tag>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      {folio.isPrimary ? (
                        <Tag color="gold" style={{ fontSize: 10 }}>
                          Primary
                        </Tag>
                      ) : (
                        <Tag style={{ fontSize: 10 }}>Secondary</Tag>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 16,
                      fontSize: 12,
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <Text type="secondary">Check-in</Text>
                      <Text>
                        {dayjs(folio.booking?.checkIn).format("MMM DD, YYYY")}
                      </Text>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        textAlign: "right",
                      }}
                    >
                      <Text type="secondary">Check-out</Text>
                      <Text>
                        {dayjs(folio.booking?.checkOut).format("MMM DD, YYYY")}
                      </Text>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                    <Tag color="blue" style={{ fontSize: 11 }}>
                      {folio.items?.length || 0} items
                    </Tag>
                    <Tag color="green" style={{ fontSize: 11 }}>
                      {folio.payments?.length || 0} payments
                    </Tag>
                  </div>

                  {renderActions(folio)}
                </Card>
              </List.Item>
            )}
          />
        )}
      </Card>

      <Modal
        title="Create New Folio"
        open={isCreateModalOpen}
        onCancel={() => {
          setIsCreateModalOpen(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateFolio}
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="bookingId"
            label="Select Booking"
            rules={[{ required: true, message: "Please select a booking" }]}
          >
            <Select
              placeholder="Select a checked-in guest"
              showSearch
              optionFilterProp="children"
              size="large"
            >
              {bookings
                .filter((b) => b.status === "CHECKED_IN")
                .map((booking) => (
                  <Select.Option key={booking.id} value={booking.id}>
                    {booking.primaryGuest?.firstName}{" "}
                    {booking.primaryGuest?.lastName} - Room{" "}
                    {booking.roomStays?.[0]?.room?.number}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item name="isPrimary" label="Folio Type" initialValue={true}>
            <Select size="large">
              <Select.Option value={true}>Primary Folio</Select.Option>
              <Select.Option value={false}>Secondary Folio</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createFolioMutation.isPending}
              >
                Create Folio
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
