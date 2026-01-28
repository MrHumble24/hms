import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Drawer,
  message,
} from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { roomApi, type RoomType } from "@/entities/room/api/room-api";
import { useTranslation } from "react-i18next";
import { FileUpload } from "@/shared/ui/file-upload";

interface RoomTypeFormProps {
  initialValues?: RoomType | null;
  open: boolean;
  onClose: () => void;
}

export const RoomTypeForm = ({
  initialValues,
  open,
  onClose,
}: RoomTypeFormProps) => {
  const { t } = useTranslation(["room-types", "common"]);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const isEdit = !!initialValues;

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (isEdit && initialValues?.id) {
        return roomApi.updateRoomType(initialValues.id, data);
      }
      return roomApi.createRoomType(data);
    },
    onSuccess: () => {
      message.success(
        isEdit ? t("common:saveSuccess") : t("common:createSuccess"),
      );
      queryClient.invalidateQueries({ queryKey: ["room-types"] });
      onClose();
    },
    onError: () => {
      message.error(t("common:error"));
    },
  });

  const onFinish = (values: any) => {
    mutation.mutate(values);
  };

  if (open && initialValues && !form.getFieldValue("name")) {
    form.setFieldsValue(initialValues);
  } else if (open && !initialValues) {
    form.resetFields();
  }

  return (
    <Drawer
      title={
        isEdit ? t("room-types:editRoomType") : t("room-types:addRoomType")
      }
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
          label={t("room-types:typeName")}
          rules={[{ required: true, message: t("room-types:typeReq") }]}
        >
          <Input placeholder="Deluxe Double" size="large" />
        </Form.Item>

        <Form.Item
          name="basePrice"
          label={t("room-types:basePrice")}
          rules={[{ required: true, message: t("room-types:priceReq") }]}
        >
          <InputNumber
            style={{ width: "100%" }}
            size="large"
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
          />
        </Form.Item>

        <Form.Item name="amenities" label={t("room-types:amenities")}>
          <Select
            mode="multiple"
            placeholder={t("room-types:selectAmenities")}
            size="large"
          >
            {Object.entries(
              t("room-types:amenityOptions", { returnObjects: true }),
            ).map(([key, label]) => (
              <Select.Option key={key} value={key}>
                {label as string}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="description" label={t("room-types:description")}>
          <Input.TextArea rows={4} size="large" />
        </Form.Item>

        <Form.Item name="images" label={t("room-types:photos")}>
          <FileUpload multiple maxCount={10} />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
