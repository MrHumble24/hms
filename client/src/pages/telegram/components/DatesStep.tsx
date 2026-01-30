import { Button, DatePicker } from "antd";
import { CalendarOutlined } from "@ant-design/icons";
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
    <div className="tg-dates-section">
      <div className="tg-section-header">
        <CalendarOutlined style={{ fontSize: 32, color: "#1677ff" }} />
        <h2>Select Dates</h2>
        <p>When would you like to stay?</p>
      </div>

      <div className="tg-date-inputs">
        <div className="tg-date-field">
          <label>Check-in</label>
          <DatePicker
            value={checkIn}
            onChange={onCheckInChange}
            format="DD MMM YYYY"
            size="large"
            style={{ width: "100%" }}
            disabledDate={(d) => d && d < dayjs().startOf("day")}
          />
        </div>
        <div className="tg-date-field">
          <label>Check-out</label>
          <DatePicker
            value={checkOut}
            onChange={onCheckOutChange}
            format="DD MMM YYYY"
            size="large"
            style={{ width: "100%" }}
            disabledDate={(d) => d && d <= (checkIn || dayjs())}
          />
        </div>
      </div>

      {nights > 0 && (
        <div className="tg-nights-info">
          🌙 {nights} night{nights > 1 ? "s" : ""}
        </div>
      )}

      <Button
        type="primary"
        size="large"
        block
        onClick={onCheckAvailability}
        disabled={!checkIn || !checkOut}
        loading={loading}
      >
        Check Availability
      </Button>
    </div>
  );
}
