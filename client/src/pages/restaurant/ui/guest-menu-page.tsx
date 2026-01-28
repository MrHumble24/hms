import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Typography,
  Card,
  Row,
  Col,
  Button,
  List,
  Badge,
  Divider,
  Space,
  Empty,
  message,
  InputNumber,
  Drawer,
  Input,
} from "antd";
import {
  ShoppingCartOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  Utensils,
  Search,
  ClipboardList,
  Clock,
  ArrowLeft,
  X,
  Trash2,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { restaurantApi } from "@/entities/restaurant";
import type { RestaurantMenuItem } from "@/entities/restaurant";
import { useTranslation } from "react-i18next";
import { resolveImageUrl } from "@/shared/lib/utils/resolve-image-url";

const { Title, Text } = Typography;

export const GuestMenuPage = () => {
  const { t, i18n } = useTranslation(["common", "restaurant"]);
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("room");
  const tenantId = searchParams.get("tenant");
  const branchId = searchParams.get("branch");

  useEffect(() => {
    if (tenantId) localStorage.setItem("activeTenantId", tenantId);
    if (branchId) localStorage.setItem("activeBranchId", branchId);
  }, [tenantId, branchId]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<
    { item: RestaurantMenuItem; quantity: number; notes?: string }[]
  >(() => {
    const saved = localStorage.getItem(`guestCart_${roomId}`);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (roomId) {
      localStorage.setItem(`guestCart_${roomId}`, JSON.stringify(cart));
    }
  }, [cart, roomId]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [ordersOpen, setOrdersOpen] = useState(false);

  const { data: menuData, isLoading: itemsLoading } = useQuery({
    queryKey: ["public-menu-items", searchQuery, activeCategory],
    queryFn: () =>
      restaurantApi.getPublicMenuItems({
        search: searchQuery,
        categoryId: activeCategory || undefined,
        take: 100, // Fetch more for guest menu
      }),
    refetchInterval: 60000,
  });

  const items = menuData?.data || [];

  const { data: categories = [] } = useQuery({
    queryKey: ["public-categories"],
    queryFn: restaurantApi.getPublicCategories,
    refetchInterval: 300000, // Refresh categories every 5 minutes
  });

  // Order Tracking
  const { data: myOrders = [], refetch: refetchOrders } = useQuery({
    queryKey: ["my-orders-status", roomId],
    queryFn: () => restaurantApi.getRoomOrders(roomId as string),
    enabled: !!roomId,
    refetchInterval: 3000, // Poll every 3 seconds to mimic real-time
  });

  const createOrderMutation = useMutation({
    mutationFn: restaurantApi.createGuestOrder,
    onSuccess: () => {
      message.success(t("restaurant:pos.orderSuccess"));
      refetchOrders();
      setCart([]);
      localStorage.removeItem(`guestCart_${roomId}`);
      setCartOpen(false);
      setOrdersOpen(true);
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || t("common:error"));
    },
  });

  const getLocalized = (obj: any) => {
    if (!obj) return "";
    return obj[i18n.language] || obj["en"] || Object.values(obj)[0] || "";
  };

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
    message.success(`${getLocalized(item.name)} added to cart`);
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
    if (!roomId) {
      message.error("Room ID is missing. Please scan the QR code again.");
      return;
    }
    if (cart.length === 0) {
      message.warning(t("restaurant:pos.cartEmptyWarning"));
      return;
    }
    createOrderMutation.mutate({
      roomId,
      items: cart.map((c) => ({
        menuItemId: c.item.id,
        quantity: c.quantity,
        notes: c.notes,
      })),
    });
  };

  // Server-side filtering is used
  const filteredItems = items;

  if (!roomId) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Empty
          description="Invalid QR Code. Please contact reception."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "orange";
      case "PREPARING":
        return "blue";
      case "SERVED":
        return "green";
      case "CANCELLED":
        return "red";
      default:
        return "default";
    }
  };

  return (
    <div
      style={{
        background: "#f8f9fa",
        minHeight: "100vh",
        paddingBottom: 80,
        position: "relative",
      }}
    >
      {/* Premium Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
          padding: "16px 20px",
          borderBottom: "1px solid #eee",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 800 }}>
              {t("restaurant:pos.title")}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Room {roomId} • {tenantId ? "Premium Service" : ""}
            </Text>
          </div>
          <Space>
            <Button
              type="text"
              icon={<ClipboardList size={20} />}
              onClick={() => setOrdersOpen(true)}
            />
            <Badge count={cart.length} showZero color="#ff7675">
              <Button
                shape="circle"
                icon={<ShoppingCartOutlined />}
                onClick={() => setCartOpen(true)}
              />
            </Badge>
          </Space>
        </div>

        {/* Search Bar */}
        <div style={{ marginTop: 12 }}>
          <Input
            placeholder="Search our menu..."
            prefix={<Search size={16} color="#bfbfbf" />}
            size="large"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            style={{ borderRadius: 12, border: "1px solid #eee" }}
          />
        </div>

        {/* Categories Scroll */}
        <div
          style={{
            display: "flex",
            overflowX: "auto",
            padding: "12px 0 4px",
            gap: 8,
            scrollbarWidth: "none",
          }}
          className="no-scrollbar"
        >
          <Button
            shape="round"
            type={activeCategory === null ? "primary" : "default"}
            onClick={() => setActiveCategory(null)}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              shape="round"
              type={activeCategory === cat.id ? "primary" : "default"}
              onClick={() => setActiveCategory(cat.id)}
            >
              {getLocalized(cat.name)}
            </Button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px" }}>
        {itemsLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}>Loading...</div>
        ) : filteredItems.length === 0 ? (
          <Empty description="No items found" style={{ marginTop: 40 }} />
        ) : (
          <Row gutter={[16, 20]}>
            {filteredItems.map((item) => (
              <Col xs={24} key={item.id}>
                <Card
                  bodyStyle={{ padding: 12 }}
                  style={{
                    borderRadius: 20,
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                    overflow: "hidden",
                  }}
                  onClick={() => addToCart(item)}
                >
                  <div style={{ display: "flex", gap: 16 }}>
                    <div
                      style={{
                        width: 100,
                        height: 100,
                        flexShrink: 0,
                        borderRadius: 16,
                        overflow: "hidden",
                        background: "#fafafa",
                      }}
                    >
                      {item.imageUrl ? (
                        <img
                          alt={getLocalized(item.name)}
                          src={resolveImageUrl(item.imageUrl)}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Utensils size={32} color="#ddd" />
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <Title
                          level={5}
                          style={{ margin: "0 0 4px", fontSize: 16 }}
                        >
                          {getLocalized(item.name)}
                        </Title>
                        <Text
                          type="secondary"
                          style={{
                            fontSize: 12,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {getLocalized(item.description)}
                        </Text>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Text strong style={{ color: "#2d3436", fontSize: 16 }}>
                          {new Intl.NumberFormat().format(item.price)}{" "}
                          <span style={{ fontSize: 12, fontWeight: 400 }}>
                            {t("common:currency")}
                          </span>
                        </Text>
                        <Button
                          type="primary"
                          size="small"
                          shape="circle"
                          icon={<PlusOutlined />}
                          style={{ background: "#2d3436", border: "none" }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>

      {/* Floating Cart Bar (Mobile-style) */}
      {cart.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            left: 20,
            right: 20,
            background: "#2d3436",
            borderRadius: 16,
            padding: "12px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            zIndex: 1000,
            cursor: "pointer",
          }}
          onClick={() => setCartOpen(true)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Badge count={cart.length} color="#ff7675">
              <ShoppingCartOutlined style={{ color: "#fff", fontSize: 20 }} />
            </Badge>
            <Text style={{ color: "#fff", fontWeight: 600 }}>View Cart</Text>
          </div>
          <Text style={{ color: "#fff", fontWeight: 700 }}>
            {new Intl.NumberFormat().format(totalAmount)} {t("common:currency")}
          </Text>
        </div>
      )}

      {/* Order Status Drawer */}
      <Drawer
        title="My Orders"
        placement="bottom"
        height="100%"
        onClose={() => setOrdersOpen(false)}
        open={ordersOpen}
        closeIcon={<ArrowLeft />}
        extra={
          <Button
            type="text"
            icon={<ReloadOutlined style={{ fontSize: 14 }} />}
            onClick={() => refetchOrders()}
          />
        }
      >
        {myOrders.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="You haven't placed any orders yet."
            style={{ marginTop: 40 }}
          />
        ) : (
          <List
            dataSource={myOrders}
            renderItem={(order) => (
              <Card
                style={{ marginBottom: 16, borderRadius: 16 }}
                bodyStyle={{ padding: 16 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    ID: #{order.id.slice(-6).toUpperCase()}
                  </Text>
                  <Badge
                    color={getStatusColor(order.status)}
                    text={
                      <span style={{ fontWeight: 600 }}>{order.status}</span>
                    }
                  />
                </div>
                <List
                  size="small"
                  dataSource={order.items}
                  renderItem={(it: any) => (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                        marginBottom: 4,
                      }}
                    >
                      <Text>
                        {it.quantity}x {getLocalized(it.menuItem.name)}
                      </Text>
                    </div>
                  )}
                />
                <Divider style={{ margin: "12px 0" }} />
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Text type="secondary">
                    <Clock size={12} style={{ marginRight: 4 }} />
                    {new Date(order.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  <Text strong>
                    {new Intl.NumberFormat().format(order.totalAmount)}{" "}
                    {t("common:currency")}
                  </Text>
                </div>
              </Card>
            )}
          />
        )}
      </Drawer>

      <Drawer
        title={t("restaurant:pos.currentOrder")}
        placement="bottom"
        height="85%"
        onClose={() => setCartOpen(false)}
        open={cartOpen}
        closeIcon={<X />}
      >
        <List
          dataSource={cart}
          renderItem={(c) => (
            <List.Item>
              <List.Item.Meta
                title={getLocalized(c.item.name)}
                description={
                  <Space direction="vertical" size={4}>
                    <Text type="secondary">
                      {new Intl.NumberFormat().format(c.item.price)}{" "}
                      {t("common:currency")}
                    </Text>
                    <InputNumber
                      size="small"
                      min={1}
                      value={c.quantity}
                      onChange={(val) => updateQuantity(c.item.id, val || 1)}
                    />
                  </Space>
                }
              />
              <div
                style={{
                  textAlign: "right",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <Button
                  type="text"
                  danger
                  icon={<Trash2 size={16} />}
                  onClick={() => removeFromCart(c.item.id)}
                />
                <Text strong>
                  {new Intl.NumberFormat().format(c.item.price * c.quantity)}
                </Text>
              </div>
            </List.Item>
          )}
        />
        <Divider />
        <div style={{ padding: "16px 0" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Text strong>{t("restaurant:pos.total")}</Text>
            <Text strong type="danger" style={{ fontSize: 18 }}>
              {new Intl.NumberFormat().format(totalAmount)}{" "}
              {t("common:currency")}
            </Text>
          </div>
          <Button
            type="primary"
            block
            size="large"
            disabled={cart.length === 0}
            loading={createOrderMutation.isPending}
            onClick={handlePlaceOrder}
            style={{
              height: 54,
              borderRadius: 16,
              background: "#2d3436",
              border: "none",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            {t("restaurant:pos.placeOrder")}
          </Button>
        </div>
      </Drawer>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
