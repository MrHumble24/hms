import { Button } from "antd";
import {
  CalendarOutlined,
  ArrowRightOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useTelegram } from "@/shared/hooks/use-telegram";

interface DatesStepProps {
  checkIn: dayjs.Dayjs | null;
  checkOut: dayjs.Dayjs | null;
  loading: boolean;
  onCheckInChange: (date: dayjs.Dayjs | null) => void;
  onCheckOutChange: (date: dayjs.Dayjs | null) => void;
  onCheckAvailability: () => void;
}

export function DatesStep({
  checkIn,
  checkOut,
  loading,
  onCheckInChange,
  onCheckOutChange,
  onCheckAvailability,
}: DatesStepProps) {
  const { haptic } = useTelegram();
  const nights = checkIn && checkOut ? checkOut.diff(checkIn, "day") : 0;

  const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onCheckInChange(val ? dayjs(val) : null);
    haptic("selection");
  };

  const handleCheckOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onCheckOutChange(val ? dayjs(val) : null);
    haptic("selection");
  };

  return (
    <div className="tg-step-content">
      <div className="tg-header-top" style={{ marginBottom: 32 }}>
        <h2 className="tg-section-title" style={{ margin: 0 }}>
          Your Stay
        </h2>
        <p
          style={{
            margin: "4px 0 0",
            color: "var(--tg-hint)",
            fontWeight: 600,
          }}
        >
          Plan your visit to paradise
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="tg-hotel-card" style={{ padding: 20 }}>
          <div
            style={{
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <CalendarOutlined
              style={{ color: "var(--tg-primary)", fontSize: 18 }}
            />
            <span style={{ fontWeight: 800, fontSize: 15 }}>Select Dates</span>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <div className="tg-input-wrapper">
              <label
                style={{
                  display: "block",
                  fontSize: 10,
                  fontWeight: 800,
                  color: "var(--tg-hint)",
                  textTransform: "uppercase",
                  marginBottom: 8,
                  letterSpacing: 0.5,
                }}
              >
                Check In
              </label>
              <input
                type="date"
                className="tg-native-date"
                style={{
                  width: "100%",
                  background: "var(--tg-secondary-bg)",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px",
                  fontWeight: 700,
                  fontSize: 14,
                  color: "var(--tg-text)",
                }}
                value={checkIn?.format("YYYY-MM-DD") || ""}
                onChange={handleCheckInChange}
                min={dayjs().format("YYYY-MM-DD")}
              />
            </div>

            <div className="tg-input-wrapper">
              <label
                style={{
                  display: "block",
                  fontSize: 10,
                  fontWeight: 800,
                  color: "var(--tg-hint)",
                  textTransform: "uppercase",
                  marginBottom: 8,
                  letterSpacing: 0.5,
                }}
              >
                Check Out
              </label>
              <input
                type="date"
                className="tg-native-date"
                style={{
                  width: "100%",
                  background: "var(--tg-secondary-bg)",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px",
                  fontWeight: 700,
                  fontSize: 14,
                  color: "var(--tg-text)",
                }}
                value={checkOut?.format("YYYY-MM-DD") || ""}
                onChange={handleCheckOutChange}
                min={
                  checkIn
                    ? checkIn.add(1, "day").format("YYYY-MM-DD")
                    : dayjs().add(1, "day").format("YYYY-MM-DD")
                }
              />
            </div>
          </div>
        </div>

        {nights > 0 ? (
          <div
            className="tg-hotel-card"
            style={{
              padding: "16px 20px",
              background: "linear-gradient(135deg, var(--tg-primary), #40a9ff)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.2)",
                  padding: 8,
                  borderRadius: 10,
                }}
              >
                <CalendarOutlined style={{ fontSize: 20 }} />
              </div>
              <div>
                <div style={{ fontSize: 13, opacity: 0.9, fontWeight: 600 }}>
                  Duration of Stay
                </div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>
                  {nights} {nights > 1 ? "Nights" : "Night"}
                </div>
              </div>
            </div>
            <ArrowRightOutlined style={{ fontSize: 20 }} />
          </div>
        ) : (
          <div
            style={{
              padding: 16,
              borderRadius: 16,
              border: "1px dashed var(--tg-hint)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              opacity: 0.6,
            }}
          >
            <InfoCircleOutlined />
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              Select dates to see total duration
            </span>
          </div>
        )}
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
          loading={loading}
          disabled={!checkIn || !checkOut}
          style={{
            height: 54,
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 800,
            boxShadow:
              !checkIn || !checkOut
                ? "none"
                : "0 4px 15px rgba(24, 144, 255, 0.3)",
          }}
          onClick={() => {
            onCheckAvailability();
            haptic("medium");
          }}
        >
          See Available Rooms
        </Button>
      </div>
    </div>
  );
}
