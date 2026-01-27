import { Card, Tag, Space, Typography, Tooltip } from "antd";
import {
  UserOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { type RoomDashboardItem } from "@/entities/room/api/room-api";

const { Text, Title } = Typography;

interface RoomCardProps {
  room: RoomDashboardItem;
  onClick: (room: RoomDashboardItem) => void;
}

export const RoomCard = ({ room, onClick }: RoomCardProps) => {
  const activeBooking = room.bookings?.[0];
  const activeTask = room.tasks?.[0];
  const maintenanceTicket = room.maintenance?.[0];

  // Professional status colors
  const getStatusColor = () => {
    if (maintenanceTicket || room.status === "MAINTENANCE") return "#ff4d4f"; // Red -> Out of service
    if (room.status === "DIRTY") return "#faad14"; // Yellow -> Cleaning
    if (activeBooking) return "#1677ff"; // Blue -> Occupied
    return "#52c41a"; // Green -> Available
  };

  const backgroundColor = getStatusColor();

  return (
    <Card
      hoverable
      bodyStyle={{ padding: "16px", position: "relative", overflow: "hidden" }}
      style={{
        height: "100%",
        borderRadius: 12,
        border: "none",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      }}
      onClick={() => onClick(room)}
    >
      {/* Visual Indicator Line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: backgroundColor,
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            {room.number}
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {room.type.name}
          </Text>
        </div>
        <div style={{ textAlign: "right" }}>
          <Tag
            color={backgroundColor}
            style={{ margin: 0, borderRadius: 4, fontWeight: 600 }}
          >
            {activeBooking ? "OCCUPIED" : room.status}
          </Tag>
        </div>
      </div>

      <div style={{ minHeight: 40, marginBottom: 16 }}>
        {activeBooking && activeBooking.guest ? (
          <Space>
            <UserOutlined style={{ color: "#8c8c8c" }} />
            <Text strong style={{ fontSize: 13 }}>
              {activeBooking.guest.firstName} {activeBooking.guest.lastName}
            </Text>
          </Space>
        ) : (
          <Text italic type="secondary" style={{ fontSize: 13 }}>
            Available
          </Text>
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid #f0f0f0",
          paddingTop: 12,
        }}
      >
        <Space size={12}>
          {activeTask && (
            <Tooltip title="Cleaning in progress">
              <ClockCircleOutlined style={{ color: "#faad14", fontSize: 16 }} />
            </Tooltip>
          )}
          {maintenanceTicket && (
            <Tooltip title="Maintenance Required">
              <AlertOutlined style={{ color: "#ff4d4f", fontSize: 16 }} />
            </Tooltip>
          )}
          {!activeBooking && room.status === "CLEAN" && (
            <Tooltip title="Ready for Guest">
              <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />
            </Tooltip>
          )}
        </Space>

        <Text type="secondary" style={{ fontSize: 11 }}>
          Floor {room.floor}
        </Text>
      </div>
    </Card>
  );
};
