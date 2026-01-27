import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Drawer,
  message,
  Typography,
  Divider,
  Tag,
} from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  inventoryApi,
  type InventoryItem,
  type StockUpdateReason,
} from "@/entities/inventory/api/inventory-api";
import { useTranslation } from "react-i18next";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;
const { Option } = Select;

interface StockUpdateDrawerProps {
  item: InventoryItem | null;
  open: boolean;
  onClose: () => void;
}

export const StockUpdateDrawer = ({
  item,
  open,
  onClose,
}: StockUpdateDrawerProps) => {
  const { t } = useTranslation(["inventory", "common"]);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const change = Form.useWatch("change", form) || 0;
  const newStock = (item?.quantity || 0) + change;

  const mutation = useMutation({
    mutationFn: (data: any) => inventoryApi.updateStock(item!.id, data),
    onSuccess: () => {
      message.success(t("common:success"));
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      onClose();
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || t("common:error"));
    },
  });

  const onFinish = (values: any) => {
    mutation.mutate(values);
  };

  const reasons: StockUpdateReason[] = [
    "USED_IN_ROOM",
    "MINIBAR_REFILL",
    "DAMAGED_OR_LOST",
    "RESTOCKED",
    "CORRECTION",
    "OTHER",
  ];

  if (open && item) {
    // Reset form when opening for a new item
  }

  return (
    <Drawer
      title={`Update Stock: ${item?.name}`}
      width={400}
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
          >
            Confirm Update
          </Button>
        </Space>
      }
    >
      {item && (
        <div style={{ marginBottom: 24 }}>
          <Space direction="vertical" size={2}>
            <Text type="secondary">Product SKU</Text>
            <Text strong>{item.sku}</Text>
          </Space>
          <Divider style={{ margin: "12px 0" }} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text type="secondary">Current Balance</Text>
            <Title level={3} style={{ margin: 0 }}>
              {item.quantity} {item.unit}
            </Title>
          </div>
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ change: 1, reason: "RESTOCKED" }}
        requiredMark="optional"
      >
        <Form.Item
          name="change"
          label="Quantity Change (+ for restock, - for usage)"
          rules={[{ required: true }]}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Button
              icon={<MinusOutlined />}
              onClick={() =>
                form.setFieldsValue({
                  change: (form.getFieldValue("change") || 0) - 1,
                })
              }
            />
            <InputNumber style={{ flex: 1 }} size="large" placeholder="0" />
            <Button
              icon={<PlusOutlined />}
              onClick={() =>
                form.setFieldsValue({
                  change: (form.getFieldValue("change") || 0) + 1,
                })
              }
            />
          </div>
        </Form.Item>

        <Form.Item
          name="reason"
          label="Reason for Update"
          rules={[{ required: true }]}
        >
          <Select size="large">
            {reasons.map((r) => (
              <Option key={r} value={r}>
                {r.replace(/_/g, " ")}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="note" label="Note (Optional)">
          <Input.TextArea rows={3} placeholder="Add additional context..." />
        </Form.Item>

        <div
          style={{
            background: "#f9fafb",
            padding: "16px",
            borderRadius: 8,
            border: "1px solid #f0f0f0",
            marginTop: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text type="secondary">Projected Balance</Text>
            <Tag
              color={newStock < (item?.minThreshold || 0) ? "red" : "green"}
              style={{ fontSize: 16, padding: "4px 12px" }}
            >
              {newStock} {item?.unit}
            </Tag>
          </div>
        </div>
      </Form>
    </Drawer>
  );
};
