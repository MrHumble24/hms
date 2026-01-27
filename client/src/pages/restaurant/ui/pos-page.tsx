import { useState } from "react";
import {
  Row,
  Col,
  Card,
  Typography,
  Input,
  Button,
  List,
  Badge,
  Divider,
  Space,
  Empty,
  Select,
  message,
  InputNumber,
  Tag,
} from "antd";
import { SearchOutlined, DeleteOutlined } from "@ant-design/icons";
import { Utensils, User, Hash } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { restaurantApi } from "@/entities/restaurant";
import type {
  RestaurantMenuItem,
  RestaurantOrder,
} from "@/entities/restaurant";
import { bookingApi, BookingStatus } from "@/entities/booking/api/booking-api";
import { ReceiptModal } from "@/widgets/restaurant/ui/receipt-modal";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;
const { Option } = Select;

export const POSPage = () => {
  const { t, i18n } = useTranslation(["common", "restaurant"]);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [cart, setCart] = useState<
    { item: RestaurantMenuItem; quantity: number; notes?: string }[]
  >([]);
  const [selectedRoomStayId, setSelectedRoomStayId] = useState<
    string | undefined
  >(undefined);
  const [tableNumber, setTableNumber] = useState<string | undefined>(undefined);
  const [lastOrder, setLastOrder] = useState<RestaurantOrder | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const { data: menuData, isLoading: itemsLoading } = useQuery({
    queryKey: ["restaurant-menu-items", search, selectedCategoryId],
    queryFn: () =>
      restaurantApi.getMenuItems({
        search,
        categoryId:
          selectedCategoryId === "ALL" ? undefined : selectedCategoryId,
        take: 100, // Fetch more for POS
      }),
  });

  const items = menuData?.data || [];

  const { data: categories = [] } = useQuery({
    queryKey: ["restaurant-categories"],
    queryFn: restaurantApi.getCategories,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["active-bookings"],
    queryFn: () => bookingApi.getAll(),
    select: (res) =>
      res.data.filter((b) => b.status === BookingStatus.CHECKED_IN),
  });

  const createOrderMutation = useMutation({
    mutationFn: restaurantApi.createOrder,
    onSuccess: (data) => {
      message.success(t("restaurant:pos.orderSuccess"));
      setLastOrder(data);
      setIsReceiptOpen(true);
      setCart([]);
      setSelectedRoomStayId(undefined);
      setTableNumber(undefined);
      queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || t("common:error"));
    },
  });

  const getLocalized = (obj: any) => {
    if (!obj) return "";
    return obj[i18n.language] || obj["en"] || Object.values(obj)[0] || "";
  };

  // Server-side filtering is now used, so we just use items directly
  const filteredItems = items;

  const addToCart = (item: RestaurantMenuItem) => {
    const existing = cart.find((c) => c.item.id === item.id);
    if (existing) {
      setCart(
        cart.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c,
        ),
      );
    } else {
      setCart([...cart, { item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter((c) => c.item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map((c) => (c.item.id === itemId ? { ...c, quantity } : c)));
    }
  };

  const totalAmount = cart.reduce(
    (sum, c) => sum + Number(c.item.price) * c.quantity,
    0,
  );

  const handlePlaceOrder = () => {
    if (cart.length === 0) {
      message.warning(t("restaurant:pos.cartEmptyWarning"));
      return;
    }

    const selectedBookingId = bookings.find((b) =>
      b.roomStays?.some((rs) => rs.id === selectedRoomStayId),
    )?.id;

    createOrderMutation.mutate({
      tableNumber,
      bookingId: selectedBookingId,
      items: cart.map((c) => ({
        menuItemId: c.item.id,
        quantity: c.quantity,
        notes: c.notes,
      })),
    });
  };

  return (
    <div style={{ height: "calc(100vh - 64px)", overflow: "hidden" }}>
      <Row style={{ height: "100%" }}>
        <Col
          span={16}
          style={{
            height: "100%",
            overflowY: "auto",
            padding: 24,
            borderRight: "1px solid #f0f0f0",
          }}
        >
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Title level={3} style={{ margin: 0 }}>
                {t("restaurant:pos.title")}
              </Title>
              <Input
                placeholder={t("restaurant:pos.searchPlaceholder")}
                prefix={<SearchOutlined />}
                style={{ width: 300 }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Space wrap>
              <Button
                type={selectedCategoryId === "ALL" ? "primary" : "default"}
                onClick={() => setSelectedCategoryId("ALL")}
              >
                {t("restaurant:pos.allCategories")}
              </Button>
              {categories.map((c) => (
                <Button
                  key={c.id}
                  type={selectedCategoryId === c.id ? "primary" : "default"}
                  onClick={() => setSelectedCategoryId(c.id)}
                >
                  {getLocalized(c.name)}
                </Button>
              ))}
            </Space>

            <Row gutter={[16, 16]}>
              {filteredItems.map((item) => (
                <Col span={6} key={item.id}>
                  <Card
                    hoverable
                    cover={
                      item.imageUrl ? (
                        <div style={{ height: 120, overflow: "hidden" }}>
                          <img
                            alt={getLocalized(item.name)}
                            src={item.imageUrl}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            height: 120,
                            background: "#fafafa",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Utensils size={32} color="#bfbfbf" />
                        </div>
                      )
                    }
                    onClick={() => addToCart(item)}
                    styles={{ body: { padding: 12 } }}
                    style={{ borderRadius: 8, overflow: "hidden" }}
                  >
                    <div style={{ height: 40, overflow: "hidden" }}>
                      <Text strong>{getLocalized(item.name)}</Text>
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text type="success" strong>
                        {new Intl.NumberFormat().format(item.price)}
                      </Text>
                      {item.calories && (
                        <Tag color="blue" style={{ fontSize: 10 }}>
                          {item.calories} cal
                        </Tag>
                      )}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
            {filteredItems.length === 0 && !itemsLoading && (
              <Empty description={t("restaurant:pos.noItems")} />
            )}
          </Space>
        </Col>

        <Col
          span={8}
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            padding: 24,
            background: "#fff",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Title level={4} style={{ margin: 0 }}>
              {t("restaurant:pos.currentOrder")}
            </Title>
            <Badge count={cart.length} showZero color="#1890ff" />
          </div>

          <Divider style={{ margin: "12px 0" }} />

          <div style={{ flex: 1, overflowY: "auto", marginBottom: 16 }}>
            {cart.length === 0 ? (
              <Empty
                description={t("restaurant:pos.cartEmpty")}
                style={{ marginTop: 60 }}
              />
            ) : (
              <List
                dataSource={cart}
                renderItem={(c) => (
                  <List.Item
                    actions={[
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeFromCart(c.item.id)}
                      />,
                    ]}
                  >
                    <List.Item.Meta
                      title={getLocalized(c.item.name)}
                      description={
                        <Space
                          direction="vertical"
                          size={4}
                          style={{ width: "100%" }}
                        >
                          <Text type="secondary">
                            {new Intl.NumberFormat().format(c.item.price)}{" "}
                            {t("common:currency")}
                          </Text>
                          <InputNumber
                            size="small"
                            min={1}
                            value={c.quantity}
                            onChange={(val) =>
                              updateQuantity(c.item.id, val || 1)
                            }
                          />
                        </Space>
                      }
                    />
                    <div style={{ textAlign: "right", paddingRight: 8 }}>
                      <Text strong>
                        {new Intl.NumberFormat().format(
                          c.item.price * c.quantity,
                        )}
                      </Text>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </div>

          <Divider />

          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <div>
              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Hash size={12} /> {t("restaurant:pos.tableNumber")}
              </Text>
              <Input
                placeholder={t("restaurant:pos.tablePlaceholder")}
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
              />
            </div>

            <div>
              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <User size={12} /> {t("restaurant:pos.linkToRoom")}
              </Text>
              <Select
                placeholder={t("restaurant:pos.selectBooking")}
                style={{ width: "100%" }}
                allowClear
                value={selectedRoomStayId}
                onChange={setSelectedRoomStayId}
              >
                {bookings.flatMap((b) =>
                  (b.roomStays || []).map((rs) => (
                    <Option key={rs.id} value={rs.id}>
                      {t("restaurant:pos.roomNumber", {
                        number: rs.room?.number,
                      })}{" "}
                      - {b.primaryGuest?.firstName} {b.primaryGuest?.lastName}
                    </Option>
                  )),
                )}
              </Select>
            </div>

            <div
              style={{ background: "#f9f9f9", padding: 16, borderRadius: 8 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text>{t("restaurant:pos.total")}</Text>
                <Title level={4} style={{ margin: 0 }}>
                  {new Intl.NumberFormat().format(totalAmount)}{" "}
                  {t("common:currency")}
                </Title>
              </div>
              <Button
                type="primary"
                size="large"
                block
                disabled={cart.length === 0}
                loading={createOrderMutation.isPending}
                onClick={handlePlaceOrder}
              >
                {t("restaurant:pos.placeOrder")}
              </Button>
            </div>
          </Space>
        </Col>
      </Row>

      <ReceiptModal
        order={lastOrder}
        open={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />
    </div>
  );
};
