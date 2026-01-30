import { Button, Divider } from "antd";
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
    <div className="tg-discovery-container">
      <div className="tg-header">
        <h2>Confirm Booking</h2>
        <p>Please review your stay details</p>
      </div>

      <div className="tg-step-content">
        <div
          className="tg-date-box"
          style={{
            background: "transparent",
            border: "1px solid var(--tg-secondary-bg)",
          }}
        >
          <h3 style={{ margin: "0 0 16px", fontSize: 18 }}>{hotel.name}</h3>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <span style={{ color: "var(--tg-hint)" }}>Room Type</span>
            <span style={{ fontWeight: 600 }}>{room.name}</span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <span style={{ color: "var(--tg-hint)" }}>Check-in</span>
            <span style={{ fontWeight: 600 }}>
              {checkIn.format("DD MMM YYYY")}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <span style={{ color: "var(--tg-hint)" }}>Check-out</span>
            <span style={{ fontWeight: 600 }}>
              {checkOut.format("DD MMM YYYY")}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <span style={{ color: "var(--tg-hint)" }}>Duration</span>
            <span style={{ fontWeight: 600 }}>
              {nights} night{nights > 1 ? "s" : ""}
            </span>
          </div>

          <Divider style={{ margin: "16px 0" }} />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700 }}>Total Price</span>
            <span
              style={{ fontSize: 20, fontWeight: 800, color: "var(--tg-link)" }}
            >
              {currency} {totalPrice.toLocaleString()}
            </span>
          </div>
        </div>

        <p
          style={{
            fontSize: 12,
            color: "var(--tg-hint)",
            textAlign: "center",
            marginTop: 20,
          }}
        >
          By tapping the button below, you agree to our booking terms and
          conditions.
        </p>
      </div>

      <div className="tg-fixed-footer">
        <Button
          type="primary"
          className="tg-main-button"
          block
          onClick={onConfirm}
          loading={loading}
        >
          Confirm Reservation
        </Button>
      </div>
    </div>
  );
}
