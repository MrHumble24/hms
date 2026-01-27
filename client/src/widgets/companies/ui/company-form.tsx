import {
  Form,
  Input,
  Switch,
  Button,
  Space,
  Drawer,
  message,
  Grid,
} from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  companiesApi,
  type Company,
} from "@/entities/companies/api/companies-api";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

interface CompanyFormProps {
  item: Company | null;
  open: boolean;
  onClose: () => void;
}

export const CompanyForm = ({ item, open, onClose }: CompanyFormProps) => {
  const { t } = useTranslation(["companies", "common"]);
  const screens = Grid.useBreakpoint();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const isEdit = !!item;

  useEffect(() => {
    if (open) {
      if (item) {
        form.setFieldsValue(item);
      } else {
        form.resetFields();
        form.setFieldsValue({ isActive: true });
      }
    }
  }, [open, item, form]);

  const mutation = useMutation({
    mutationFn: (data: any) =>
      isEdit ? companiesApi.update(item!.id, data) : companiesApi.create(data),
    onSuccess: () => {
      message.success(t("common:success"));
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      onClose();
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || t("common:error"));
    },
  });

  const onFinish = (values: any) => {
    mutation.mutate(values);
  };

  return (
    <Drawer
      title={
        isEdit
          ? t("companies:actions.editCompany")
          : t("companies:actions.addCompany")
      }
      width={screens.md ? 440 : "100%"}
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
          label={t("companies:fields.companyName")}
          rules={[{ required: true, message: t("common:required") }]}
        >
          <Input placeholder="e.g., Google Uzbekistan" size="large" />
        </Form.Item>

        <Form.Item
          name="taxId"
          label={t("companies:fields.taxId")}
          rules={[{ required: true, message: t("common:required") }]}
        >
          <Input placeholder="INN (9 digits)" size="large" />
        </Form.Item>

        <Form.Item
          name="contactPerson"
          label={t("companies:fields.contactPerson")}
        >
          <Input placeholder="Contact Name" size="large" />
        </Form.Item>

        <div style={{ display: "flex", gap: 16 }}>
          <Form.Item
            name="email"
            label={t("companies:fields.email")}
            rules={[{ type: "email" }]}
            style={{ flex: 1 }}
          >
            <Input placeholder="email@company.com" size="large" />
          </Form.Item>

          <Form.Item
            name="phone"
            label={t("companies:fields.phone")}
            style={{ flex: 1 }}
          >
            <Input placeholder="+998..." size="large" />
          </Form.Item>
        </div>

        <Form.Item
          name="isActive"
          label={t("companies:fields.status")}
          valuePropName="checked"
        >
          <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
