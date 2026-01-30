import { Button, Form, Input } from "antd";
import { UserOutlined, PhoneOutlined, MailOutlined } from "@ant-design/icons";
import { useTelegram } from "@/shared/hooks/use-telegram";
import type { GuestFormValues } from "../types";

interface GuestStepProps {
  initialValues: Partial<GuestFormValues>;
  onSubmit: (values: GuestFormValues) => void;
}

export function GuestStep({ initialValues, onSubmit }: GuestStepProps) {
  const [form] = Form.useForm<GuestFormValues>();
  const { haptic } = useTelegram();

  return (
    <div className="tg-step-content" style={{ paddingBottom: 100 }}>
      <div className="tg-header-top" style={{ marginBottom: 32 }}>
        <h2 className="tg-section-title" style={{ margin: 0 }}>
          Guest Information
        </h2>
        <p
          style={{
            margin: "4px 0 0",
            color: "var(--tg-hint)",
            fontWeight: 600,
          }}
        >
          We just need a few more details
        </p>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={(values) => {
          onSubmit(values);
          haptic("medium");
        }}
        requiredMark={false}
      >
        <div
          className="tg-hotel-card"
          style={{
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <Form.Item
            name="firstName"
            label={
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "var(--tg-hint)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                First Name
              </span>
            }
            rules={[{ required: true, message: "Required" }]}
          >
            <Input
              prefix={
                <UserOutlined
                  style={{ color: "var(--tg-primary)", marginRight: 8 }}
                />
              }
              placeholder="e.g. John"
              className="tg-premium-input"
              style={{
                height: 50,
                borderRadius: 12,
                background: "var(--tg-secondary-bg)",
                border: "none",
                fontWeight: 600,
              }}
            />
          </Form.Item>

          <Form.Item
            name="lastName"
            label={
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "var(--tg-hint)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Last Name
              </span>
            }
            rules={[{ required: true, message: "Required" }]}
          >
            <Input
              prefix={
                <UserOutlined
                  style={{ color: "var(--tg-primary)", marginRight: 8 }}
                />
              }
              placeholder="e.g. Smith"
              className="tg-premium-input"
              style={{
                height: 50,
                borderRadius: 12,
                background: "var(--tg-secondary-bg)",
                border: "none",
                fontWeight: 600,
              }}
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label={
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "var(--tg-hint)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Phone Number
              </span>
            }
            rules={[{ required: true, message: "Required" }]}
          >
            <Input
              prefix={
                <PhoneOutlined
                  style={{ color: "var(--tg-primary)", marginRight: 8 }}
                />
              }
              placeholder="+998"
              className="tg-premium-input"
              style={{
                height: 50,
                borderRadius: 12,
                background: "var(--tg-secondary-bg)",
                border: "none",
                fontWeight: 600,
              }}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label={
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "var(--tg-hint)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Email Address (Optional)
              </span>
            }
          >
            <Input
              prefix={
                <MailOutlined
                  style={{ color: "var(--tg-primary)", marginRight: 8 }}
                />
              }
              placeholder="email@example.com"
              className="tg-premium-input"
              style={{
                height: 50,
                borderRadius: 12,
                background: "var(--tg-secondary-bg)",
                border: "none",
                fontWeight: 600,
              }}
            />
          </Form.Item>
        </div>
      </Form>

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
          onClick={() => form.submit()}
        >
          Check Everything
        </Button>
      </div>
    </div>
  );
}
