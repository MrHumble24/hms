import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import {
  Table,
  Tag,
  Space,
  Button,
  Typography,
  Popconfirm,
  message,
  Card,
  Row,
  Col,
  Tabs,
  Tooltip,
  Skeleton,
  Empty,
  Divider,
  Grid,
  List,
} from "antd";
import {
  PlusOutlined,
  AuditOutlined,
  CreditCardOutlined,
  HistoryOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
  WarningOutlined,
  PrinterOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  financeApi,
  type FolioItem,
  type Payment,
} from "@/entities/finance/api/finance-api";
import { AddChargeForm } from "@/widgets/finance/ui/add-charge-form";
import { RecordPaymentForm } from "@/widgets/finance/ui/record-payment-form";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export const FolioMainPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(["finance", "common"]);
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  // Helper to extract order ID
  const getOrderIdFromDescription = (description: string) => {
    const match = description.match(/Restaurant Order #([A-Z0-9]+)/i);
    return match ? match[1] : null;
  };

  // Drawers state
  const [isChargeOpen, setIsChargeOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const {
    data: folio,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["folio", id],
    queryFn: () => financeApi.getFolio(id!),
    enabled: !!id,
  });

  const { data: bookingFolios = [] } = useQuery({
    queryKey: ["booking-folios", folio?.bookingId],
    queryFn: () => financeApi.getFoliosByBooking(folio!.bookingId),
    enabled: !!folio?.bookingId,
  });

  const adjustMutation = useMutation({
    mutationFn: (itemId: string) => financeApi.adjustCharge(id!, itemId),
    onSuccess: () => {
      message.success(t("common:success"));
      refetch();
    },
  });

  const balance = useMemo(() => {
    if (!folio) return { totalCharges: 0, totalPayments: 0, outstanding: 0 };
    const charges = (folio.items || []).reduce(
      (sum: number, i: FolioItem) => sum + Number(i.totalAmount || 0),
      0,
    );
    const payments = (folio.payments || []).reduce(
      (sum: number, p: Payment) => sum + Number(p.amount),
      0,
    );
    return {
      totalCharges: charges,
      totalPayments: payments,
      outstanding: charges - payments,
    };
  }, [folio]);

  const isClosed = folio?.status === "CLOSED";

  const { data: roomChargesSummary } = useQuery({
    queryKey: ["folio-room-charges-summary", id],
    queryFn: () => financeApi.getRoomChargesSummary(id!),
    enabled: !!id && !!folio,
  });

  if (isLoading) return <Skeleton active />;
  if (!folio) return <Empty description="Folio not found" />;

  const chargeColumns = [
    {
      title: t("finance:columns.date"),
      dataIndex: "createdAt",
      key: "date",
      render: (val: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {dayjs(val).format("DD.MM HH:mm")}
        </Text>
      ),
    },
    {
      title: t("finance:columns.description"),
      dataIndex: "description",
      key: "desc",
      render: (text: string, record: FolioItem) => {
        const restaurantOrderId = getOrderIdFromDescription(text);
        return (
          <Space direction="vertical" size={0}>
            <Space>
              <Text strong={record.source === "SYSTEM"}>{text}</Text>
              {restaurantOrderId && (
                <Tooltip title="View Order Details">
                  <Button
                    type="link"
                    size="small"
                    style={{ padding: 0, height: "auto" }}
                    onClick={() =>
                      navigate(
                        `/restaurant/history?search=${restaurantOrderId}`,
                      )
                    }
                  >
                    #{restaurantOrderId}
                  </Button>
                </Tooltip>
              )}
            </Space>
            {record.staff?.fullName && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                {t("finance:columns.staff")}: {record.staff.fullName}
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: t("finance:columns.type"),
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag style={{ fontSize: 11, borderRadius: 4 }}>
          {t(`finance:types.${type}`)}
        </Tag>
      ),
    },
    {
      title: t("finance:columns.amount"),
      key: "amount",
      align: "right" as const,
      render: (record: FolioItem) => (
        <Space direction="vertical" align="end" size={0}>
          <Text strong>
            {new Intl.NumberFormat().format(Number(record.totalAmount || 0))}{" "}
            UZS
          </Text>
          {record.quantity > 1 && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.quantity} ×{" "}
              {new Intl.NumberFormat().format(Number(record.unitPrice || 0))}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "",
      key: "actions",
      render: (record: FolioItem) =>
        Number(record.totalAmount) > 0 && (
          <Tooltip
            title={
              isClosed
                ? t("finance:warnings.folioClosedTitle")
                : t("finance:actions.adjust")
            }
          >
            <Popconfirm
              disabled={isClosed}
              title={t("finance:actions.adjustConfirm")}
              onConfirm={() => adjustMutation.mutate(record.id)}
            >
              <Button
                type="text"
                size="small"
                disabled={isClosed}
                icon={
                  <HistoryOutlined
                    style={{ color: isClosed ? "#d9d9d9" : "#fa8c16" }}
                  />
                }
              />
            </Popconfirm>
          </Tooltip>
        ),
    },
  ];

  const paymentColumns = [
    {
      title: t("finance:columns.date"),
      dataIndex: "createdAt",
      key: "date",
      render: (val: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {dayjs(val).format("DD.MM HH:mm")}
        </Text>
      ),
    },
    {
      title: t("finance:columns.method"),
      dataIndex: "method",
      key: "method",
      render: (method: string) => <Tag color="blue">{method}</Tag>,
    },
    {
      title: `${t("finance:columns.source")} / ${t("finance:columns.staff")}`,
      key: "ref",
      render: (record: Payment) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 12 }}>{record.transactionRef || "-"}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.staff?.fullName || "-"}
          </Text>
        </Space>
      ),
    },
    {
      title: t("finance:columns.amount"),
      dataIndex: "amount",
      key: "amount",
      align: "right" as const,
      render: (val: number) => (
        <Text strong style={{ color: "#52c41a" }}>
          {new Intl.NumberFormat().format(val)} UZS
        </Text>
      ),
    },
  ];

  return (
    <div
      style={{
        height: "100%",
        background: "#f5f7fa",
        padding: isMobile ? "16px" : "24px",
        minHeight: "100vh",
      }}
    >
      {/* Header & Folio Selector */}
      <div style={{ marginBottom: 24 }}>
        <Row
          justify="space-between"
          align="top"
          style={{ marginBottom: 16 }}
          gutter={[16, 16]}
        >
          <Col xs={24} lg={18}>
            <Space align="center" size={16} wrap style={{ marginBottom: 8 }}>
              <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
                {t("finance:folioTitle")} #{folio.id.slice(0, 8)}
              </Title>
              {folio.isPrimary && (
                <Tag
                  color="gold"
                  icon={<AuditOutlined />}
                  style={{ padding: "4px 12px", borderRadius: 6 }}
                >
                  {t("finance:status.PRIMARY")}
                </Tag>
              )}
              {isClosed && (
                <Tag
                  color="error"
                  icon={<LockOutlined />}
                  style={{ padding: "4px 12px", borderRadius: 6 }}
                >
                  {t("finance:status.CLOSED")}
                </Tag>
              )}
            </Space>
            <div
              style={{
                background: "#fff",
                padding: isMobile ? "12px" : "12px 20px",
                borderRadius: 12,
                border: "1px solid #e1e8f0",
              }}
            >
              <Space
                split={!isMobile && <Divider type="vertical" />}
                direction={isMobile ? "vertical" : "horizontal"}
                size={isMobile ? 4 : 8}
                style={{ width: "100%" }}
              >
                <div>
                  <Text type="secondary">{t("common:guest")}: </Text>
                  <Text strong>
                    {folio.booking?.guest?.lastName || ""}{" "}
                    {folio.booking?.guest?.firstName || ""}
                  </Text>
                </div>
                <div>
                  <Text type="secondary">{t("common:room")}: </Text>
                  <Text strong>{folio.booking?.room?.number || "N/A"}</Text>
                </div>
                <div>
                  <Text type="secondary">Stay: </Text>
                  <Text strong>
                    {folio.booking?.checkIn
                      ? dayjs(folio.booking.checkIn).format("MMM DD")
                      : "N/A"}{" "}
                    -{" "}
                    {folio.booking?.checkOut
                      ? dayjs(folio.booking.checkOut).format("MMM DD")
                      : "N/A"}
                  </Text>
                </div>
              </Space>
            </div>
          </Col>
          <Col
            xs={24}
            lg={6}
            style={{
              display: "flex",
              justifyContent: isMobile ? "flex-start" : "flex-end",
            }}
          >
            <Space size={12} wrap>
              <Button
                icon={<ReloadOutlined spin={isFetching} />}
                onClick={() => refetch()}
                size={isMobile ? "middle" : "large"}
                style={{ borderRadius: 8 }}
              >
                {t("common:refresh")}
              </Button>
              <Button
                type="primary"
                ghost
                icon={<PrinterOutlined />}
                size={isMobile ? "middle" : "large"}
                onClick={() => window.print()}
                style={{ borderRadius: 8 }}
              >
                {t("finance:actions.print")}
              </Button>
            </Space>
          </Col>
        </Row>

        <Tabs
          activeKey={id}
          onChange={(key) => navigate(`/finance/folios/${key}`)}
          className="custom-folio-tabs"
          items={bookingFolios.map((f, i) => ({
            key: f.id,
            label: (
              <Space>
                <Tag
                  style={{
                    border: "none",
                    background:
                      f.id === id
                        ? "rgba(22, 119, 255, 0.1)"
                        : "rgba(0,0,0,0.05)",
                    color: f.id === id ? "#1677ff" : "inherit",
                  }}
                >
                  {String.fromCharCode(65 + i)}
                </Tag>
                <span style={{ fontWeight: f.id === id ? 600 : 400 }}>
                  {f.isPrimary
                    ? t("finance:status.MAIN_FOLIO")
                    : t("finance:status.EXTRA_FOLIO")}
                </span>
                {f.status === "CLOSED" && (
                  <LockOutlined style={{ fontSize: 12, opacity: 0.5 }} />
                )}
              </Space>
            ),
          }))}
        />
      </div>

      <Row gutter={24}>
        <Col lg={17} md={24}>
          {/* Room Charges Summary (Professional Aesthetic) */}
          {roomChargesSummary && (
            <Card
              className="room-charges-card"
              style={{
                borderRadius: 16,
                marginBottom: 24,
                border: "none",
                background: roomChargesSummary.isEstimated
                  ? "linear-gradient(135deg, #f8fbff 0%, #eef5ff 100%)"
                  : "linear-gradient(135deg, #2c3e50 0%, #000000 100%)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                overflow: "hidden",
              }}
              styles={{ body: { padding: 0 } }}
            >
              <div
                style={{
                  padding: "20px 24px",
                  borderBottom: roomChargesSummary.isEstimated
                    ? "1px solid #d9e8ff"
                    : "1px solid rgba(255,255,255,0.1)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Space>
                  <Title
                    level={5}
                    style={{
                      margin: 0,
                      color: roomChargesSummary.isEstimated
                        ? "#1677ff"
                        : "#fff",
                    }}
                  >
                    {t("finance:sections.summary")}
                  </Title>
                  {roomChargesSummary.isEstimated && (
                    <Tag color="blue" style={{ borderRadius: 4 }}>
                      {t("finance:status.ESTIMATED")}
                    </Tag>
                  )}
                </Space>
                {roomChargesSummary.isEstimated && (
                  <Tooltip title={t("finance:status.ESTIMATED_NOTICE")}>
                    <WarningOutlined style={{ color: "#1677ff" }} />
                  </Tooltip>
                )}
              </div>
              <div style={{ padding: "24px" }}>
                <Row gutter={[24, 24]}>
                  <Col xs={12} sm={6}>
                    <Text
                      style={{
                        color: roomChargesSummary.isEstimated
                          ? "#595959"
                          : "rgba(255,255,255,0.6)",
                        fontSize: 13,
                        textTransform: "uppercase",
                      }}
                    >
                      {t("finance:columns.nights")}
                    </Text>
                    <div
                      style={{
                        color: roomChargesSummary.isEstimated ? "#000" : "#fff",
                        fontSize: isMobile ? 20 : 24,
                        fontWeight: 600,
                      }}
                    >
                      {roomChargesSummary.nights}
                    </div>
                  </Col>
                  <Col xs={12} sm={9}>
                    <Text
                      style={{
                        color: roomChargesSummary.isEstimated
                          ? "#595959"
                          : "rgba(255,255,255,0.6)",
                        fontSize: 13,
                        textTransform: "uppercase",
                      }}
                    >
                      {t("finance:columns.rate")}
                    </Text>
                    <div
                      style={{
                        color: roomChargesSummary.isEstimated ? "#000" : "#fff",
                        fontSize: isMobile ? 20 : 24,
                        fontWeight: 600,
                      }}
                    >
                      {new Intl.NumberFormat().format(
                        roomChargesSummary.ratePerNight,
                      )}{" "}
                      UZS
                    </div>
                  </Col>
                  <Col xs={24} sm={9}>
                    <Text
                      style={{
                        color: roomChargesSummary.isEstimated
                          ? "#595959"
                          : "rgba(255,255,255,0.6)",
                        fontSize: 13,
                        textTransform: "uppercase",
                      }}
                    >
                      {t("finance:columns.totalRoomCharges")}
                    </Text>
                    <div
                      style={{
                        color: roomChargesSummary.isEstimated
                          ? "#1677ff"
                          : "#52c41a",
                        fontSize: isMobile ? 20 : 24,
                        fontWeight: 700,
                      }}
                    >
                      {new Intl.NumberFormat().format(
                        roomChargesSummary.totalRoomCharges,
                      )}{" "}
                      UZS
                    </div>
                  </Col>
                </Row>
              </div>
            </Card>
          )}

          {/* Charges Table */}
          <Card
            title={t("finance:sections.charges")}
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsChargeOpen(true)}
                style={{ borderRadius: 6 }}
                disabled={isClosed}
              >
                {t("finance:actions.addCharge")}
              </Button>
            }
            styles={{ body: { padding: 0 } }}
            style={{
              borderRadius: 16,
              marginBottom: 24,
              overflow: "hidden",
              border: "1px solid #e1e8f0",
            }}
          >
            {!isMobile ? (
              <Table
                dataSource={folio.items || []}
                columns={chargeColumns}
                pagination={false}
                rowKey="id"
                locale={{ emptyText: t("finance:sections.noCharges") }}
              />
            ) : (
              <List
                dataSource={folio.items || []}
                renderItem={(item: FolioItem) => (
                  <List.Item style={{ padding: "16px 20px" }}>
                    <div style={{ width: "100%" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <Text strong>{item.description}</Text>
                        <Text strong>
                          {new Intl.NumberFormat().format(
                            Number(item.totalAmount || 0),
                          )}{" "}
                          UZS
                        </Text>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Space>
                          <Tag style={{ fontSize: 10 }}>
                            {t(`finance:types.${item.type}`)}
                          </Tag>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {dayjs(item.createdAt).format("DD.MM HH:mm")}
                          </Text>
                        </Space>
                        {Number(item.totalAmount) > 0 && (
                          <Button
                            type="text"
                            size="small"
                            disabled={isClosed}
                            icon={
                              <HistoryOutlined
                                style={{
                                  color: isClosed ? "#d9d9d9" : "#fa8c16",
                                }}
                              />
                            }
                            onClick={() => adjustMutation.mutate(item.id)}
                          />
                        )}
                      </div>
                    </div>
                  </List.Item>
                )}
                locale={{ emptyText: t("finance:sections.noCharges") }}
              />
            )}
          </Card>

          {/* Payments Table */}
          <Card
            title={t("finance:sections.payments")}
            extra={
              <Button
                type="primary"
                style={{
                  background: "#52c41a",
                  borderColor: "#52c41a",
                  borderRadius: 6,
                }}
                icon={<CreditCardOutlined />}
                onClick={() => setIsPaymentOpen(true)}
              >
                {t("finance:actions.recordPayment")}
              </Button>
            }
            styles={{ body: { padding: 0 } }}
            style={{
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid #e1e8f0",
            }}
          >
            {!isMobile ? (
              <Table
                dataSource={folio.payments || []}
                columns={paymentColumns}
                pagination={false}
                rowKey="id"
                locale={{ emptyText: t("finance:sections.noPayments") }}
              />
            ) : (
              <List
                dataSource={folio.payments || []}
                renderItem={(payment: Payment) => (
                  <List.Item style={{ padding: "16px 20px" }}>
                    <div style={{ width: "100%" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <Tag color="blue">{payment.method}</Tag>
                        <Text strong style={{ color: "#52c41a" }}>
                          {new Intl.NumberFormat().format(payment.amount)} UZS
                        </Text>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 11,
                        }}
                      >
                        <Text type="secondary">
                          {dayjs(payment.createdAt).format("DD.MM HH:mm")}
                        </Text>
                        <Text type="secondary">
                          {payment.transactionRef || "-"}
                        </Text>
                      </div>
                    </div>
                  </List.Item>
                )}
                locale={{ emptyText: t("finance:sections.noPayments") }}
              />
            )}
          </Card>
        </Col>

        {/* Sticky Balance Summary */}
        <Col lg={7} md={24} style={{ marginTop: isMobile ? 24 : 0 }}>
          <div style={{ position: isMobile ? "static" : "sticky", top: 24 }}>
            <Card
              style={{
                borderRadius: 20,
                boxShadow: "0 10px 40px rgba(0,0,0,0.06)",
                border: "none",
                overflow: "hidden",
              }}
              styles={{ body: { padding: 0 } }}
            >
              <div
                style={{
                  padding: "24px",
                  background: "#f8fbff",
                  borderBottom: "1px solid #eef2f8",
                }}
              >
                <Title level={4} style={{ margin: 0, fontSize: 18 }}>
                  {t("finance:balancePanel.title")}
                </Title>
              </div>

              <div style={{ padding: "24px" }}>
                <Space direction="vertical" size={20} style={{ width: "100%" }}>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Text type="secondary">
                      {t("finance:balancePanel.totalCharges")}
                    </Text>
                    <Text strong style={{ fontSize: 15 }}>
                      {new Intl.NumberFormat().format(balance.totalCharges)} UZS
                    </Text>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Text type="secondary">
                      {t("finance:balancePanel.totalPayments")}
                    </Text>
                    <Text strong style={{ color: "#52c41a", fontSize: 15 }}>
                      - {new Intl.NumberFormat().format(balance.totalPayments)}{" "}
                      UZS
                    </Text>
                  </div>

                  <Divider style={{ margin: "4px 0" }} />

                  <div style={{ marginTop: 4 }}>
                    <Text
                      type="secondary"
                      style={{
                        fontSize: 12,
                        textTransform: "uppercase",
                        letterSpacing: 0.8,
                        fontWeight: 600,
                      }}
                    >
                      {t("finance:balancePanel.outstanding")}
                    </Text>
                    <div
                      style={{
                        fontSize: isMobile ? 28 : 36,
                        fontWeight: 800,
                        color: balance.outstanding > 0 ? "#ff4d4f" : "#52c41a",
                        wordBreak: "break-word",
                      }}
                    >
                      {new Intl.NumberFormat().format(balance.outstanding)} UZS
                    </div>
                  </div>

                  <Button
                    type="primary"
                    size="large"
                    block
                    icon={isClosed ? <LockOutlined /> : <ArrowRightOutlined />}
                    disabled={isClosed}
                    style={{
                      height: 60,
                      fontSize: 18,
                      fontWeight: 600,
                      borderRadius: 14,
                      marginTop: 8,
                      background: isClosed
                        ? "#f5f5f5"
                        : balance.outstanding > 0
                          ? "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)"
                          : "#52c41a",
                      border: "none",
                      boxShadow: isClosed
                        ? "none"
                        : balance.outstanding > 0
                          ? "0 4px 14px rgba(82,196,26,0.35)"
                          : "0 4px 14px rgba(82,196,26,0.3)",
                    }}
                    onClick={() => setIsPaymentOpen(true)}
                  >
                    {isClosed
                      ? t("finance:status.CLOSED")
                      : balance.outstanding > 0
                        ? t("finance:balancePanel.settle")
                        : t("finance:balancePanel.settled")}
                  </Button>
                </Space>
              </div>

              {balance.outstanding < 0 && (
                <div
                  style={{
                    padding: "16px 24px",
                    background: "#fff2f0",
                    borderTop: "1px solid #ffccc7",
                  }}
                >
                  <Space align="start" style={{ color: "#ff4d4f" }}>
                    <WarningOutlined style={{ marginTop: 4 }} />
                    <Text
                      style={{
                        fontSize: 13,
                        color: "#ff4d4f",
                        lineHeight: 1.4,
                      }}
                    >
                      {t("finance:warnings.creditBalance")}
                    </Text>
                  </Space>
                </div>
              )}
            </Card>

            <Card
              style={{
                marginTop: 24,
                borderRadius: 16,
                border: "1px solid #e1e8f0",
              }}
            >
              <Title
                level={5}
                style={{
                  fontSize: 14,
                  textTransform: "uppercase",
                  color: "#8c8c8c",
                  marginBottom: 16,
                }}
              >
                {t("finance:sections.quickSettings")}
              </Title>
              <Space direction="vertical" style={{ width: "100%" }} size={12}>
                <Button
                  block
                  disabled={folio.isPrimary}
                  style={{ borderRadius: 8, height: 40 }}
                >
                  {t("finance:actions.setPrimary")}
                </Button>
                <Button
                  block
                  danger
                  type="dashed"
                  style={{ borderRadius: 8, height: 40 }}
                >
                  {t("finance:actions.voidFolio")}
                </Button>
              </Space>
            </Card>
          </div>
        </Col>
      </Row>

      <AddChargeForm
        folioId={id!}
        status={folio.status}
        open={isChargeOpen}
        onClose={() => setIsChargeOpen(false)}
      />

      <RecordPaymentForm
        folioId={id!}
        status={folio.status}
        outstandingBalance={balance.outstanding}
        open={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
      />
    </div>
  );
};
