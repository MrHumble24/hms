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
  Tooltip,
} from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  inventoryApi,
  type InventoryItem,
  type InventoryCategory,
} from "@/entities/inventory/api/inventory-api";
import { useTranslation } from "react-i18next";
import { useEffect, useCallback } from "react";
import { SyncOutlined } from "@ant-design/icons";

const { Option } = Select;

interface InventoryFormProps {
  item: InventoryItem | null;
  open: boolean;
  onClose: () => void;
}

// Category prefixes for SKU generation
const categoryPrefixes: Record<InventoryCategory, string> = {
  MINIBAR: "MB",
  HOUSEKEEPING: "HK",
  MAINTENANCE: "MT",
  KITCHEN: "KT",
  OTHER: "OT",
};

// Generate a unique SKU based on category and name
const generateSku = (category: InventoryCategory, name: string): string => {
  const prefix = categoryPrefixes[category] || "XX";

  // Create a slug from the name (first 3-4 chars, uppercase)
  const nameSlug = name
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special chars
    .split(/\s+/) // Split by whitespace
    .map((word) => word.substring(0, 3).toUpperCase()) // Take first 3 chars of each word
    .slice(0, 2) // Take first 2 words max
    .join("");

  // Add a unique suffix (last 4 chars of timestamp)
  const uniqueSuffix = Date.now().toString(36).slice(-4).toUpperCase();

  return `${prefix}-${nameSlug || "ITEM"}-${uniqueSuffix}`;
};

export const InventoryForm = ({ item, open, onClose }: InventoryFormProps) => {
  const { t } = useTranslation(["inventory", "common"]);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const isEdit = !!item;

  // Auto-generate SKU when name or category changes (only for new items)
  const regenerateSku = useCallback(() => {
    const name = form.getFieldValue("name") || "";
    const category = form.getFieldValue("category") || "OTHER";
    const newSku = generateSku(category, name);
    form.setFieldsValue({ sku: newSku });
  }, [form]);

  useEffect(() => {
    if (open) {
      if (item) {
        form.setFieldsValue(item);
      } else {
        form.resetFields();
        const defaultCategory = "MINIBAR";
        const defaultSku = generateSku(defaultCategory, "");
        form.setFieldsValue({
          quantity: 0,
          minThreshold: 5,
          category: defaultCategory,
          sku: defaultSku,
        });
      }
    }
  }, [open, item, form]);

  // Watch for name and category changes to auto-update SKU (only for new items)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEdit) {
      const name = e.target.value;
      const category = form.getFieldValue("category") || "OTHER";
      // Only auto-update if the current SKU looks auto-generated (has the prefix pattern)
      const currentSku = form.getFieldValue("sku") || "";
      if (!currentSku || currentSku.match(/^[A-Z]{2}-[A-Z]*-[A-Z0-9]{4}$/)) {
        const newSku = generateSku(category, name);
        form.setFieldsValue({ sku: newSku });
      }
    }
  };

  const handleCategoryChange = (category: InventoryCategory) => {
    if (!isEdit) {
      const name = form.getFieldValue("name") || "";
      const currentSku = form.getFieldValue("sku") || "";
      // Only auto-update if the current SKU looks auto-generated
      if (!currentSku || currentSku.match(/^[A-Z]{2}-[A-Z]*-[A-Z0-9]{4}$/)) {
        const newSku = generateSku(category, name);
        form.setFieldsValue({ sku: newSku });
      }
    }
  };

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
          <Input
            placeholder="e.g., Coca-Cola 0.5L"
            size="large"
            onChange={handleNameChange}
          />
        </Form.Item>

        <Form.Item
          name="sku"
          label="SKU / Identification"
          rules={[{ required: true, message: t("common:required") }]}
          extra={
            !isEdit &&
            "Auto-generated based on category and name. You can customize it."
          }
        >
          <Input
            placeholder="e.g., MB-COKE-A1B2"
            size="large"
            suffix={
              !isEdit && (
                <Tooltip title="Regenerate SKU">
                  <SyncOutlined
                    onClick={regenerateSku}
                    style={{ cursor: "pointer", color: "#1890ff" }}
                  />
                </Tooltip>
              )
            }
          />
        </Form.Item>

        <Form.Item
          name="category"
          label={t("inventory:columns.category")}
          rules={[{ required: true }]}
        >
          <Select size="large" onChange={handleCategoryChange}>
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
            <Select size="large" placeholder="Select unit">
              <Option value="pcs">pcs (Pieces)</Option>
              <Option value="kg">kg (Kilograms)</Option>
              <Option value="L">L (Liters)</Option>
              <Option value="pack">pack (Pack)</Option>
              <Option value="box">box (Box)</Option>
              <Option value="gram">g (Grams)</Option>
            </Select>
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

        <Divider style={{ margin: "16px 0" }}>Price Configuration</Divider>

        <div style={{ display: "flex", gap: 16 }}>
          <Form.Item
            name="purchasePrice"
            label="Purchase Price (Cost)"
            style={{ flex: 1 }}
          >
            <InputNumber
              style={{ width: "100%" }}
              size="large"
              min={0}
              precision={2}
              prefix="$"
            />
          </Form.Item>

          <Form.Item
            name="sellPrice"
            label="Sell Price (Retail)"
            style={{ flex: 1 }}
          >
            <InputNumber
              style={{ width: "100%" }}
              size="large"
              min={0}
              precision={2}
              prefix="$"
            />
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
