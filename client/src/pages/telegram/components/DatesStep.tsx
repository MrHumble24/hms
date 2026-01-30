import { Button } from "antd";
import dayjs from "dayjs";

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
  const nights = checkIn && checkOut ? checkOut.diff(checkIn, "day") : 0;

  const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onCheckInChange(val ? dayjs(val) : null);
  };

  const handleCheckOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onCheckOutChange(val ? dayjs(val) : null);
  };

  return (
    <div className="tg-discovery-container">
      <div className="tg-header">
        <h2>Your Stay</h2>
        <p>When are you planning to visit?</p>
      </div>

      <div className="tg-step-content">
        <div className="tg-date-box">
          <label>Arrival Date</label>
          <input
            type="date"
            className="tg-native-date"
            value={checkIn?.format("YYYY-MM-DD") || ""}
            onChange={handleCheckInChange}
            min={dayjs().format("YYYY-MM-DD")}
          />
        </div>

        <div className="tg-date-box">
          <label>Departure Date</label>
          <input
            type="date"
            className="tg-native-date"
            value={checkOut?.format("YYYY-MM-DD") || ""}
            onChange={handleCheckOutChange}
            min={
              checkIn
                ? checkIn.add(1, "day").format("YYYY-MM-DD")
                : dayjs().add(1, "day").format("YYYY-MM-DD")
            }
          />
        </div>

        {nights > 0 && (
          <div
            style={{
              textAlign: "center",
              marginTop: 24,
              padding: "12px 20px",
              background: "var(--tg-secondary-bg)",
              borderRadius: 12,
            }}
          >
            <span style={{ fontSize: 17, fontWeight: 600 }}>
              🌙 {nights} night{nights > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      <div className="tg-fixed-footer">
        <Button
          type="primary"
          className="tg-main-button"
          block
          onClick={onCheckAvailability}
          disabled={!checkIn || !checkOut}
          loading={loading}
        >
          See Available Rooms
        </Button>
      </div>
    </div>
  );
}
