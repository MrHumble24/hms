import {
  Form,
  Input,
  Button,
  Card,
  Space,
  Row,
  Col,
  TimePicker,
  Select,
  message,
  Typography,
  InputNumber,
} from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { branchApi } from "@/entities/branch/api/branch-api";
import { useTenantStore } from "@/entities/tenant/model/tenant-store";
import { useTranslation } from "react-i18next";
import { LocalizedInput } from "@/shared/ui/localized-input";
import { FileUpload } from "@/shared/ui/file-upload";
import dayjs from "dayjs";
import { useEffect } from "react";

const { Option } = Select;
const { Text } = Typography;

export const BranchSettings = () => {
  const { t } = useTranslation(["common", "settings"]);
  const { activeBranchId } = useTenantStore();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: branch, isLoading } = useQuery({
    queryKey: ["branch", activeBranchId],
    queryFn: () => branchApi.getBranch(activeBranchId!),
    enabled: !!activeBranchId,
  });

  useEffect(() => {
    if (branch) {
      form.setFieldsValue({
        ...branch,
        checkInTime: branch.checkInTime
          ? dayjs(branch.checkInTime, "HH:mm")
          : null,
        checkOutTime: branch.checkOutTime
          ? dayjs(branch.checkOutTime, "HH:mm")
          : null,
      });
    }
  }, [branch, form]);

  const mutation = useMutation({
    mutationFn: (values: any) =>
      branchApi.updateBranch(activeBranchId!, values),
    onSuccess: () => {
      message.success(t("common:success"));
      queryClient.invalidateQueries({ queryKey: ["branch", activeBranchId] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || t("common:error"));
    },
  });

  const onFinish = (values: any) => {
    const formattedValues = {
      ...values,
      checkInTime: values.checkInTime
        ? values.checkInTime.format("HH:mm")
        : undefined,
      checkOutTime: values.checkOutTime
        ? values.checkOutTime.format("HH:mm")
        : undefined,
      latitude: values.latitude ? Number(values.latitude) : undefined,
      longitude: values.longitude ? Number(values.longitude) : undefined,
      isSetupCompleted: true, // Mark setup as completed when they save
    };
    mutation.mutate(formattedValues);
  };

  if (isLoading) return <div>Loading...</div>;
  if (!activeBranchId) return <div>Please select a branch first.</div>;

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{ currency: "USD" }}
    >
      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card title="Hotel Identity" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Display Name"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="e.g., Grand Palace Hotel" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="legalName" label="Legal Entity Name">
                  <Input placeholder="e.g., Grand Palace LLC" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="address" label="Physical Address">
                  <Input.TextArea rows={2} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="taxId" label="Tax ID / License Number">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="logoUrl" label="Hotel Logo">
                  <FileUpload accept="image/*" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <LocalizedInput label="Branch Description" name="description" />
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Contact Information" style={{ marginBottom: 24 }}>
            <Form.Item name="phone" label="Phone Number">
              <Input />
            </Form.Item>
            <Form.Item name="email" label="Email Address">
              <Input />
            </Form.Item>
            <Form.Item name="website" label="Website URL">
              <Input />
            </Form.Item>
          </Card>

          <Card title="Operational Settings" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="checkInTime" label="Check-in">
                  <TimePicker format="HH:mm" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="checkOutTime" label="Check-out">
                  <TimePicker format="HH:mm" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="currency" label="Default Currency">
                  <Select>
                    <Option value="USD">USD ($)</Option>
                    <Option value="UZS">UZS (so'm)</Option>
                    <Option value="RUB">RUB (₽)</Option>
                    <Option value="EUR">EUR (€)</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="Location Coordinates (Optional)">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="latitude" label="Latitude">
                  <InputNumber
                    placeholder="e.g., 41.2995"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="longitude" label="Longitude">
                  <InputNumber
                    placeholder="e.g., 69.2401"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Used for maps and guest navigation.
            </Text>
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 24, textAlign: "right" }}>
        <Space>
          <Button size="large">Reset</Button>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={mutation.isPending}
          >
            Save Hotel Configuration
          </Button>
        </Space>
      </div>
    </Form>
  );
};
