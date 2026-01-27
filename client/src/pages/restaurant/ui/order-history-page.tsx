import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Table,
  Tag,
  Space,
  Button,
  Typography,
  Card,
  Input,
  Row,
  Col,
  DatePicker,
  Select,
  Tooltip,
} from "antd";
import { SearchOutlined, PrinterOutlined } from "@ant-design/icons";
import { History } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { restaurantApi } from "@/entities/restaurant";
import type { RestaurantOrder } from "@/entities/restaurant";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { ReceiptModal } from "@/widgets/restaurant/ui/receipt-modal";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export const OrderHistoryPage = () => {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation(["common", "finance", "restaurant"]);
  const [searchText, setSearchText] = useState(
    searchParams.get("search") || "",
  );
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null,
  );
  const [selectedOrder, setSelectedOrder] = useState<RestaurantOrder | null>(
    null,
  );
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const search = searchParams.get("search");

  useEffect(() => {
    if (search !== null && search !== searchText) {
      const timer = setTimeout(() => setSearchText(search), 0);
      return () => clearTimeout(timer);
    }
  }, [search]);

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["restaurant-orders", searchText, statusFilter],
    queryFn: () =>
      restaurantApi.getOrders({
        search: searchText,
        status: statusFilter || undefined,
        take: 50, // Reasonable limit for history
      }),
  });

  const orders = ordersData?.data || [];

  const columns = [
    {
      title: t("restaurant:history.columns.orderId"),
      dataIndex: "id",
      key: "id",
      render: (id: string) => <Text code>{id.slice(-6).toUpperCase()}</Text>,
    },
    {
      title: t("restaurant:history.columns.dateTime"),
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a: RestaurantOrder, b: RestaurantOrder) =>
        dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      render: (date: string) => dayjs(date).format("DD MMM YYYY, HH:mm"),
    },
    {
      title: t("restaurant:history.columns.location"),
      key: "location",
      render: (record: RestaurantOrder) => (
        <Space direction="vertical" size={0}>
          {record.tableNumber && (
            <Tag color="blue">
              {t("restaurant:kds.table")}: {record.tableNumber}
            </Tag>
          )}
          {record.booking && (
            <Tag color="cyan">
              {t("restaurant:pos.roomNumber", {
                number: record.booking.room?.number || "N/A",
              })}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: t("restaurant:history.columns.guest"),
      key: "guest",
      render: (record: RestaurantOrder) =>
        record.booking?.guest
          ? `${record.booking.guest.firstName} ${record.booking.guest.lastName}`
          : t("restaurant:history.walkIn"),
    },
    {
      title: t("restaurant:history.columns.amount"),
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount: number) => (
        <Text strong>
          {new Intl.NumberFormat().format(amount)} {t("common:currency")}
        </Text>
      ),
    },
    {
      title: t("restaurant:history.columns.status"),
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "default";
        if (status === "SERVED" || status === "PAID") color = "success";
        if (status === "PREPARING") color = "warning";
        if (status === "CANCELLED") color = "error";
        if (status === "PENDING") color = "processing";
        return (
          <Tag color={color}>
            {t(`restaurant:history.status.${status.toLowerCase()}`)}
          </Tag>
        );
      },
    },
    {
      title: t("restaurant:history.columns.actions"),
      key: "actions",
      render: (record: RestaurantOrder) => (
        <Space>
          <Tooltip title={t("restaurant:history.viewReceipt")}>
            <Button
              icon={<PrinterOutlined />}
              onClick={() => {
                setSelectedOrder(record);
                setIsReceiptOpen(true);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Server-side filtering used for search and status. Date filtering still client-side for now or move to server?
  // For simplicity given constraints, we'll keep date filtering client-side or assume server handles it if improved later.
  // Actually, we should move all to server if possible, but API doesn't support date range yet.
  // We will filter by date client-side on the fetched results.
  const filteredOrders = orders.filter((order) => {
    const matchesDate = dateRange
      ? dayjs(order.createdAt).isAfter(dateRange[0].startOf("day")) &&
        dayjs(order.createdAt).isBefore(dateRange[1].endOf("day"))
      : true;

    return matchesDate;
  });

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <History style={{ marginRight: 12 }} />
            {t("restaurant:history.title")}
          </Title>
          <Text type="secondary">{t("restaurant:history.subtitle")}</Text>
        </div>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Input
              placeholder={t("restaurant:history.searchPlaceholder")}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              style={{ width: "100%" }}
              placeholder={t("restaurant:history.filterStatus")}
              allowClear
              onChange={setStatusFilter}
              options={[
                {
                  value: "PENDING",
                  label: t("restaurant:history.status.pending"),
                },
                {
                  value: "PREPARING",
                  label: t("restaurant:history.status.preparing"),
                },
                {
                  value: "SERVED",
                  label: t("restaurant:history.status.served"),
                },
                { value: "PAID", label: t("restaurant:history.status.paid") },
                {
                  value: "CANCELLED",
                  label: t("restaurant:history.status.cancelled"),
                },
              ]}
            />
          </Col>
          <Col span={8}>
            <RangePicker
              style={{ width: "100%" }}
              onChange={(dates) => setDateRange(dates as any)}
            />
          </Col>
        </Row>
      </Card>

      <Table
        dataSource={filteredOrders}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{
          pageSize: 10,
          showTotal: (total) =>
            t("restaurant:history.totalOrders", { count: total }),
        }}
      />

      <ReceiptModal
        order={selectedOrder}
        open={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />
    </div>
  );
};
