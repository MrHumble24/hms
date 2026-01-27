import {
  Drawer,
  Form,
  Input,
  Select,
  Switch,
  Button,
  Space,
  Typography,
  Divider,
  message,
  Alert,
} from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  staffApi,
  Role,
  type Staff,
  type UpdateStaffDto,
} from "@/entities/staff/api/staff-api";
import { useTranslation } from "react-i18next";
import {
  UserOutlined,
  MailOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "@/entities/user/model/auth-store";

const { Title, Text } = Typography;

interface StaffDrawerProps {
  open: boolean;
  onClose: () => void;
  staff: Staff | null;
}

export const StaffDrawer = ({ open, onClose, staff }: StaffDrawerProps) => {
  const { t } = useTranslation(["staff", "common"]);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isManager = user?.role === "MANAGER";
  const canEditRole = isSuperAdmin;
  const canEdit = isSuperAdmin || isManager;

  const updateMutation = useMutation({
    mutationFn: (data: UpdateStaffDto) => staffApi.updateStaff(staff!.id, data),
    onSuccess: () => {
      message.success(t("common:success", "Staff updated successfully"));
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      onClose();
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message ||
          t("common:error", "Failed to update staff"),
      );
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: (role: Role) => staffApi.updateRole(staff!.id, { role }),
    onSuccess: () => {
      message.success(t("staff:roleUpdated", "Role updated successfully"));
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      onClose();
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message ||
          t("common:error", "Failed to update role"),
      );
    },
  });

  const onFinish = (values: any) => {
    // Check if role changed
    if (values.role && values.role !== staff?.role) {
      updateRoleMutation.mutate(values.role);
    } else {
      // Update other fields
      const { role, ...updateData } = values;
      updateMutation.mutate(updateData);
    }
  };

  const getRoleColor = (role: Role) => {
    switch (role) {
      case Role.SUPER_ADMIN:
        return "#ff4d4f";
      case Role.MANAGER:
        return "#1890ff";
      case Role.ACCOUNTANT:
        return "#52c41a";
      case Role.RECEPTIONIST:
        return "#722ed1";
      case Role.HOUSEKEEPER:
        return "#fa8c16";
      case Role.MAINTENANCE:
        return "#13c2c2";
      default:
        return "#8c8c8c";
    }
  };

  const roleOptions = Object.values(Role).map((role) => ({
    label: (
      <Space>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: getRoleColor(role),
          }}
        />
        {t(`staff:roles.${role.toLowerCase()}`, role.replace("_", " "))}
      </Space>
    ),
    value: role,
  }));

  return (
    <Drawer
      title={
        <Space>
          <UserOutlined />
          {staff
            ? t("staff:editStaff", "Edit Staff Member")
            : t("staff:viewStaff", "Staff Details")}
        </Space>
      }
      width={500}
      onClose={onClose}
      open={open}
      footer={
        canEdit ? (
          <div style={{ textAlign: "right" }}>
            <Button onClick={onClose} style={{ marginRight: 8 }}>
              {t("common:cancel", "Cancel")}
            </Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              loading={updateMutation.isPending || updateRoleMutation.isPending}
            >
              {t("common:save", "Save Changes")}
            </Button>
          </div>
        ) : null
      }
    >
      {staff && (
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            fullName: staff.fullName,
            email: staff.email,
            role: staff.role,
            isActive: staff.isActive,
          }}
        >
          {/* Basic Info Section */}
          <div style={{ marginBottom: 24 }}>
            <Title level={5}>
              <UserOutlined /> {t("staff:basicInfo", "Basic Information")}
            </Title>
            <Divider style={{ margin: "12px 0" }} />

            <Form.Item
              name="fullName"
              label={t("staff:fullName", "Full Name")}
              rules={[
                {
                  required: true,
                  message: t(
                    "staff:fullNameRequired",
                    "Please enter full name",
                  ),
                },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder={t("staff:fullNamePlaceholder", "Enter full name")}
                disabled={!canEdit}
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="email"
              label={t("staff:email", "Email")}
              rules={[
                {
                  required: true,
                  type: "email",
                  message: t(
                    "staff:emailInvalid",
                    "Please enter a valid email",
                  ),
                },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder={t("staff:emailPlaceholder", "Enter email address")}
                disabled={!canEdit}
                size="large"
              />
            </Form.Item>
          </div>

          {/* Role & Permissions Section */}
          <div style={{ marginBottom: 24 }}>
            <Title level={5}>
              <SafetyOutlined />{" "}
              {t("staff:rolePermissions", "Role & Permissions")}
            </Title>
            <Divider style={{ margin: "12px 0" }} />

            {!canEditRole && (
              <Alert
                message={t(
                  "staff:roleEditRestricted",
                  "Only Super Admins can change user roles",
                )}
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Form.Item
              name="role"
              label={t("staff:role", "Role")}
              rules={[
                {
                  required: true,
                  message: t("staff:roleRequired", "Please select a role"),
                },
              ]}
            >
              <Select
                options={roleOptions}
                disabled={!canEditRole}
                size="large"
                placeholder={t("staff:selectRole", "Select role")}
              />
            </Form.Item>
          </div>

          {/* Status Section */}
          <div style={{ marginBottom: 24 }}>
            <Title level={5}>
              <CheckCircleOutlined /> {t("staff:status", "Status")}
            </Title>
            <Divider style={{ margin: "12px 0" }} />

            <Form.Item
              name="isActive"
              label={t("staff:activeStatus", "Active Status")}
              valuePropName="checked"
            >
              <Switch
                checkedChildren={t("common:active", "Active")}
                unCheckedChildren={t("common:inactive", "Inactive")}
                disabled={!canEdit}
              />
            </Form.Item>

            {staff.tasksAssigned && staff.tasksAssigned.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">
                  {t("staff:assignedTasks", "Assigned Tasks")}:{" "}
                  <Text strong>{staff.tasksAssigned.length}</Text>
                </Text>
              </div>
            )}

            {staff.maintenanceTickets &&
              staff.maintenanceTickets.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">
                    {t("staff:maintenanceTickets", "Maintenance Tickets")}:{" "}
                    <Text strong>{staff.maintenanceTickets.length}</Text>
                  </Text>
                </div>
              )}
          </div>

          {/* Metadata */}
          <div
            style={{
              padding: 16,
              background: "#f5f5f5",
              borderRadius: 8,
              marginTop: 24,
            }}
          >
            <Space direction="vertical" size={4}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t("staff:memberId", "Member ID")}: <Text code>{staff.id}</Text>
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t("staff:createdAt", "Created")}:{" "}
                {new Date(staff.createdAt).toLocaleDateString()}
              </Text>
            </Space>
          </div>
        </Form>
      )}
    </Drawer>
  );
};
