import {
  Drawer,
  Form,
  Input,
  Button,
  Space,
  message,
  InputNumber,
  Select,
} from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { restaurantApi } from "@/entities/restaurant";
import type { RestaurantMenuItem } from "@/entities/restaurant";
import { LocalizedInput } from "@/shared/ui/localized-input";
import { useTranslation } from "react-i18next";
import { BrainCircuit } from "lucide-react";
import { useState } from "react";

interface MenuItemFormProps {
  item: RestaurantMenuItem | null;
  open: boolean;
  onClose: () => void;
}

export const MenuItemForm = ({ item, open, onClose }: MenuItemFormProps) => {
  const { t } = useTranslation(["common", "restaurant"]);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [isEstimating, setIsEstimating] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["restaurant-categories"],
    queryFn: restaurantApi.getCategories,
  });

  const mutation = useMutation({
    mutationFn: (values: any) =>
      item
        ? restaurantApi.updateMenuItem(item.id, values)
        : restaurantApi.createMenuItem(values),
    onSuccess: () => {
      message.success(t("common:success"));
      queryClient.invalidateQueries({ queryKey: ["restaurant-menu-items"] });
      onClose();
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || t("common:error"));
    },
  });

  const handleEstimateCalories = async () => {
    const values = form.getFieldsValue();
    if (!values.name?.en || !values.ingredients) {
      message.warning(t("restaurant:menu.form.aiWarning"));
      return;
    }

    setIsEstimating(true);
    try {
      // In a real scenario, this might be a separate endpoint,
      // but here we can just "save" and let the backend do it if calories is empty.
      // Or we can create an endpoint if needed.
      // For now, I'll just show a message.
      message.info(t("restaurant:menu.form.aiEstimationInfo"));
    } finally {
      setIsEstimating(false);
    }
  };

  return (
    <Drawer
      title={
        item
          ? t("restaurant:menu.form.editItem")
          : t("restaurant:menu.form.newItem")
      }
      width={480}
      open={open}
      onClose={onClose}
      extra={
        <Space>
          <Button onClick={onClose}>{t("common:cancel")}</Button>
          <Button
            type="primary"
            onClick={() => form.submit()}
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
        initialValues={
          item || {
            name: { en: "", uz: "", ru: "" },
            description: { en: "", uz: "", ru: "" },
          }
        }
        onFinish={mutation.mutate}
      >
        <Form.Item
          name="categoryId"
          label={t("restaurant:menu.form.category")}
          rules={[{ required: true }]}
        >
          <Select placeholder={t("restaurant:menu.form.selectCategory")}>
            {categories.map((c) => (
              <Select.Option key={c.id} value={c.id}>
                {c.name.en || c.name.uz || Object.values(c.name)[0]}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <LocalizedInput
          label={t("restaurant:menu.form.itemName")}
          name="name"
          required
        />
        <LocalizedInput
          label={t("restaurant:menu.form.description")}
          name="description"
        />

        <Form.Item
          name="price"
          label={t("restaurant:menu.form.price")}
          rules={[{ required: true }]}
        >
          <InputNumber style={{ width: "100%" }} min={0} />
        </Form.Item>

        <Form.Item name="imageUrl" label={t("restaurant:menu.form.imageUrl")}>
          <Input placeholder="https://..." />
        </Form.Item>

        <Form.Item
          name="ingredients"
          label={t("restaurant:menu.form.ingredients")}
        >
          <Input.TextArea rows={3} placeholder="Eggs, milk, salt, pepper..." />
        </Form.Item>

        <Form.Item name="calories" label={t("restaurant:menu.form.calories")}>
          <Space.Compact style={{ width: "100%" }}>
            <InputNumber style={{ width: "calc(100% - 100px)" }} min={0} />
            <Button
              icon={<BrainCircuit size={16} />}
              onClick={handleEstimateCalories}
              loading={isEstimating}
            >
              AI
            </Button>
          </Space.Compact>
        </Form.Item>
      </Form>
    </Drawer>
  );
};
