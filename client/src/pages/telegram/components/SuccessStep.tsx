import { Button } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";
import { useTelegram } from "@/shared/hooks/use-telegram";
import type { BookingResult } from "../types";

interface SuccessStepProps {
  result: BookingResult;
}

export function SuccessStep({ result }: SuccessStepProps) {
  const { closeApp } = useTelegram();

  return (
    <div className="tg-discovery-container">
      <div className="tg-success-vibe">
        <CheckCircleFilled className="tg-success-icon" />
        <h2>Reservation Ready!</h2>
        <p style={{ color: "var(--tg-hint)", fontSize: 16 }}>
          Your room at <strong>{result.hotel}</strong> has been secured. See you
          soon!
        </p>

        <div className="tg-conf-number">{result.confirmationNumber}</div>

        <div className="tg-date-box" style={{ textAlign: "left" }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: "var(--tg-hint)" }}>Room: </span>
            <span style={{ fontWeight: 600 }}>{result.room}</span>
          </div>
          <div>
            <span style={{ color: "var(--tg-hint)" }}>Stays: </span>
            <span style={{ fontWeight: 600 }}>
              {result.nights} night{result.nights > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="tg-fixed-footer">
        <Button
          type="primary"
          className="tg-main-button"
          block
          onClick={closeApp}
        >
          Great, Thank You!
        </Button>
      </div>
    </div>
  );
}
