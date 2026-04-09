import { Tag, Empty, Button, Skeleton } from "antd";
import { UserOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { publicBookingApi } from "@/shared/api/public-booking-api";
import { useTelegram } from "@/shared/hooks/use-telegram";
import type {
  AvailabilityResponse,
  RoomTypeAvailability,
} from "@/shared/api/public-booking-api";

interface RoomsStepProps {
  availability: AvailabilityResponse | null;
  loading?: boolean;
  onSelectRoom: (room: RoomTypeAvailability) => void;
}

export function RoomsStep({
  availability,
  loading,
  onSelectRoom,
}: RoomsStepProps) {
  const { haptic } = useTelegram();

  return (
    <div className="tg-step-content">
      <div className="tg-header-top" style={{ marginBottom: 24 }}>
        <h2 className="tg-section-title" style={{ margin: 0 }}>
          Choice of Rooms
        </h2>
        {loading ? (
          <Skeleton.Button active style={{ width: 100, height: 24 }} />
        ) : (
          <Tag
            color="blue"
            style={{ borderRadius: 12, padding: "2px 10px", fontWeight: 600 }}
          >
            {availability?.roomTypes.length || 0} Available
          </Tag>
        )}
      </div>

      <div className="tg-hotel-list" style={{ padding: 0 }}>
        {loading ? (
          [1, 2].map((i) => (
            <div key={i} className="tg-hotel-card">
              <Skeleton.Button
                active
                style={{ width: "100%", height: 160, borderRadius: 0 }}
              />
              <div className="tg-hotel-details" style={{ padding: 16 }}>
                <Skeleton active paragraph={{ rows: 3 }} />
              </div>
            </div>
          ))
        ) : !availability || availability.roomTypes.length === 0 ? (
          <Empty
            description="No rooms available for these dates"
            style={{ marginTop: 40 }}
          />
        ) : (
          availability.roomTypes.map((room) => (
            <div
              key={room.id}
              className="tg-hotel-card"
              onClick={() => {
                onSelectRoom(room);
                haptic("selection");
              }}
              style={{ cursor: "pointer" }}
            >
              <div className="tg-hotel-image-container" style={{ height: 160 }}>
                <img
                  src={publicBookingApi.resolveImageUrl(
                    room.images?.[0] || null,
                  )}
                  alt={room.name}
                  className="tg-hotel-image"
                />
                <div
                  className="tg-hotel-badge"
                  style={{
                    background: "rgba(24, 144, 255, 0.9)",
                    color: "#fff",
                  }}
                >
                  {room.availableRooms} LEFT
                </div>
              </div>

              <div className="tg-hotel-details" style={{ padding: 16 }}>
                <div className="tg-hotel-row">
                  <h4 className="tg-hotel-name" style={{ fontSize: 18 }}>
                    {room.name}
                  </h4>
                  <div className="tg-hotel-price-tag">
                    <span className="tg-price-amount" style={{ fontSize: 20 }}>
                      {Number(room.basePrice).toLocaleString()}
                    </span>
                    <span className="tg-price-unit">
                      {availability.branch.currency} / night
                    </span>
                  </div>
                </div>

                {room.description && (
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--tg-hint)",
                      margin: "8px 0",
                      lineHeight: "1.4",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {room.description}
                  </p>
                )}

                <div
                  className="tg-hotel-meta"
                  style={{ marginTop: 12, flexWrap: "wrap" }}
                >
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <UserOutlined /> Up to 2 Guests
                  </span>
                  {room.amenities &&
                    room.amenities.slice(0, 3).map((amenity, i) => (
                      <span
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <CheckCircleOutlined style={{ color: "#52c41a" }} />{" "}
                        {amenity}
                      </span>
                    ))}
                </div>

                <Button
                  type="primary"
                  block
                  size="large"
                  style={{
                    marginTop: 16,
                    borderRadius: 10,
                    height: 48,
                    fontWeight: 700,
                    boxShadow: "0 4px 10px rgba(24, 144, 255, 0.2)",
                  }}
                >
                  Select Room
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
