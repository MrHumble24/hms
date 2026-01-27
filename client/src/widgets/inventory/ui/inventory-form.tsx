import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Drawer,
  message,
  Divider,
} from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  inventoryApi,
  type InventoryItem,
  type InventoryCategory,
} from "@/entities/inventory/api/inventory-api";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

const { Option } = Select;

interface InventoryFormProps {
  item: InventoryItem | null;
  open: boolean;
  onClose: () => void;
}

export const InventoryForm = ({ item, open, onClose }: InventoryFormProps) => {
  const { t } = useTranslation(["inventory", "common"]);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const isEdit = !!item;

  useEffect(() => {
    if (open) {
      if (item) {
        form.setFieldsValue(item);
      } else {
        form.resetFields();
        form.setFieldsValue({
          quantity: 0,
          minThreshold: 5,
          category: "MINIBAR",
        });
      }
    }
  }, [open, item, form]);

  const mutation = useMutation({
    mutationFn: (data: any) =>
      isEdit ? inventoryApi.update(item!.id, data) : inventoryApi.create(data),
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

  const categories: InventoryCategory[] = [
    "MINIBAR",
    "HOUSEKEEPING",
    "MAINTENANCE",
    "KITCHEN",
    "OTHER",
  ];

  return (
    <Drawer
      title={
        isEdit
          ? t("inventory:actions.editItem") || "Edit Item"
          : t("inventory:actions.addNewItem")
      }
      width={440}
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
            {t("common:save")}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark="optional"
      >
        <Form.Item
          name="name"
          label={t("inventory:columns.itemName")}
          rules={[{ required: true, message: t("common:required") }]}
        >
          <Input placeholder="e.g., Coca-Cola 0.5L" size="large" />
        </Form.Item>

        <Form.Item
          name="sku"
          label="SKU / Identification"
          rules={[{ required: true, message: t("common:required") }]}
        >
          <Input
            placeholder="e.g., SOFT-COKE-05"
            size="large"
            disabled={isEdit}
          />
        </Form.Item>

        <Form.Item
          name="category"
          label={t("inventory:columns.category")}
          rules={[{ required: true }]}
        >
          <Select size="large">
            {categories.map((c) => (
              <Option key={c} value={c}>
                {t(`inventory:categories.${c}`) || c}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <div style={{ display: "flex", gap: 16 }}>
          <Form.Item
            name="unit"
            label={t("inventory:columns.unit")}
            rules={[{ required: true }]}
            style={{ flex: 1 }}
          >
            <Input placeholder="pcs, kg, L" size="large" />
          </Form.Item>

          <Form.Item
            name="minThreshold"
            label={t("inventory:columns.threshold")}
            rules={[{ required: true }]}
            style={{ flex: 1 }}
          >
            <InputNumber style={{ width: "100%" }} size="large" min={0} />
          </Form.Item>
        </div>

        {!isEdit && (
          <Form.Item
            name="quantity"
            label="Initial Stock Level"
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: "100%" }} size="large" min={0} />
          </Form.Item>
        )}

        <Divider />
        <p style={{ color: "#8c8c8c", fontSize: "12px" }}>
          {isEdit
            ? "Note: Changing metadata will not log a stock movement. Use the 'Update Stock' action for inventory changes."
            : "Adding a new item will initialize it in the system with the specified stock level."}
        </p>
      </Form>
    </Drawer>
  );
};
