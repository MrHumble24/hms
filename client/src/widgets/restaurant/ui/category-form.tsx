import { Drawer, Form, Button, Space, message } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { restaurantApi } from "@/entities/restaurant";
import type { RestaurantCategory } from "@/entities/restaurant";
import { LocalizedInput } from "@/shared/ui/localized-input";
import { useTranslation } from "react-i18next";

interface CategoryFormProps {
  category: RestaurantCategory | null;
  open: boolean;
  onClose: () => void;
}

export const CategoryForm = ({
  category,
  open,
  onClose,
}: CategoryFormProps) => {
  const { t } = useTranslation(["common", "restaurant"]);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (values: any) =>
      category
        ? restaurantApi.updateCategory(category.id, values)
        : restaurantApi.createCategory(values),
    onSuccess: () => {
      message.success(t("common:success"));
      queryClient.invalidateQueries({ queryKey: ["restaurant-categories"] });
      onClose();
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || t("common:error"));
    },
  });

  return (
    <Drawer
      title={
        category
          ? t("restaurant:menu.form.editCategory")
          : t("restaurant:menu.form.newCategory")
      }
      width={400}
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
        initialValues={category || { name: { en: "", uz: "", ru: "" } }}
        onFinish={mutation.mutate}
      >
        <LocalizedInput
          label={t("restaurant:menu.table.name")}
          name="name"
          required
        />
      </Form>
    </Drawer>
  );
};
