import { Button, Divider, Tag } from "antd";
import {
  CheckCircleOutlined,
  BankOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useTelegram } from "@/shared/hooks/use-telegram";
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
  const { haptic } = useTelegram();

  return (
    <div className="tg-step-content">
      <div className="tg-header-top" style={{ marginBottom: 32 }}>
        <h2 className="tg-section-title" style={{ margin: 0 }}>
          Review & Confirm
        </h2>
        <p
          style={{
            margin: "4px 0 0",
            color: "var(--tg-hint)",
            fontWeight: 600,
          }}
        >
          Your final step to a perfect stay
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="tg-hotel-card" style={{ padding: 20 }}>
          <div
            style={{
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <BankOutlined
              style={{ color: "var(--tg-primary)", fontSize: 20 }}
            />
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
              {hotel.name}
            </h3>
          </div>

          <div
            style={{
              background: "var(--tg-secondary-bg)",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: "var(--tg-hint)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                Selected Room
              </span>
              <span style={{ fontWeight: 800, fontSize: 15 }}>{room.name}</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--tg-hint)",
                    fontWeight: 800,
                    textTransform: "uppercase",
                  }}
                >
                  Check In
                </span>
                <span style={{ fontWeight: 700 }}>
                  {checkIn.format("DD MMM, YYYY")}
                </span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", opacity: 0.3 }}
              >
                <ArrowRightOutlined />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  textAlign: "right",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--tg-hint)",
                    fontWeight: 800,
                    textTransform: "uppercase",
                  }}
                >
                  Check Out
                </span>
                <span style={{ fontWeight: 700 }}>
                  {checkOut.format("DD MMM, YYYY")}
                </span>
              </div>
            </div>

            <Divider
              style={{ margin: "12px 0", borderColor: "rgba(0,0,0,0.05)" }}
            />

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span
                style={{
                  fontSize: 13,
                  color: "var(--tg-hint)",
                  fontWeight: 700,
                }}
              >
                Total Duration
              </span>
              <Tag
                color="blue"
                style={{ borderRadius: 6, margin: 0, fontWeight: 700 }}
              >
                {nights} Nights
              </Tag>
            </div>
          </div>
        </div>

        <div
          className="tg-hotel-card"
          style={{
            padding: 24,
            background: "var(--tg-bg)",
            border: "2px solid var(--tg-primary)",
            boxShadow: "0 8px 24px rgba(24, 144, 255, 0.15)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--tg-hint)",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                Total Amount
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: "var(--tg-text)",
                  letterSpacing: -0.5,
                }}
              >
                <span style={{ fontSize: 18, marginRight: 4, opacity: 0.6 }}>
                  {currency}
                </span>
                {totalPrice.toLocaleString()}
              </div>
            </div>
            <div
              style={{
                background: "var(--tg-primary)",
                color: "white",
                padding: "10px 14px",
                borderRadius: 12,
              }}
            >
              <CheckCircleOutlined style={{ fontSize: 24 }} />
            </div>
          </div>
        </div>
      </div>

      <p
        style={{
          textAlign: "center",
          fontSize: 12,
          color: "var(--tg-hint)",
          margin: "32px 20px",
          lineHeight: "1.6",
          fontWeight: 600,
        }}
      >
        By confirming, you agree to the hotel's policies and booking terms.
        Secure payment will be handled at the property.
      </p>

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
          loading={loading}
          style={{
            height: 54,
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 800,
            boxShadow: "0 4px 15px rgba(24, 144, 255, 0.3)",
          }}
          onClick={() => {
            onConfirm();
            haptic("success");
          }}
        >
          Confirm Reservation
        </Button>
      </div>
    </div>
  );
}
