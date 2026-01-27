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
  Checkbox,
  Divider,
} from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { financeApi, FolioStatus } from "@/entities/finance/api/finance-api";
import { useTranslation } from "react-i18next";
import {
  WarningOutlined,
  CheckCircleOutlined,
  LockOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;
const { Option } = Select;

interface RecordPaymentFormProps {
  folioId: string;
  status: FolioStatus;
  outstandingBalance: number;
  open: boolean;
  onClose: () => void;
}

export const RecordPaymentForm = ({
  folioId,
  status,
  outstandingBalance,
  open,
  onClose,
}: RecordPaymentFormProps) => {
  const { t } = useTranslation(["finance", "common"]);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const amount = Form.useWatch("amount", form) || 0;
  const isOverpaying = amount > outstandingBalance;
  const isSettlingFull = amount === outstandingBalance;
  const isClosed = status === FolioStatus.CLOSED;

  const mutation = useMutation({
    mutationFn: (data: any) => financeApi.recordPayment(folioId, data),
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
    // Remove settleFull as it's only a UI helper, not part of the DTO
    const { settleFull, ...paymentData } = values;
    mutation.mutate(paymentData);
  };

  const handleSettleFull = (e: any) => {
    if (e.target.checked) {
      form.setFieldsValue({ amount: outstandingBalance });
    }
  };

  return (
    <Drawer
      title={t("finance:forms.payment.title")}
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
            danger={isOverpaying}
            disabled={isClosed}
          >
            {t("finance:actions.recordPayment")}
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

      <div
        style={{
          background: isClosed ? "#f5f5f5" : "#f0f7ff",
          padding: "20px",
          borderRadius: 12,
          marginBottom: 24,
          textAlign: "center",
          border: isClosed ? "1px solid #d9d9d9" : "1px solid #bae0ff",
          opacity: isClosed ? 0.7 : 1,
        }}
      >
        <Text type="secondary" style={{ display: "block", marginBottom: 4 }}>
          {t("finance:forms.payment.outstandingLabel")}
        </Text>
        <Title
          level={2}
          style={{ margin: 0, color: isClosed ? "#434343" : "#0958d9" }}
        >
          {new Intl.NumberFormat().format(outstandingBalance)} UZS
        </Title>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ method: "CASH", currency: "UZS" }}
        disabled={isClosed}
        requiredMark="optional"
      >
        <Form.Item
          name="amount"
          label={t("finance:columns.amount")}
          rules={[{ required: true, message: t("common:required") }]}
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

        <Form.Item name="settleFull" valuePropName="checked">
          <Checkbox onChange={handleSettleFull}>
            {t("finance:forms.payment.partialFull")}
          </Checkbox>
        </Form.Item>

        <Form.Item
          name="currency"
          label={t("finance:columns.currency")}
          rules={[{ required: true }]}
        >
          <Select size="large">
            {["UZS", "USD", "EUR", "RUB"].map((c) => (
              <Option key={c} value={c}>
                {c}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="method"
          label={t("finance:columns.method")}
          rules={[{ required: true }]}
        >
          <Select size="large">
            {[
              "CASH",
              "UZCARD",
              "HUMO",
              "VISA_MASTERCARD",
              "CLICK",
              "PAYME",
              "BANK_TRANSFER",
            ].map((m) => (
              <Option key={m} value={m}>
                {m}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="transactionRef" label="Transaction Reference / Note">
          <Input placeholder="Receipt # or Card Auth Code" size="large" />
        </Form.Item>

        {isOverpaying && (
          <Alert
            message={t("finance:forms.payment.overpaymentWarning")}
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            style={{ marginBottom: 24 }}
          />
        )}

        {isSettlingFull && (
          <Alert
            message="This payment will fully settle the current folio balance."
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            style={{ marginBottom: 24 }}
          />
        )}

        <Divider />
        <Text type="secondary" style={{ fontSize: 12 }}>
          Confirmation: Recorded payments are audit-tracked. Ensure the physical
          transaction is successful before submitting.
        </Text>
      </Form>
    </Drawer>
  );
};
