import {
  Form,
  Input,
  Button,
  Space,
  Drawer,
  message,
  Radio,
  Timeline,
  Tag,
  Typography,
} from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  housekeepingApi,
  RoomStatus,
} from "@/entities/housekeeping/api/housekeeping-api";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/entities/user/model/auth-store";

const { Text, Title } = Typography;

interface RoomStatusDrawerProps {
  room: any | null;
  open: boolean;
  onClose: () => void;
}

export const RoomStatusDrawer = ({
  room,
  open,
  onClose,
}: RoomStatusDrawerProps) => {
  const { t } = useTranslation(["housekeeping", "common", "rooms"]);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const mutation = useMutation({
    mutationFn: (values: any) =>
      housekeepingApi.updateRoomStatus(
        room.id,
        values.status,
        user!.id,
        values.notes,
      ),
    onSuccess: async () => {
      message.success(t("common:success"));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["housekeeping"] }),
        queryClient.invalidateQueries({ queryKey: ["rooms"] }),
        queryClient.invalidateQueries({ queryKey: ["housekeeping-rooms"] }),
      ]);
      await queryClient.refetchQueries({ queryKey: ["housekeeping-rooms"] });
      onClose();
      form.resetFields();
    },
    onError: () => message.error(t("common:error")),
  });

  const onFinish = (values: any) => {
    mutation.mutate(values);
  };

  const statusColors: Record<string, string> = {
    [RoomStatus.CLEAN]: "green",
    [RoomStatus.DIRTY]: "red",
    [RoomStatus.INSPECTED]: "blue",
    [RoomStatus.MAINTENANCE]: "gray",
  };

  return (
    <Drawer
      title={room ? `${t("common:room")} ${room.number}` : ""}
      width={400}
      onClose={onClose}
      open={open}
      styles={{ body: { paddingBottom: 80 } }}
    >
      {room && (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <Tag
              color={statusColors[room.status]}
              style={{ fontSize: 16, padding: "4px 12px" }}
            >
              {room.status}
            </Tag>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">{room.type?.name}</Text>
            </div>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ status: room.status }}
          >
            <Form.Item
              name="status"
              label={t("housekeeping:actions.updateStatus")}
            >
              <Radio.Group buttonStyle="solid" style={{ width: "100%" }}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Radio.Button
                    value={RoomStatus.CLEAN}
                    style={{ width: "100%", textAlign: "center" }}
                  >
                    {t("housekeeping:status.clean")}
                  </Radio.Button>
                  <Radio.Button
                    value={RoomStatus.DIRTY}
                    style={{ width: "100%", textAlign: "center" }}
                  >
                    {t("housekeeping:status.dirty")}
                  </Radio.Button>
                  <Radio.Button
                    value={RoomStatus.INSPECTED}
                    style={{ width: "100%", textAlign: "center" }}
                  >
                    {t("housekeeping:status.inspected")}
                  </Radio.Button>
                  <Radio.Button
                    value={RoomStatus.MAINTENANCE}
                    style={{ width: "100%", textAlign: "center" }}
                  >
                    {t("housekeeping:status.maintenance")}
                  </Radio.Button>
                </Space>
              </Radio.Group>
            </Form.Item>

            <Form.Item name="notes" label={t("housekeeping:fields.notes")}>
              <Input.TextArea
                rows={3}
                placeholder={t("housekeeping:placeholders.notes")}
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={mutation.isPending}
              size="large"
            >
              {t("common:save")}
            </Button>
          </Form>

          <Title level={5} style={{ marginTop: 16 }}>
            {t("housekeeping:history")}
          </Title>
          <Timeline
            items={[
              {
                color: "green",
                children: (
                  <>
                    <Text strong>Cleaned</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Today, 10:30 AM - Aziza
                    </Text>
                  </>
                ),
              },
              {
                color: "red",
                children: (
                  <>
                    <Text strong>Checkout (Dirty)</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Today, 09:15 AM - System
                    </Text>
                  </>
                ),
              },
            ]}
          />
        </Space>
      )}
    </Drawer>
  );
};
