import { Button, Rate } from "antd";
import { publicBookingApi } from "@/shared/api/public-booking-api";
import type { NearbyHotel } from "@/shared/api/public-booking-api";

interface HotelDetailStepProps {
  hotel: NearbyHotel;
  onBookNow: () => void;
}

export function HotelDetailStep({ hotel, onBookNow }: HotelDetailStepProps) {
  return (
    <div className="tg-discovery-container">
      <img
        src={publicBookingApi.resolveImageUrl(hotel.logoUrl)}
        alt={hotel.name}
        style={{ width: "100%", height: "250px", objectFit: "cover" }}
      />

      <div className="tg-step-content">
        <h2 className="tg-section-title">{hotel.name}</h2>

        <div style={{ marginBottom: 20 }}>
          {hotel.starRating && (
            <Rate
              disabled
              defaultValue={hotel.starRating}
              style={{ fontSize: 14 }}
            />
          )}
          <p style={{ margin: "8px 0", color: "var(--tg-hint)" }}>
            {hotel.address}
          </p>
        </div>

        <div
          className="tg-date-box"
          style={{
            background: "transparent",
            border: "1px solid var(--tg-secondary-bg)",
            padding: 0,
          }}
        >
          <p style={{ margin: 0, padding: 20 }}>
            Stay at one of our best rooms with all amenities included. Reliable
            service and comfortable environment.
          </p>
        </div>
      </div>

      <div className="tg-fixed-footer">
        <Button
          type="primary"
          className="tg-main-button"
          block
          onClick={onBookNow}
        >
          Configure My Stay
        </Button>
      </div>
    </div>
  );
}
