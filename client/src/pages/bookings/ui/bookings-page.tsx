import { useState } from "react";
import {
  Table,
  Button,
  Tag,
  Space,
  Typography,
  Card,
  Input,
  Dropdown,
  type MenuProps,
  Modal,
  Grid,
  List,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  EllipsisOutlined,
  StopOutlined,
  CheckCircleOutlined,
  KeyOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  bookingApi,
  BookingStatus,
  type Booking,
} from "@/entities/booking/api/booking-api";
import { CreateBookingDrawer } from "@/widgets/bookings/ui/create-booking-drawer";
import { CheckoutModal } from "@/widgets/bookings/ui/checkout-modal";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { usePaginationSearchParams } from "@/shared/hooks/use-pagination-search-params";

const { Title, Text } = Typography;

export const BookingsPage = () => {
  const { t } = useTranslation(["bookings", "common"]);
  const screens = Grid.useBreakpoint();
  const queryClient = useQueryClient();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [checkoutBooking, setCheckoutBooking] = useState<Booking | null>(null);

  const { params, handleSearch, setParam, pagination, apiParams } =
    usePaginationSearchParams();

  const { data, isLoading } = useQuery({
    queryKey: ["bookings", apiParams],
    queryFn: () => bookingApi.getAll(apiParams),
  });

  const bookings = data?.data || [];
  const total = data?.total || 0;

  // Client-side filtering removed in favor of server-side
  const filteredBookings = bookings;

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
      bookingApi.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });

  const handleStatusChange = (id: string, status: BookingStatus) => {
    Modal.confirm({
      title: t("common:confirm", "Are you sure?"),
      content: `Change status to ${status}?`,
      onOk: () => updateStatusMutation.mutate({ id, status }),
    });
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.CONFIRMED:
        return "blue";
      case BookingStatus.CHECKED_IN:
        return "green";
      case BookingStatus.CHECKED_OUT:
        return "purple";
      case BookingStatus.CANCELLED:
        return "red";
      case BookingStatus.NO_SHOW:
        return "orange";
      default:
        return "default";
    }
  };

  const columns = [
    {
      title: t("bookings:guest", "Guest"),
      key: "guest",
      render: (_: any, record: Booking) => (
        <Space direction="vertical" size={2}>
          <Text strong>
            {record.primaryGuest?.firstName} {record.primaryGuest?.lastName}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.primaryGuest?.phone}
          </Text>
        </Space>
      ),
    },
    {
      title: t("bookings:room", "Room"),
      key: "room",
      render: (_: any, record: Booking) =>
        record.roomStays?.[0]?.room ? (
          <Tag>{record.roomStays[0].room.number}</Tag>
        ) : (
          <Text type="secondary" italic>
            Unassigned
          </Text>
        ),
    },
    {
      title: t("bookings:dates", "Dates"),
      key: "dates",
      render: (_: any, record: Booking) => (
        <Space direction="vertical" size={2}>
          <Text>
            {dayjs(record.checkIn).format("DD MMM YYYY")}
            <span style={{ color: "#bfbfbf", margin: "0 8px" }}>→</span>
            {dayjs(record.checkOut).format("DD MMM YYYY")}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(record.checkOut).diff(dayjs(record.checkIn), "day")} nights
          </Text>
        </Space>
      ),
    },
    {
      title: t("bookings:status", "Status"),
      dataIndex: "status",
      key: "status",
      render: (status: BookingStatus) => (
        <Tag color={getStatusColor(status)}>{status.replace("_", " ")}</Tag>
      ),
    },
    {
      title: t("bookings:source", "Source"),
      dataIndex: "source",
      key: "source",
      render: (source: string) => (
        <Text style={{ fontSize: 13 }}>{source}</Text>
      ),
    },
    {
      title: t("common:actions", "Actions"),
      key: "actions",
      render: (_: any, record: Booking) => (
        <Dropdown menu={{ items: getActionItems(record) }} trigger={["click"]}>
          <Button type="text" icon={<EllipsisOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const getActionItems = (record: Booking): MenuProps["items"] => {
    const items: MenuProps["items"] = [];

    if (record.status === BookingStatus.CONFIRMED) {
      items.push({
        key: "check-in",
        icon: <CheckCircleOutlined />,
        label: "Check In",
        onClick: () => handleStatusChange(record.id, BookingStatus.CHECKED_IN),
      });
    }
    if (record.status === BookingStatus.CHECKED_IN) {
      items.push({
        key: "check-out",
        icon: <StopOutlined />,
        label: "Check Out",
        onClick: () => setCheckoutBooking(record),
      });
    }
    if (
      record.status === BookingStatus.PENDING ||
      record.status === BookingStatus.CONFIRMED
    ) {
      items.push({
        key: "cancel",
        danger: true,
        label: "Cancel Booking",
        onClick: () => handleStatusChange(record.id, BookingStatus.CANCELLED),
      });
    }
    return items;
  };

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          flexDirection: screens.md ? "row" : "column",
          justifyContent: "space-between",
          marginBottom: 24,
          alignItems: screens.md ? "center" : "flex-start",
          gap: screens.md ? 0 : 16,
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            {t("bookings:title", "Bookings")}
          </Title>
          <Text type="secondary">Manage your reservations and occupancy</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => setIsDrawerOpen(true)}
          style={{ width: screens.md ? "auto" : "100%" }}
        >
          {t("bookings:newReservation", "New Reservation")}
        </Button>
      </div>

      <Card>
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            gap: 16,
            flexDirection: screens.md ? "row" : "column",
          }}
        >
          <Input
            placeholder={t("common:search", "Search bookings...")}
            prefix={<SearchOutlined />}
            style={{ maxWidth: screens.md ? 300 : "100%" }}
            value={params.search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <Button
            icon={<FilterOutlined />}
            style={{ width: screens.md ? "auto" : "100%" }}
            onClick={() => setIsFilterDrawerOpen(true)}
          >
            {params.status === "ALL" || !params.status
              ? "Filter"
              : `Status: ${params.status}`}
          </Button>
        </div>

        <Modal
          title="Filters"
          open={isFilterDrawerOpen && !screens.md}
          onCancel={() => setIsFilterDrawerOpen(false)}
          footer={null}
          style={{ top: 20 }}
        >
          <div style={{ padding: "16px 0" }}>
            <Text strong style={{ display: "block", marginBottom: 12 }}>
              Booking Status
            </Text>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["ALL", ...Object.values(BookingStatus)].map((status) => (
                <Button
                  key={status}
                  type={
                    (params.status || "ALL") === status ? "primary" : "default"
                  }
                  onClick={() => {
                    setParam("status", status === "ALL" ? null : status);
                    setIsFilterDrawerOpen(false);
                  }}
                >
                  {status.replace("_", " ")}
                </Button>
              ))}
            </div>
          </div>
        </Modal>

        {!screens.md ? (
          <List
            grid={{ gutter: 16, column: 1 }}
            dataSource={filteredBookings}
            loading={isLoading}
            pagination={{
              ...pagination,
              total,
              align: "center",
            }}
            renderItem={(item: Booking) => (
              <List.Item style={{ padding: "8px 0" }}>
                <Card
                  hoverable
                  bodyStyle={{ padding: "16px 20px" }}
                  style={{
                    borderRadius: 16,
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <Text
                        strong
                        style={{
                          fontSize: 18,
                          display: "block",
                          color: "#1a1a1a",
                        }}
                      >
                        {item.primaryGuest?.firstName}{" "}
                        {item.primaryGuest?.lastName}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {item.primaryGuest?.phone}
                      </Text>
                    </div>
                    <Tag
                      color={getStatusColor(item.status)}
                      style={{
                        margin: 0,
                        borderRadius: 6,
                        padding: "2px 8px",
                        textTransform: "capitalize",
                      }}
                    >
                      {item.status.replace("_", " ").toLowerCase()}
                    </Tag>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                      marginBottom: 20,
                    }}
                  >
                    <div
                      style={{
                        background: "#fafafa",
                        padding: "10px 14px",
                        borderRadius: 12,
                        border: "1px solid #f0f0f0",
                      }}
                    >
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 10,
                          display: "block",
                          letterSpacing: "0.5px",
                          fontWeight: 600,
                        }}
                      >
                        CHECK-IN
                      </Text>
                      <Text strong style={{ fontSize: 15 }}>
                        {dayjs(item.checkIn).format("MMM DD")}
                      </Text>
                    </div>
                    <div
                      style={{
                        background: "#fafafa",
                        padding: "10px 14px",
                        borderRadius: 12,
                        border: "1px solid #f0f0f0",
                      }}
                    >
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 10,
                          display: "block",
                          letterSpacing: "0.5px",
                          fontWeight: 600,
                        }}
                      >
                        CHECK-OUT
                      </Text>
                      <Text strong style={{ fontSize: 15 }}>
                        {dayjs(item.checkOut).format("MMM DD")}
                      </Text>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Space size={12}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          background: "#fff1f0",
                          padding: "4px 10px",
                          borderRadius: 8,
                          color: "#cf1322",
                        }}
                      >
                        <KeyOutlined style={{ fontSize: 12 }} />
                        <Text strong style={{ color: "inherit", fontSize: 13 }}>
                          {item.roomStays?.[0]?.room?.number || "-"}
                        </Text>
                      </div>
                      <Text
                        type="secondary"
                        style={{ fontSize: 13, fontWeight: 500 }}
                      >
                        {dayjs(item.checkOut).diff(dayjs(item.checkIn), "day")}{" "}
                        nights
                      </Text>
                    </Space>

                    <div style={{ display: "flex", gap: 10 }}>
                      {item.status === BookingStatus.CONFIRMED && (
                        <Button
                          size="middle"
                          type="primary"
                          shape="round"
                          onClick={() =>
                            handleStatusChange(
                              item.id,
                              BookingStatus.CHECKED_IN,
                            )
                          }
                          style={{ fontWeight: 500 }}
                        >
                          Check In
                        </Button>
                      )}
                      {item.status === BookingStatus.CHECKED_IN && (
                        <Button
                          size="middle"
                          type="primary"
                          ghost
                          shape="round"
                          onClick={() => setCheckoutBooking(item)}
                          style={{ fontWeight: 500 }}
                        >
                          Check Out
                        </Button>
                      )}
                      <Dropdown
                        menu={{ items: getActionItems(item) }}
                        trigger={["click"]}
                        placement="bottomRight"
                      >
                        <Button
                          icon={<EllipsisOutlined />}
                          shape="circle"
                          style={{ border: "1px solid #f0f0f0" }}
                        />
                      </Dropdown>
                    </div>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        ) : (
          <Table
            dataSource={filteredBookings}
            columns={columns}
            rowKey="id"
            loading={isLoading}
            pagination={{
              ...pagination,
              total,
            }}
          />
        )}
      </Card>

      <CreateBookingDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {checkoutBooking && (
        <CheckoutModal
          open={!!checkoutBooking}
          onClose={() => setCheckoutBooking(null)}
          booking={checkoutBooking}
          folioBalance={(() => {
            const primaryFolio = checkoutBooking.folios?.find(
              (f: any) => f.isPrimary,
            );
            if (!primaryFolio) return 0;
            const charges =
              primaryFolio.items?.reduce(
                (sum: number, item: any) =>
                  sum + Number(item.amount) * item.quantity,
                0,
              ) || 0;
            const payments =
              primaryFolio.payments?.reduce(
                (sum: number, payment: any) => sum + Number(payment.amount),
                0,
              ) || 0;
            return charges - payments;
          })()}
        />
      )}
    </div>
  );
};
