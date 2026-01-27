import {
  Drawer,
  Form,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Divider,
  message,
  Progress,
} from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  staffApi,
  Role,
  type CreateStaffDto,
} from "@/entities/staff/api/staff-api";
import { useTranslation } from "react-i18next";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import { useState } from "react";

const { Title, Text } = Typography;

interface CreateStaffDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const CreateStaffDrawer = ({
  open,
  onClose,
}: CreateStaffDrawerProps) => {
  const { t } = useTranslation(["staff", "common"]);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [passwordStrength, setPasswordStrength] = useState(0);

  const createMutation = useMutation({
    mutationFn: (data: CreateStaffDto) => staffApi.create(data),
    onSuccess: () => {
      message.success(t("staff:created", "Staff member created successfully"));
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      onClose();
      form.resetFields();
      setPasswordStrength(0);
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message ||
          t("common:error", "Failed to create staff member"),
      );
    },
  });

  const onFinish = (values: CreateStaffDto) => {
    createMutation.mutate(values);
  };

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 10) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
    setPasswordStrength(Math.min(strength, 100));
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
          {t("staff:createStaff", "Create New Staff Member")}
        </Space>
      }
      width={500}
      onClose={onClose}
      open={open}
      footer={
        <div style={{ textAlign: "right" }}>
          <Button onClick={onClose} style={{ marginRight: 8 }}>
            {t("common:cancel", "Cancel")}
          </Button>
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={createMutation.isPending}
          >
            {t("common:create", "Create Staff")}
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
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
                message: t("staff:fullNameRequired", "Please enter full name"),
              },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder={t("staff:fullNamePlaceholder", "Enter full name")}
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
                message: t("staff:emailInvalid", "Please enter a valid email"),
              },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder={t("staff:emailPlaceholder", "Enter email address")}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={t("staff:password", "Password")}
            rules={[
              {
                required: true,
                min: 6,
                message: t(
                  "staff:passwordMinLength",
                  "Password must be at least 6 characters",
                ),
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t("staff:passwordPlaceholder", "Enter password")}
              size="large"
              onChange={(e) => checkPasswordStrength(e.target.value)}
            />
          </Form.Item>

          {passwordStrength > 0 && (
            <div style={{ marginTop: -16, marginBottom: 16 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t("staff:passwordStrength", "Password strength")}:
              </Text>
              <Progress
                percent={passwordStrength}
                size="small"
                strokeColor={
                  passwordStrength < 40
                    ? "#ff4d4f"
                    : passwordStrength < 70
                      ? "#faad14"
                      : "#52c41a"
                }
                showInfo={false}
              />
            </div>
          )}
        </div>

        <div style={{ marginBottom: 24 }}>
          <Title level={5}>
            <SafetyOutlined />{" "}
            {t("staff:rolePermissions", "Role & Permissions")}
          </Title>
          <Divider style={{ margin: "12px 0" }} />

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
              size="large"
              placeholder={t("staff:selectRole", "Select role")}
            />
          </Form.Item>
        </div>
      </Form>
    </Drawer>
  );
};
