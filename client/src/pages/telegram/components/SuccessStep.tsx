import { Card } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import type { BookingResult } from "../types";

interface SuccessStepProps {
  result: BookingResult;
}

export function SuccessStep({ result }: SuccessStepProps) {
  return (
    <div className="tg-success-section">
      <CheckCircleOutlined style={{ fontSize: 64, color: "#52c41a" }} />
      <h2>Booking Confirmed!</h2>

      <div className="tg-confirmation-code">{result.confirmationNumber}</div>

      <Card className="tg-summary-card">
        <p>
          <strong>Hotel:</strong> {result.hotel}
        </p>
        <p>
          <strong>Room:</strong> {result.room}
        </p>
        <p>
          <strong>Nights:</strong> {result.nights}
        </p>
        <p>
          <strong>Total:</strong> {result.currency}{" "}
          {result.totalAmount.toLocaleString()}
        </p>
      </Card>

      <p className="tg-success-note">Show this confirmation at the hotel</p>
    </div>
  );
}
