import {
  Modal,
  Form,
  InputNumber,
  Select,
  Input,
  Button,
  Space,
  Divider,
  Typography,
  Alert,
  Statistic,
  Row,
  Col,
  message,
  Checkbox,
  Card,
  List,
  Tag,
  Grid,
} from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  bookingApi,
  type CheckoutDto,
  type AdditionalChargeDto,
  RoomStatus,
} from "@/entities/booking/api/booking-api";
import { PaymentMethod } from "@/entities/finance/api/finance-api";
import { useState, useMemo } from "react";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text, Title } = Typography;

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  booking: any;
  folioBalance: number;
}

export const CheckoutModal = ({
  open,
  onClose,
  booking,
  folioBalance,
}: CheckoutModalProps) => {
  const screens = Grid.useBreakpoint();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [showReceipt, setShowReceipt] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  const [additionalCharges, setAdditionalCharges] = useState<
    AdditionalChargeDto[]
  >([]);

  const checkoutMutation = useMutation({
    mutationFn: (data: CheckoutDto) => bookingApi.checkout(booking.id, data),
    onSuccess: (response) => {
      setReceipt(response.receipt);
      setShowReceipt(true);
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      message.success(response.message);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || "Checkout failed");
    },
  });

  const handleCheckout = (values: CheckoutDto) => {
    const checkoutData: CheckoutDto = {
      ...values,
      additionalCharges:
        additionalCharges.length > 0 ? additionalCharges : undefined,
    };
    checkoutMutation.mutate(checkoutData);
  };

  const addAdditionalCharge = () => {
    setAdditionalCharges([
      ...additionalCharges,
      { description: "", amount: 0, quantity: 1 },
    ]);
  };

  const updateAdditionalCharge = (
    index: number,
    field: keyof AdditionalChargeDto,
    value: any,
  ) => {
    const updated = [...additionalCharges];
    updated[index] = { ...updated[index], [field]: value };
    setAdditionalCharges(updated);
  };

  const removeAdditionalCharge = (index: number) => {
    setAdditionalCharges(additionalCharges.filter((_, i) => i !== index));
  };

  const chargesBreakdown = useMemo(() => {
    const primaryFolio = booking?.folios?.find((f: any) => f.isPrimary);
    if (!primaryFolio) return { items: [], totalCharges: 0, roomCharges: null };

    const items = primaryFolio.items || [];
    const totalCharges = items.reduce(
      (sum: number, item: any) => sum + Number(item.totalAmount || 0),
      0,
    );

    const roomCharges = items.filter(
      (item: any) => item.type === "ROOM_CHARGE",
    );

    let estimatedRoomCharges = null;
    if (roomCharges.length === 0 && booking?.roomStays?.[0]?.room?.type) {
      const checkIn = dayjs(booking.actualCheckIn || booking.checkIn);
      const checkOut = dayjs();
      const nights = Math.max(1, checkOut.diff(checkIn, "day"));
      const basePrice =
        Number(
          booking.roomStays[0].dailyRate ||
            booking.roomStays[0].room.type.basePrice,
        ) || 0;

      estimatedRoomCharges = {
        nights,
        ratePerNight: basePrice,
        total: basePrice * nights,
        roomTypeName: booking.roomStays[0].room.type.name,
      };
    }

    return {
      items,
      totalCharges,
      roomCharges: roomCharges.length > 0 ? roomCharges : null,
      estimatedRoomCharges,
    };
  }, [booking]);

  const handleClose = () => {
    setShowReceipt(false);
    setReceipt(null);
    setAdditionalCharges([]);
    form.resetFields();
    onClose();
  };

  if (showReceipt && receipt) {
    return (
      <Modal
        title="Checkout Receipt"
        open={open}
        onCancel={handleClose}
        footer={[
          <Button key="print" type="primary">
            Print Receipt
          </Button>,
          <Button key="close" onClick={handleClose}>
            Close
          </Button>,
        ]}
        width={screens.md ? 500 : "100%"}
        style={screens.md ? { top: 100 } : { top: 0 }}
      >
        <div style={{ padding: "20px 0" }}>
          <Title level={4} style={{ textAlign: "center", marginBottom: 24 }}>
            Checkout Successful
          </Title>
          <Divider />
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <div>
              <Text type="secondary">Guest Name</Text>
              <div>
                <Text strong>{receipt.guestName}</Text>
              </div>
            </div>
            <div>
              <Text type="secondary">Room Number</Text>
              <div>
                <Text strong>{receipt.roomNumber}</Text>
              </div>
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Text type="secondary">Check-in</Text>
                <div>
                  <Text>{new Date(receipt.checkIn).toLocaleDateString()}</Text>
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Check-out</Text>
                <div>
                  <Text>{new Date(receipt.checkOut).toLocaleDateString()}</Text>
                </div>
              </Col>
            </Row>
            <Divider />
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Total Charges"
                  value={receipt.totalCharges}
                  suffix="UZS"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Total Payments"
                  value={receipt.totalPayments}
                  suffix="UZS"
                  valueStyle={{ color: "#52c41a" }}
                />
              </Col>
            </Row>
            <Alert message="Balance Settled" type="success" showIcon />

            {receipt.folioItems && receipt.folioItems.length > 0 && (
              <>
                <Divider />
                <div>
                  <Text strong style={{ marginBottom: 8, display: "block" }}>
                    Charges Breakdown:
                  </Text>
                  <List
                    size="small"
                    dataSource={receipt.folioItems}
                    renderItem={(item: any) => (
                      <List.Item>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                          }}
                        >
                          <span>{item.description}</span>
                          <span>
                            {item.amount} UZS × {item.quantity}
                          </span>
                        </div>
                      </List.Item>
                    )}
                  />
                </div>
              </>
            )}

            {receipt.payments && receipt.payments.length > 0 && (
              <>
                <Divider />
                <div>
                  <Text strong style={{ marginBottom: 8, display: "block" }}>
                    Payments:
                  </Text>
                  <List
                    size="small"
                    dataSource={receipt.payments}
                    renderItem={(payment: any) => (
                      <List.Item>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                          }}
                        >
                          <span>
                            {payment.method} - {payment.transactionRef || "N/A"}
                          </span>
                          <span>{payment.amount} UZS</span>
                        </div>
                      </List.Item>
                    )}
                  />
                </div>
              </>
            )}

            {receipt.checkoutNotes && (
              <>
                <Divider />
                <div>
                  <Text strong>Checkout Notes:</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text>{receipt.checkoutNotes}</Text>
                  </div>
                </div>
              </>
            )}
          </Space>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="Guest Checkout"
      open={open}
      onCancel={onClose}
      footer={null}
      width={screens.md ? 600 : "100%"}
      style={screens.md ? { top: 100 } : { top: 0 }}
    >
      <div style={{ marginBottom: 24 }}>
        <Title level={5}>
          {booking?.primaryGuest?.firstName} {booking?.primaryGuest?.lastName}
        </Title>
        <Text type="secondary">
          Room {booking?.roomStays?.[0]?.room?.number || "-"} | Check-in:{" "}
          {new Date(booking?.checkIn).toLocaleDateString()}
        </Text>
      </div>

      <Divider>Charges Breakdown</Divider>
      <Card size="small" style={{ marginBottom: 24 }}>
        {chargesBreakdown.roomCharges &&
        chargesBreakdown.roomCharges.length > 0 ? (
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              Room Charges
            </Text>
            {chargesBreakdown.roomCharges.map((charge: any, idx: number) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <Text>
                  {charge.description ||
                    `Room charge (${charge.quantity} night${charge.quantity > 1 ? "s" : ""})`}
                </Text>
                <Text strong>
                  {new Intl.NumberFormat().format(
                    Number(charge.totalAmount || 0),
                  )}{" "}
                  UZS
                </Text>
              </div>
            ))}
          </div>
        ) : chargesBreakdown.estimatedRoomCharges ? (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              background: "#f0f5ff",
              borderRadius: 8,
            }}
          >
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              Estimated Room Charges
              {chargesBreakdown.estimatedRoomCharges.roomTypeName && (
                <Text
                  type="secondary"
                  style={{ marginLeft: 8, fontWeight: "normal" }}
                >
                  ({chargesBreakdown.estimatedRoomCharges.roomTypeName})
                </Text>
              )}
            </Text>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text type="secondary">
                {chargesBreakdown.estimatedRoomCharges.nights} night
                {chargesBreakdown.estimatedRoomCharges.nights > 1
                  ? "s"
                  : ""} ×{" "}
                {new Intl.NumberFormat().format(
                  chargesBreakdown.estimatedRoomCharges.ratePerNight,
                )}{" "}
                UZS/night
              </Text>
              <Text strong>
                {new Intl.NumberFormat().format(
                  chargesBreakdown.estimatedRoomCharges.total,
                )}{" "}
                UZS
              </Text>
            </div>
            <Tag color="blue" style={{ marginTop: 8 }}>
              Will be calculated during checkout based on actual stay duration
            </Tag>
          </div>
        ) : null}

        {chargesBreakdown.items
          .filter((item: any) => item.type !== "ROOM_CHARGE")
          .map((item: any, idx: number) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text>{item.description}</Text>
              <Text>
                {new Intl.NumberFormat().format(Number(item.totalAmount || 0))}{" "}
                UZS
              </Text>
            </div>
          ))}

        {chargesBreakdown.items.length === 0 &&
          !chargesBreakdown.estimatedRoomCharges && (
            <Text type="secondary">No charges yet</Text>
          )}

        <Divider style={{ margin: "12px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Text strong>Total Charges:</Text>
          <Text strong style={{ fontSize: 16 }}>
            {new Intl.NumberFormat().format(
              chargesBreakdown.totalCharges +
                (chargesBreakdown.estimatedRoomCharges?.total || 0),
            )}{" "}
            UZS
          </Text>
        </div>
      </Card>

      <Alert
        message={`Outstanding Balance: ${new Intl.NumberFormat().format(folioBalance)} UZS`}
        type={folioBalance > 0 ? "warning" : "success"}
        showIcon
        style={{ marginBottom: 24 }}
      />

      {folioBalance > 0 && (
        <>
          <Divider>Payment Required</Divider>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCheckout}
            initialValues={{ paymentAmount: folioBalance }}
          >
            <Form.Item
              name="paymentAmount"
              label="Payment Amount"
              rules={[
                { required: true, message: "Please enter payment amount" },
                {
                  type: "number",
                  min: folioBalance,
                  message: `Minimum ${folioBalance} UZS required`,
                },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                size="large"
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
              />
            </Form.Item>

            <Form.Item
              name="paymentMethod"
              label="Payment Method"
              rules={[
                { required: true, message: "Please select payment method" },
              ]}
            >
              <Select size="large">
                <Select.Option value={PaymentMethod.CASH}>Cash</Select.Option>
                <Select.Option value={PaymentMethod.UZCARD}>
                  UzCard
                </Select.Option>
                <Select.Option value={PaymentMethod.HUMO}>Humo</Select.Option>
                <Select.Option value={PaymentMethod.VISA_MASTERCARD}>
                  Visa/Mastercard
                </Select.Option>
                <Select.Option value={PaymentMethod.CLICK}>Click</Select.Option>
                <Select.Option value={PaymentMethod.PAYME}>Payme</Select.Option>
                <Select.Option value={PaymentMethod.BANK_TRANSFER}>
                  Bank Transfer
                </Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="transactionRef"
              label="Transaction Reference (Optional)"
            >
              <Input size="large" placeholder="Receipt # or Auth Code" />
            </Form.Item>

            <Form.Item name="notes" label="Notes (Optional)">
              <Input.TextArea rows={2} placeholder="Any additional notes" />
            </Form.Item>

            <Divider>Room Condition</Divider>
            <Form.Item
              name="roomStatus"
              label="Room Status After Checkout"
              initialValue={RoomStatus.DIRTY}
            >
              <Select size="large">
                <Select.Option value={RoomStatus.DIRTY}>
                  Dirty - Needs Cleaning
                </Select.Option>
                <Select.Option value={RoomStatus.MAINTENANCE}>
                  Maintenance Required
                </Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="maintenanceNotes"
              label="Maintenance Notes (if applicable)"
            >
              <Input.TextArea
                rows={2}
                placeholder="Describe any maintenance issues found during checkout"
              />
            </Form.Item>

            <Divider>Additional Charges</Divider>
            {additionalCharges.map((charge, index) => (
              <Card key={index} size="small" style={{ marginBottom: 16 }}>
                <Row gutter={16} align="middle">
                  <Col span={10}>
                    <Input
                      placeholder="Description"
                      value={charge.description}
                      onChange={(e) =>
                        updateAdditionalCharge(
                          index,
                          "description",
                          e.target.value,
                        )
                      }
                    />
                  </Col>
                  <Col span={6}>
                    <InputNumber
                      placeholder="Amount"
                      value={charge.amount}
                      onChange={(value) =>
                        updateAdditionalCharge(index, "amount", value)
                      }
                      style={{ width: "100%" }}
                      min={0}
                    />
                  </Col>
                  <Col span={4}>
                    <InputNumber
                      placeholder="Qty"
                      value={charge.quantity}
                      onChange={(value) =>
                        updateAdditionalCharge(index, "quantity", value)
                      }
                      min={1}
                      style={{ width: "100%" }}
                    />
                  </Col>
                  <Col span={4}>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeAdditionalCharge(index)}
                    />
                  </Col>
                </Row>
              </Card>
            ))}
            <Button
              type="dashed"
              onClick={addAdditionalCharge}
              icon={<PlusOutlined />}
              style={{ width: "100%", marginBottom: 16 }}
            >
              Add Additional Charge
            </Button>

            <Divider>Feedback & Survey</Divider>
            <Form.Item name="requestFeedback" valuePropName="checked">
              <Checkbox>Request guest feedback survey</Checkbox>
            </Form.Item>

            <Form.Item>
              <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={checkoutMutation.isPending}
                  size="large"
                >
                  Complete Checkout
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </>
      )}

      {folioBalance <= 0 && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Button
            type="primary"
            size="large"
            onClick={() => handleCheckout({})}
            loading={checkoutMutation.isPending}
          >
            Complete Checkout
          </Button>
        </div>
      )}
    </Modal>
  );
};
