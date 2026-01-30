import { Button, DatePicker } from "antd";
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

  return (
    <div className="tg-discovery-container">
      <div className="tg-header">
        <h2>Your Stay</h2>
        <p>When are you planning to visit?</p>
      </div>

      <div className="tg-step-content">
        <div
          className="tg-date-box"
          onClick={() =>
            (
              document.querySelector(".tg-check-in-picker input") as HTMLElement
            )?.click()
          }
        >
          <label>Arrival Date</label>
          <DatePicker
            className="tg-check-in-picker"
            value={checkIn}
            onChange={onCheckInChange}
            format="DD MMMM YYYY"
            style={{ width: "100%" }}
            placeholder="Select date"
            disabledDate={(d) => d && d < dayjs().startOf("day")}
            allowClear={false}
          />
        </div>

        <div
          className="tg-date-box"
          onClick={() =>
            (
              document.querySelector(
                ".tg-check-out-picker input",
              ) as HTMLElement
            )?.click()
          }
        >
          <label>Departure Date</label>
          <DatePicker
            className="tg-check-out-picker"
            value={checkOut}
            onChange={onCheckOutChange}
            format="DD MMMM YYYY"
            style={{ width: "100%" }}
            placeholder="Select date"
            disabledDate={(d) => d && d <= (checkIn || dayjs())}
            allowClear={false}
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
