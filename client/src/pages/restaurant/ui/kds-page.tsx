import { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Typography,
  Button,
  Space,
  Badge,
  Empty,
  message,
  Divider,
  Tag,
  List,
} from "antd";
import { Clock, CheckCircle, ChefHat } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { restaurantApi } from "@/entities/restaurant";
import type {
  RestaurantOrder,
  RestaurantOrderStatus,
} from "@/entities/restaurant";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export const KDSPage = () => {
  const { t, i18n } = useTranslation(["common", "restaurant"]);
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(dayjs());

  // Tick every second for timers
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: ordersData } = useQuery({
    queryKey: ["restaurant-orders"],
    queryFn: () => restaurantApi.getOrders(),
    refetchInterval: 5000, // Poll every 5 seconds for the kitchen
  });

  const orders = ordersData?.data || [];

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: RestaurantOrderStatus;
    }) => restaurantApi.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
    },
    onError: (err: any) => {
      message.error(
        err.response?.data?.message || t("restaurant:kds.statusUpdateError"),
      );
    },
  });

  const getLocalized = (obj: any) => {
    if (!obj) return "";
    return obj[i18n.language] || obj["en"] || Object.values(obj)[0] || "";
  };

  const activeOrders = orders.filter(
    (o) => o.status === "PENDING" || o.status === "PREPARING",
  );

  const getPreparationTime = (createdAt: string) => {
    const diff = currentTime.diff(dayjs(createdAt), "minute");
    return diff;
  };

  const renderOrderCard = (order: RestaurantOrder) => {
    const prepTime = getPreparationTime(order.createdAt);
    const isLate = prepTime > 15;

    return (
      <Col span={6} key={order.id}>
        <Card
          title={
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text strong>#{order.id.slice(-4).toUpperCase()}</Text>
              <Badge
                status={order.status === "PENDING" ? "processing" : "warning"}
                text={order.status}
              />
            </div>
          }
          style={{
            height: "100%",
            border:
              isLate && order.status === "PENDING"
                ? "1px solid #ff4d4f"
                : undefined,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
          styles={{ body: { padding: 12 } }}
        >
          <div style={{ marginBottom: 12 }}>
            <Space direction="vertical" size={0}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <Clock size={12} style={{ marginRight: 4 }} />
                {t("restaurant:kds.placed")}:{" "}
                {dayjs(order.createdAt).format("HH:mm")} (
                {t("restaurant:kds.ago", { count: prepTime })})
              </Text>
              {order.tableNumber && (
                <Tag color="blue" style={{ marginTop: 4 }}>
                  {t("restaurant:kds.table")}: {order.tableNumber}
                </Tag>
              )}
            </Space>
          </div>

          <Divider style={{ margin: "8px 0" }} />

          <List
            size="small"
            dataSource={order.items}
            renderItem={(item) => (
              <List.Item style={{ padding: "4px 0" }}>
                <div style={{ width: "100%" }}>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Text strong>
                      {item.quantity}x {getLocalized(item.menuItem.name)}
                    </Text>
                  </div>
                  {item.notes && (
                    <Text
                      type="danger"
                      style={{ fontSize: 11, display: "block" }}
                    >
                      {t("restaurant:kds.note")}: {item.notes}
                    </Text>
                  )}
                </div>
              </List.Item>
            )}
          />

          <Divider style={{ margin: "12px 0" }} />

          <div style={{ marginTop: "auto" }}>
            {order.status === "PENDING" ? (
              <Button
                type="primary"
                block
                icon={<ChefHat size={16} />}
                onClick={() =>
                  updateStatusMutation.mutate({
                    id: order.id,
                    status: "PREPARING",
                  })
                }
                loading={updateStatusMutation.isPending}
              >
                {t("restaurant:kds.startCooking")}
              </Button>
            ) : (
              <Button
                type="primary"
                style={{ background: "#52c41a", borderColor: "#52c41a" }}
                block
                icon={<CheckCircle size={16} />}
                onClick={() =>
                  updateStatusMutation.mutate({
                    id: order.id,
                    status: "SERVED",
                  })
                }
                loading={updateStatusMutation.isPending}
              >
                {t("restaurant:kds.markAsReady")}
              </Button>
            )}
          </div>
        </Card>
      </Col>
    );
  };

  return (
    <div
      style={{
        padding: 24,
        height: "calc(100vh - 64px)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
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
            {t("restaurant:kds.title")}
          </Title>
          <Text type="secondary">{t("restaurant:kds.subtitle")}</Text>
        </div>
        <Space>
          <Badge count={activeOrders.length} overflowCount={99}>
            <Title level={4} style={{ margin: 0 }}>
              {t("restaurant:kds.activeOrders")}
            </Title>
          </Badge>
        </Space>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {activeOrders.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t("restaurant:kds.noActiveOrders")}
            style={{ marginTop: 100 }}
          />
        ) : (
          <Row gutter={[16, 16]}>{activeOrders.map(renderOrderCard)}</Row>
        )}
      </div>
    </div>
  );
};
