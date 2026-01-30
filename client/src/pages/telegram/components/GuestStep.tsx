import { Button, Form, Input } from "antd";
import type { GuestFormValues } from "../types";

interface GuestStepProps {
  initialValues: Partial<GuestFormValues>;
  onSubmit: (values: GuestFormValues) => void;
}

export function GuestStep({ initialValues, onSubmit }: GuestStepProps) {
  const [form] = Form.useForm<GuestFormValues>();

  return (
    <div className="tg-discovery-container">
      <div className="tg-header">
        <h2>Your Information</h2>
        <p>Just a few details for the reservation</p>
      </div>

      <div className="tg-step-content">
        <Form
          form={form}
          layout="vertical"
          initialValues={initialValues}
          onFinish={onSubmit}
          requiredMark={false}
        >
          <Form.Item
            name="firstName"
            label="FIRST NAME"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="Enter your first name" />
          </Form.Item>

          <Form.Item
            name="lastName"
            label="LAST NAME"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="Enter your last name" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="PHONE NUMBER"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="+998" />
          </Form.Item>

          <Form.Item name="email" label="EMAIL ADDRESS (OPTIONAL)">
            <Input placeholder="email@example.com" />
          </Form.Item>
        </Form>
      </div>

      <div className="tg-fixed-footer">
        <Button
          type="primary"
          className="tg-main-button"
          block
          onClick={() => form.submit()}
        >
          Check Everything
        </Button>
      </div>
    </div>
  );
}
