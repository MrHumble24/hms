import { Button, Rate } from "antd";
import { EnvironmentOutlined, PhoneOutlined } from "@ant-design/icons";
import type { NearbyHotel } from "@/shared/api/public-booking-api";

interface HotelDetailStepProps {
  hotel: NearbyHotel;
  onBookNow: () => void;
}

export function HotelDetailStep({ hotel, onBookNow }: HotelDetailStepProps) {
  return (
    <div className="tg-hotel-detail">
      {hotel.logoUrl && (
        <img src={hotel.logoUrl} alt={hotel.name} className="tg-hotel-cover" />
      )}

      <div className="tg-hotel-content">
        <h2>{hotel.name}</h2>
        {hotel.starRating && <Rate disabled defaultValue={hotel.starRating} />}

        <div className="tg-hotel-meta">
          {hotel.address && (
            <p>
              <EnvironmentOutlined /> {hotel.address}
            </p>
          )}
          {hotel.phone && (
            <p>
              <PhoneOutlined /> {hotel.phone}
            </p>
          )}
        </div>

        {hotel.startingPrice && (
          <div className="tg-price-badge">
            From{" "}
            <strong>
              {hotel.currency} {hotel.startingPrice.toLocaleString()}
            </strong>
            /night
          </div>
        )}

        <Button type="primary" size="large" block onClick={onBookNow}>
          Book Now
        </Button>
      </div>
    </div>
  );
}
