import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Drawer,
  message,
  Alert,
  Typography,
  Divider,
} from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { financeApi, FolioStatus } from "@/entities/finance/api/finance-api";
import { useTranslation } from "react-i18next";
import { InfoCircleOutlined, LockOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;
const { Option } = Select;

interface AddChargeFormProps {
  folioId: string;
  status: FolioStatus;
  open: boolean;
  onClose: () => void;
}

export const AddChargeForm = ({
  folioId,
  status,
  open,
  onClose,
}: AddChargeFormProps) => {
  const { t } = useTranslation(["finance", "common"]);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const amount = Form.useWatch("amount", form) || 0;
  const quantity = Form.useWatch("quantity", form) || 1;
  const totalPrice = amount * quantity;
  const isClosed = status === FolioStatus.CLOSED;

  const mutation = useMutation({
    mutationFn: (data: any) => financeApi.addItem(folioId, data),
    onSuccess: () => {
      message.success(t("common:success"));
      queryClient.invalidateQueries({ queryKey: ["folio", folioId] });
      queryClient.invalidateQueries({ queryKey: ["folio-balance", folioId] });
      onClose();
    },
    onError: () => {
      message.error(t("common:error"));
    },
  });

  const onFinish = (values: any) => {
    const { amount, ...rest } = values;
    mutation.mutate({
      ...rest,
      unitPrice: amount,
      totalAmount: amount * (values.quantity || 1),
    });
  };

  if (open) {
    // Reset or set defaults if needed when opening
  }

  return (
    <Drawer
      title={t("finance:forms.charge.title")}
      width={480}
      onClose={onClose}
      open={open}
      styles={{ body: { paddingBottom: 80 } }}
      extra={
        <Space>
          <Button onClick={onClose}>{t("common:cancel")}</Button>
          <Button
            onClick={() => form.submit()}
            type="primary"
            loading={mutation.isPending}
            disabled={isClosed}
          >
            {t("common:add")}
          </Button>
        </Space>
      }
    >
      {isClosed && (
        <Alert
          message={t("finance:warnings.folioClosedTitle")}
          description={t("finance:warnings.folioClosedDescription")}
          type="error"
          showIcon
          icon={<LockOutlined />}
          style={{ marginBottom: 24, borderRadius: 12 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ quantity: 1, type: "MINIBAR" }}
        disabled={isClosed}
        requiredMark="optional"
      >
        <Form.Item
          name="type"
          label={t("finance:columns.type")}
          rules={[{ required: true }]}
        >
          <Select size="large">
            {Object.keys(t("finance:types", { returnObjects: true })).map(
              (key) => (
                <Option key={key} value={key}>
                  {t(`finance:types.${key}`)}
                </Option>
              ),
            )}
          </Select>
        </Form.Item>

        <Form.Item
          name="description"
          label={t("finance:columns.description")}
          rules={[{ required: true, message: t("common:required") }]}
        >
          <Input placeholder="e.g., Mini-bar Coke 0.5L" size="large" />
        </Form.Item>

        <div style={{ display: "flex", gap: 16 }}>
          <Form.Item
            name="amount"
            label={t("finance:columns.amount")}
            rules={[{ required: true }]}
            style={{ flex: 2 }}
          >
            <InputNumber
              style={{ width: "100%" }}
              size="large"
              placeholder="0.00"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
            />
          </Form.Item>

          <Form.Item
            name="quantity"
            label={t("finance:columns.qty")}
            rules={[{ required: true }]}
            style={{ flex: 1 }}
          >
            <InputNumber style={{ width: "100%" }} size="large" min={1} />
          </Form.Item>
        </div>

        <div
          style={{
            background: "#f9fafb",
            padding: "16px",
            borderRadius: 8,
            marginBottom: 24,
            border: "1px solid #f0f0f0",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text type="secondary">
              {t("finance:forms.charge.pricePreview")}
            </Text>
            <Title level={4} style={{ margin: 0, color: "#1677ff" }}>
              {new Intl.NumberFormat().format(totalPrice)} UZS
            </Title>
          </div>
        </div>

        <Alert
          message={t("finance:forms.charge.nonReversible")}
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: 24 }}
        />

        <Divider />
        <Text type="secondary" style={{ fontSize: 12 }}>
          Audit: This charge will be logged under your account and timestamped.
        </Text>
      </Form>
    </Drawer>
  );
};
