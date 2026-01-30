import { Card, Tag, Empty } from "antd";
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
    <div className="tg-rooms-section">
      <div className="tg-section-header">
        <h2>Select Room</h2>
        <p>
          {availability.nights} nights · {availability.checkIn} →{" "}
          {availability.checkOut}
        </p>
      </div>

      {availability.roomTypes.length === 0 ? (
        <Empty description="No rooms available for these dates" />
      ) : (
        availability.roomTypes.map((room) => (
          <Card
            key={room.id}
            className="tg-room-card"
            hoverable
            onClick={() => onSelectRoom(room)}
          >
            <div className="tg-room-info">
              <h3>{room.name}</h3>
              <Tag color="green">{room.availableRooms} left</Tag>
              <div className="tg-room-price">
                {availability.branch.currency}{" "}
                {Number(room.basePrice).toLocaleString()}/night
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
