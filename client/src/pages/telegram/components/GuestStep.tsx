import { Button, Form, Input, Select } from "antd";
import { UserOutlined } from "@ant-design/icons";
import type { GuestFormValues } from "../types";

interface GuestStepProps {
  initialValues: Partial<GuestFormValues>;
  onSubmit: (values: GuestFormValues) => void;
}

export function GuestStep({ initialValues, onSubmit }: GuestStepProps) {
  const [form] = Form.useForm<GuestFormValues>();

  const handleFinish = (values: GuestFormValues) => {
    onSubmit(values);
  };

  return (
    <div className="tg-guest-section">
      <div className="tg-section-header">
        <UserOutlined style={{ fontSize: 32, color: "#1677ff" }} />
        <h2>Guest Details</h2>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={handleFinish}
      >
        <Form.Item
          name="firstName"
          label="First Name"
          rules={[{ required: true, message: "Please enter your first name" }]}
        >
          <Input size="large" placeholder="John" />
        </Form.Item>

        <Form.Item
          name="lastName"
          label="Last Name"
          rules={[{ required: true, message: "Please enter your last name" }]}
        >
          <Input size="large" placeholder="Doe" />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Phone"
          rules={[
            { required: true, message: "Please enter your phone number" },
          ]}
        >
          <Input size="large" placeholder="+998 90 123 45 67" />
        </Form.Item>

        <Form.Item name="email" label="Email">
          <Input size="large" type="email" placeholder="john@example.com" />
        </Form.Item>

        <Form.Item name="gender" label="Gender">
          <Select size="large" placeholder="Select gender">
            <Select.Option value="MALE">Male</Select.Option>
            <Select.Option value="FEMALE">Female</Select.Option>
          </Select>
        </Form.Item>

        <Button type="primary" size="large" block htmlType="submit">
          Continue
        </Button>
      </Form>
    </div>
  );
}
