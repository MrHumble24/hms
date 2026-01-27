import { useState } from "react";
import {
  Table,
  Button,
  Space,
  Typography,
  Card,
  Input,
  Modal,
  Form,
  Grid,
  List,
  Badge,
  Tooltip,
  Switch,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  BankOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  branchApi,
  type Branch,
  type CreateBranchDto,
} from "@/entities/branch/api/branch-api";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export const BranchPage = () => {
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [form] = Form.useForm();
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchApi.getAllBranches(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateBranchDto) => branchApi.createBranch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setIsModalOpen(false);
      form.resetFields();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Branch> }) =>
      branchApi.updateBranch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setIsModalOpen(false);
      setEditingBranch(null);
      form.resetFields();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => branchApi.deleteBranch(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["branches"] }),
  });

  const handleSubmit = (values: CreateBranchDto) => {
    if (editingBranch) {
      updateMutation.mutate({ id: editingBranch.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    form.setFieldsValue(branch);
    setIsModalOpen(true);
  };

  const handleDelete = (branch: Branch) => {
    Modal.confirm({
      title: "Delete Branch?",
      content: `This will delete "${branch.name}". This action cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      onOk: () => deleteMutation.mutate(branch.id),
    });
  };

  const filteredBranches = branches.filter((b) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      b.name.toLowerCase().includes(search) ||
      b.address?.toLowerCase().includes(search)
    );
  });

  const columns = [
    {
      title: "Branch",
      key: "name",
      render: (_: any, record: Branch) => (
        <Space>
          <BankOutlined style={{ fontSize: 20 }} />
          <div>
            <Text strong>{record.name}</Text>
            {record.address && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <EnvironmentOutlined /> {record.address}
                </Text>
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_: any, record: Branch) => (
        <Badge
          status={record.isActive ? "success" : "default"}
          text={record.isActive ? "Active" : "Inactive"}
        />
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => (
        <Tooltip title={dayjs(date).format("YYYY-MM-DD HH:mm")}>
          <Text type="secondary">{dayjs(date).format("MMM DD, YYYY")}</Text>
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Branch) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: isMobile ? 16 : 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 16 : 0,
          marginBottom: 24,
        }}
      >
        <div>
          <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
            Branch Management
          </Title>
          <Text type="secondary">Manage your hotel branches</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => {
            setEditingBranch(null);
            form.resetFields();
            setIsModalOpen(true);
          }}
          block={isMobile}
        >
          Add Branch
        </Button>
      </div>

      <Card>
        <Input
          placeholder="Search branches..."
          prefix={<SearchOutlined />}
          style={{ width: isMobile ? "100%" : 300, marginBottom: 16 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />

        {!isMobile ? (
          <Table
            dataSource={filteredBranches}
            columns={columns}
            rowKey="id"
            loading={isLoading}
            pagination={{ pageSize: 10 }}
          />
        ) : (
          <List
            dataSource={filteredBranches}
            loading={isLoading}
            renderItem={(branch: Branch) => (
              <List.Item>
                <Card style={{ width: "100%" }} bodyStyle={{ padding: 16 }}>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Space>
                      <BankOutlined style={{ fontSize: 24 }} />
                      <div>
                        <Text strong>{branch.name}</Text>
                        {branch.address && (
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {branch.address}
                            </Text>
                          </div>
                        )}
                        <Badge
                          status={branch.isActive ? "success" : "default"}
                          text={branch.isActive ? "Active" : "Inactive"}
                          style={{ fontSize: 12 }}
                        />
                      </div>
                    </Space>
                    <Space>
                      <Button
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(branch)}
                      />
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(branch)}
                      />
                    </Space>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        )}
      </Card>

      <Modal
        title={editingBranch ? "Edit Branch" : "Add Branch"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingBranch(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Branch Name"
            rules={[{ required: true, message: "Please enter branch name" }]}
          >
            <Input placeholder="e.g. Main Branch, City Center" />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input placeholder="Branch address" />
          </Form.Item>
          <Form.Item
            name="isActive"
            label="Active"
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
