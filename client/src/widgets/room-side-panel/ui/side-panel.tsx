import {
  Drawer,
  Typography,
  Descriptions,
  Badge,
  Button,
  Space,
  Divider,
  Empty,
  Tag,
  Card,
} from "antd";
import {
  CheckCircleOutlined,
  ToolOutlined,
  UserOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { type RoomDashboardItem, roomApi } from "@/entities/room/api/room-api";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

interface RoomSidePanelProps {
  room: RoomDashboardItem | null;
  onClose: () => void;
}

export const RoomSidePanel = ({ room, onClose }: RoomSidePanelProps) => {
  const { t } = useTranslation(["rooms", "common"]);
  const queryClient = useQueryClient();
  const activeBooking = room?.bookings?.[0];
  const maintenance = room?.maintenance?.[0];

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      roomApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms-dashboard"] });
      onClose();
    },
  });

  if (!room) return null;

  return (
    <Drawer
      title={
        <Space size="middle">
          <Title level={4} style={{ margin: 0 }}>
            {t("rooms:floor")} {room.number}
          </Title>
          <Tag color="blue">{room.type.name}</Tag>
        </Space>
      }
      placement="right"
      width={480}
      onClose={onClose}
      open={!!room}
      bodyStyle={{ paddingBottom: 80 }}
      extra={
        <Space>
          <Button onClick={onClose}>{t("common:cancel")}</Button>
        </Space>
      }
    >
      {/* Status Controller Area */}
      <div style={{ marginBottom: 32 }}>
        <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
          {t("rooms:roomStatus")}
        </Text>
        <Space wrap size={12}>
          <Button
            type={room.status === "CLEAN" ? "primary" : "default"}
            icon={<CheckCircleOutlined />}
            onClick={() => mutation.mutate({ id: room.id, status: "CLEAN" })}
          >
            {t("rooms:markAsCleaned")}
          </Button>
          <Button
            type={room.status === "DIRTY" ? "primary" : "default"}
            danger={room.status === "DIRTY"}
            onClick={() => mutation.mutate({ id: room.id, status: "DIRTY" })}
          >
            {t("rooms:markAsDirty")}
          </Button>
          <Button
            type={room.status === "MAINTENANCE" ? "primary" : "default"}
            icon={<ToolOutlined />}
            onClick={() =>
              mutation.mutate({ id: room.id, status: "MAINTENANCE" })
            }
          >
            {t("rooms:setToMaintenance")}
          </Button>
        </Space>
      </div>

      <Divider />

      {/* Guest Info Section */}
      <section style={{ marginBottom: 32 }}>
        <Title level={5}>
          <UserOutlined style={{ marginRight: 8 }} />
          {t("rooms:currentOccupancy")}
        </Title>
        {activeBooking && activeBooking.guest ? (
          <Card
            style={{
              borderRadius: 8,
              background: "#f0faff",
              border: "1px solid #e6f7ff",
            }}
            bodyStyle={{ padding: "16px" }}
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Guest">
                {activeBooking.guest.firstName} {activeBooking.guest.lastName}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {activeBooking.guest.phone}
              </Descriptions.Item>
              <Descriptions.Item label="Dates">
                <Text strong>
                  {activeBooking.checkIn
                    ? new Date(activeBooking.checkIn).toLocaleDateString()
                    : ""}
                </Text>
                <Text type="secondary"> to </Text>
                <Text strong>
                  {activeBooking.checkOut
                    ? new Date(activeBooking.checkOut).toLocaleDateString()
                    : ""}
                </Text>
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 12 }}>
              <Button type="link" size="small" icon={<FileTextOutlined />}>
                {t("rooms:viewFolio")}
              </Button>
            </div>
          </Card>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t("rooms:unoccupied")}
          />
        )}
      </section>

      <Divider />

      {/* Maintenance / Issues Section */}
      <section>
        <Title level={5}>
          <ToolOutlined style={{ marginRight: 8 }} />
          {t("rooms:serviceIssues")}
        </Title>
        {maintenance ? (
          <Card
            style={{
              borderRadius: 8,
              background: "#fff1f0",
              border: "1px solid #ffa39e",
            }}
            bodyStyle={{ padding: "16px" }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text strong>{maintenance.description}</Text>
              <Space>
                <Badge status="error" text="Active Maintenance Ticket" />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Reported at 2:00 PM
                </Text>
              </Space>
              <Button
                type="primary"
                size="small"
                block
                style={{ marginTop: 8 }}
              >
                View Full Ticket
              </Button>
            </Space>
          </Card>
        ) : (
          <Text type="secondary">{t("rooms:noIssues")}</Text>
        )}
      </section>

      {/* Bottom Actions */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "16px 24px",
          background: "#fff",
          borderTop: "1px solid #f0f0f0",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Button size="large">{t("rooms:internalNote")}</Button>
        <Button size="large" type="primary">
          {t("rooms:viewReservation")}
        </Button>
      </div>
    </Drawer>
  );
};
