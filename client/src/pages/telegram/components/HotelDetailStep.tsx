import { Button, Tag } from "antd";
import {
  EnvironmentOutlined,
  StarFilled,
  InfoCircleOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { publicBookingApi } from "@/shared/api/public-booking-api";
import { useTelegram } from "@/shared/hooks/use-telegram";
import type { NearbyHotel } from "@/shared/api/public-booking-api";

interface HotelDetailStepProps {
  hotel: NearbyHotel;
  onBookNow: () => void;
}

export function HotelDetailStep({ hotel, onBookNow }: HotelDetailStepProps) {
  const { haptic } = useTelegram();

  return (
    <div className="tg-app" style={{ background: "var(--tg-bg)" }}>
      <div
        className="tg-hotel-image-container"
        style={{ height: 280, borderRadius: 0 }}
      >
        <img
          src={publicBookingApi.resolveImageUrl(hotel.logoUrl)}
          alt={hotel.name}
          className="tg-hotel-image"
        />
        <div
          className="tg-hotel-rating"
          style={{
            top: 20,
            right: 20,
            padding: "6px 12px",
            fontSize: 14,
            background: "rgba(255, 255, 255, 0.9)",
            color: "#000",
          }}
        >
          <StarFilled style={{ color: "#faad14" }} />
          <span>{hotel.starRating || 4.5}</span>
        </div>
      </div>

      <div
        className="tg-step-content"
        style={{
          marginTop: -20,
          background: "var(--tg-bg)",
          borderRadius: "24px 24px 0 0",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 12,
          }}
        >
          <h2 className="tg-section-title" style={{ margin: 0, flex: 1 }}>
            {hotel.name}
          </h2>
          <Tag
            color="gold"
            icon={<ThunderboltOutlined />}
            style={{ borderRadius: 6, fontWeight: 700 }}
          >
            BEST VALUE
          </Tag>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "var(--tg-hint)",
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            <EnvironmentOutlined style={{ color: "var(--tg-primary)" }} />
            <span>{hotel.address}</span>
          </div>

          <div
            style={{
              background: "var(--tg-secondary-bg)",
              padding: 16,
              borderRadius: 16,
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <InfoCircleOutlined
              style={{ color: "var(--tg-primary)", marginTop: 3 }}
            />
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: "var(--tg-text)",
                lineHeight: "1.5",
              }}
            >
              Experience unparalleled comfort at {hotel.name}. This property is
              highly rated for its strategic location and exceptional service.
            </p>
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            Features
          </h3>
          <div className="tg-hotel-meta" style={{ flexWrap: "wrap", gap: 16 }}>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 14,
              }}
            >
              <CheckCircleOutlined style={{ color: "#52c41a" }} /> Free WiFi
            </span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 14,
              }}
            >
              <CheckCircleOutlined style={{ color: "#52c41a" }} /> Best Quality
            </span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 14,
              }}
            >
              <CheckCircleOutlined style={{ color: "#52c41a" }} /> 24/7 Service
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "16px 20px 32px",
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(10px)",
          borderTop: "1px solid rgba(0, 0, 0, 0.05)",
          zIndex: 100,
        }}
      >
        <Button
          type="primary"
          block
          size="large"
          style={{
            height: 54,
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 800,
            boxShadow: "0 4px 15px rgba(24, 144, 255, 0.3)",
          }}
          onClick={() => {
            onBookNow();
            haptic("medium");
          }}
        >
          Check Availability
        </Button>
      </div>
    </div>
  );
}
