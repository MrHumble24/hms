import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Drawer,
  message,
  Switch,
  Divider,
} from "antd";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { roomApi, type RoomDashboardItem } from "@/entities/room/api/room-api";
import { useTranslation } from "react-i18next";
import { FileUpload } from "@/shared/ui/file-upload";

const { Option } = Select;

interface RoomFormProps {
  initialValues?: RoomDashboardItem | null;
  open: boolean;
  onClose: () => void;
}

export const RoomForm = ({ initialValues, open, onClose }: RoomFormProps) => {
  const { t } = useTranslation(["inventory", "common"]);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const isEdit = !!initialValues;

  const { data: types = [] } = useQuery({
    queryKey: ["room-types"],
    queryFn: roomApi.getAllRoomTypes,
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (isEdit && initialValues?.id) {
        return roomApi.updateRoom(initialValues.id, data);
      }
      return roomApi.createRoom(data);
    },
    onSuccess: () => {
      message.success(
        isEdit ? t("common:saveSuccess") : t("common:createSuccess"),
      );
      queryClient.invalidateQueries({ queryKey: ["rooms-inventory"] });
      onClose();
    },
    onError: () => {
      message.error(t("common:error"));
    },
  });

  const onFinish = (values: any) => {
    mutation.mutate(values);
  };

  if (open && initialValues && !form.getFieldValue("number")) {
    form.setFieldsValue({
      ...initialValues,
      typeId: initialValues.type.id,
    });
  } else if (open && !initialValues) {
    form.resetFields();
  }

  return (
    <Drawer
      title={isEdit ? t("inventory:editRoom") : t("inventory:addRoom")}
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
          name="number"
          label={t("inventory:roomNumber")}
          rules={[{ required: true, message: t("inventory:roomNumReq") }]}
        >
          <Input placeholder="101" size="large" />
        </Form.Item>

        <Form.Item
          name="floor"
          label={t("inventory:floor")}
          rules={[{ required: true, message: t("inventory:floorReq") }]}
        >
          <InputNumber style={{ width: "100%" }} size="large" min={1} />
        </Form.Item>

        <Form.Item
          name="capacity"
          label={t("inventory:capacity")}
          rules={[{ required: true }]}
          initialValue={2}
        >
          <InputNumber style={{ width: "100%" }} size="large" min={1} />
        </Form.Item>

        <Form.Item
          name="typeId"
          label={t("inventory:roomType")}
          rules={[{ required: true }]}
        >
          <Select size="large" placeholder="Select category">
            {types.map((type) => (
              <Option key={type.id} value={type.id}>
                {type.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Divider
          orientation={"left" as any}
          style={{ fontSize: 13, color: "#8c8c8c" }}
        >
          Gallery & Visuals
        </Divider>

        <Form.Item
          name="isGalleryInherited"
          label="Inherit Category Photos?"
          valuePropName="checked"
          initialValue={true}
          extra="If enabled, this room will show all photos from its Room Category."
        >
          <Switch checkedChildren="Yes" unCheckedChildren="No" />
        </Form.Item>

        <Form.Item
          name="images"
          label="Room-Specific Photos"
          extra="Additional photos specific to this room (e.g., specific view or corner details)."
        >
          <FileUpload multiple maxCount={5} />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
