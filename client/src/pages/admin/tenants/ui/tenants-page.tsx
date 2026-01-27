import {
  Table,
  Tag,
  Space,
  Button,
  Typography,
  Input,
  Select,
  Card,
  Tooltip,
  Modal,
  message,
  Form,
  Grid,
  List,
} from "antd";
import {
  StopOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { adminApi, type Tenant } from "@/entities/admin/api/admin-api";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

export const TenantsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");
  const search = searchParams.get("search") || "";
  const statusFilter =
    (searchParams.get("status") as "active" | "inactive" | null) || undefined;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  const { data, isLoading } = useQuery({
    queryKey: ["tenants", page, pageSize, search, statusFilter],
    queryFn: () =>
      adminApi.getTenants({
        skip: (page - 1) * pageSize,
        take: pageSize,
        search,
        status: statusFilter,
      }),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => adminApi.activateTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => adminApi.deactivateTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });

  const getStatusTag = (isActive: boolean) => (
    <Tag color={isActive ? "success" : "error"}>
      {isActive ? "ACTIVE" : "INACTIVE"}
    </Tag>
  );

  const getActions = (record: Tenant) => (
    <Space>
      <Tooltip title="View Details">
        <Button
          icon={<EyeOutlined />}
          onClick={() => navigate(`/admin/tenants/${record.id}`)}
        />
      </Tooltip>
      {record.isActive ? (
        <Tooltip title="Deactivate">
          <Button
            danger
            icon={<StopOutlined />}
            onClick={() => deactivateMutation.mutate(record.id)}
            loading={deactivateMutation.isPending}
          />
        </Tooltip>
      ) : (
        <Tooltip title="Activate">
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => activateMutation.mutate(record.id)}
            loading={activateMutation.isPending}
            ghost
          />
        </Tooltip>
      )}
    </Space>
  );

  const columns = [
    {
      title: "Organization",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Tenant) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.slug}
          </Text>
        </Space>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_: any, record: Tenant) => (
        <Space direction="vertical" size={2}>
          {getStatusTag(record.isActive)}
          <Tag color="blue">{record.subscriptionStatus}</Tag>
        </Space>
      ),
    },
    {
      title: "Plan",
      dataIndex: "planType",
      key: "planType",
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: "Usage",
      key: "usage",
      render: (_: any, record: Tenant) => (
        <Space direction="vertical" size={0} style={{ fontSize: "12px" }}>
          <Text>
            Branches: {record._count?.branches || 0} / {record.maxBranches}
          </Text>
          <Text>
            Users: {record._count?.users || 0} / {record.maxUsers}
          </Text>
        </Space>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => dayjs(date).format("DD MMM YYYY"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Tenant) => getActions(record),
    },
  ];

  return (
    <div style={{ padding: isMobile ? "16px" : "24px" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "center",
            gap: isMobile ? 16 : 0,
          }}
        >
          <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
            Tenant Management
          </Title>
          <Button
            type="primary"
            onClick={() => setIsModalVisible(true)}
            block={isMobile}
          >
            Add Tenant
          </Button>
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
              placeholder="Search tenants..."
              prefix={<SearchOutlined />}
              style={{ width: isMobile ? "100%" : 300 }}
              value={search}
              onChange={(e) => {
                const val = e.target.value;
                setSearchParams((prev) => {
                  if (val) prev.set("search", val);
                  else prev.delete("search");
                  prev.set("page", "1");
                  return prev;
                });
              }}
            />
            <Select
              placeholder="Filter by status"
              style={{ width: isMobile ? "100%" : 200 }}
              allowClear
              value={statusFilter}
              onChange={(val) => {
                setSearchParams((prev) => {
                  if (val) prev.set("status", val);
                  else prev.delete("status");
                  prev.set("page", "1");
                  return prev;
                });
              }}
            >
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </div>

          {!isMobile ? (
            <Table
              columns={columns}
              dataSource={data?.tenants}
              loading={isLoading}
              rowKey="id"
              pagination={{
                current: page,
                pageSize: pageSize,
                total: data?.total,
                showSizeChanger: true,
                onChange: (newPage, newPageSize) => {
                  setSearchParams((prev) => {
                    prev.set("page", newPage.toString());
                    prev.set("pageSize", newPageSize.toString());
                    return prev;
                  });
                },
              }}
            />
          ) : (
            <List
              loading={isLoading}
              dataSource={data?.tenants}
              pagination={{
                current: page,
                pageSize: pageSize,
                total: data?.total,
                align: "center",
                onChange: (newPage, newPageSize) => {
                  setSearchParams((prev) => {
                    prev.set("page", newPage.toString());
                    prev.set("pageSize", newPageSize.toString());
                    return prev;
                  });
                },
              }}
              renderItem={(record: Tenant) => (
                <List.Item>
                  <Card
                    style={{ width: "100%" }}
                    title={
                      <Space>
                        <Text strong>{record.name}</Text>
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          ({record.slug})
                        </Text>
                      </Space>
                    }
                    extra={getStatusTag(record.isActive)}
                    actions={[
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          width: "100%",
                          paddingRight: 12,
                        }}
                      >
                        {getActions(record)}
                      </div>,
                    ]}
                  >
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text type="secondary">Plan:</Text>
                        <Tag>{record.planType}</Tag>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text type="secondary">Subscription:</Text>
                        <Tag color="blue">{record.subscriptionStatus}</Tag>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text type="secondary">Branches:</Text>
                        <Text>
                          {record._count?.branches || 0} / {record.maxBranches}
                        </Text>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text type="secondary">Users:</Text>
                        <Text>
                          {record._count?.users || 0} / {record.maxUsers}
                        </Text>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text type="secondary">Created:</Text>
                        <Text>
                          {dayjs(record.createdAt).format("DD MMM YYYY")}
                        </Text>
                      </div>
                    </Space>
                  </Card>
                </List.Item>
              )}
            />
          )}
        </Card>
      </Space>

      <CreateTenantModal
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onSuccess={() => {
          setIsModalVisible(false);
          queryClient.invalidateQueries({ queryKey: ["tenants"] });
        }}
      />
    </div>
  );
};

const CreateTenantModal = ({
  visible,
  onCancel,
  onSuccess,
}: {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}) => {
  const [form] = Form.useForm();

  const createMutation = useMutation({
    mutationFn: (values: any) => adminApi.createTenant(values),
    onSuccess: () => {
      message.success("Tenant created successfully");
      form.resetFields();
      onSuccess();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || "Failed to create tenant");
    },
  });

  return (
    <Modal
      title="Create New Tenant"
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={createMutation.isPending}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => createMutation.mutate(values)}
        initialValues={{ planType: "BASIC" }}
      >
        <Card
          title="Organization Details"
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Form.Item
            name="name"
            label="Organization Name"
            rules={[
              { required: true, message: "Please enter organization name" },
            ]}
          >
            <Input
              onChange={(e) => {
                const slug = e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-+|-+$/g, "");
                form.setFieldValue("slug", slug);
              }}
            />
          </Form.Item>
          <Form.Item
            name="slug"
            label="Domain Slug"
            rules={[
              { required: true, message: "Please enter domain slug" },
              {
                pattern: /^[a-z0-9-]+$/,
                message: "Only lowercase letters, numbers, and hyphens allowed",
              },
            ]}
            extra="Used for subdomain/URL (e.g., slug.hms.com)"
          >
            <Input addonBefore="https://" addonAfter=".hms.com" />
          </Form.Item>
          <Form.Item
            name="planType"
            label="Subscription Plan"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="BASIC">Basic</Option>
              <Option value="STANDARD">Standard</Option>
              <Option value="PREMIUM">Premium</Option>
              <Option value="ENTERPRISE">Enterprise</Option>
            </Select>
          </Form.Item>
        </Card>

        <Card title="Admin User" size="small">
          <Form.Item
            name="fullName"
            label="Admin Full Name"
            rules={[{ required: true, message: "Please enter admin name" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Admin Email"
            rules={[
              { required: true, message: "Please enter admin email" },
              { type: "email", message: "Invalid email format" },
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
        </Card>
      </Form>
    </Modal>
  );
};
