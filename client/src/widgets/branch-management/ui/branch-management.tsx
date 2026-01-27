import { useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Space,
  message,
  Tag,
  Tooltip,
  List,
  Grid,
  Card,
  Typography,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { branchApi, type Branch } from "@/entities/branch/api/branch-api";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

interface BranchManagementProps {
  tenantId?: string; // If provided, manage this tenant's branches (Super Admin view). Else current context.
}

export const BranchManagement = ({ tenantId }: BranchManagementProps) => {
  const { t } = useTranslation(["common"]); // Assuming common for now, or create branch namespace
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  const { data: branches, isLoading } = useQuery({
    queryKey: ["branches", tenantId],
    queryFn: () => branchApi.getAllBranches(tenantId),
  });

  const createMutation = useMutation({
    mutationFn: branchApi.createBranch,
    onSuccess: () => {
      message.success("Branch created successfully");
      setIsModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || "Failed to create branch");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: any) =>
      branchApi.updateBranch(editingBranch!.id, values),
    onSuccess: () => {
      message.success("Branch updated successfully");
      setIsModalVisible(false);
      setEditingBranch(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || "Failed to update branch");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: branchApi.deleteBranch,
    onSuccess: () => {
      message.success("Branch deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || "Failed to delete branch");
    },
  });

  const handleSubmit = (values: any) => {
    if (editingBranch) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    form.setFieldsValue(branch); // Assumes field names match
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "Delete Branch?",
      content:
        "Are you sure you want to delete this branch? This action cannot be undone if data exists.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const renderActions = (record: Branch) => (
    <Space>
      <Tooltip title="Edit">
        <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
      </Tooltip>
      <Tooltip title="Delete">
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record.id)}
        />
      </Tooltip>
    </Space>
  );

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <Space>
          <ShopOutlined />
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Space>
      ),
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "success" : "error"}>
          {isActive ? "ACTIVE" : "INACTIVE"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Branch) => renderActions(record),
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingBranch(null);
            form.resetFields();
            setIsModalVisible(true);
          }}
          block={isMobile}
        >
          Add Branch
        </Button>
      </div>

      {!isMobile ? (
        <Table
          columns={columns}
          dataSource={branches}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      ) : (
        <List
          loading={isLoading}
          dataSource={branches}
          pagination={{ pageSize: 10, align: "center" }}
          renderItem={(branch: Branch) => (
            <List.Item>
              <Card
                style={{ width: "100%" }}
                title={
                  <Space>
                    <ShopOutlined />
                    <span style={{ fontWeight: 500 }}>{branch.name}</span>
                  </Space>
                }
                extra={
                  <Tag color={branch.isActive ? "success" : "error"}>
                    {branch.isActive ? "ACTIVE" : "INACTIVE"}
                  </Tag>
                }
                actions={[
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      width: "100%",
                      paddingRight: 12,
                    }}
                  >
                    {renderActions(branch)}
                  </div>,
                ]}
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Text type="secondary">Address:</Text>
                    <Text>{branch.address || "N/A"}</Text>
                  </div>
                </Space>
              </Card>
            </List.Item>
          )}
        />
      )}

      <Modal
        title={editingBranch ? "Edit Branch" : "Add Branch"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ isActive: true }}
        >
          <Form.Item
            name="name"
            label="Branch Name"
            rules={[{ required: true, message: "Please enter branch name" }]}
          >
            <Input placeholder="e.g. Downtown Hotel" />
          </Form.Item>

          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} placeholder="e.g. 123 Main St" />
          </Form.Item>

          <Form.Item name="isActive" label="Status" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
