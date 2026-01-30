import { Tag, Empty } from "antd";
import type {
  AvailabilityResponse,
  RoomTypeAvailability,
} from "@/shared/api/public-booking-api";

interface RoomsStepProps {
  availability: AvailabilityResponse;
  onSelectRoom: (room: RoomTypeAvailability) => void;
}

export function RoomsStep({ availability, onSelectRoom }: RoomsStepProps) {
  return (
    <div className="tg-discovery-container">
      <div className="tg-header">
        <h2>Choice of Rooms</h2>
        <p>{availability.roomTypes.length} types available for your dates</p>
      </div>

      <div className="tg-hotel-feed">
        {availability.roomTypes.length === 0 ? (
          <Empty description="No rooms available for these dates" />
        ) : (
          availability.roomTypes.map((room) => (
            <div
              key={room.id}
              className="tg-hotel-item"
              onClick={() => onSelectRoom(room)}
            >
              <div className="tg-hotel-item-content">
                <div className="tg-hotel-item-top">
                  <h3 className="tg-hotel-item-title">{room.name}</h3>
                  <span className="tg-hotel-item-price">
                    {availability.branch.currency}{" "}
                    {Number(room.basePrice).toLocaleString()}
                  </span>
                </div>
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ color: "var(--tg-hint)", fontSize: 13 }}>
                    Per night
                  </div>
                  <Tag
                    color="green"
                    style={{ borderRadius: 6, border: "none" }}
                  >
                    {room.availableRooms} rooms left
                  </Tag>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
