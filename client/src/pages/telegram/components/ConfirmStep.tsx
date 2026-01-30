import { Button, Card, Divider } from "antd";
import dayjs from "dayjs";
import type {
  NearbyHotel,
  RoomTypeAvailability,
} from "@/shared/api/public-booking-api";

interface ConfirmStepProps {
  hotel: NearbyHotel;
  room: RoomTypeAvailability;
  checkIn: dayjs.Dayjs;
  checkOut: dayjs.Dayjs;
  nights: number;
  totalPrice: number;
  currency: string;
  loading: boolean;
  onConfirm: () => void;
}

export function ConfirmStep({
  hotel,
  room,
  checkIn,
  checkOut,
  nights,
  totalPrice,
  currency,
  loading,
  onConfirm,
}: ConfirmStepProps) {
  return (
    <div className="tg-confirm-section">
      <div className="tg-section-header">
        <h2>Confirm Booking</h2>
      </div>

      <Card className="tg-summary-card">
        <h3>{hotel.name}</h3>
        <Divider />
        <p>
          <strong>Room:</strong> {room.name}
        </p>
        <p>
          <strong>Check-in:</strong> {checkIn.format("DD MMM YYYY")}
        </p>
        <p>
          <strong>Check-out:</strong> {checkOut.format("DD MMM YYYY")}
        </p>
        <p>
          <strong>Nights:</strong> {nights}
        </p>
        <Divider />
        <div className="tg-total-price">
          <span>Total</span>
          <strong>
            {currency} {totalPrice.toLocaleString()}
          </strong>
        </div>
      </Card>

      <Button
        type="primary"
        size="large"
        block
        onClick={onConfirm}
        loading={loading}
      >
        Confirm Booking
      </Button>
    </div>
  );
}
