import { useState, useMemo } from "react";
import {
  Card,
  Typography,
  DatePicker,
  Button,
  Space,
  Tag,
  Spin,
  Tooltip,
  Empty,
  Avatar,
  Badge,
  Segmented,
  message,
} from "antd";
import {
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
  UnorderedListOutlined,
  UserOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingApi } from "@/entities/booking/api/booking-api";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { CreateBookingDrawer } from "@/widgets/bookings/ui/create-booking-drawer";

dayjs.extend(isBetween);

const { Title, Text } = Typography;

// Design Constants
const ROOM_COL_WIDTH = 220;
const DAY_COL_WIDTH = 120; // Much wider for comfort
const ROW_HEIGHT = 90; // Taller rows for better separation

export const TimelinePage = () => {
  const {} = useTranslation(["bookings", "common"]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewDate, setViewDate] = useState(dayjs());
  const [viewMode, setViewMode] = useState<"month" | "day">("month");

  // Booking Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerInitialValues, setDrawerInitialValues] = useState<any>(null);

  // Calculate dates/hours for the current view
  const { columns, dateFrom, dateTo } = useMemo(() => {
    if (viewMode === "month") {
      const days = viewDate.daysInMonth();
      return {
        columns: Array.from({ length: days }, (_, i) => viewDate.date(i + 1)),
        dateFrom: viewDate.startOf("month").format("YYYY-MM-DD"),
        dateTo: viewDate.endOf("month").format("YYYY-MM-DD"),
      };
    } else {
      // Day view: 24 hours
      return {
        columns: Array.from({ length: 24 }, (_, i) =>
          viewDate.hour(i).startOf("hour"),
        ),
        dateFrom: viewDate.startOf("day").format("YYYY-MM-DD"),
        dateTo: viewDate.endOf("day").format("YYYY-MM-DD"),
      };
    }
  }, [viewDate, viewMode]);

  const { data: rooms, isLoading } = useQuery({
    queryKey: ["bookings-timeline", dateFrom, dateTo, viewMode],
    queryFn: () => bookingApi.getTimeline(dateFrom, dateTo),
  });

  const handlePrev = () => setViewDate(viewDate.subtract(1, viewMode));
  const handleNext = () => setViewDate(viewDate.add(1, viewMode));
  const handleToday = () => setViewDate(dayjs().startOf(viewMode));

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "CHECKED_IN":
        return {
          bg: "rgba(82, 196, 26, 0.15)",
          border: "#52c41a",
          text: "#237804",
          gradient: "linear-gradient(135deg, #73d13d 0%, #52c41a 100%)",
        };
      case "CONFIRMED":
        return {
          bg: "rgba(24, 144, 255, 0.15)",
          border: "#1890ff",
          text: "#0050b3",
          gradient: "linear-gradient(135deg, #40a9ff 0%, #1890ff 100%)",
        };
      case "CHECKED_OUT":
        return {
          bg: "rgba(114, 46, 209, 0.15)",
          border: "#722ed1",
          text: "#391085",
          gradient: "linear-gradient(135deg, #9254de 0%, #722ed1 100%)",
        };
      default:
        return {
          bg: "rgb(245, 245, 245)",
          border: "#d9d9d9",
          text: "#595959",
          gradient: "linear-gradient(135deg, #f5f5f5 0%, #d9d9d9 100%)",
        };
    }
  };

  const isToday = (day: dayjs.Dayjs) => day.isSame(dayjs(), "day");
  const isNow = (hour: dayjs.Dayjs) =>
    hour.isSame(dayjs(), "hour") && hour.isSame(dayjs(), "day");

  return (
    <div style={{ padding: "24px", minHeight: "100vh", background: "#f8f9fa" }}>
      {/* Header Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          background: "white",
          padding: "20px 24px",
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div>
          <Space align="center" size="middle">
            <div
              style={{
                width: 48,
                height: 48,
                background: "#1677ff15",
                borderRadius: 12,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <CalendarOutlined style={{ fontSize: 24, color: "#1677ff" }} />
            </div>
            <div>
              <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
                Tape Chart
              </Title>
              <Text type="secondary">
                {viewMode === "month"
                  ? `Occupancy for ${viewDate.format("MMMM YYYY")}`
                  : `Schedule for ${viewDate.format("MMMM D, YYYY")}`}
              </Text>
            </div>
          </Space>
        </div>
        <Space size="middle">
          <Segmented
            options={[
              { label: "Monthly", value: "month" },
              { label: "Daily", value: "day" },
            ]}
            value={viewMode}
            onChange={(val) => setViewMode(val as any)}
            size="large"
          />
          <Button
            size="large"
            icon={<UnorderedListOutlined />}
            onClick={() => navigate("/bookings")}
          >
            List View
          </Button>
          <div
            style={{
              background: "#f0f2f5",
              padding: 4,
              borderRadius: 10,
              display: "flex",
              gap: 4,
            }}
          >
            <Button icon={<LeftOutlined />} onClick={handlePrev} type="text" />
            <DatePicker
              picker={viewMode === "month" ? "month" : "date"}
              value={viewDate}
              onChange={(date) => date && setViewDate(date)}
              allowClear={false}
              bordered={false}
              style={{ width: 140, fontWeight: 600 }}
            />
            <Button icon={<RightOutlined />} onClick={handleNext} type="text" />
          </div>
          <Button size="large" onClick={handleToday} type="primary" ghost>
            Today
          </Button>
        </Space>
      </div>

      {/* Main Chart Card */}
      <Card
        bodyStyle={{ padding: 0 }}
        style={{
          borderRadius: 16,
          overflow: "hidden",
          border: "none",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        }}
      >
        {isLoading ? (
          <div
            style={{
              height: 600,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Spin size="large" />
            <Text type="secondary" strong>
              Loading your inventory...
            </Text>
          </div>
        ) : rooms && rooms.length > 0 ? (
          <div style={{ position: "relative" }}>
            {/* Legend & Controls Overlay */}
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid #f0f0f0",
                display: "flex",
                justifyContent: "space-between",
                background: "#fff",
              }}
            >
              <Space size="large">
                <Badge
                  color="#1890ff"
                  text={
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Confirmed
                    </Text>
                  }
                />
                <Badge
                  color="#52c41a"
                  text={
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Checked In
                    </Text>
                  }
                />
                <Badge
                  color="#722ed1"
                  text={
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Checked Out
                    </Text>
                  }
                />
                <Badge
                  color="#f5f5f5"
                  text={
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Room Available
                    </Text>
                  }
                />
              </Space>
              <Tooltip title="Scroll horizontally to see the full month">
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <InfoCircleOutlined /> Hint: Use Shift + Scroll for horizontal
                  navigation
                </Text>
              </Tooltip>
            </div>

            {/* Scrollable Container */}
            <div
              style={{
                overflowX: "auto",
                maxHeight: "calc(100vh - 300px)",
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `${ROOM_COL_WIDTH}px repeat(${columns.length}, ${DAY_COL_WIDTH}px)`,
                  minWidth: ROOM_COL_WIDTH + columns.length * DAY_COL_WIDTH,
                }}
              >
                {/* Header Row */}
                <div
                  style={{
                    padding: "16px",
                    fontWeight: "bold",
                    borderBottom: "1px solid #f0f0f0",
                    borderRight: "1px solid #f0f0f0",
                    background: "#fafafa",
                    position: "sticky",
                    top: 0,
                    left: 0,
                    zIndex: 100,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#8c8c8c",
                    fontSize: 12,
                    letterSpacing: "0.05em",
                  }}
                >
                  ROOMS
                </div>
                {columns.map((col, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "8px 0",
                      textAlign: "center",
                      borderBottom: "1px solid #f0f0f0",
                      background: (
                        viewMode === "day" ? isNow(col) : isToday(col)
                      )
                        ? "#e6f7ff"
                        : "#fafafa",
                      position: "sticky",
                      top: 0,
                      zIndex: 90,
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        color:
                          viewMode === "month" &&
                          (col.day() === 0 || col.day() === 6)
                            ? "#ff4d4f"
                            : "#8c8c8c",
                        fontWeight: 600,
                      }}
                    >
                      {viewMode === "month"
                        ? col.format("ddd").toUpperCase()
                        : col.format("HH")}
                    </Text>
                    <Title
                      level={5}
                      style={{
                        margin: 0,
                        fontSize: 14,
                        color: (viewMode === "day" ? isNow(col) : isToday(col))
                          ? "#1677ff"
                          : "inherit",
                      }}
                    >
                      {viewMode === "month" ? col.date() : col.format("mm")}
                    </Title>
                    {(viewMode === "day" ? isNow(col) : isToday(col)) && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          background: "#1677ff",
                        }}
                      />
                    )}
                  </div>
                ))}

                {/* Body Rows */}
                {rooms.map((room: any) => (
                  <div key={room.id} style={{ display: "contents" }}>
                    {/* Room Cell */}
                    <div
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #f0f0f0",
                        borderRight: "1px solid #f0f0f0",
                        background: "#fff",
                        position: "sticky",
                        left: 0,
                        zIndex: 80,
                        height: ROW_HEIGHT,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        transition: "background 0.2s",
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          background: "#f0f2f5",
                          borderRadius: 10,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          fontWeight: 700,
                          color: "#595959",
                        }}
                      >
                        {room.number}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          strong
                          style={{
                            display: "block",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {room.type?.name}
                        </Text>
                        <Tag
                          style={{
                            fontSize: 9,
                            margin: 0,
                            borderRadius: 4,
                            verticalAlign: "middle",
                          }}
                        >
                          {room.floor}F • {room.capacity}P
                        </Tag>
                      </div>
                    </div>

                    {/* Timeline Data Row */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${columns.length}, ${DAY_COL_WIDTH}px)`,
                        gridColumn: `2 / span ${columns.length}`,
                        borderBottom: "1px solid #f0f0f0",
                        position: "relative",
                        background: "#fff",
                        height: ROW_HEIGHT,
                      }}
                    >
                      {/* Grid Lines & Clickable Areas */}
                      {columns.map((col, idx) => (
                        <div
                          key={idx}
                          style={{
                            borderRight: "1px solid #f5f5f5",
                            background: (
                              viewMode === "day" ? isNow(col) : isToday(col)
                            )
                              ? "rgba(230, 247, 255, 0.3)"
                              : "transparent",
                            cursor: "cell",
                            transition: "background 0.2s",
                          }}
                          className="clickable-grid-cell"
                          onClick={() => {
                            setDrawerInitialValues({
                              roomId: room.id,
                              dates: [
                                viewMode === "day" ? col : col.startOf("day"),
                                viewMode === "day"
                                  ? col.add(1, "hour")
                                  : col.add(1, "day"),
                              ],
                            });
                            setIsDrawerOpen(true);
                          }}
                        />
                      ))}

                      {/* Now Vertical Line Indicator */}
                      {((viewMode === "month" && columns.some(isToday)) ||
                        (viewMode === "day" && isToday(viewDate))) && (
                        <div
                          style={{
                            position: "absolute",
                            left:
                              viewMode === "month"
                                ? (dayjs().date() - 1) * DAY_COL_WIDTH +
                                  (dayjs().hour() / 24) * DAY_COL_WIDTH
                                : dayjs().hour() * DAY_COL_WIDTH +
                                  (dayjs().minute() / 60) * DAY_COL_WIDTH,
                            top: 0,
                            bottom: 0,
                            width: 2,
                            background: "rgba(255, 77, 79, 0.6)",
                            zIndex: 85,
                            pointerEvents: "none",
                          }}
                        >
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: "#ff4d4f",
                              position: "absolute",
                              top: -4,
                              left: -3,
                            }}
                          />
                        </div>
                      )}

                      {/* Reservations */}
                      {room.roomStays.map((stay: any) => {
                        const start = dayjs(stay.startDate);
                        const end = dayjs(stay.endDate);

                        // Visibility Check
                        const isVisible = !(
                          start.isAfter(dateTo) || end.isBefore(dateFrom)
                        );
                        if (!isVisible) return null;

                        // Calculate Grid Positioning
                        let left, width;

                        if (viewMode === "month") {
                          const startOffset = start.isBefore(dateFrom)
                            ? 0
                            : (start.date() - 1) * DAY_COL_WIDTH +
                              (start.hour() / 24) * DAY_COL_WIDTH;

                          const endOffset = end.isAfter(dateTo)
                            ? columns.length * DAY_COL_WIDTH
                            : (end.date() - 1) * DAY_COL_WIDTH +
                              (end.hour() / 24) * DAY_COL_WIDTH;

                          left = startOffset;
                          width = endOffset - startOffset;
                        } else {
                          // Day view
                          const startOffset = start.isBefore(dateFrom)
                            ? 0
                            : start.hour() * DAY_COL_WIDTH +
                              (start.minute() / 60) * DAY_COL_WIDTH;

                          const endOffset = end.isAfter(dateTo)
                            ? 24 * DAY_COL_WIDTH
                            : end.hour() * DAY_COL_WIDTH +
                              (end.minute() / 60) * DAY_COL_WIDTH;

                          left = startOffset;
                          width = endOffset - startOffset;
                        }

                        const styles = getStatusStyles(stay.booking?.status);

                        return (
                          <Tooltip
                            key={stay.id}
                            destroyTooltipOnHide
                            title={
                              <div style={{ padding: 4 }}>
                                <div
                                  style={{
                                    borderBottom:
                                      "1px solid rgba(255,255,255,0.2)",
                                    marginBottom: 8,
                                    paddingBottom: 4,
                                  }}
                                >
                                  <Text strong style={{ color: "white" }}>
                                    {stay.booking?.primaryGuest?.firstName}{" "}
                                    {stay.booking?.primaryGuest?.lastName}
                                  </Text>
                                </div>
                                <Space direction="vertical" size={2}>
                                  <Text
                                    style={{
                                      color: "rgba(255,255,255,0.8)",
                                      fontSize: 12,
                                    }}
                                  >
                                    📅 {start.format("MMM D, HH:mm")} —{" "}
                                    {end.format("MMM D, HH:mm")}
                                  </Text>
                                  <Text
                                    style={{
                                      color: "rgba(255,255,255,0.8)",
                                      fontSize: 12,
                                    }}
                                  >
                                    📍 Room {room.number}
                                  </Text>
                                  <Tag
                                    color={styles.border}
                                    style={{ marginTop: 4 }}
                                  >
                                    {stay.booking?.status}
                                  </Tag>
                                </Space>
                              </div>
                            }
                          >
                            <div
                              style={{
                                position: "absolute",
                                left: left + 2,
                                top: 15,
                                width: Math.max(10, width - 4),
                                height: 60,
                                background: styles.bg,
                                color: styles.text,
                                borderLeft: `5px solid ${styles.border}`,
                                borderRadius: 10,
                                padding: "8px 12px",
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                cursor: "pointer",
                                zIndex: 70,
                                boxShadow: "0 3px 10px rgba(0,0,0,0.06)",
                                transition:
                                  "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                overflow: "hidden",
                              }}
                              className="timeline-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                const folioId = stay.booking?.folios?.[0]?.id;
                                if (folioId) {
                                  navigate(`/finance/folios/${folioId}`);
                                } else {
                                  message.warning(
                                    "This booking does not have an active folio yet.",
                                  );
                                }
                              }}
                            >
                              <Avatar
                                size={32}
                                icon={<UserOutlined />}
                                style={{
                                  background: styles.border,
                                  flexShrink: 0,
                                  boxShadow: "0 3px 6px rgba(0,0,0,0.12)",
                                }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <Text
                                  strong
                                  style={{
                                    fontSize: 14,
                                    color: styles.text,
                                    display: "block",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {stay.booking?.primaryGuest?.lastName}
                                </Text>
                                <Text
                                  style={{
                                    fontSize: 11,
                                    color: styles.text,
                                    opacity: 0.8,
                                    fontWeight: 500,
                                  }}
                                >
                                  {start.format("HH:mm")} -{" "}
                                  {end.format("HH:mm")}
                                </Text>
                              </div>
                            </div>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: 100 }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Space direction="vertical" align="center">
                  <Text type="secondary" strong>
                    No rooms found for this branch
                  </Text>
                  <Button type="primary" onClick={() => navigate("/rooms")}>
                    Manage Rooms
                  </Button>
                </Space>
              }
            />
          </div>
        )}
      </Card>

      <CreateBookingDrawer
        open={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          queryClient.invalidateQueries({ queryKey: ["bookings-timeline"] });
        }}
        initialValues={drawerInitialValues}
      />

      <style>{`
        .clickable-grid-cell:hover {
          background: rgba(22, 119, 255, 0.08) !important;
        }
        .timeline-item:active {
          transform: scale(0.98);
        }
        .timeline-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0,0,0,0.1) !important;
          z-index: 75 !important;
        }
        /* Custom scrollbar for premium feel */
        ::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #bbb;
        }
      `}</style>
    </div>
  );
};
