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
} from "antd";
import {
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { bookingApi } from "@/entities/booking/api/booking-api";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

dayjs.extend(isBetween);

const { Title, Text } = Typography;

export const TimelinePage = () => {
  const {} = useTranslation(["bookings", "common"]);
  const navigate = useNavigate();
  const [viewDate, setViewDate] = useState(dayjs().startOf("month"));

  // Calculate dates for the current view (1 month)
  const daysInMonth = viewDate.daysInMonth();
  const monthDays = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => viewDate.date(i + 1));
  }, [viewDate, daysInMonth]);

  const dateFrom = viewDate.startOf("month").format("YYYY-MM-DD");
  const dateTo = viewDate.endOf("month").format("YYYY-MM-DD");

  const { data: rooms, isLoading } = useQuery({
    queryKey: ["bookings-timeline", dateFrom, dateTo],
    queryFn: () => bookingApi.getTimeline(dateFrom, dateTo),
  });

  const handlePrevMonth = () => setViewDate(viewDate.subtract(1, "month"));
  const handleNextMonth = () => setViewDate(viewDate.add(1, "month"));
  const handleToday = () => setViewDate(dayjs().startOf("month"));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CHECKED_IN":
        return "#52c41a"; // green
      case "CONFIRMED":
        return "#1890ff"; // blue
      case "CHECKED_OUT":
        return "#722ed1"; // purple
      default:
        return "#bfbfbf";
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Tape Chart <Tag color="orange">Experimental</Tag>
          </Title>
          <Text type="secondary">Visual room occupancy and availability</Text>
        </div>
        <Space>
          <Button
            icon={<UnorderedListOutlined />}
            onClick={() => navigate("/bookings")}
          >
            List View
          </Button>
          <Button icon={<CalendarOutlined />} type="primary">
            Tape Chart
          </Button>
        </Space>
      </div>

      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Space size="middle">
            <Button icon={<LeftOutlined />} onClick={handlePrevMonth} />
            <DatePicker
              picker="month"
              value={viewDate}
              onChange={(date) => date && setViewDate(date.startOf("month"))}
              allowClear={false}
            />
            <Button icon={<RightOutlined />} onClick={handleNextMonth} />
            <Button onClick={handleToday}>Today</Button>
          </Space>

          <Space>
            <Tag color="#1890ff">Confirmed</Tag>
            <Tag color="#52c41a">Checked In</Tag>
            <Tag color="#722ed1">Checked Out</Tag>
          </Space>
        </div>

        {isLoading ? (
          <div
            style={{
              height: 400,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Spin size="large" tip="Loading Tape Chart..." />
          </div>
        ) : rooms && rooms.length > 0 ? (
          <div
            style={{
              overflowX: "auto",
              border: "1px solid #f0f0f0",
              borderRadius: 8,
              maxHeight: "calc(100vh - 350px)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `150px repeat(${daysInMonth}, 40px)`,
                minWidth: 150 + daysInMonth * 40,
              }}
            >
              {/* Header Row */}
              <div
                style={{
                  padding: "12px",
                  fontWeight: "bold",
                  borderBottom: "2px solid #f0f0f0",
                  borderRight: "1px solid #f0f0f0",
                  background: "#fafafa",
                  position: "sticky",
                  left: 0,
                  zIndex: 10,
                }}
              >
                Room
              </div>
              {monthDays.map((day) => (
                <div
                  key={day.format("YYYY-MM-DD")}
                  style={{
                    padding: "12px 0",
                    textAlign: "center",
                    fontWeight: "bold",
                    borderBottom: "2px solid #f0f0f0",
                    background: day.isSame(dayjs(), "day")
                      ? "#e6f7ff"
                      : "#fafafa",
                    color:
                      day.day() === 0 || day.day() === 6
                        ? "#ff4d4f"
                        : "inherit",
                  }}
                >
                  {day.date()}
                </div>
              ))}

              {/* Room Rows */}
              {rooms.map((room: any) => (
                <>
                  <div
                    key={`${room.id}-label`}
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #f0f0f0",
                      borderRight: "1px solid #f0f0f0",
                      background: "#fff",
                      position: "sticky",
                      left: 0,
                      zIndex: 9,
                    }}
                  >
                    <Text strong>{room.number}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 10 }}>
                      {room.type?.name}
                    </Text>
                  </div>
                  <div
                    key={`${room.id}-grid`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${daysInMonth}, 40px)`,
                      gridColumn: `2 / span ${daysInMonth}`,
                      borderBottom: "1px solid #f0f0f0",
                      position: "relative",
                      background: "#fff",
                      height: 52,
                    }}
                  >
                    {/* Background Grid Lines */}
                    {monthDays.map((day) => (
                      <div
                        key={day.format("YYYY-MM-DD")}
                        style={{
                          borderRight: "1px solid #f5f5f5",
                          background: day.isSame(dayjs(), "day")
                            ? "#f0faff"
                            : "transparent",
                        }}
                      />
                    ))}

                    {/* Booking Blocks */}
                    {room.roomStays.map((stay: any) => {
                      const start = dayjs(stay.startDate);
                      const end = dayjs(stay.endDate);

                      // Calculate positions
                      const startDay = Math.max(
                        1,
                        start.isBefore(viewDate, "month") ? 1 : start.date(),
                      );
                      const endDay = Math.min(
                        daysInMonth,
                        end.isAfter(viewDate.endOf("month"))
                          ? daysInMonth
                          : end.date(),
                      );

                      if (
                        start.isAfter(viewDate.endOf("month")) ||
                        end.isBefore(viewDate.startOf("month"))
                      )
                        return null;

                      const duration = endDay - startDay;

                      return (
                        <Tooltip
                          key={stay.id}
                          title={
                            <div>
                              <strong>
                                {stay.booking?.primaryGuest?.firstName}{" "}
                                {stay.booking?.primaryGuest?.lastName}
                              </strong>
                              <br />
                              {start.format("D MMM")} - {end.format("D MMM")}
                              <br />
                              Status: {stay.booking?.status}
                            </div>
                          }
                        >
                          <div
                            style={{
                              position: "absolute",
                              left: (startDay - 1) * 40 + 4,
                              top: 8,
                              width: Math.max(32, duration * 40 - 8),
                              height: 36,
                              background: getStatusColor(stay.booking?.status),
                              borderRadius: 6,
                              color: "white",
                              padding: "4px 8px",
                              fontSize: 11,
                              fontWeight: 500,
                              overflow: "hidden",
                              whiteSpace: "nowrap",
                              textOverflow: "ellipsis",
                              cursor: "pointer",
                              zIndex: 5,
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            }}
                            onClick={() =>
                              navigate(
                                `/finance/folios/${stay.booking?.folios?.[0]?.id}`,
                              )
                            }
                          >
                            {stay.booking?.primaryGuest?.lastName}
                          </div>
                        </Tooltip>
                      );
                    })}
                  </div>
                </>
              ))}
            </div>
          </div>
        ) : (
          <Empty description="No rooms found in this branch" />
        )}
      </Card>
    </div>
  );
};
