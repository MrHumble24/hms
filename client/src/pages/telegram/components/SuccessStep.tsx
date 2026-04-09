import { Button, Tag } from "antd";
import {
  CheckCircleFilled,
  StarFilled,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useTelegram } from "@/shared/hooks/use-telegram";
import type { BookingResult } from "../types";

interface SuccessStepProps {
  result: BookingResult;
}

export function SuccessStep({ result }: SuccessStepProps) {
  const { closeApp, haptic } = useTelegram();

  return (
    <div
      className="tg-step-content"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        paddingTop: 40,
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #52c41a, #95de64)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 40,
          marginBottom: 24,
          boxShadow: "0 8px 24px rgba(82, 196, 26, 0.3)",
        }}
      >
        <CheckCircleFilled />
      </div>

      <h2
        style={{
          fontSize: 28,
          fontWeight: 900,
          margin: "0 0 8px",
          color: "var(--tg-text)",
        }}
      >
        Reservation Ready!
      </h2>
      <p
        style={{
          color: "var(--tg-hint)",
          fontSize: 16,
          fontWeight: 600,
          maxWidth: "280px",
        }}
      >
        Your room at <strong>{result.hotel}</strong> has been secured and
        confirmed.
      </p>

      <div
        className="tg-hotel-card"
        style={{
          width: "100%",
          marginTop: 40,
          padding: 0,
          background: "linear-gradient(135deg, #1890ff, #40a9ff)",
          position: "relative",
          overflow: "hidden",
          border: "none",
          borderRadius: 20,
        }}
      >
        {/* Decorative elements */}
        <div
          style={{
            position: "absolute",
            top: -20,
            right: -20,
            width: 100,
            height: 100,
            background: "rgba(255,255,255,0.1)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -10,
            left: -20,
            width: 80,
            height: 80,
            background: "rgba(255,255,255,0.05)",
            borderRadius: "50%",
          }}
        />

        <div style={{ padding: "24px 20px", color: "white" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase",
              opacity: 0.8,
              letterSpacing: 1.5,
              marginBottom: 8,
            }}
          >
            Confirmation Number
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: 2,
              textShadow: "0 2px 10px rgba(0,0,0,0.1)",
            }}
          >
            {result.confirmationNumber}
          </div>
        </div>

        <div
          style={{
            background: "rgba(0,0,0,0.1)",
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backdropFilter: "blur(5px)",
          }}
        >
          <div style={{ textAlign: "left" }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.7)",
                marginBottom: 2,
              }}
            >
              Room Details
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "white" }}>
              {result.room}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.7)",
                marginBottom: 2,
              }}
            >
              Duration
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "white" }}>
              {result.nights} Night{result.nights > 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 24,
          display: "flex",
          gap: 12,
          justifyContent: "center",
        }}
      >
        <Tag
          color="gold"
          icon={<StarFilled />}
          style={{ borderRadius: 12, padding: "4px 12px", fontWeight: 700 }}
        >
          VIP STATUS
        </Tag>
        <Tag
          color="blue"
          icon={<ThunderboltOutlined />}
          style={{ borderRadius: 12, padding: "4px 12px", fontWeight: 700 }}
        >
          VERIFIED
        </Tag>
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
            haptic("medium");
            closeApp();
          }}
        >
          Great, Thank You!
        </Button>
      </div>
    </div>
  );
}
