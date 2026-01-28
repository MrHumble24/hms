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
  Select,
  DatePicker,
  Badge,
  Divider,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  EllipsisOutlined,
  StopOutlined,
  CheckCircleOutlined,
  KeyOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  bookingApi,
  BookingStatus,
  BookingSource,
  type Booking,
} from "@/entities/booking/api/booking-api";
import { CreateBookingDrawer } from "@/widgets/bookings/ui/create-booking-drawer";
import { CheckoutModal } from "@/widgets/bookings/ui/checkout-modal";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { usePaginationSearchParams } from "@/shared/hooks/use-pagination-search-params";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Helper functions for labels
const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    CHECKED_IN: "Checked In",
    CHECKED_OUT: "Checked Out",
    CANCELLED: "Cancelled",
    NO_SHOW: "No Show",
  };
  return labels[status] || status;
};

const getSourceLabel = (source: string) => {
  const labels: Record<string, string> = {
    WALK_IN: "Walk-in",
    PHONE: "Phone",
    BOOKING_COM: "Booking.com",
    EXPEDIA: "Expedia",
    WEBSITE: "Website",
  };
  return labels[source] || source;
};

export const BookingsPage = () => {
  const { t } = useTranslation(["bookings", "common"]);
  const screens = Grid.useBreakpoint();
  const queryClient = useQueryClient();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [checkoutBooking, setCheckoutBooking] = useState<Booking | null>(null);

  // Local filter states for the filter modal
  const [tempFilters, setTempFilters] = useState<{
    status: string | null;
    source: string | null;
    dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;
  }>({
    status: null,
    source: null,
    dateRange: null,
  });

  const { params, handleSearch, setParam, setParams, pagination, apiParams } =
    usePaginationSearchParams();

  // Calculate active filter count
  const activeFilterCount = [
    params.status && params.status !== "ALL" ? 1 : 0,
    params.source && params.source !== "ALL" ? 1 : 0,
    params.dateFrom ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  console.log("📤 Frontend apiParams:", apiParams);

  const { data, isLoading } = useQuery({
    queryKey: ["bookings", apiParams],
    queryFn: () => bookingApi.getAll(apiParams),
  });

  const bookings = data?.data || [];
  const total = data?.total || 0;

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
      content: `Change status to ${getStatusLabel(status)}?`,
      onOk: () => updateStatusMutation.mutate({ id, status }),
    });
  };

  const handleApplyFilters = () => {
    setParams({
      status: tempFilters.status || undefined,
      source: tempFilters.source || undefined,
      dateFrom: tempFilters.dateRange?.[0]?.format("YYYY-MM-DD") || undefined,
      dateTo: tempFilters.dateRange?.[1]?.format("YYYY-MM-DD") || undefined,
    });
    setIsFilterDrawerOpen(false);
  };

  const handleClearFilters = () => {
    setTempFilters({ status: null, source: null, dateRange: null });
    setParams({
      status: undefined,
      source: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    });
    setIsFilterDrawerOpen(false);
  };

  const openFilterModal = () => {
    // Sync temp filters with current params
    setTempFilters({
      status: params.status || null,
      source: params.source || null,
      dateRange:
        params.dateFrom && params.dateTo
          ? [dayjs(params.dateFrom), dayjs(params.dateTo)]
          : null,
    });
    setIsFilterDrawerOpen(true);
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

  const getSourceColor = (source: string) => {
    switch (source) {
      case BookingSource.BOOKING_COM:
        return "blue";
      case BookingSource.EXPEDIA:
        return "gold";
      case BookingSource.WEBSITE:
        return "cyan";
      case BookingSource.PHONE:
        return "purple";
      case BookingSource.WALK_IN:
        return "green";
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
        <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
      ),
    },
    {
      title: t("bookings:source", "Source"),
      dataIndex: "source",
      key: "source",
      render: (source: string) => (
        <Tag color={getSourceColor(source)}>{getSourceLabel(source)}</Tag>
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

  // Filter tags display
  const renderActiveFilters = () => {
    const filters = [];

    if (params.status && params.status !== "ALL") {
      filters.push(
        <Tag
          key="status"
          closable
          onClose={() => setParam("status", null)}
          color="blue"
        >
          Status: {getStatusLabel(params.status)}
        </Tag>,
      );
    }

    if (params.source && params.source !== "ALL") {
      filters.push(
        <Tag
          key="source"
          closable
          onClose={() => setParam("source", null)}
          color="purple"
        >
          Source: {getSourceLabel(params.source)}
        </Tag>,
      );
    }

    if (params.dateFrom && params.dateTo) {
      filters.push(
        <Tag
          key="dates"
          closable
          onClose={() => {
            setParams({ dateFrom: undefined, dateTo: undefined });
          }}
          color="green"
        >
          {dayjs(params.dateFrom).format("MMM DD")} -{" "}
          {dayjs(params.dateTo).format("MMM DD, YYYY")}
        </Tag>,
      );
    }

    return filters.length > 0 ? (
      <div
        style={{
          marginBottom: 12,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        }}
      >
        <Text type="secondary" style={{ fontSize: 13 }}>
          Active filters:
        </Text>
        {filters}
        <Button
          type="link"
          size="small"
          onClick={handleClearFilters}
          icon={<ClearOutlined />}
        >
          Clear all
        </Button>
      </div>
    ) : null;
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
            gap: 12,
            flexDirection: screens.md ? "row" : "column",
          }}
        >
          <Input
            placeholder={t("common:search", "Search by guest name or room...")}
            prefix={<SearchOutlined />}
            style={{ maxWidth: screens.md ? 300 : "100%", flex: 1 }}
            value={params.search}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
          />

          {/* Desktop: Inline filters */}
          {screens.md && (
            <>
              <Select
                placeholder="All Statuses"
                style={{ minWidth: 150 }}
                value={params.status || undefined}
                onChange={(value) => setParam("status", value || null)}
                allowClear
                options={[
                  { value: "ALL", label: "All Statuses" },
                  ...Object.values(BookingStatus).map((status) => ({
                    value: status,
                    label: getStatusLabel(status),
                  })),
                ]}
              />

              <Select
                placeholder="All Sources"
                style={{ minWidth: 140 }}
                value={params.source || undefined}
                onChange={(value) => setParam("source", value || null)}
                allowClear
                options={[
                  { value: "ALL", label: "All Sources" },
                  ...Object.values(BookingSource).map((source) => ({
                    value: source,
                    label: getSourceLabel(source),
                  })),
                ]}
              />

              <RangePicker
                value={
                  params.dateFrom && params.dateTo
                    ? [dayjs(params.dateFrom), dayjs(params.dateTo)]
                    : null
                }
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setParams({
                      dateFrom: dates[0].format("YYYY-MM-DD"),
                      dateTo: dates[1].format("YYYY-MM-DD"),
                    });
                  } else {
                    setParams({ dateFrom: undefined, dateTo: undefined });
                  }
                }}
                style={{ minWidth: 240 }}
                placeholder={["Check-in from", "Check-in to"]}
              />
            </>
          )}

          {/* Mobile: Filter button */}
          {!screens.md && (
            <Badge count={activeFilterCount} size="small">
              <Button
                icon={<FilterOutlined />}
                style={{ width: "100%" }}
                onClick={openFilterModal}
              >
                Filters
                {activeFilterCount > 0 && ` (${activeFilterCount})`}
              </Button>
            </Badge>
          )}
        </div>

        {/* Active filters display */}
        {screens.md && renderActiveFilters()}

        {/* Mobile Filter Modal */}
        <Modal
          title="Filter Bookings"
          open={isFilterDrawerOpen && !screens.md}
          onCancel={() => setIsFilterDrawerOpen(false)}
          footer={[
            <Button key="clear" onClick={handleClearFilters}>
              Clear All
            </Button>,
            <Button key="apply" type="primary" onClick={handleApplyFilters}>
              Apply Filters
            </Button>,
          ]}
          style={{ top: 20 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                Booking Status
              </Text>
              <Select
                placeholder="Select status"
                style={{ width: "100%" }}
                value={tempFilters.status}
                onChange={(value) =>
                  setTempFilters((prev) => ({ ...prev, status: value }))
                }
                allowClear
                options={Object.values(BookingStatus).map((status) => ({
                  value: status,
                  label: getStatusLabel(status),
                }))}
              />
            </div>

            <Divider style={{ margin: 0 }} />

            <div>
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                Booking Source
              </Text>
              <Select
                placeholder="Select source"
                style={{ width: "100%" }}
                value={tempFilters.source}
                onChange={(value) =>
                  setTempFilters((prev) => ({ ...prev, source: value }))
                }
                allowClear
                options={Object.values(BookingSource).map((source) => ({
                  value: source,
                  label: getSourceLabel(source),
                }))}
              />
            </div>

            <Divider style={{ margin: 0 }} />

            <div>
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                Check-in Date Range
              </Text>
              <RangePicker
                style={{ width: "100%" }}
                value={tempFilters.dateRange}
                onChange={(dates) =>
                  setTempFilters((prev) => ({
                    ...prev,
                    dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] | null,
                  }))
                }
                placeholder={["From", "To"]}
              />
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
                    <Space direction="vertical" size={4} align="end">
                      <Tag
                        color={getStatusColor(item.status)}
                        style={{
                          margin: 0,
                          borderRadius: 6,
                          padding: "2px 8px",
                        }}
                      >
                        {getStatusLabel(item.status)}
                      </Tag>
                      <Tag
                        color={getSourceColor(item.source)}
                        style={{
                          margin: 0,
                          borderRadius: 6,
                          padding: "2px 8px",
                          fontSize: 11,
                        }}
                      >
                        {getSourceLabel(item.source)}
                      </Tag>
                    </Space>
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
