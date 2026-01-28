import { useState } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Card,
  Typography,
  Tabs,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Avatar,
  Statistic,
  Row,
  Col,
} from "antd";
import {
  BellOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  TruckOutlined,
  CoffeeOutlined,
  FormatPainterOutlined,
  HeartOutlined,
  CarOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  hotelServiceApi,
  type HotelServiceRequest,
} from "@/entities/hotel-service/api/hotel-service-api";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

export const ConciergePage = () => {
  const queryClient = useQueryClient();
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: requests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ["service-requests"],
    queryFn: hotelServiceApi.getRequests,
  });

  const { data: catalog = [] } = useQuery({
    queryKey: ["service-catalog"],
    queryFn: hotelServiceApi.getCatalog,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) =>
      hotelServiceApi.updateRequestStatus(id, { status }),
    onSuccess: () => {
      message.success("Status updated and billing posted if completed");
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: (values: any) => hotelServiceApi.createService(values),
    onSuccess: () => {
      message.success("Service added to catalog");
      setIsServiceModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["service-catalog"] });
    },
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "TRANSPORT":
        return <CarOutlined />;
      case "FOOD_BEVERAGE":
        return <CoffeeOutlined />;
      case "LAUNDRY":
        return <FormatPainterOutlined />;
      case "SPA":
        return <HeartOutlined />;
      default:
        return <TruckOutlined />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "REQUESTED":
        return "blue";
      case "IN_PROGRESS":
        return "orange";
      case "COMPLETED":
        return "success";
      case "CANCELLED":
        return "error";
      default:
        return "default";
    }
  };

  const requestColumns = [
    {
      title: "Service",
      key: "service",
      render: (_: any, record: HotelServiceRequest) => (
        <Space>
          {getCategoryIcon(record.service.category)}
          <Text strong>{record.service.name}</Text>
        </Space>
      ),
    },
    {
      title: "Guest / Room",
      key: "guest",
      render: (_: any, record: HotelServiceRequest) => (
        <div>
          <div>{record.booking.primaryGuest.fullName}</div>
          <Text type="secondary">
            Room: {record.booking.roomStays?.[0]?.room?.number || "N/A"}
          </Text>
        </div>
      ),
    },
    {
      title: "Scheduled For",
      dataIndex: "scheduledFor",
      key: "scheduledFor",
      render: (date: string) =>
        date ? dayjs(date).format("MMM DD, HH:mm") : "ASAP",
    },
    {
      title: "Total",
      key: "total",
      render: (_: any, record: HotelServiceRequest) => (
        <Text strong>
          {Number(record.totalAmount).toLocaleString()}{" "}
          {record.service.currency}
        </Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: HotelServiceRequest) => (
        <Space>
          {record.status === "REQUESTED" && (
            <Button
              size="small"
              onClick={() =>
                updateStatusMutation.mutate({
                  id: record.id,
                  status: "IN_PROGRESS",
                })
              }
            >
              Start
            </Button>
          )}
          {record.status === "IN_PROGRESS" && (
            <Button
              size="small"
              type="primary"
              onClick={() =>
                updateStatusMutation.mutate({
                  id: record.id,
                  status: "COMPLETED",
                })
              }
            >
              Complete
            </Button>
          )}
          {record.status !== "COMPLETED" && record.status !== "CANCELLED" && (
            <Button
              size="small"
              danger
              onClick={() =>
                updateStatusMutation.mutate({
                  id: record.id,
                  status: "CANCELLED",
                })
              }
            >
              Cancel
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Hotel Services & Concierge
          </Title>
          <Text type="secondary">
            Manage guest requests, transport, and extra services.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsServiceModalOpen(true)}
        >
          Add New Service
        </Button>
      </div>

      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Requests"
              value={requests.filter((r) => r.status === "REQUESTED").length}
              prefix={<BellOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="In Progress"
              value={requests.filter((r) => r.status === "IN_PROGRESS").length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Completed Today"
              value={
                requests.filter(
                  (r) =>
                    r.status === "COMPLETED" &&
                    dayjs(r.createdAt).isSame(dayjs(), "day"),
                ).length
              }
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Catalog Items"
              value={catalog.length}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Tabs
        items={[
          {
            key: "requests",
            label: `Live Requests (${requests.filter((r) => r.status !== "COMPLETED" && r.status !== "CANCELLED").length})`,
            children: (
              <Card>
                <Table
                  columns={requestColumns}
                  dataSource={requests}
                  rowKey="id"
                  loading={isLoadingRequests}
                />
              </Card>
            ),
          },
          {
            key: "catalog",
            label: "Service Catalog",
            children: (
              <Row gutter={[16, 16]}>
                {catalog.map((service) => (
                  <Col key={service.id} xs={24} sm={12} lg={8} xl={6}>
                    <Card
                      hoverable
                      actions={[
                        <Button type="link">Edit</Button>,
                        <Button type="link" danger>
                          Deactivate
                        </Button>,
                      ]}
                    >
                      <Card.Meta
                        avatar={
                          <Avatar
                            icon={getCategoryIcon(service.category)}
                            style={{
                              backgroundColor: "#f0f2f5",
                              color: "#1890ff",
                            }}
                          />
                        }
                        title={service.name}
                        description={
                          <div>
                            <div
                              style={{
                                marginBottom: 8,
                                height: 40,
                                overflow: "hidden",
                              }}
                            >
                              {service.description ||
                                "No description provided."}
                            </div>
                            <Tag color="blue">{service.category}</Tag>
                            <div style={{ marginTop: 8 }}>
                              <Text strong style={{ fontSize: 16 }}>
                                {Number(service.basePrice).toLocaleString()}{" "}
                                {service.currency}
                              </Text>
                            </div>
                          </div>
                        }
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            ),
          },
        ]}
      />

      <Modal
        title="Create New Hotel Service"
        open={isServiceModalOpen}
        onCancel={() => setIsServiceModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createServiceMutation.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(v) => createServiceMutation.mutate(v)}
        >
          <Form.Item
            name="name"
            label="Service Name"
            rules={[{ required: true }]}
          >
            <Input placeholder="e.g. Airport Transfer Luxury" />
          </Form.Item>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="TRANSPORT">Transport</Option>
              <Option value="LAUNDRY">Laundry</Option>
              <Option value="SPA">Spa & Wellness</Option>
              <Option value="CONCIERGE">Concierge</Option>
              <Option value="FOOD_BEVERAGE">Food & Beverage</Option>
              <Option value="CLEANING">Cleaning</Option>
              <Option value="OTHER">Other</Option>
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="basePrice"
                label="Base Price"
                rules={[{ required: true }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  formatter={(v) =>
                    `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="currency" label="Currency" initialValue="UZS">
                <Select>
                  <Option value="UZS">UZS</Option>
                  <Option value="USD">USD</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
