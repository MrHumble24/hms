import {
  Card,
  Descriptions,
  Tag,
  Typography,
  Button,
  Space,
  Tabs,
  Form,
  Select,
  Input,
  DatePicker,
  Statistic,
  Row,
  Col,
  Modal,
  message,
  Table,
  Grid,
  List,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  UserOutlined,
  ShopOutlined,
  TeamOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/entities/admin/api/admin-api";
import dayjs from "dayjs";

import { BranchManagement } from "@/widgets/branch-management/ui/branch-management";

const { Title, Text } = Typography;
const { Option } = Select;

export const TenantDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"admin" | "user">("admin");
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  const { data: tenant, isLoading } = useQuery({
    queryKey: ["tenant", id],
    queryFn: async () => {
      const res = await adminApi.getTenant(id!);
      return res;
    },
    enabled: !!id,
  });

  const { data: usage } = useQuery({
    queryKey: ["tenant-usage", id],
    queryFn: async () => {
      const res = await adminApi.getTenantUsage(id!);
      return res;
    },
    enabled: !!id,
  });

  const { data: users } = useQuery({
    queryKey: ["tenant-users", id],
    queryFn: async () => {
      const res = await adminApi.getTenantUsers(id!);
      return res;
    },
    enabled: !!id,
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: (values: any) => adminApi.updateSubscription(id!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant", id] });
    },
  });

  const onFinish = (values: any) => {
    updateSubscriptionMutation.mutate({
      ...values,
      subscriptionStart: values.subscriptionStart?.toISOString(),
      subscriptionEnd: values.subscriptionEnd?.toISOString(),
      nextBillingDate: values.nextBillingDate?.toISOString(),
    });
  };

  const createUserMutation = useMutation({
    mutationFn: (values: any) => {
      if (modalMode === "admin") {
        return adminApi.createTenantAdmin(id!, values);
      } else {
        return adminApi.createTenantUser(id!, values);
      }
    },
    onSuccess: () => {
      message.success(`Tenant ${modalMode} created successfully`);
      setIsModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ["tenant-users", id] });
      form.resetFields();
    },
    onError: () => {
      message.error(`Failed to create tenant ${modalMode}`);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => adminApi.deleteTenantUser(id!, userId),
    onSuccess: () => {
      message.success("User removed successfully");
      queryClient.invalidateQueries({ queryKey: ["tenant-users", id] });
    },
    onError: () => {
      message.error("Failed to remove user");
    },
  });

  const onCreateUser = (values: any) => {
    createUserMutation.mutate(values);
  };

  if (isLoading || !tenant) return <div>Loading...</div>;

  return (
    <div style={{ padding: isMobile ? "16px" : "24px" }}>
      <div style={{ marginBottom: 24 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/admin/tenants")}
          style={{ marginBottom: 16, paddingLeft: 0 }}
        >
          Back to Tenants
        </Button>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
              {tenant.name}
            </Title>
            <Space wrap>
              <Text type="secondary">{tenant.slug}</Text>
              <Tag color={tenant.isActive ? "success" : "error"}>
                {tenant.isActive ? "ACTIVE" : "INACTIVE"}
              </Tag>
              <Tag color="blue">{tenant.subscriptionStatus}</Tag>
              <Tag>{tenant.planType}</Tag>
            </Space>
          </Space>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="Usage Overview">
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Branches"
                  value={usage?.branches}
                  suffix={`/ ${tenant.maxBranches}`}
                  prefix={<ShopOutlined />}
                  valueStyle={{ fontSize: isMobile ? "20px" : "24px" }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Users"
                  value={usage?.users}
                  suffix={`/ ${tenant.maxUsers}`}
                  prefix={<UserOutlined />}
                  valueStyle={{ fontSize: isMobile ? "20px" : "24px" }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Guests"
                  value={usage?.guests}
                  prefix={<TeamOutlined />}
                  valueStyle={{ fontSize: isMobile ? "20px" : "24px" }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Bookings"
                  value={usage?.bookings}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ fontSize: isMobile ? "20px" : "24px" }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={24}>
          <Tabs
            defaultActiveKey="subscription"
            items={[
              {
                key: "subscription",
                label: "Subscription & Limits",
                children: (
                  <Card title="Manage Subscription">
                    <Form
                      form={form}
                      layout="vertical"
                      onFinish={onFinish}
                      initialValues={{
                        ...tenant,
                        subscriptionStart: tenant.subscriptionStart
                          ? dayjs(tenant.subscriptionStart)
                          : null,
                        subscriptionEnd: tenant.subscriptionEnd
                          ? dayjs(tenant.subscriptionEnd)
                          : null,
                        nextBillingDate: tenant.nextBillingDate
                          ? dayjs(tenant.nextBillingDate)
                          : null,
                      }}
                    >
                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="subscriptionStatus"
                            label="Status"
                            rules={[{ required: true }]}
                          >
                            <Select>
                              <Option value="TRIAL">Trial</Option>
                              <Option value="ACTIVE">Active</Option>
                              <Option value="EXPIRED">Expired</Option>
                              <Option value="SUSPENDED">Suspended</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="planType"
                            label="Plan Type"
                            rules={[{ required: true }]}
                          >
                            <Select>
                              <Option value="BASIC">Basic</Option>
                              <Option value="STANDARD">Standard</Option>
                              <Option value="PREMIUM">Premium</Option>
                              <Option value="ENTERPRISE">Enterprise</Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="subscriptionStart"
                            label="Start Date"
                          >
                            <DatePicker style={{ width: "100%" }} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item name="subscriptionEnd" label="End Date">
                            <DatePicker style={{ width: "100%" }} />
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="maxBranches"
                            label="Max Branches"
                            rules={[{ required: true }]}
                          >
                            <Input type="number" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="maxUsers"
                            label="Max Users"
                            rules={[{ required: true }]}
                          >
                            <Input type="number" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SaveOutlined />}
                        loading={updateSubscriptionMutation.isPending}
                      >
                        Save Changes
                      </Button>
                    </Form>
                  </Card>
                ),
              },
              {
                key: "users",
                label: "Users",
                children: (
                  <Card
                    title="User Management"
                    extra={
                      <Button
                        type="primary"
                        onClick={() => {
                          setModalMode("user");
                          setIsModalVisible(true);
                        }}
                      >
                        Create User
                      </Button>
                    }
                  >
                    {!isMobile ? (
                      <Table
                        dataSource={users || []}
                        rowKey="id"
                        columns={[
                          { title: "Name", dataIndex: "fullName", key: "name" },
                          { title: "Email", dataIndex: "email", key: "email" },
                          {
                            title: "Role",
                            dataIndex: "role",
                            key: "role",
                            render: (role: string) => (
                              <Tag color="blue">{role}</Tag>
                            ),
                          },
                          {
                            title: "Actions",
                            key: "actions",
                            render: (_, record: any) => (
                              <Button
                                danger
                                type="link"
                                onClick={() => {
                                  if (
                                    confirm(
                                      "Are you sure you want to remove this user?",
                                    )
                                  ) {
                                    deleteUserMutation.mutate(record.id);
                                  }
                                }}
                              >
                                Remove
                              </Button>
                            ),
                          },
                        ]}
                      />
                    ) : (
                      <List
                        dataSource={users || []}
                        rowKey="id"
                        renderItem={(user: any) => (
                          <List.Item
                            actions={[
                              <Button
                                danger
                                type="link"
                                onClick={() => {
                                  if (
                                    confirm(
                                      "Are you sure you want to remove this user?",
                                    )
                                  ) {
                                    deleteUserMutation.mutate(user.id);
                                  }
                                }}
                              >
                                Remove
                              </Button>,
                            ]}
                          >
                            <List.Item.Meta
                              title={user.fullName}
                              description={
                                <Space direction="vertical" size={0}>
                                  <Text type="secondary">{user.email}</Text>
                                  <Tag color="blue" style={{ marginTop: 4 }}>
                                    {user.role}
                                  </Tag>
                                </Space>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    )}
                  </Card>
                ),
              },
              {
                key: "branches",
                label: "Branches",
                children: (
                  <Card title="Branch Management">
                    <BranchManagement tenantId={id} />
                  </Card>
                ),
              },
              {
                key: "details",
                label: "Details",
                children: (
                  <Card
                    title="Tenant Details"
                    extra={
                      <Button
                        type="primary"
                        onClick={() => {
                          setModalMode("admin");
                          setIsModalVisible(true);
                        }}
                        block={isMobile}
                      >
                        {isMobile ? "Add Admin" : "Create Tenant Admin"}
                      </Button>
                    }
                  >
                    <Descriptions bordered column={isMobile ? 1 : 2}>
                      <Descriptions.Item label="ID">
                        {tenant.id}
                      </Descriptions.Item>
                      <Descriptions.Item label="Name">
                        {tenant.name}
                      </Descriptions.Item>
                      <Descriptions.Item label="Slug">
                        {tenant.slug}
                      </Descriptions.Item>
                      <Descriptions.Item label="Created At">
                        {dayjs(tenant.createdAt).format("YYYY-MM-DD HH:mm")}
                      </Descriptions.Item>
                      <Descriptions.Item label="Notes" span={2}>
                        {tenant.notes || "No notes"}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                ),
              },
            ]}
          />
        </Col>
      </Row>

      <Modal
        title={modalMode === "admin" ? "Create Tenant Admin" : "Create User"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={onCreateUser} form={form}>
          <Form.Item
            name="fullName"
            label="Full Name"
            rules={[{ required: true, message: "Please enter full name" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter valid email" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please enter password" }]}
          >
            <Input.Password />
          </Form.Item>

          {modalMode === "user" && (
            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: "Please select role" }]}
            >
              <Select>
                <Option value="MANAGER">Manager</Option>
                <Option value="RECEPTIONIST">Receptionist</Option>
                <Option value="HOUSEKEEPER">Housekeeper</Option>
                <Option value="KITCHEN">Kitchen</Option>
                <Option value="WAITER">Waiter</Option>
                <Option value="ACCOUNTANT">Accountant</Option>
              </Select>
            </Form.Item>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={createUserMutation.isPending}
            >
              Create {modalMode === "admin" ? "Admin" : "User"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
