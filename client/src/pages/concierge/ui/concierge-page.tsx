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
  Switch,
  Popconfirm,
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
  EditOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  hotelServiceApi,
  type HotelService,
  type HotelServiceRequest,
} from "@/entities/hotel-service/api/hotel-service-api";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

export const ConciergePage = () => {
  const queryClient = useQueryClient();
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<HotelService | null>(
    null,
  );
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
      closeServiceModal();
      queryClient.invalidateQueries({ queryKey: ["service-catalog"] });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: any }) =>
      hotelServiceApi.updateService(id, values),
    onSuccess: () => {
      message.success("Service updated");
      closeServiceModal();
      queryClient.invalidateQueries({ queryKey: ["service-catalog"] });
    },
  });

  const toggleServiceMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      hotelServiceApi.updateService(id, { isActive }),
    onSuccess: () => {
      message.success("Service status updated");
      queryClient.invalidateQueries({ queryKey: ["service-catalog"] });
    },
  });

  const openEditModal = (service: HotelService) => {
    setEditingService(service);
    form.setFieldsValue(service);
    setIsServiceModalOpen(true);
  };

  const closeServiceModal = () => {
    setIsServiceModalOpen(false);
    setEditingService(null);
    form.resetFields();
  };

  const onServiceFormFinish = (values: any) => {
    if (editingService) {
      updateServiceMutation.mutate({ id: editingService.id, values });
    } else {
      createServiceMutation.mutate(values);
    }
  };

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
                      style={{ opacity: service.isActive ? 1 : 0.6 }}
                      actions={[
                        <Button
                          type="link"
                          icon={<EditOutlined />}
                          onClick={() => openEditModal(service)}
                        >
                          Edit
                        </Button>,
                        <Popconfirm
                          title={
                            service.isActive
                              ? "Deactivate this service?"
                              : "Activate this service?"
                          }
                          onConfirm={() =>
                            toggleServiceMutation.mutate({
                              id: service.id,
                              isActive: !service.isActive,
                            })
                          }
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button
                            type="link"
                            danger={service.isActive}
                            icon={
                              service.isActive ? (
                                <EyeInvisibleOutlined />
                              ) : (
                                <EyeOutlined />
                              )
                            }
                          >
                            {service.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </Popconfirm>,
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
                        title={
                          <Space>
                            {service.name}
                            {!service.isActive && (
                              <Tag color="default">INACTIVE</Tag>
                            )}
                          </Space>
                        }
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
        title={
          editingService ? "Edit Hotel Service" : "Create New Hotel Service"
        }
        open={isServiceModalOpen}
        onCancel={closeServiceModal}
        onOk={() => form.submit()}
        confirmLoading={
          createServiceMutation.isPending || updateServiceMutation.isPending
        }
      >
        <Form form={form} layout="vertical" onFinish={onServiceFormFinish}>
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
          <Form.Item
            name="isActive"
            label="Active Status"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
